import React, { useState, useEffect, useMemo } from 'react';
import { 
  Aperture, 
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
  Upload,
  Image as ImageIcon,
  Trash2,
  Maximize2
} from 'lucide-react';
import { Machine, MHCSession } from '../../../types';
import { 
  BeamCheckpointReading, 
  BeamProfileCheckRecord, 
  CHECKPOINT_SPECS, 
  CheckpointId 
} from '../../../types/beamProfile';
import { BeamProfileEngine } from '../../../utils/beamProfileEngine';
import { StorageService } from '../../../utils/persistence';

export interface MhcLaserBeamActivityProps {
  session: MHCSession;
  machine: Machine;
  isReadOnly: boolean;
  onUpdateSession: (updatedSession: MHCSession) => void;
  onCompleteActivity: () => void;
  onUpdateMachine?: (updatedMachine: Machine) => void;
  isDark: boolean;
  showNotification?: (msg: string) => void;
}

const HEAD_1_CHECKPOINTS: CheckpointId[] = [
  '6A', '6B', '6C-2.2mm', '6C-2.0mm', '6C-1.8mm', '6C-1.3mm', '6C-1.1mm', '6C-0.9mm'
];

const HEAD_2_CHECKPOINTS: CheckpointId[] = [
  '7A', '7B', '7C-2.2mm', '7C-2.0mm', '7C-1.8mm', '7C-1.3mm', '7C-1.1mm', '7C-0.9mm'
];

const STATION_DISPLAY_NAMES: Record<string, string> = {
  '6A': '1. Laser Source',
  '6B': '2. After Optics',
  '6C-2.2mm': '3. Index Mask 0 (2.2mm)',
  '6C-2.0mm': '4. Index Mask 1 (2.0mm)',
  '6C-1.8mm': '5. Index Mask 2 (1.8mm)',
  '6C-1.3mm': '6. Index Mask 3 (1.3mm)',
  '6C-1.1mm': '7. Index Mask 4 (1.1mm)',
  '6C-0.9mm': '8. Index Mask 5 (0.9mm)',

  '7A': '1. Laser Source',
  '7B': '2. After Optics',
  '7C-2.2mm': '3. Index Mask 0 (2.2mm)',
  '7C-2.0mm': '4. Index Mask 1 (2.0mm)',
  '7C-1.8mm': '5. Index Mask 2 (1.8mm)',
  '7C-1.3mm': '6. Index Mask 3 (1.3mm)',
  '7C-1.1mm': '7. Index Mask 4 (1.1mm)',
  '7C-0.9mm': '8. Index Mask 5 (0.9mm)'
};

