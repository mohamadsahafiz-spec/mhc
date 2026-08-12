import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
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
  Ruler,
  Clock
} from 'lucide-react';
import { Machine, MHCSession, MHCAgcResult, MHCAgcIndexItem } from '../../../types';
import { advanceAutopilotActivity, flagDownstreamNeedsReview } from '../../../utils/mhcAutopilotBrain';

export interface MhcAgcActivityProps {
  session: MHCSession;
  machine: Machine;
  isReadOnly: boolean;
  onUpdateSession: (updatedSession: MHCSession) => void;
  onCompleteActivity: () => void;
  isDark: boolean;
  showNotification?: (msg: string) => void;
  activeCode?: string; // '05_agc1' | '05_agc2' | '05'
}

const SPEC_TOLERANCE_UM = 3.0;
const INDEX_COUNT = 6; // Indices 0 through 5

export const MhcAgcActivity: React.FC<MhcAgcActivityProps> = ({
  session,
  isReadOnly,
  onUpdateSession,
  onCompleteActivity,
  isDark,
  showNotification,
  activeCode = '05_agc1'
}) => {
  // Active AGC tab: 'agc1' or 'agc2'
  const initialAgcId = activeCode === '05_agc2' ? 'agc2' : 'agc1';
  const [activeAgcId, setActiveAgcId] = useState<'agc1' | 'agc2'>(initialAgcId);

  useEffect(() => {
    if (activeCode === '05_agc2') {
      setActiveAgcId('agc2');
    } else if (activeCode === '05_agc1') {
      setActiveAgcId('agc1');
    }
  }, [activeCode]);

  const agcData = useMemo(() => {
    return session.agcData || {};
  }, [session.agcData]);

  // Form State for Indices 0 through 5
  // We keep string states for each index X and Y to allow smooth typing
  const [indexXInputs, setIndexXInputs] = useState<string[]>(Array(INDEX_COUNT).fill(''));
  const [indexYInputs, setIndexYInputs] = useState<string[]>(Array(INDEX_COUNT).fill(''));
  const [indexNotes, setIndexNotes] = useState<string[]>(Array(INDEX_COUNT).fill(''));
  const [overallNote, setOverallNote] = useState<string>('');
  const [evidenceImage, setEvidenceImage] = useState<string>('');

  // Hydrate state when activeAgcId or session changes
  useEffect(() => {
    const rec = agcData[activeAgcId];
    if (rec && rec.indices && rec.indices.length === INDEX_COUNT) {
      setIndexXInputs(rec.indices.map(idx => (idx.xUm !== null && idx.xUm !== undefined ? String(idx.xUm) : '')));
      setIndexYInputs(rec.indices.map(idx => (idx.yUm !== null && idx.yUm !== undefined ? String(idx.yUm) : '')));
      setIndexNotes(rec.indices.map(idx => idx.engineerNote || ''));
      setOverallNote(rec.engineerNote || '');
      setEvidenceImage(rec.evidenceImage || '');
    } else {
      setIndexXInputs(Array(INDEX_COUNT).fill(''));
      setIndexYInputs(Array(INDEX_COUNT).fill(''));
      setIndexNotes(Array(INDEX_COUNT).fill(''));
      setOverallNote('');
      setEvidenceImage('');
    }
  }, [activeAgcId, agcData]);

  const parseNum = (val: string): number | null => {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  // Compute parsed numeric indices
  const parsedIndices = useMemo(() => {
    return Array.from({ length: INDEX_COUNT }, (_, i) => {
      const x = parseNum(indexXInputs[i]);
      const y = parseNum(indexYInputs[i]);
      const isXValid = x !== null;
      const isYValid = y !== null;
      const isComplete = isXValid && isYValid;
      const isXOut = isXValid && Math.abs(x) > SPEC_TOLERANCE_UM;
      const isYOut = isYValid && Math.abs(y) > SPEC_TOLERANCE_UM;
      const isOut = isXOut || isYOut;

      let verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED' = 'UNANSWERED';
      if (isComplete) {
        verdict = isOut ? 'OUT_OF_SPEC' : 'PASS';
      }

      return {
        indexNum: i,
        xUm: x,
        yUm: y,
        isXValid,
        isYValid,
        isComplete,
        isOut,
        verdict,
        note: indexNotes[i]
      };
    });
  }, [indexXInputs, indexYInputs, indexNotes]);

  // Aggregate checks
  const hasAllValues = useMemo(() => {
    return parsedIndices.every(idx => idx.isComplete);
  }, [parsedIndices]);

  const isAnyOutOfSpec = useMemo(() => {
    return parsedIndices.some(idx => idx.isOut);
  }, [parsedIndices]);

  const maxAbsX = useMemo(() => {
    const validXs = parsedIndices.filter(idx => idx.isXValid).map(idx => Math.abs(idx.xUm!));
    if (validXs.length === 0) return null;
    return Math.max(...validXs);
  }, [parsedIndices]);

  const maxAbsY = useMemo(() => {
    const validYs = parsedIndices.filter(idx => idx.isYValid).map(idx => Math.abs(idx.yUm!));
    if (validYs.length === 0) return null;
    return Math.max(...validYs);
  }, [parsedIndices]);

  const overallMaxDev = useMemo(() => {
    if (maxAbsX === null && maxAbsY === null) return null;
    return Math.max(maxAbsX || 0, maxAbsY || 0);
  }, [maxAbsX, maxAbsY]);

  const liveVerdict = useMemo(() => {
    if (!hasAllValues) return 'UNANSWERED';
    return isAnyOutOfSpec ? 'OUT_OF_SPEC' : 'PASS';
  }, [hasAllValues, isAnyOutOfSpec]);

  // Input Handlers
  const handleXChange = (index: number, val: string) => {
    setIndexXInputs(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleYChange = (index: number, val: string) => {
    setIndexYInputs(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

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
      if (showNotification) showNotification('AGC evidence image attached successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setIndexXInputs(Array(INDEX_COUNT).fill(''));
    setIndexYInputs(Array(INDEX_COUNT).fill(''));
    setIndexNotes(Array(INDEX_COUNT).fill(''));
    setOverallNote('');
    setEvidenceImage('');
    if (showNotification) showNotification(`${activeAgcId === 'agc1' ? 'AGC 1' : 'AGC 2'} inputs cleared for re-run.`);
  };

  // Save Result Handler
  const saveAgcResult = (
    verdict: 'PASS' | 'OUT_OF_SPEC',
    status: 'COMPLETED' | 'NEEDS_REVIEW'
  ) => {
    const agcCode = activeAgcId === 'agc1' ? '05_agc1' : '05_agc2';
    const agcName = activeAgcId === 'agc1' ? 'AGC 1' : 'AGC 2';

    const indexItems: MHCAgcIndexItem[] = parsedIndices.map(idx => ({
      indexNum: idx.indexNum,
      xUm: idx.xUm,
      yUm: idx.yUm,
      specToleranceUm: SPEC_TOLERANCE_UM,
      verdict: idx.verdict,
      engineerNote: idx.note || undefined
    }));

    const updatedAgcResult: MHCAgcResult = {
      agcId: activeAgcId,
      agcName,
      indices: indexItems,
      maxAbsXUm: maxAbsX ?? undefined,
      maxAbsYUm: maxAbsY ?? undefined,
      overallMaxDevUm: overallMaxDev ?? undefined,
      specToleranceUm: SPEC_TOLERANCE_UM,
      verdict,
      status,
      scannerConditionFlag: verdict === 'OUT_OF_SPEC',
      evidenceImage: evidenceImage || undefined,
      engineerNote: overallNote || undefined,
      updatedAt: new Date().toISOString()
    };

    const newAgcData = {
      ...agcData,
      [activeAgcId]: updatedAgcResult
    };

    let updatedSession: MHCSession = {
      ...session,
      agcData: newAgcData
    };

    // Flag downstream if editing previously completed activity
    if (session.autopilotProgress?.activityStatuses?.[agcCode] === 'COMPLETED') {
      updatedSession = flagDownstreamNeedsReview(updatedSession, agcCode);
    }

    // Advance autopilot state for this AGC activity
    updatedSession = advanceAutopilotActivity(
      updatedSession,
      agcCode,
      status,
      overallNote
    );

    const otherAgcId = activeAgcId === 'agc1' ? 'agc2' : 'agc1';
    const otherRecord = newAgcData[otherAgcId];
    const isOtherCompleted = otherRecord?.status === 'COMPLETED' && otherRecord?.verdict === 'PASS';

    onUpdateSession(updatedSession);

    if (status === 'COMPLETED' && verdict === 'PASS') {
      if (isOtherCompleted) {
        if (showNotification) {
          showNotification('AGC 1 & AGC 2 Calibration PASS! Advanced to Day 3 Temperature & Evidence.');
        }
        onCompleteActivity();
      } else {
        if (showNotification) {
          showNotification(`${agcName} Calibration PASS recorded. Switching to ${otherAgcId === 'agc1' ? 'AGC 1' : 'AGC 2'}...`);
        }
        setActiveAgcId(otherAgcId);
      }
    } else {
      if (showNotification) {
        showNotification(`${agcName} flagged as NEEDS_REVIEW (Scanner Out of Spec).`);
      }
    }
  };

  const getAgcTabStatus = (agcIdKey: 'agc1' | 'agc2') => {
    const rec = agcData[agcIdKey];
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
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                DAY 3 • 05
              </span>
              <h2 className="text-lg font-bold text-slate-100">AGC Calibration Autopilot</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatic Gain Compensation index calibration check (Tolerance: ±3.0 µm across Indices 0–5)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 text-xs font-medium">
          <span className="text-slate-400 pl-2">Benchmark Spec:</span>
          <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30 flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5" /> ±3.0 µm
          </span>
        </div>
      </div>

      {/* AGC Head Navigation Tabs (AGC 1 vs AGC 2) */}
      <div className="grid grid-cols-2 gap-3">
        {(['agc1', 'agc2'] as const).map(agcIdKey => {
          const isActive = activeAgcId === agcIdKey;
          const label = agcIdKey === 'agc1' ? 'AGC 1 Calibration (Head 1 Scanner)' : 'AGC 2 Calibration (Head 2 Scanner)';
          const code = agcIdKey === 'agc1' ? '05_agc1' : '05_agc2';

          return (
            <button
              key={agcIdKey}
              type="button"
              onClick={() => setActiveAgcId(agcIdKey)}
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
              <div>{getAgcTabStatus(agcIdKey)}</div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace for Active AGC Head */}
      <div className={`p-5 rounded-xl border space-y-6 ${
        isDark ? 'bg-slate-800/30 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <span>{activeAgcId === 'agc1' ? 'AGC 1 (Head 1 Scanner)' : 'AGC 2 (Head 2 Scanner)'} Index 0–5 Data Entry</span>
            {agcData[activeAgcId]?.status === 'COMPLETED' && agcData[activeAgcId]?.verdict === 'PASS' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Authoritative Record
              </span>
            )}
          </h3>

          <button
            type="button"
            onClick={handleReset}
            disabled={isReadOnly}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-enter Readings
          </button>
        </div>

        {/* Index 0–5 Input Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b text-slate-400 font-semibold uppercase tracking-wider ${
                isDark ? 'border-slate-700/60 bg-slate-900/50' : 'border-slate-200 bg-slate-100/60'
              }`}>
                <th className="py-2.5 px-3">AGC Index</th>
                <th className="py-2.5 px-3">Final X Result (µm)</th>
                <th className="py-2.5 px-3">Final Y Result (µm)</th>
                <th className="py-2.5 px-3">Spec Limit</th>
                <th className="py-2.5 px-3">Index Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {parsedIndices.map((idxItem) => {
                const i = idxItem.indexNum;
                return (
                  <tr key={i} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                    {/* Index Label */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-200">
                      Index {i}
                    </td>

                    {/* Final X Input */}
                    <td className="py-2 px-3">
                      <div className="relative max-w-[140px]">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 1.20"
                          value={indexXInputs[i]}
                          onChange={(e) => handleXChange(i, e.target.value)}
                          disabled={isReadOnly}
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                            idxItem.isXValid && Math.abs(idxItem.xUm!) > SPEC_TOLERANCE_UM
                              ? 'border-rose-500 bg-rose-950/20 text-rose-300 focus:ring-rose-500'
                              : isDark
                                ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                          }`}
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-mono">µm</span>
                      </div>
                    </td>

                    {/* Final Y Input */}
                    <td className="py-2 px-3">
                      <div className="relative max-w-[140px]">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. -0.90"
                          value={indexYInputs[i]}
                          onChange={(e) => handleYChange(i, e.target.value)}
                          disabled={isReadOnly}
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                            idxItem.isYValid && Math.abs(idxItem.yUm!) > SPEC_TOLERANCE_UM
                              ? 'border-rose-500 bg-rose-950/20 text-rose-300 focus:ring-rose-500'
                              : isDark
                                ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                          }`}
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-mono">µm</span>
                      </div>
                    </td>

                    {/* Spec Limit */}
                    <td className="py-3 px-3 font-mono text-slate-400">
                      ±3.0 µm
                    </td>

                    {/* Index Verdict */}
                    <td className="py-3 px-3">
                      {idxItem.verdict === 'PASS' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PASS
                        </span>
                      )}
                      {idxItem.verdict === 'OUT_OF_SPEC' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[11px] border border-rose-500/40">
                          <XCircle className="w-3 h-3 text-rose-400" /> OUT OF SPEC
                        </span>
                      )}
                      {idxItem.verdict === 'UNANSWERED' && (
                        <span className="text-[11px] text-slate-500 italic">Awaiting readings</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Real-time Summary Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Max Abs X */}
          <div className={`p-3.5 rounded-xl border ${
            maxAbsX === null
              ? 'bg-slate-900/40 border-slate-800'
              : maxAbsX > SPEC_TOLERANCE_UM
                ? 'bg-rose-950/30 border-rose-500/50'
                : 'bg-emerald-950/20 border-emerald-500/30'
          }`}>
            <div className="text-[11px] text-slate-400 font-medium">Max Abs X Deviation</div>
            <div className={`text-lg font-mono font-bold mt-1 ${
              maxAbsX === null
                ? 'text-slate-500'
                : maxAbsX > SPEC_TOLERANCE_UM
                  ? 'text-rose-400'
                  : 'text-emerald-400'
            }`}>
              {maxAbsX !== null ? `${maxAbsX.toFixed(2)} µm` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {maxAbsX !== null ? (maxAbsX <= SPEC_TOLERANCE_UM ? '✓ ≤ 3.0 µm' : '⚠ Exceeds Limit') : 'Awaiting inputs'}
            </div>
          </div>

          {/* Max Abs Y */}
          <div className={`p-3.5 rounded-xl border ${
            maxAbsY === null
              ? 'bg-slate-900/40 border-slate-800'
              : maxAbsY > SPEC_TOLERANCE_UM
                ? 'bg-rose-950/30 border-rose-500/50'
                : 'bg-emerald-950/20 border-emerald-500/30'
          }`}>
            <div className="text-[11px] text-slate-400 font-medium">Max Abs Y Deviation</div>
            <div className={`text-lg font-mono font-bold mt-1 ${
              maxAbsY === null
                ? 'text-slate-500'
                : maxAbsY > SPEC_TOLERANCE_UM
                  ? 'text-rose-400'
                  : 'text-emerald-400'
            }`}>
              {maxAbsY !== null ? `${maxAbsY.toFixed(2)} µm` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {maxAbsY !== null ? (maxAbsY <= SPEC_TOLERANCE_UM ? '✓ ≤ 3.0 µm' : '⚠ Exceeds Limit') : 'Awaiting inputs'}
            </div>
          </div>

          {/* Overall Max Dev */}
          <div className={`p-3.5 rounded-xl border ${
            overallMaxDev === null
              ? 'bg-slate-900/40 border-slate-800'
              : overallMaxDev > SPEC_TOLERANCE_UM
                ? 'bg-rose-950/30 border-rose-500/50'
                : 'bg-cyan-950/30 border-cyan-500/30'
          }`}>
            <div className="text-[11px] text-slate-400 font-medium">Overall Max Deviation</div>
            <div className={`text-lg font-mono font-bold mt-1 ${
              overallMaxDev === null
                ? 'text-slate-500'
                : overallMaxDev > SPEC_TOLERANCE_UM
                  ? 'text-rose-400'
                  : 'text-cyan-300'
            }`}>
              {overallMaxDev !== null ? `${overallMaxDev.toFixed(2)} µm` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Across Indices 0–5
            </div>
          </div>

          {/* Overall AGC Verdict Badge */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            liveVerdict === 'PASS'
              ? 'bg-emerald-950/30 border-emerald-500/50'
              : liveVerdict === 'OUT_OF_SPEC'
                ? 'bg-rose-950/40 border-rose-500/60'
                : 'bg-slate-900/40 border-slate-800'
          }`}>
            <div className="text-[11px] text-slate-400 font-medium">Overall AGC Status</div>
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
              {liveVerdict === 'PASS' ? 'Ready to confirm' : liveVerdict === 'OUT_OF_SPEC' ? 'Scanner issue flagged' : 'Enter all 12 values'}
            </div>
          </div>
        </div>

        {/* SCANNER CONDITION WARNING (if OUT_OF_SPEC) */}
        {hasAllValues && isAnyOutOfSpec && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/60 text-xs text-rose-200 space-y-2 shadow-lg shadow-rose-950/20">
            <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>Scanner calibration outside specification — scanner condition requires engineering attention.</span>
            </div>
            <p className="text-rose-300/90 pl-7 leading-relaxed">
              One or more AGC index deviation readings exceed the ±3.0 µm limit ({overallMaxDev?.toFixed(2)} µm max deviation). Pass cannot be granted without physical scanner calibration correction.
            </p>
            <div className="ml-7 pt-1 flex items-center gap-2 text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded-lg border border-amber-500/30">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Engineering Planning Datum:</strong> Scanner service or replacement is typically considered around a 2-year operational interval. The service engineer must determine the final corrective action.
              </span>
            </div>
          </div>
        )}

        {hasAllValues && !isAnyOutOfSpec && (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-300">PASS — All 6 AGC Indices Within Specification</span>
              <p className="text-emerald-300/80 mt-0.5">
                Maximum scanner index deviation is {overallMaxDev?.toFixed(2)} µm (Tolerance benchmark: ±3.0 µm). Ready to record authoritative result.
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
              <span className="text-[10px] text-slate-400">Calibration observation or re-run log</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. AGC gain table re-loaded on run 2. All 6 indices verified."
              value={overallNote}
              onChange={e => setOverallNote(e.target.value)}
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
              <span>Optional AGC Report / Evidence Image</span>
              <span className="text-[10px] text-slate-400">Attach external AGC printout or plot</span>
            </label>

            {evidenceImage ? (
              <div className="relative p-2 rounded-xl border border-slate-700 bg-slate-900 flex items-center gap-3">
                <img
                  src={evidenceImage}
                  alt="AGC Calibration Evidence"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-700"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-slate-200 truncate">AGC Evidence Attached</div>
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
                  <span>Click to attach AGC plot / report image</span>
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

        {/* Footer Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-400">
            Active Scanner: <span className="font-bold text-slate-200">{activeAgcId === 'agc1' ? 'AGC 1 (Head 1 Scanner)' : 'AGC 2 (Head 2 Scanner)'}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {hasAllValues && isAnyOutOfSpec && !isReadOnly && (
              <button
                type="button"
                onClick={() => saveAgcResult('OUT_OF_SPEC', 'NEEDS_REVIEW')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-950/30 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Save as Out-of-Spec (Needs Review)</span>
              </button>
            )}

            {hasAllValues && !isAnyOutOfSpec && !isReadOnly && (
              <button
                type="button"
                onClick={() => saveAgcResult('PASS', 'COMPLETED')}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Save {activeAgcId === 'agc1' ? 'AGC 1' : 'AGC 2'} (PASS)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}

            {(!hasAllValues || isReadOnly) && (
              <button
                type="button"
                disabled
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs border border-slate-700/60 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Enter All 12 Index Readings (0–5) to Save</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
