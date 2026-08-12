import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Check, 
  Sparkles, 
  Lock, 
  Layers, 
  Activity, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Machine, MHCSession, MHCLaserPowerItem } from '../../../types';
import { LaserPowerCheckRecord, MASK_SPECS, MaskSize } from '../../../types/laserPower';
import { LaserPowerEngine } from '../../../utils/laserPowerEngine';
import { StorageService } from '../../../utils/persistence';

export interface MhcLaserPowerActivityProps {
  session: MHCSession;
  machine: Machine;
  isReadOnly: boolean;
  onUpdateSession: (updatedSession: MHCSession) => void;
  onCompleteActivity: () => void;
  onUpdateMachine?: (updatedMachine: Machine) => void;
  isDark: boolean;
  showNotification?: (msg: string) => void;
}

interface PointConfig {
  id: string;
  name: string;
  specText: string;
  type: 'range' | 'min';
  minWatts: number;
  maxWatts?: number;
  maskSize?: MaskSize;
}

const MEASUREMENT_POINTS: PointConfig[] = [
  { id: 'ls', name: '1. Laser Source', specText: '15W ±10% (13.5–16.5W)', type: 'range', minWatts: 13.5, maxWatts: 16.5 },
  { id: 'opt', name: '2. After Optics', specText: '15W ±10% (13.5–16.5W)', type: 'range', minWatts: 13.5, maxWatts: 16.5 },
  ...MASK_SPECS.map((s, idx) => ({
    id: `mask_${idx}`,
    name: `${idx + 3}. Index Mask ${idx} (${s.size})`,
    specText: s.specText,
    type: 'min' as const,
    minWatts: s.minWatts,
    maskSize: s.size
  }))
];

