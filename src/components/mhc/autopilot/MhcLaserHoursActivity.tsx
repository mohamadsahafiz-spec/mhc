import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  Lock, 
  Zap, 
  History,
  Activity
} from 'lucide-react';
import { Machine, MHCSession, MHCLaserHourItem } from '../../../types';
import { LaserEngine } from '../../../utils/laserEngine';

export interface MhcLaserHoursActivityProps {
  session: MHCSession;
  machine: Machine;
  isReadOnly: boolean;
  onUpdateSession: (updatedSession: MHCSession) => void;
  onCompleteActivity: () => void;
  isDark: boolean;
  showNotification?: (msg: string) => void;
}

export const MhcLaserHoursActivity: React.FC<MhcLaserHoursActivityProps> = ({
  session,
  machine,
  isReadOnly,
  onUpdateSession,
  onCompleteActivity,
  isDark,
  showNotification
}) => {
  // Extract laser heads from Machine Passport
  const laserHeads = (machine.laserHeads && machine.laserHeads.length > 0)
    ? machine.laserHeads
    : ((machine.lasers && machine.lasers.length > 0) ? machine.lasers : [
        { 
          id: `${machine.id}-lh1`, 
          name: 'Laser Head 1', 
          model: machine.model, 
          serialNo: `${machine.serialNumber}-L1`, 
          baseLaserHour: 12450, 
          runningHours: 12450, 
          ratedLife: 25000, 
          warningLife: 20000 
        },
        { 
          id: `${machine.id}-lh2`, 
          name: 'Laser Head 2', 
          model: machine.model, 
          serialNo: `${machine.serialNumber}-L2`, 
          baseLaserHour: 11800, 
          runningHours: 11800, 
          ratedLife: 25000, 
          warningLife: 20000 
        }
      ]);

  // Sync session.stage01_laserHours with current laser heads if missing
  const activeItems: MHCLaserHourItem[] = React.useMemo(() => {
    const existing = session.stage01_laserHours || [];
    
    return laserHeads.map((lh, idx) => {
      const metrics = LaserEngine.calculateLaserMetrics(lh);
      const calculatedHr = metrics?.currentHour ?? (lh.runningHours || lh.baseLaserHour || 12450);
      const matched = existing.find(item => item.laserId === lh.id || item.laserIdentifier.includes(`${idx + 1}`));

      if (matched) {
        return {
          ...matched,
          calculatedCurrentHour: matched.calculatedCurrentHour || calculatedHr,
          verifiedHour: matched.verifiedHour ?? matched.calculatedCurrentHour ?? calculatedHr,
          originalSourceHour: matched.originalSourceHour ?? matched.calculatedCurrentHour ?? calculatedHr
        };
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);

      return {
        laserId: lh.id || `${machine.id}-lh${idx + 1}`,
        laserIdentifier: lh.name || `Laser Head ${idx + 1}`,
        recordedLaserHour: lh.baseLaserHour ?? lh.runningHours ?? 12450,
        readingDate: dateStr,
        readingTime: timeStr,
        calculatedCurrentHour: calculatedHr,
        warningThreshold: lh.warningLife || 20000,
        criticalThreshold: lh.ratedLife || 25000,
        runtimeStatus: (metrics?.status === 'ALARM' ? 'CRITICAL' : metrics?.status === 'WARNING' ? 'WARNING' : 'NORMAL') as 'NORMAL' | 'WARNING' | 'CRITICAL',
        isVerified: false,
        verifiedHour: calculatedHr,
        originalSourceHour: calculatedHr,
        verificationNotes: ''
      };
    });
  }, [session.stage01_laserHours, laserHeads, machine]);

  // Local state for editable verification values per head
  const [localHours, setLocalHours] = useState<Record<string, number>>({});
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  // Populate local input state from activeItems
  useEffect(() => {
    const hoursMap: Record<string, number> = {};
    const notesMap: Record<string, string> = {};

    activeItems.forEach(item => {
      hoursMap[item.laserId] = item.verifiedHour ?? item.calculatedCurrentHour;
      notesMap[item.laserId] = item.verificationNotes || '';
    });

    setLocalHours(hoursMap);
    setLocalNotes(notesMap);
  }, [activeItems]);

  // Verify single laser head
  const handleVerifyHead = (item: MHCLaserHourItem) => {
    if (isReadOnly) return;

    const hourToSave = localHours[item.laserId] ?? item.calculatedCurrentHour;
    const noteToSave = localNotes[item.laserId] || '';

    const updatedItems = activeItems.map(it => {
      if (it.laserId === item.laserId) {
        return {
          ...it,
          isVerified: true,
          verifiedHour: hourToSave,
          originalSourceHour: it.originalSourceHour || it.calculatedCurrentHour,
          verificationNotes: noteToSave,
          verifiedAt: new Date().toISOString()
        };
      }
      return it;
    });

    const updatedSession: MHCSession = {
      ...session,
      stage01_laserHours: updatedItems,
      lastUpdated: new Date().toISOString()
    };

    onUpdateSession(updatedSession);

    if (showNotification) {
      showNotification(`✓ Verified ${item.laserIdentifier} at ${hourToSave.toLocaleString()} hrs`);
    }
  };

  // Check if all heads are verified
  const verifiedCount = activeItems.filter(item => item.isVerified).length;
  const isAllVerified = activeItems.length > 0 && verifiedCount === activeItems.length;

  return (
    <div className="space-y-6">
      {/* HEADER & PASSPORT BINDING BANNER */}
      <div className={`p-4 rounded-2xl border space-y-2 ${
        isDark ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
              Day 1 • Activity 01: Laser Hours Verification
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            ENGINEERING WORKFLOW ACTIVE
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          FSOS Machine Passport & LaserEngine have pre-retrieved current operating hours and historical baselines for {laserHeads.length} laser head(s). Review and confirm each reading below.
        </p>
      </div>

      {/* LASER HEAD CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {laserHeads.map((lh, idx) => {
          const matchedItem = activeItems[idx] || activeItems.find(it => it.laserId === lh.id);
          const metrics = LaserEngine.calculateLaserMetrics(lh);
          
          const passportBaseHour = lh.baseLaserHour ?? lh.runningHours ?? 12450;
          const passportBaseDate = lh.baseTimestamp || lh.lastRecalibrationDate || machine.installationDate || '2025-01-15';
          const retrievedHour = metrics?.currentHour ?? (lh.runningHours || 12450);
          const deltaHours = retrievedHour - passportBaseHour;

          const currentVerified = matchedItem?.isVerified || false;
          const activeInputHour = localHours[matchedItem?.laserId || lh.id] ?? retrievedHour;
          const isRecalibrated = activeInputHour !== retrievedHour;

          return (
            <div 
              key={lh.id || `lh-card-${idx}`}
              className={`p-5 rounded-2xl border space-y-4 transition-all ${
                currentVerified
                  ? isDark 
                    ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20' 
                    : 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30'
                  : isDark 
                    ? 'bg-slate-900/60 border-slate-800' 
                    : 'bg-white border-slate-200'
              }`}
            >
              {/* CARD TITLE & VERIFIED BADGE */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    currentVerified 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    LH{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">
                      {lh.name || `Laser Head ${idx + 1}`}
                    </h4>
                    <div className="text-[10px] font-mono text-slate-400">
                      SN: {lh.serialNo || lh.serialNumber || `${machine.serialNumber}-L${idx + 1}`} • Model: {lh.model || machine.model}
                    </div>
                  </div>
                </div>

                {currentVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>VERIFIED</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>UNVERIFIED</span>
                  </span>
                )}
              </div>

              {/* AUTOMATED DATA RETRIEVAL TRAY (MACHINE PASSPORT + LASER ENGINE) */}
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center justify-between">
                  <span>RETRIEVED SOURCE DATA</span>
                  <span className="text-[9px] text-slate-400">PASSPORT & LASER ENGINE</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Passport Baseline</div>
                    <div className="font-mono font-bold text-slate-200">{passportBaseHour.toLocaleString()} hrs</div>
                    <div className="text-[9px] text-slate-500">Rec: {passportBaseDate}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">Retrieved Reading</div>
                    <div className="font-mono font-bold text-cyan-300">{retrievedHour.toLocaleString()} hrs</div>
                    <div className="text-[9px] text-emerald-400 font-mono font-semibold">
                      {deltaHours > 0 ? `+${deltaHours} hrs logged` : 'At Baseline'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">Lifecycle Health</div>
                    <div className="font-semibold text-slate-200 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${
                        metrics?.status === 'SAFE' ? 'bg-emerald-400' : metrics?.status === 'WARNING' ? 'bg-amber-400' : 'bg-rose-400'
                      }`} />
                      <span>{metrics?.status || 'SAFE'}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {metrics?.formattedLifeRemaining || '95%'} ({metrics?.ratedLife?.toLocaleString() || '25,000'} hrs rated)
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">Calibration Baseline</div>
                    <div className="font-mono text-[11px] text-slate-300 truncate">
                      {metrics?.lastRecalibrationDate ? metrics.lastRecalibrationDate : 'Initial Baseline Active'}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {lh.calibrationHistory?.length || 0} historical record(s)
                    </div>
                  </div>
                </div>
              </div>

              {/* VERIFICATION & RECALIBRATION CONTROLS */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center justify-between">
                    <span>VERIFIED OPERATING HOURS (HRS)</span>
                    {isRecalibrated && (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>RECALIBRATED / ADJUSTED</span>
                      </span>
                    )}
                  </label>
                  
                  <div className="relative">
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={activeInputHour}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setLocalHours(prev => ({ ...prev, [matchedItem?.laserId || lh.id]: val }));
                      }}
                      className={`w-full pl-3 pr-16 py-2 rounded-xl border text-xs font-mono font-bold outline-none transition-all ${
                        isDark 
                          ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                      HOURS
                    </span>
                  </div>

                  {isRecalibrated && (
                    <p className="text-[10px] text-amber-300/90 leading-tight pt-0.5 font-mono">
                      Original source: <strong>{retrievedHour.toLocaleString()} hrs</strong>. Value adjusted for offline/shutdown operation without destroying original source info.
                    </p>
                  )}
                </div>

                {/* VERIFICATION NOTES */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 font-semibold">
                    VERIFICATION / CALIBRATION NOTES
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={localNotes[matchedItem?.laserId || lh.id] || ''}
                    onChange={(e) => {
                      const txt = e.target.value;
                      setLocalNotes(prev => ({ ...prev, [matchedItem?.laserId || lh.id]: txt }));
                    }}
                    placeholder={isReadOnly ? "Read-only mode" : "e.g., Cabinet physical hour meter verified. Offline operation recorded."}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                    }`}
                  />
                </div>

                {/* VERIFY ACTION BUTTON */}
                {!isReadOnly && (
                  <button
                    onClick={() => handleVerifyHead(matchedItem || {
                      laserId: lh.id,
                      laserIdentifier: lh.name || `Laser Head ${idx + 1}`,
                      recordedLaserHour: passportBaseHour,
                      readingDate: new Date().toISOString().split('T')[0],
                      readingTime: '09:00',
                      calculatedCurrentHour: retrievedHour,
                      warningThreshold: 20000,
                      criticalThreshold: 25000,
                      runtimeStatus: 'NORMAL'
                    })}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all ${
                      currentVerified
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{currentVerified ? 'Update Verification Data' : `Confirm & Verify ${lh.name || `Laser Head ${idx + 1}`}`}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* VERIFICATION PROGRESS & COMPLETION GATE */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isAllVerified
          ? isDark ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
          : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${isAllVerified ? 'text-emerald-400' : 'text-slate-400'}`} />
              <h4 className="font-extrabold text-sm sm:text-base text-slate-100">
                Activity 01 Completion Readiness
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              {isAllVerified 
                ? 'All laser heads verified. Ready to record authoritative session data and advance Journey Rail.' 
                : `Verification required for all ${laserHeads.length} laser head(s) before completing Activity 01.`}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300">
            <span>VERIFIED:</span>
            <span className={isAllVerified ? 'text-emerald-400 font-extrabold' : 'text-amber-400'}>
              {verifiedCount} / {laserHeads.length} HEADS
            </span>
          </div>
        </div>

        {/* COMPLETION BUTTON */}
        {!isReadOnly && (
          <div className="pt-2 flex justify-end">
            <button
              disabled={!isAllVerified}
              onClick={onCompleteActivity}
              className={`px-6 py-3 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all ${
                isAllVerified
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Complete Activity 01: Laser Hours & Advance Journey Rail</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
