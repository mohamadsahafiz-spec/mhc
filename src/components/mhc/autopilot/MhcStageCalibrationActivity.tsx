import React, { useState, useEffect, useMemo } from 'react';
import { 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  ArrowRight, 
  Info, 
  Layers, 
  Check, 
  RefreshCw,
  Ruler
} from 'lucide-react';
import { Machine, MHCSession, MHCStageCalibrationResult } from '../../../types';
import { advanceAutopilotActivity, flagDownstreamNeedsReview } from '../../../utils/mhcAutopilotBrain';

export interface MhcStageCalibrationActivityProps {
  session: MHCSession;
  machine: Machine;
  isReadOnly: boolean;
  onUpdateSession: (updatedSession: MHCSession) => void;
  onCompleteActivity: () => void;
  isDark: boolean;
  showNotification?: (msg: string) => void;
  activeCode?: string; // '04_stage1' | '04_stage2' | '04'
}

export const MhcStageCalibrationActivity: React.FC<MhcStageCalibrationActivityProps> = ({
  session,
  isReadOnly,
  onUpdateSession,
  onCompleteActivity,
  isDark,
  showNotification,
  activeCode = '04_stage1'
}) => {
  // Active stage tab: 'stage1' or 'stage2'
  const initialStage = activeCode === '04_stage2' ? 'stage2' : 'stage1';
  const [activeStageId, setActiveStageId] = useState<'stage1' | 'stage2'>(initialStage);

  // Sync tab if activeCode changes
  useEffect(() => {
    if (activeCode === '04_stage2') {
      setActiveStageId('stage2');
    } else if (activeCode === '04_stage1') {
      setActiveStageId('stage1');
    }
  }, [activeCode]);

  // Existing stage calibration records from session
  const stageData = useMemo(() => {
    return session.stageCalibrationData || {};
  }, [session.stageCalibrationData]);

  // Current active stage record
  const currentRecord = stageData[activeStageId] || {
    stageId: activeStageId,
    stageName: activeStageId === 'stage1' ? 'Stage 1' : 'Stage 2',
    xMinUm: null,
    xMaxUm: null,
    yMinUm: null,
    yMaxUm: null,
    specToleranceUm: 2.0,
    verdict: 'UNANSWERED',
    status: 'NOT_STARTED'
  };

  // Form Inputs
  const [xMinStr, setXMinStr] = useState<string>('');
  const [xMaxStr, setXMaxStr] = useState<string>('');
  const [yMinStr, setYMinStr] = useState<string>('');
  const [yMaxStr, setYMaxStr] = useState<string>('');
  const [engineerNote, setEngineerNote] = useState<string>('');
  const [evidenceImage, setEvidenceImage] = useState<string>('');

  // Hydrate form inputs when activeStageId or session changes
  useEffect(() => {
    const rec = stageData[activeStageId];
    if (rec) {
      setXMinStr(rec.xMinUm !== null && rec.xMinUm !== undefined ? String(rec.xMinUm) : '');
      setXMaxStr(rec.xMaxUm !== null && rec.xMaxUm !== undefined ? String(rec.xMaxUm) : '');
      setYMinStr(rec.yMinUm !== null && rec.yMinUm !== undefined ? String(rec.yMinUm) : '');
      setYMaxStr(rec.yMaxUm !== null && rec.yMaxUm !== undefined ? String(rec.yMaxUm) : '');
      setEngineerNote(rec.engineerNote || '');
      setEvidenceImage(rec.evidenceImage || '');
    } else {
      setXMinStr('');
      setXMaxStr('');
      setYMinStr('');
      setYMaxStr('');
      setEngineerNote('');
      setEvidenceImage('');
    }
  }, [activeStageId, stageData]);

  // Numeric parsing
  const parseNum = (val: string): number | null => {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const xMin = parseNum(xMinStr);
  const xMax = parseNum(xMaxStr);
  const yMin = parseNum(yMinStr);
  const yMax = parseNum(yMaxStr);

  const hasAllValues = xMin !== null && xMax !== null && yMin !== null && yMax !== null;

  // Real-time calculations
  const maxAbsX = useMemo(() => {
    if (xMin === null || xMax === null) return null;
    return Math.max(Math.abs(xMin), Math.abs(xMax));
  }, [xMin, xMax]);

  const maxAbsY = useMemo(() => {
    if (yMin === null || yMax === null) return null;
    return Math.max(Math.abs(yMin), Math.abs(yMax));
  }, [yMin, yMax]);

  const overallMaxDev = useMemo(() => {
    if (maxAbsX === null || maxAbsY === null) return null;
    return Math.max(maxAbsX, maxAbsY);
  }, [maxAbsX, maxAbsY]);

  // Specification limit: ±2.0 µm
  const SPEC_TOLERANCE_UM = 2.0;

  const isOutOfSpec = useMemo(() => {
    if (!hasAllValues) return false;
    return (
      Math.abs(xMin!) > SPEC_TOLERANCE_UM ||
      Math.abs(xMax!) > SPEC_TOLERANCE_UM ||
      Math.abs(yMin!) > SPEC_TOLERANCE_UM ||
      Math.abs(yMax!) > SPEC_TOLERANCE_UM
    );
  }, [hasAllValues, xMin, xMax, yMin, yMax]);

  const liveVerdict = useMemo(() => {
    if (!hasAllValues) return 'UNANSWERED';
    return isOutOfSpec ? 'OUT_OF_SPEC' : 'PASS';
  }, [hasAllValues, isOutOfSpec]);

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showNotification) showNotification('File size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEvidenceImage(reader.result as string);
      if (showNotification) showNotification('Evidence image attached successfully');
    };
    reader.readAsDataURL(file);
  };

  // Helper to save stage state
  const saveStageResult = (
    verdict: 'PASS' | 'OUT_OF_SPEC',
    status: 'COMPLETED' | 'NEEDS_REVIEW'
  ) => {
    const stageCode = activeStageId === 'stage1' ? '04_stage1' : '04_stage2';
    const stageName = activeStageId === 'stage1' ? 'Stage 1' : 'Stage 2';

    const updatedResult: MHCStageCalibrationResult = {
      stageId: activeStageId,
      stageName,
      xMinUm: xMin,
      xMaxUm: xMax,
      yMinUm: yMin,
      yMaxUm: yMax,
      maxAbsXUm: maxAbsX ?? undefined,
      maxAbsYUm: maxAbsY ?? undefined,
      overallMaxDevUm: overallMaxDev ?? undefined,
      specToleranceUm: SPEC_TOLERANCE_UM,
      verdict,
      status,
      evidenceImage: evidenceImage || undefined,
      engineerNote: engineerNote || undefined,
      updatedAt: new Date().toISOString()
    };

    const newStageData = {
      ...stageData,
      [activeStageId]: updatedResult
    };

    // Update session persistence
    let updatedSession: MHCSession = {
      ...session,
      stageCalibrationData: newStageData
    };

    // Check if editing a previously completed activity -> flag downstream if needed
    if (session.autopilotProgress?.activityStatuses?.[stageCode] === 'COMPLETED') {
      updatedSession = flagDownstreamNeedsReview(updatedSession, stageCode);
    }

    // Advance autopilot state for this stage code
    updatedSession = advanceAutopilotActivity(
      updatedSession,
      stageCode,
      status,
      engineerNote
    );

    // Check status of BOTH stages
    const otherStageId = activeStageId === 'stage1' ? 'stage2' : 'stage1';
    const otherStageRecord = newStageData[otherStageId];
    const isOtherCompleted = otherStageRecord?.status === 'COMPLETED' && otherStageRecord?.verdict === 'PASS';

    onUpdateSession(updatedSession);

    if (status === 'COMPLETED' && verdict === 'PASS') {
      if (isOtherCompleted) {
        // Both Stage 1 and Stage 2 complete! Advance Autopilot
        if (showNotification) {
          showNotification('Stage 1 & Stage 2 Calibration PASS! Advanced to Day 3 AGC.');
        }
        onCompleteActivity();
      } else {
        // Switch tab to the other stage automatically
        if (showNotification) {
          showNotification(`${stageName} Calibration PASS recorded. Switching to ${otherStageId === 'stage1' ? 'Stage 1' : 'Stage 2'}...`);
        }
        setActiveStageId(otherStageId);
      }
    } else {
      if (showNotification) {
        showNotification(`${stageName} flagged as NEEDS_REVIEW (Out of Spec).`);
      }
    }
  };

  // Reset/Clear Stage
  const handleResetStage = () => {
    setXMinStr('');
    setXMaxStr('');
    setYMinStr('');
    setYMaxStr('');
    setEngineerNote('');
    setEvidenceImage('');
    if (showNotification) showNotification(`${activeStageId === 'stage1' ? 'Stage 1' : 'Stage 2'} inputs cleared.`);
  };

  // Get status pill for stage tabs
  const getStageTabStatus = (stId: 'stage1' | 'stage2') => {
    const rec = stageData[stId];
    if (!rec || rec.status === 'NOT_STARTED') {
      return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-500/20 text-slate-400">PENDING</span>;
    }
    if (rec.status === 'COMPLETED' && rec.verdict === 'PASS') {
      return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><Check className="w-3 h-3" /> PASS</span>;
    }
    if (rec.verdict === 'OUT_OF_SPEC' || rec.status === 'NEEDS_REVIEW') {
      return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> OUT OF SPEC</span>;
    }
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">IN PROGRESS</span>;
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border space-y-6 ${
      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Crosshair className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                DAY 2 • 04
              </span>
              <h2 className="text-lg font-bold text-slate-100">Stage Calibration Autopilot</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative final X/Y deviation accuracy check (Tolerance: ±2.0 µm)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 text-xs font-medium">
          <span className="text-slate-400 pl-2">Bench Specification:</span>
          <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30 flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5" /> ±2.0 µm
          </span>
        </div>
      </div>

      {/* Stage Tabs (Stage 1 vs Stage 2) */}
      <div className="grid grid-cols-2 gap-3">
        {(['stage1', 'stage2'] as const).map(stId => {
          const isActive = activeStageId === stId;
          const label = stId === 'stage1' ? 'Stage 1 Calibration' : 'Stage 2 Calibration';
          const code = stId === 'stage1' ? '04_stage1' : '04_stage2';

          return (
            <button
              key={stId}
              type="button"
              onClick={() => setActiveStageId(stId)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                isActive
                  ? isDark
                    ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                    : 'bg-cyan-50 border-cyan-400 ring-1 ring-cyan-400/30'
                  : isDark
                    ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-mono font-bold text-slate-400">{code}</div>
                  <div className="text-sm font-bold text-slate-200">{label}</div>
                </div>
              </div>
              <div>{getStageTabStatus(stId)}</div>
            </button>
          );
        })}
      </div>

      {/* Stage Active Workspace Card */}
      <div className={`p-5 rounded-xl border space-y-6 ${
        isDark ? 'bg-slate-800/30 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <span>{activeStageId === 'stage1' ? 'Stage 1' : 'Stage 2'} Final Result Data Entry</span>
            {currentRecord.status === 'COMPLETED' && currentRecord.verdict === 'PASS' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Authoritative Record
              </span>
            )}
          </h3>
          {hasAllValues && (
            <button
              type="button"
              onClick={handleResetStage}
              disabled={isReadOnly}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-enter Readings
            </button>
          )}
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* X Min */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>X Min Deviation (µm)</span>
              <span className="text-[10px] text-slate-400 font-mono">Spec ±2.0</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="e.g. -1.20"
                value={xMinStr}
                onChange={e => setXMinStr(e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-sm transition-all ${
                  xMin !== null && Math.abs(xMin) > 2.0
                    ? 'border-rose-500 bg-rose-950/20 text-rose-300 focus:ring-rose-500'
                    : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">µm</span>
            </div>
          </div>

          {/* X Max */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>X Max Deviation (µm)</span>
              <span className="text-[10px] text-slate-400 font-mono">Spec ±2.0</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 1.40"
                value={xMaxStr}
                onChange={e => setXMaxStr(e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-sm transition-all ${
                  xMax !== null && Math.abs(xMax) > 2.0
                    ? 'border-rose-500 bg-rose-950/20 text-rose-300 focus:ring-rose-500'
                    : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">µm</span>
            </div>
          </div>

          {/* Y Min */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Y Min Deviation (µm)</span>
              <span className="text-[10px] text-slate-400 font-mono">Spec ±2.0</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="e.g. -0.80"
                value={yMinStr}
                onChange={e => setYMinStr(e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-sm transition-all ${
                  yMin !== null && Math.abs(yMin) > 2.0
                    ? 'border-rose-500 bg-rose-950/20 text-rose-300 focus:ring-rose-500'
                    : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">µm</span>
            </div>
          </div>

          {/* Y Max */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Y Max Deviation (µm)</span>
              <span className="text-[10px] text-slate-400 font-mono">Spec ±2.0</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 1.10"
                value={yMaxStr}
                onChange={e => setYMaxStr(e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-sm transition-all ${
                  yMax !== null && Math.abs(yMax) > 2.0
                    ? 'border-rose-500 bg-rose-950/20 text-rose-300 focus:ring-rose-500'
                    : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">µm</span>
            </div>
          </div>
        </div>

        {/* Real-time Validation Metrics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Max Abs X */}
          <div className={`p-3.5 rounded-xl border ${
            maxAbsX === null
              ? 'bg-slate-900/40 border-slate-800'
              : maxAbsX > 2.0
                ? 'bg-rose-950/30 border-rose-500/50'
                : 'bg-emerald-950/20 border-emerald-500/30'
          }`}>
            <div className="text-[11px] text-slate-400 font-medium">Max Abs X Deviation</div>
            <div className={`text-lg font-mono font-bold mt-1 ${
              maxAbsX === null
                ? 'text-slate-500'
                : maxAbsX > 2.0
                  ? 'text-rose-400'
                  : 'text-emerald-400'
            }`}>
              {maxAbsX !== null ? `${maxAbsX.toFixed(2)} µm` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {maxAbsX !== null ? (maxAbsX <= 2.0 ? '✓ ≤ 2.0 µm' : '⚠ Exceeds Limit') : 'Awaiting input'}
            </div>
          </div>

          {/* Max Abs Y */}
          <div className={`p-3.5 rounded-xl border ${
            maxAbsY === null
              ? 'bg-slate-900/40 border-slate-800'
              : maxAbsY > 2.0
                ? 'bg-rose-950/30 border-rose-500/50'
                : 'bg-emerald-950/20 border-emerald-500/30'
          }`}>
            <div className="text-[11px] text-slate-400 font-medium">Max Abs Y Deviation</div>
            <div className={`text-lg font-mono font-bold mt-1 ${
              maxAbsY === null
                ? 'text-slate-500'
                : maxAbsY > 2.0
                  ? 'text-rose-400'
                  : 'text-emerald-400'
            }`}>
              {maxAbsY !== null ? `${maxAbsY.toFixed(2)} µm` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {maxAbsY !== null ? (maxAbsY <= 2.0 ? '✓ ≤ 2.0 µm' : '⚠ Exceeds Limit') : 'Awaiting input'}
            </div>
          </div>

          {/* Overall Max Dev */}
          <div className={`p-3.5 rounded-xl border ${
            overallMaxDev === null
              ? 'bg-slate-900/40 border-slate-800'
              : overallMaxDev > 2.0
                ? 'bg-rose-950/30 border-rose-500/50'
                : 'bg-cyan-950/30 border-cyan-500/30'
          }`}>
            <div className="text-[11px] text-slate-400 font-medium">Overall Max Deviation</div>
            <div className={`text-lg font-mono font-bold mt-1 ${
              overallMaxDev === null
                ? 'text-slate-500'
                : overallMaxDev > 2.0
                  ? 'text-rose-400'
                  : 'text-cyan-300'
            }`}>
              {overallMaxDev !== null ? `${overallMaxDev.toFixed(2)} µm` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Worst-case X/Y offset
            </div>
          </div>

          {/* Overall Verdict Badge */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            liveVerdict === 'PASS'
              ? 'bg-emerald-950/30 border-emerald-500/50'
              : liveVerdict === 'OUT_OF_SPEC'
                ? 'bg-rose-950/40 border-rose-500/60'
                : 'bg-slate-900/40 border-slate-800'
          }`}>
            <div className="text-[11px] text-slate-400 font-medium">Specification Verdict</div>
            <div className="mt-1">
              {liveVerdict === 'PASS' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>PASS (Within Spec)</span>
                </div>
              )}
              {liveVerdict === 'OUT_OF_SPEC' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/40">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>OUT OF SPEC</span>
                </div>
              )}
              {liveVerdict === 'UNANSWERED' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>INCOMPLETE</span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {liveVerdict === 'PASS' ? 'Ready to confirm' : liveVerdict === 'OUT_OF_SPEC' ? 'Needs adjustment' : 'Enter 4 values'}
            </div>
          </div>
        </div>

        {/* Dynamic Alert Banner */}
        {!hasAllValues && (
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Please enter all 4 deviation readings (X Min, X Max, Y Min, Y Max) in µm to evaluate stage accuracy.</span>
          </div>
        )}

        {hasAllValues && isOutOfSpec && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-xs text-rose-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>OUT OF SPEC — Maximum Deviation Exceeds ±2.0 µm</span>
            </div>
            <p className="text-rose-300/90 pl-7">
              The recorded stage deviation ({overallMaxDev?.toFixed(2)} µm) exceeds the allowable benchmark limit of ±2.0 µm. Pass cannot be granted until physical mechanical stage re-alignment is performed.
            </p>
          </div>
        )}

        {hasAllValues && !isOutOfSpec && (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-300">PASS — All Readings Within Specification</span>
              <p className="text-emerald-300/80 mt-0.5">
                Maximum stage deviation is {overallMaxDev?.toFixed(2)} µm (Benchmark tolerance: ±2.0 µm). Ready to save authoritative result.
              </p>
            </div>
          </div>
        )}

        {/* Optional Attachments & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Optional Engineer Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Optional Engineer Note</span>
              <span className="text-[10px] text-slate-400">Re-run observation or calibration log</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Stage re-zeroed on run 2. Final micrometer verification reading recorded."
              value={engineerNote}
              onChange={e => setEngineerNote(e.target.value)}
              disabled={isReadOnly}
              className={`w-full px-3 py-2 rounded-lg border text-xs transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
              }`}
            />
          </div>

          {/* Optional Evidence Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Optional Calibration Image / Document</span>
              <span className="text-[10px] text-slate-400">Attach externally prepared report image</span>
            </label>

            {evidenceImage ? (
              <div className="relative p-2 rounded-xl border border-slate-700 bg-slate-900 flex items-center gap-3">
                <img
                  src={evidenceImage}
                  alt="Stage Calibration Evidence"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-700"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-slate-200 truncate">Calibration Evidence Attached</div>
                  <div className="text-[10px] text-slate-400">Optional evidence ready</div>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setEvidenceImage('')}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <label className={`p-3 rounded-xl border border-dashed text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                isDark ? 'bg-slate-900/50 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-300 hover:border-slate-400'
              }`}>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Click to attach evidence image</span>
                </div>
                <span className="text-[10px] text-slate-500">PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isReadOnly}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-400">
            Current Stage: <span className="font-bold text-slate-200">{activeStageId === 'stage1' ? 'Stage 1' : 'Stage 2'}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {hasAllValues && isOutOfSpec && !isReadOnly && (
              <button
                type="button"
                onClick={() => saveStageResult('OUT_OF_SPEC', 'NEEDS_REVIEW')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-950/30 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Save as Out-of-Spec (Needs Review)</span>
              </button>
            )}

            {hasAllValues && !isOutOfSpec && !isReadOnly && (
              <button
                type="button"
                onClick={() => saveStageResult('PASS', 'COMPLETED')}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Save {activeStageId === 'stage1' ? 'Stage 1' : 'Stage 2'} (PASS)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}

            {(!hasAllValues || isReadOnly) && (
              <button
                type="button"
                disabled
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs border border-slate-700/60 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Enter 4 Readings to Save</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