export const MhcLaserBeamActivity: React.FC<MhcLaserBeamActivityProps> = ({
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
  const previousRecord = useMemo<BeamProfileCheckRecord | null>(() => {
    const machineRecords = (machine.beamProfileRecords || [])
      .filter(r => r.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (machineRecords.length > 0) {
      return machineRecords[0];
    }

    try {
      const allSessions = StorageService.getMhcSessions();
      const pastSessions = allSessions.filter(s => s.machineId === machine.id && s.id !== session.id);
      for (const ps of pastSessions) {
        if (ps.stage02_laserProfile && ps.stage02_laserProfile.beamProfileRecord) {
          return ps.stage02_laserProfile.beamProfileRecord;
        }
      }
    } catch {
      // Ignore storage lookup error
    }

    return null;
  }, [machine, session.id]);

  // Helper to extract baseline diameter & image for a checkpoint
  const getPreviousData = (chkId: CheckpointId) => {
    if (!previousRecord || !previousRecord.readings) return { prevDiameter: null, prevImage: null };
    const r = previousRecord.readings[chkId];
    return {
      prevDiameter: r?.measuredDiameterMm ?? null,
      prevImage: r?.imageDataUrl || null
    };
  };

  // 3. INITIALIZE / HYDRATE CURRENT WORKSPACE VALUES & IMAGES
  const initialValuesAndImages = useMemo(() => {
    const vals: Partial<Record<CheckpointId, number | null>> = {};
    const imgs: Partial<Record<CheckpointId, string | undefined>> = {};

    const existingRecord = session.stage02_laserProfile?.beamProfileRecord;
    CHECKPOINT_SPECS.forEach(s => {
      if (existingRecord && existingRecord.readings && existingRecord.readings[s.id]) {
        const r = existingRecord.readings[s.id];
        vals[s.id] = r.measuredDiameterMm ?? null;
        imgs[s.id] = r.imageDataUrl;
      } else {
        vals[s.id] = null;
        imgs[s.id] = undefined;
      }
    });

    return { vals, imgs };
  }, [session.stage02_laserProfile]);

  const [values, setValues] = useState<Record<CheckpointId, number | null>>(
    initialValuesAndImages.vals as Record<CheckpointId, number | null>
  );
  const [images, setImages] = useState<Record<CheckpointId, string | undefined>>(
    initialValuesAndImages.imgs as Record<CheckpointId, string | undefined>
  );
  const [engineerRemarks, setEngineerRemarks] = useState<string>(
    session.stage02_laserProfile?.notes || ''
  );
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialValuesAndImages.vals as Record<CheckpointId, number | null>);
    setImages(initialValuesAndImages.imgs as Record<CheckpointId, string | undefined>);
  }, [initialValuesAndImages]);

  // Handler for value change
  const handleValueChange = (chkId: CheckpointId, rawVal: string) => {
    if (isReadOnly) return;
    const num = rawVal === '' ? null : parseFloat(rawVal);
    const validNum = num !== null && !isNaN(num) ? num : null;
    setValues(prev => ({ ...prev, [chkId]: validNum }));
  };

  // Handler for image upload
  const handleImageUpload = (chkId: CheckpointId, file: File) => {
    if (isReadOnly || !file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setImages(prev => ({ ...prev, [chkId]: dataUrl }));
        if (showNotification) {
          showNotification(`✓ Image uploaded for ${STATION_DISPLAY_NAMES[chkId] || chkId}`);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (chkId: CheckpointId) => {
    if (isReadOnly) return;
    setImages(prev => ({ ...prev, [chkId]: undefined }));
  };

  // Quick nominal auto-fill button
  const handlePreFillNominal = () => {
    if (isReadOnly) return;
    const nominals: Partial<Record<CheckpointId, number>> = {
      '6A': 3.5,
      '6B': 4.15,
      '6C-2.2mm': 2.3,
      '6C-2.0mm': 2.1,
      '6C-1.8mm': 1.9,
      '6C-1.3mm': 1.4,
      '6C-1.1mm': 1.2,
      '6C-0.9mm': 1.0,

      '7A': 3.5,
      '7B': 4.15,
      '7C-2.2mm': 2.3,
      '7C-2.0mm': 2.1,
      '7C-1.8mm': 1.9,
      '7C-1.3mm': 1.4,
      '7C-1.1mm': 1.2,
      '7C-0.9mm': 1.0,
    };

    setValues(nominals as Record<CheckpointId, number | null>);
    if (showNotification) {
      showNotification('✓ Pre-filled nominal passing beam diameters for Laser Head 1 & 2');
    }
  };

  // Evaluate point specification
  const evaluateStation = (chkId: CheckpointId, val: number | null) => {
    if (val === null || isNaN(val)) {
      return { status: 'UNFILLED', isPass: false, isOutOfSpec: false, msg: 'Unfilled' };
    }
    if (val < 0 || val > 25) {
      return { status: 'INVALID', isPass: false, isOutOfSpec: true, msg: 'Invalid (>25mm or <0mm)' };
    }

    const spec = CHECKPOINT_SPECS.find(s => s.id === chkId);
    if (!spec) return { status: 'INVALID', isPass: false, isOutOfSpec: true, msg: 'Unknown spec' };

    const isPass = BeamProfileEngine.evalSpec(val, spec.minMm, spec.maxMm);
    if (isPass) {
      return { status: 'PASS', isPass: true, isOutOfSpec: false, msg: 'PASS' };
    } else {
      return { status: 'OUT_OF_SPEC', isPass: false, isOutOfSpec: true, msg: 'OUT OF SPEC' };
    }
  };

  // Evaluate Summary for Head 1 (Laser 1) and Head 2 (Laser 2)
  const evalHead1 = useMemo(() => {
    let passCount = 0;
    let failCount = 0;
    let unfilledCount = 0;

    HEAD_1_CHECKPOINTS.forEach(chkId => {
      const res = evaluateStation(chkId, values[chkId]);
      if (res.isPass) passCount++;
      else if (values[chkId] === null) unfilledCount++;
      else failCount++;
    });

    return {
      passCount,
      failCount,
      unfilledCount,
      isAllPass: passCount === 8,
      isComplete: unfilledCount === 0
    };
  }, [values]);

  const evalHead2 = useMemo(() => {
    let passCount = 0;
    let failCount = 0;
    let unfilledCount = 0;

    HEAD_2_CHECKPOINTS.forEach(chkId => {
      const res = evaluateStation(chkId, values[chkId]);
      if (res.isPass) passCount++;
      else if (values[chkId] === null) unfilledCount++;
      else failCount++;
    });

    return {
      passCount,
      failCount,
      unfilledCount,
      isAllPass: passCount === 8,
      isComplete: unfilledCount === 0
    };
  }, [values]);

  const isOverallPass = evalHead1.isAllPass && evalHead2.isAllPass;
  const isOverallComplete = evalHead1.isComplete && evalHead2.isComplete;
  const hasFailures = evalHead1.failCount > 0 || evalHead2.failCount > 0;

  // HANDLE AUTHORITATIVE SAVE & JOURNEY ADVANCEMENT
  const handleSaveAndComplete = () => {
    if (isReadOnly) return;

    if (!isOverallComplete) {
      if (showNotification) showNotification('⚠ Please complete all 16 beam diameter measurements across both laser heads.');
      return;
    }

    if (hasFailures || !isOverallPass) {
      if (showNotification) showNotification('⚠ Cannot complete: Some beam diameter measurements are OUT OF SPEC.');
      return;
    }

    // Build draft readings map
    const draftReadings: Partial<Record<CheckpointId, BeamCheckpointReading>> = {};
    CHECKPOINT_SPECS.forEach(s => {
      const val = values[s.id];
      const img = images[s.id];
      const pass = BeamProfileEngine.evalSpec(val, s.minMm, s.maxMm);
      draftReadings[s.id] = {
        checkpointId: s.id,
        measuredDiameterMm: val,
        imageDataUrl: img,
        pass
      };
    });

    const draftRecord: Partial<BeamProfileCheckRecord> = {
      date: new Date().toISOString().split('T')[0],
      readings: draftReadings as Record<CheckpointId, BeamCheckpointReading>,
      engineerRemarks,
      overallResult: 'PASS'
    };

    const evaluatedRecord = BeamProfileEngine.evaluateRecord(draftRecord);

    // Update MHCSession
    const updatedSession: MHCSession = {
      ...session,
      stage02_laserProfile: {
        ...session.stage02_laserProfile,
        profileInfo: `Beam Profile & Mode Check Complete (${evalHead1.passCount + evalHead2.passCount}/16 stations passed)`,
        notes: engineerRemarks || 'Beam profile and mode measurements verified across both laser heads.',
        beamProfileRecord: evaluatedRecord
      },
      lastUpdated: new Date().toISOString()
    };

    onUpdateSession(updatedSession);

    // Update Machine Passport record
    try {
      const existingMachineRecords = machine.beamProfileRecords || [];
      const newMachineRecords = [evaluatedRecord, ...existingMachineRecords.filter(r => r.id !== evaluatedRecord.id)];
      const updatedMachine: Machine = {
        ...machine,
        beamProfileRecords: newMachineRecords
      };
      const allMachines = StorageService.getMachines();
      const otherMachines = allMachines.filter(m => m.id !== machine.id);
      StorageService.saveMachines([updatedMachine, ...otherMachines]);
      if (onUpdateMachine) onUpdateMachine(updatedMachine);
    } catch (err) {
      console.error('Failed to sync machine beam profile record:', err);
    }

    if (showNotification) {
      showNotification('✓ Authoritative Beam Profile Record saved & Journey Rail advanced!');
    }

    // Complete activity in Journey Rail
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
            <Aperture className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
              Day 1 • Activity 02 & 03: Beam Profile / Mode Workspace
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              SIDE-BY-SIDE MATRIX ACTIVE
            </span>
            {!isReadOnly && (
              <button
                onClick={handlePreFillNominal}
                className="px-2.5 py-1 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Fill nominal passing beam diameters for fast testing"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Pre-fill Nominal Specs</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          <p className="leading-relaxed">
            Record beam diameters and optional profile image evidence across Source, Optics, and Index Masks 0–5 for Laser Head 1 & 2 using native <strong className="text-cyan-300 font-mono">BeamProfileEngine</strong> specifications.
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
            evalHead1.isAllPass 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : evalHead1.failCount > 0
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            {evalHead1.passCount}/8 PASS
          </span>
        </div>

        {/* Head 2 Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">LASER HEAD 2 (HEAD B)</div>
            <div className="text-xs font-bold text-slate-200">{laserHeads[1]?.name || 'Laser Head 2'}</div>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${
            evalHead2.isAllPass 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : evalHead2.failCount > 0
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            {evalHead2.passCount}/8 PASS
          </span>
        </div>

        {/* Overall Beam Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">OVERALL BEAM STATUS</div>
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

        {/* ================= LASER HEAD 1 ================= */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          evalHead1.isAllPass 
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
                  {laserHeads[0]?.name || 'Laser Head 1'} (Laser 1)
                </h4>
                <div className="text-[10px] font-mono text-slate-400">
                  {laserHeads[0]?.serialNo || 'Primary Beam Path'}
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
              evalHead1.isAllPass 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : evalHead1.failCount > 0 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {evalHead1.isAllPass ? '✓ ALL 8 PASS' : `${evalHead1.passCount}/8 PASS`}
            </span>
          </div>

          {/* MEASUREMENT ROWS FOR LH1 */}
          <div className="space-y-3">
            {HEAD_1_CHECKPOINTS.map((chkId) => {
              const spec = CHECKPOINT_SPECS.find(s => s.id === chkId)!;
              const currentVal = values[chkId];
              const currentImg = images[chkId];
              const { prevDiameter, prevImage } = getPreviousData(chkId);
              const evalRes = evaluateStation(chkId, currentVal);

              const deltaMm = (currentVal !== null && prevDiameter !== null) ? (currentVal - prevDiameter) : null;
              const deltaPct = (currentVal !== null && prevDiameter !== null && prevDiameter !== 0) ? ((deltaMm! / prevDiameter) * 100) : null;

              return (
                <div 
                  key={`lh1-beam-${chkId}`}
                  className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                    evalRes.isPass 
                      ? 'bg-slate-950/40 border-slate-800/80' 
                      : evalRes.isOutOfSpec
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950/20 border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">
                      {STATION_DISPLAY_NAMES[chkId] || spec.stageLabel}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Spec: {spec.specText}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Previous Baseline Display */}
                    <div className="text-[11px] font-mono flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/60">
                      <span className="text-slate-500">Prev Baseline:</span>
                      <span className={prevDiameter !== null ? 'text-slate-300 font-bold' : 'text-slate-600 font-normal'}>
                        {prevDiameter !== null ? `${prevDiameter.toFixed(2)} mm` : 'No baseline'}
                      </span>
                    </div>

                    {/* Current Input */}
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        disabled={isReadOnly}
                        value={currentVal !== null ? currentVal : ''}
                        onChange={(e) => handleValueChange(chkId, e.target.value)}
                        placeholder="Diameter (mm)"
                        className={`w-full pl-3 pr-12 py-1.5 rounded-lg border text-xs font-mono font-bold outline-none transition-all ${
                          evalRes.isPass
                            ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 focus:border-emerald-400'
                            : evalRes.isOutOfSpec
                            ? 'bg-rose-900/30 border-rose-500/60 text-rose-200 focus:border-rose-400'
                            : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                        mm
                      </span>
                    </div>
                  </div>

                  {/* EVIDENCE IMAGE ATTACHMENT AREA */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Evidence Image (Optional):</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {prevImage && (
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal(prevImage)}
                          className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono flex items-center gap-1 cursor-pointer hover:bg-amber-500/20"
                          title="View previous baseline image evidence"
                        >
                          <Maximize2 className="w-2.5 h-2.5" />
                          <span>Prev Image</span>
                        </button>
                      )}

                      {currentImg ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewImageModal(currentImg)}
                            className="relative group rounded overflow-hidden border border-cyan-500/40 w-7 h-7 shrink-0 cursor-pointer"
                          >
                            <img src={currentImg} alt="Beam evidence" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-3 h-3 text-cyan-300" />
                            </div>
                          </button>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(chkId)}
                              className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                              title="Remove image"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : !isReadOnly ? (
                        <label className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-mono font-semibold transition-all flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3 h-3 text-cyan-400" />
                          <span>Attach Image</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleImageUpload(chkId, e.target.files[0]);
                            }} 
                          />
                        </label>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-600">No image</span>
                      )}
                    </div>
                  </div>

                  {/* RESULT STATUS & DELTA FOOTER */}
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                    {/* Status Badge */}
                    {evalRes.isPass ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASS ({currentVal?.toFixed(2)} mm)</span>
                      </span>
                    ) : evalRes.isOutOfSpec ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{evalRes.msg}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-semibold">Pending measurement</span>
                    )}

                    {/* Delta Display */}
                    {deltaMm !== null && (
                      <span className={`font-semibold flex items-center gap-1 ${
                        deltaMm >= 0 ? 'text-cyan-400' : 'text-amber-400'
                      }`}>
                        {deltaMm >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>Delta: {deltaMm >= 0 ? `+${deltaMm.toFixed(2)}` : deltaMm.toFixed(2)} mm ({deltaPct! >= 0 ? `+${deltaPct!.toFixed(1)}` : deltaPct!.toFixed(1)}%)</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= LASER HEAD 2 ================= */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          evalHead2.isAllPass 
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
                  {laserHeads[1]?.name || 'Laser Head 2'} (Laser 2)
                </h4>
                <div className="text-[10px] font-mono text-slate-400">
                  {laserHeads[1]?.serialNo || 'Secondary Beam Path'}
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
              evalHead2.isAllPass 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : evalHead2.failCount > 0 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {evalHead2.isAllPass ? '✓ ALL 8 PASS' : `${evalHead2.passCount}/8 PASS`}
            </span>
          </div>

          {/* MEASUREMENT ROWS FOR LH2 */}
          <div className="space-y-3">
            {HEAD_2_CHECKPOINTS.map((chkId) => {
              const spec = CHECKPOINT_SPECS.find(s => s.id === chkId)!;
              const currentVal = values[chkId];
              const currentImg = images[chkId];
              const { prevDiameter, prevImage } = getPreviousData(chkId);
              const evalRes = evaluateStation(chkId, currentVal);

              const deltaMm = (currentVal !== null && prevDiameter !== null) ? (currentVal - prevDiameter) : null;
              const deltaPct = (currentVal !== null && prevDiameter !== null && prevDiameter !== 0) ? ((deltaMm! / prevDiameter) * 100) : null;

              return (
                <div 
                  key={`lh2-beam-${chkId}`}
                  className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                    evalRes.isPass 
                      ? 'bg-slate-950/40 border-slate-800/80' 
                      : evalRes.isOutOfSpec
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950/20 border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">
                      {STATION_DISPLAY_NAMES[chkId] || spec.stageLabel}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Spec: {spec.specText}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Previous Baseline Display */}
                    <div className="text-[11px] font-mono flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/60">
                      <span className="text-slate-500">Prev Baseline:</span>
                      <span className={prevDiameter !== null ? 'text-slate-300 font-bold' : 'text-slate-600 font-normal'}>
                        {prevDiameter !== null ? `${prevDiameter.toFixed(2)} mm` : 'No baseline'}
                      </span>
                    </div>

                    {/* Current Input */}
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        disabled={isReadOnly}
                        value={currentVal !== null ? currentVal : ''}
                        onChange={(e) => handleValueChange(chkId, e.target.value)}
                        placeholder="Diameter (mm)"
                        className={`w-full pl-3 pr-12 py-1.5 rounded-lg border text-xs font-mono font-bold outline-none transition-all ${
                          evalRes.isPass
                            ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 focus:border-emerald-400'
                            : evalRes.isOutOfSpec
                            ? 'bg-rose-900/30 border-rose-500/60 text-rose-200 focus:border-rose-400'
                            : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                        mm
                      </span>
                    </div>
                  </div>

                  {/* EVIDENCE IMAGE ATTACHMENT AREA */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Evidence Image (Optional):</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {prevImage && (
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal(prevImage)}
                          className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono flex items-center gap-1 cursor-pointer hover:bg-amber-500/20"
                          title="View previous baseline image evidence"
                        >
                          <Maximize2 className="w-2.5 h-2.5" />
                          <span>Prev Image</span>
                        </button>
                      )}

                      {currentImg ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewImageModal(currentImg)}
                            className="relative group rounded overflow-hidden border border-cyan-500/40 w-7 h-7 shrink-0 cursor-pointer"
                          >
                            <img src={currentImg} alt="Beam evidence" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-3 h-3 text-cyan-300" />
                            </div>
                          </button>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(chkId)}
                              className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                              title="Remove image"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : !isReadOnly ? (
                        <label className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-mono font-semibold transition-all flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3 h-3 text-cyan-400" />
                          <span>Attach Image</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleImageUpload(chkId, e.target.files[0]);
                            }} 
                          />
                        </label>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-600">No image</span>
                      )}
                    </div>
                  </div>

                  {/* RESULT STATUS & DELTA FOOTER */}
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                    {/* Status Badge */}
                    {evalRes.isPass ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASS ({currentVal?.toFixed(2)} mm)</span>
                      </span>
                    ) : evalRes.isOutOfSpec ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{evalRes.msg}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-semibold">Pending measurement</span>
                    )}

                    {/* Delta Display */}
                    {deltaMm !== null && (
                      <span className={`font-semibold flex items-center gap-1 ${
                        deltaMm >= 0 ? 'text-cyan-400' : 'text-amber-400'
                      }`}>
                        {deltaMm >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>Delta: {deltaMm >= 0 ? `+${deltaMm.toFixed(2)}` : deltaMm.toFixed(2)} mm ({deltaPct! >= 0 ? `+${deltaPct!.toFixed(1)}` : deltaPct!.toFixed(1)}%)</span>
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
          <span>BEAM PROFILE & MODE ENGINEER REMARKS & OBSERVATIONS</span>
        </label>
        <input
          type="text"
          disabled={isReadOnly}
          value={engineerRemarks}
          onChange={(e) => setEngineerRemarks(e.target.value)}
          placeholder={isReadOnly ? "Read-only mode active" : "e.g., Beam profile concentricity verified. All index mask diameters strictly within nominal specs."}
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
                Beam Profile Completion Gate
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              {isOverallPass 
                ? 'All 16 beam diameter measurements satisfy specifications. Ready to record authoritative session data and advance Journey Rail.' 
                : hasFailures
                ? 'Out-of-spec measurement points detected. Please correct or re-measure failing stations before completing.'
                : 'Please complete all 16 beam diameter stations across Laser Head 1 and Laser Head 2.'}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300">
            <span>PASSED STATIONS:</span>
            <span className={isOverallPass ? 'text-emerald-400 font-extrabold' : 'text-amber-400'}>
              {evalHead1.passCount + evalHead2.passCount} / 16
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
              <span>Complete Beam Profile Activity & Advance Journey Rail</span>
            </button>
          </div>
        )}
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div 
            className="relative max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden p-2 space-y-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-1 text-xs font-bold text-slate-200 font-mono">
              <span>BEAM EVIDENCE PREVIEW</span>
              <button 
                onClick={() => setPreviewImageModal(null)}
                className="text-slate-400 hover:text-slate-100 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img 
              src={previewImageModal} 
              alt="Beam profile evidence preview" 
              className="max-h-[70vh] w-auto mx-auto object-contain rounded-lg border border-slate-800" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