export const MhcLaserPowerActivity: React.FC<MhcLaserPowerActivityProps> = ({
  session,
  machine,
  isReadOnly,
  onUpdateSession,
  onCompleteActivity,
  onUpdateMachine,
  isDark,
  showNotification
}) => {
  // 1. DISCOVER LASER HEADS
  const laserHeads = useMemo(() => {
    if (machine.laserHeads && machine.laserHeads.length > 0) return machine.laserHeads;
    if (machine.lasers && machine.lasers.length > 0) return machine.lasers;
    return [
      { id: `${machine.id}-lh1`, name: 'Laser Head 1', model: machine.model, serialNo: `${machine.serialNumber}-L1` },
      { id: `${machine.id}-lh2`, name: 'Laser Head 2', model: machine.model, serialNo: `${machine.serialNumber}-L2` }
    ];
  }, [machine]);

  // 2. RETRIEVE MOST RELEVANT HISTORICAL PREVIOUS BASELINE RECORD
  const previousRecord = useMemo<LaserPowerCheckRecord | null>(() => {
    // Search machine.laserPowerRecords
    const machineRecords = (machine.laserPowerRecords || [])
      .filter(r => r.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (machineRecords.length > 0) {
      return machineRecords[0];
    }

    // Fallback: search previous sessions in StorageService
    try {
      const allSessions = StorageService.getMhcSessions();
      const pastSessions = allSessions.filter(s => s.machineId === machine.id && s.id !== session.id);
      for (const ps of pastSessions) {
        if (ps.stage03_laserPower && ps.stage03_laserPower.length > 0) {
          const rec = ps.stage03_laserPower[0]?.powerRecord;
          if (rec) return rec;
        }
      }
    } catch {
      // Ignore storage lookup error
    }

    return null;
  }, [machine, session.id]);

  // Helper to extract baseline values for point index (0..7) and head ('A' | 'B')
  const getPreviousValue = (pointIdx: number, head: 'A' | 'B'): number | null => {
    if (!previousRecord) return null;
    if (pointIdx === 0) return previousRecord.laserSource?.[head === 'A' ? 'headA' : 'headB'] ?? null;
    if (pointIdx === 1) return previousRecord.opticsTopHat?.[head === 'A' ? 'headA' : 'headB'] ?? null;
    const maskIdx = pointIdx - 2;
    return previousRecord.workingZoneMasks?.[maskIdx]?.[head === 'A' ? 'headA' : 'headB'] ?? null;
  };

  // 3. INITIALIZE / HYDRATE CURRENT WORKSPACE VALUES
  const initialValues = useMemo(() => {
    const valsA: (number | null)[] = Array(8).fill(null);
    const valsB: (number | null)[] = Array(8).fill(null);

    // Check if session has a powerRecord inside stage03_laserPower
    const existingRecord = session.stage03_laserPower?.[0]?.powerRecord;
    if (existingRecord) {
      valsA[0] = existingRecord.laserSource?.headA ?? null;
      valsB[0] = existingRecord.laserSource?.headB ?? null;
      valsA[1] = existingRecord.opticsTopHat?.headA ?? null;
      valsB[1] = existingRecord.opticsTopHat?.headB ?? null;
      (existingRecord.workingZoneMasks || []).forEach((m, idx) => {
        if (idx < 6) {
          valsA[idx + 2] = m.headA ?? null;
          valsB[idx + 2] = m.headB ?? null;
        }
      });
    }

    return { valsA, valsB };
  }, [session.stage03_laserPower]);

  const [headAValues, setHeadAValues] = useState<(number | null)[]>(initialValues.valsA);
  const [headBValues, setHeadBValues] = useState<(number | null)[]>(initialValues.valsB);
  const [engineerRemarks, setEngineerRemarks] = useState<string>(
    session.stage03_laserPower?.[0]?.notes || ''
  );

  useEffect(() => {
    setHeadAValues(initialValues.valsA);
    setHeadBValues(initialValues.valsB);
  }, [initialValues]);

  // Helper to update a value
  const handleValueChange = (head: 'A' | 'B', pointIdx: number, rawVal: string) => {
    if (isReadOnly) return;
    const num = rawVal === '' ? null : parseFloat(rawVal);
    const validNum = num !== null && !isNaN(num) ? num : null;

    if (head === 'A') {
      setHeadAValues(prev => {
        const next = [...prev];
        next[pointIdx] = validNum;
        return next;
      });
    } else {
      setHeadBValues(prev => {
        const next = [...prev];
        next[pointIdx] = validNum;
        return next;
      });
    }
  };

  // Quick nominal auto-fill button
  const handlePreFillNominal = () => {
    if (isReadOnly) return;
    const nominalA = [15.2, 14.8, 3.5, 2.8, 2.1, 1.2, 0.8, 0.5];
    const nominalB = [15.0, 14.6, 3.4, 2.7, 2.0, 1.1, 0.75, 0.45];
    setHeadAValues(nominalA);
    setHeadBValues(nominalB);
    if (showNotification) {
      showNotification('✓ Pre-filled nominal passing specifications for LH1 & LH2');
    }
  };

  // Evaluate individual point status
  const evaluatePoint = (pointIdx: number, val: number | null) => {
    if (val === null || isNaN(val)) {
      return { status: 'UNFILLED', isPass: false, isInvalid: false, isOutOfSpec: false, msg: 'Unfilled' };
    }
    if (val < 0 || val > 60) {
      return { status: 'INVALID', isPass: false, isInvalid: true, isOutOfSpec: true, msg: 'Invalid value (>60W or <0W)' };
    }

    const cfg = MEASUREMENT_POINTS[pointIdx];
    let isPass = false;
    if (cfg.type === 'range') {
      isPass = LaserPowerEngine.evalRangeSpec(val, cfg.minWatts, cfg.maxWatts!);
    } else {
      isPass = LaserPowerEngine.evalMinSpec(val, cfg.minWatts);
    }

    if (isPass) {
      return { status: 'PASS', isPass: true, isInvalid: false, isOutOfSpec: false, msg: 'PASS' };
    } else {
      return { status: 'OUT_OF_SPEC', isPass: false, isInvalid: false, isOutOfSpec: true, msg: 'OUT OF SPEC' };
    }
  };

  // Compute Head A & Head B summary metrics
  const evalSummaryA = useMemo(() => {
    let passCount = 0;
    let failCount = 0;
    let unfilledCount = 0;

    headAValues.forEach((v, idx) => {
      const res = evaluatePoint(idx, v);
      if (res.isPass) passCount++;
      else if (v === null) unfilledCount++;
      else failCount++;
    });

    const isAllPass = passCount === 8;
    const isComplete = unfilledCount === 0;

    return { passCount, failCount, unfilledCount, isAllPass, isComplete };
  }, [headAValues]);

  const evalSummaryB = useMemo(() => {
    let passCount = 0;
    let failCount = 0;
    let unfilledCount = 0;

    headBValues.forEach((v, idx) => {
      const res = evaluatePoint(idx, v);
      if (res.isPass) passCount++;
      else if (v === null) unfilledCount++;
      else failCount++;
    });

    const isAllPass = passCount === 8;
    const isComplete = unfilledCount === 0;

    return { passCount, failCount, unfilledCount, isAllPass, isComplete };
  }, [headBValues]);

  const isOverallPass = evalSummaryA.isAllPass && evalSummaryB.isAllPass;
  const isOverallComplete = evalSummaryA.isComplete && evalSummaryB.isComplete;
  const hasFailures = evalSummaryA.failCount > 0 || evalSummaryB.failCount > 0;

  // HANDLE COMPLETION & AUTHORITATIVE PERSISTENCE
  const handleSaveAndComplete = () => {
    if (isReadOnly) return;

    if (!isOverallComplete) {
      if (showNotification) showNotification('⚠ Please complete all 16 measurement points for both laser heads.');
      return;
    }

    if (hasFailures || !isOverallPass) {
      if (showNotification) showNotification('⚠ Cannot complete: Some measurement points are OUT OF SPEC. Please resolve or correct values.');
      return;
    }

    // Construct draft record
    const draftRecord: Partial<LaserPowerCheckRecord> = {
      date: new Date().toISOString().split('T')[0],
      frequencyKhz: 50,
      engineerRemarks,
      laserSource: {
        specText: MEASUREMENT_POINTS[0].specText,
        minWatts: MEASUREMENT_POINTS[0].minWatts,
        maxWatts: MEASUREMENT_POINTS[0].maxWatts!,
        headA: headAValues[0],
        headB: headBValues[0],
        passA: evaluatePoint(0, headAValues[0]).isPass,
        passB: evaluatePoint(0, headBValues[0]).isPass,
      },
      opticsTopHat: {
        specText: MEASUREMENT_POINTS[1].specText,
        minWatts: MEASUREMENT_POINTS[1].minWatts,
        maxWatts: MEASUREMENT_POINTS[1].maxWatts!,
        headA: headAValues[1],
        headB: headBValues[1],
        passA: evaluatePoint(1, headAValues[1]).isPass,
        passB: evaluatePoint(1, headBValues[1]).isPass,
      },
      workingZoneMasks: MASK_SPECS.map((s, idx) => {
        const pIdx = idx + 2;
        return {
          maskSize: s.size,
          specText: s.specText,
          minWatts: s.minWatts,
          headA: headAValues[pIdx],
          headB: headBValues[pIdx],
          passA: evaluatePoint(pIdx, headAValues[pIdx]).isPass,
          passB: evaluatePoint(pIdx, headBValues[pIdx]).isPass,
        };
      }),
      overallResult: 'PASS'
    };

    const evaluatedRecord = LaserPowerEngine.evaluateRecord(draftRecord);

    // Build MHCLaserPowerItem array for session.stage03_laserPower
    const updatedStage03Power: MHCLaserPowerItem[] = laserHeads.map((lh, idx) => {
      const isHeadA = idx === 0;
      const vals = isHeadA ? headAValues : headBValues;
      const summary = isHeadA ? evalSummaryA : evalSummaryB;

      return {
        laserId: lh.id || `lh-${idx + 1}`,
        laserIdentifier: lh.name || `Laser Head ${idx + 1}`,
        ratedPowerWatts: (lh as any).ratedPowerWatts || 250,
        referenceValueWatts: 15.0,
        beforeValueWatts: vals[0] ?? 15.0,
        afterValueWatts: vals[1] ?? 14.8,
        stabilityPercent: 99.2,
        result: summary.isAllPass ? 'PASS' : 'FAIL',
        notes: engineerRemarks || `${lh.name || `Laser Head ${idx + 1}`} Power Check Complete (${summary.passCount}/8 points passed)`,
        evidenceImages: [],
        powerRecord: evaluatedRecord
      };
    });

    // Update MHCSession
    const updatedSession: MHCSession = {
      ...session,
      stage03_laserPower: updatedStage03Power,
      lastUpdated: new Date().toISOString()
    };

    onUpdateSession(updatedSession);

    // Also update Machine Passport records
    try {
      const existingMachineRecords = machine.laserPowerRecords || [];
      const newMachineRecords = [evaluatedRecord, ...existingMachineRecords.filter(r => r.id !== evaluatedRecord.id)];
      const updatedMachine: Machine = {
        ...machine,
        laserPowerRecords: newMachineRecords
      };
      const allMachines = StorageService.getMachines();
      const otherMachines = allMachines.filter(m => m.id !== machine.id);
      StorageService.saveMachines([updatedMachine, ...otherMachines]);
      if (onUpdateMachine) onUpdateMachine(updatedMachine);
    } catch (err) {
      console.error('Failed to sync machine laser power record:', err);
    }

    if (showNotification) {
      showNotification('✓ Authoritative Laser Power Record saved & Journey Rail advanced!');
    }

    // Trigger Autopilot Journey completion
    onCompleteActivity();
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className={`p-4 rounded-2xl border space-y-2 ${
        isDark ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
              Day 1 • Activity 02 & 03: Laser Power Measurement Workspace
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              SIDE-BY-SIDE MATRIX ACTIVE
            </span>
            {!isReadOnly && (
              <button
                onClick={handlePreFillNominal}
                className="px-2.5 py-1 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold transition-all flex items-center gap-1"
                title="Fill nominal passing values for fast field testing"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Pre-fill Nominal Specs</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          <p className="leading-relaxed">
            Record power readings across Source, Optics, and Index Masks 0–5 for both laser heads simultaneously using native <strong className="text-cyan-300 font-mono">LaserPowerEngine</strong> specifications.
          </p>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400">Baseline:</span>
            <span className={previousRecord ? 'text-amber-300 font-bold' : 'text-slate-500 font-semibold'}>
              {previousRecord ? `Record ${previousRecord.id} (${previousRecord.date})` : 'No previous baseline'}
            </span>
          </div>
        </div>
      </div>

      {/* OVERALL STATUS SUMMARY BAR */}
      <div className={`p-4 rounded-2xl border grid grid-cols-1 md:grid-cols-3 gap-4 items-center ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Head 1 Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">LASER HEAD 1 (HEAD A)</div>
            <div className="text-xs font-bold text-slate-200">{laserHeads[0]?.name || 'Laser Head 1'}</div>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${
            evalSummaryA.isAllPass 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : evalSummaryA.failCount > 0
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            {evalSummaryA.passCount}/8 PASS
          </span>
        </div>

        {/* Head 2 Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">LASER HEAD 2 (HEAD B)</div>
            <div className="text-xs font-bold text-slate-200">{laserHeads[1]?.name || 'Laser Head 2'}</div>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${
            evalSummaryB.isAllPass 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : evalSummaryB.failCount > 0
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            {evalSummaryB.passCount}/8 PASS
          </span>
        </div>

        {/* Overall Power Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">OVERALL POWER STATUS</div>
            <div className="text-xs font-bold text-slate-200">
              {isOverallPass ? 'All Specs Satisfied' : hasFailures ? 'Out of Spec Detected' : 'Measurements Pending'}
            </div>
          </div>
          <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${
            isOverallPass
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : hasFailures
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
          }`}>
            {isOverallPass ? '✓ PASS' : hasFailures ? '⚠ OUT OF SPEC' : '◉ IN PROGRESS'}
          </span>
        </div>
      </div>

      {/* SIDE-BY-SIDE MEASUREMENT CARDS MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= LASER HEAD 1 (HEAD A) ================= */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          evalSummaryA.isAllPass 
            ? 'bg-slate-900/80 border-emerald-500/30' 
            : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                LH1
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {laserHeads[0]?.name || 'Laser Head 1'} (Head A)
                </h4>
                <div className="text-[10px] font-mono text-slate-400">
                  {laserHeads[0]?.serialNo || 'Primary Source Unit'}
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
              evalSummaryA.isAllPass 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : evalSummaryA.failCount > 0 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {evalSummaryA.isAllPass ? '✓ ALL 8 PASS' : `${evalSummaryA.passCount}/8 PASS`}
            </span>
          </div>

          {/* MEASUREMENT ROWS FOR LH1 */}
          <div className="space-y-3">
            {MEASUREMENT_POINTS.map((pt, idx) => {
              const currentVal = headAValues[idx];
              const prevVal = getPreviousValue(idx, 'A');
              const evalRes = evaluatePoint(idx, currentVal);

              const deltaW = (currentVal !== null && prevVal !== null) ? (currentVal - prevVal) : null;
              const deltaPct = (currentVal !== null && prevVal !== null && prevVal !== 0) ? ((deltaW! / prevVal) * 100) : null;

              return (
                <div 
                  key={`lh1-pt-${pt.id}`}
                  className={`p-3 rounded-xl border space-y-2 transition-all ${
                    evalRes.isPass 
                      ? 'bg-slate-950/40 border-slate-800/80' 
                      : evalRes.isOutOfSpec
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950/20 border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{pt.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Spec: {pt.specText}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Previous Baseline Display */}
                    <div className="text-[11px] font-mono flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/60">
                      <span className="text-slate-500">Prev Baseline:</span>
                      <span className={prevVal !== null ? 'text-slate-300 font-bold' : 'text-slate-600 font-normal'}>
                        {prevVal !== null ? `${prevVal.toFixed(2)} W` : 'No baseline'}
                      </span>
                    </div>

                    {/* Current Input */}
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        disabled={isReadOnly}
                        value={currentVal !== null ? currentVal : ''}
                        onChange={(e) => handleValueChange('A', idx, e.target.value)}
                        placeholder="Measured W"
                        className={`w-full pl-3 pr-12 py-1.5 rounded-lg border text-xs font-mono font-bold outline-none transition-all ${
                          evalRes.isPass
                            ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 focus:border-emerald-400'
                            : evalRes.isOutOfSpec
                            ? 'bg-rose-900/30 border-rose-500/60 text-rose-200 focus:border-rose-400'
                            : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                        W
                      </span>
                    </div>
                  </div>

                  {/* RESULT STATUS & DELTA FOOTER */}
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                    {/* Status Badge */}
                    {evalRes.isPass ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASS ({currentVal?.toFixed(2)} W)</span>
                      </span>
                    ) : evalRes.isOutOfSpec ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{evalRes.msg}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-semibold">Pending measurement</span>
                    )}

                    {/* Delta W / % Display */}
                    {deltaW !== null && (
                      <span className={`font-semibold flex items-center gap-1 ${
                        deltaW >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {deltaW >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>Delta: {deltaW >= 0 ? `+${deltaW.toFixed(2)}` : deltaW.toFixed(2)} W ({deltaPct! >= 0 ? `+${deltaPct!.toFixed(1)}` : deltaPct!.toFixed(1)}%)</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= LASER HEAD 2 (HEAD B) ================= */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          evalSummaryB.isAllPass 
            ? 'bg-slate-900/80 border-emerald-500/30' 
            : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                LH2
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {laserHeads[1]?.name || 'Laser Head 2'} (Head B)
                </h4>
                <div className="text-[10px] font-mono text-slate-400">
                  {laserHeads[1]?.serialNo || 'Secondary Source Unit'}
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
              evalSummaryB.isAllPass 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : evalSummaryB.failCount > 0 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {evalSummaryB.isAllPass ? '✓ ALL 8 PASS' : `${evalSummaryB.passCount}/8 PASS`}
            </span>
          </div>

          {/* MEASUREMENT ROWS FOR LH2 */}
          <div className="space-y-3">
            {MEASUREMENT_POINTS.map((pt, idx) => {
              const currentVal = headBValues[idx];
              const prevVal = getPreviousValue(idx, 'B');
              const evalRes = evaluatePoint(idx, currentVal);

              const deltaW = (currentVal !== null && prevVal !== null) ? (currentVal - prevVal) : null;
              const deltaPct = (currentVal !== null && prevVal !== null && prevVal !== 0) ? ((deltaW! / prevVal) * 100) : null;

              return (
                <div 
                  key={`lh2-pt-${pt.id}`}
                  className={`p-3 rounded-xl border space-y-2 transition-all ${
                    evalRes.isPass 
                      ? 'bg-slate-950/40 border-slate-800/80' 
                      : evalRes.isOutOfSpec
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950/20 border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{pt.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Spec: {pt.specText}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Previous Baseline Display */}
                    <div className="text-[11px] font-mono flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/60">
                      <span className="text-slate-500">Prev Baseline:</span>
                      <span className={prevVal !== null ? 'text-slate-300 font-bold' : 'text-slate-600 font-normal'}>
                        {prevVal !== null ? `${prevVal.toFixed(2)} W` : 'No baseline'}
                      </span>
                    </div>

                    {/* Current Input */}
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        disabled={isReadOnly}
                        value={currentVal !== null ? currentVal : ''}
                        onChange={(e) => handleValueChange('B', idx, e.target.value)}
                        placeholder="Measured W"
                        className={`w-full pl-3 pr-12 py-1.5 rounded-lg border text-xs font-mono font-bold outline-none transition-all ${
                          evalRes.isPass
                            ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 focus:border-emerald-400'
                            : evalRes.isOutOfSpec
                            ? 'bg-rose-900/30 border-rose-500/60 text-rose-200 focus:border-rose-400'
                            : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                        W
                      </span>
                    </div>
                  </div>

                  {/* RESULT STATUS & DELTA FOOTER */}
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                    {/* Status Badge */}
                    {evalRes.isPass ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASS ({currentVal?.toFixed(2)} W)</span>
                      </span>
                    ) : evalRes.isOutOfSpec ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{evalRes.msg}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-semibold">Pending measurement</span>
                    )}

                    {/* Delta W / % Display */}
                    {deltaW !== null && (
                      <span className={`font-semibold flex items-center gap-1 ${
                        deltaW >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {deltaW >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>Delta: {deltaW >= 0 ? `+${deltaW.toFixed(2)}` : deltaW.toFixed(2)} W ({deltaPct! >= 0 ? `+${deltaPct!.toFixed(1)}` : deltaPct!.toFixed(1)}%)</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ENGINEER REMARKS INPUT */}
      <div className={`p-4 rounded-2xl border space-y-2 ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>POWER CHECK ENGINEER REMARKS & OBSERVATIONS</span>
        </label>
        <input
          type="text"
          disabled={isReadOnly}
          value={engineerRemarks}
          onChange={(e) => setEngineerRemarks(e.target.value)}
          placeholder={isReadOnly ? "Read-only mode active" : "e.g., External power meter calibrated. Both laser source and top hat optics within 10% spec."}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all ${
            isDark 
              ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500' 
              : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
          }`}
        />
      </div>

      {/* COMPLETION GATE & ACTION BUTTON */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isOverallPass
          ? isDark ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
          : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${isOverallPass ? 'text-emerald-400' : 'text-slate-400'}`} />
              <h4 className="font-extrabold text-sm sm:text-base text-slate-100">
                Laser Power Completion Gate
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              {isOverallPass 
                ? 'All 16 measurement points satisfy specifications. Ready to record authoritative session data and advance Journey Rail.' 
                : hasFailures
                ? 'Out-of-spec measurement points detected. Please correct or re-measure failing points before completing.'
                : 'Please complete all 16 measurement points for Laser Head 1 and Laser Head 2.'}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300">
            <span>PASSED POINTS:</span>
            <span className={isOverallPass ? 'text-emerald-400 font-extrabold' : 'text-amber-400'}>
              {evalSummaryA.passCount + evalSummaryB.passCount} / 16
            </span>
          </div>
        </div>

        {/* COMPLETION BUTTON */}
        {!isReadOnly && (
          <div className="pt-2 flex justify-end">
            <button
              disabled={!isOverallPass || !isOverallComplete}
              onClick={handleSaveAndComplete}
              className={`px-6 py-3 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all ${
                isOverallPass && isOverallComplete
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Complete Laser Power Activity & Advance Journey Rail</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
