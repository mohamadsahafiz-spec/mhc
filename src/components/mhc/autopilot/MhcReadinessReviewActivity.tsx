import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ArrowRight, 
  FileCheck2, 
  ShieldCheck, 
  Clock, 
  Activity, 
  ExternalLink,
  Info,
  Thermometer,
  FileText
} from 'lucide-react';
import { MHCSession, Machine } from '../../../types';
import { auditMhcSession, MhcAuditItem } from '../../../utils/mhcAutopilotBrain';

export interface MhcReadinessReviewActivityProps {
  session: MHCSession;
  machine: Machine;
  isDark: boolean;
  isReadOnly?: boolean;
  onNavigateToActivity: (code: string) => void;
  onProceedToReportGeneration: () => void;
  onUpdateEngineerNote?: (note: string) => void;
}

export const MhcReadinessReviewActivity: React.FC<MhcReadinessReviewActivityProps> = ({
  session,
  machine,
  isDark,
  isReadOnly = false,
  onNavigateToActivity,
  onProceedToReportGeneration,
  onUpdateEngineerNote
}) => {
  const [reviewNote, setReviewNote] = useState<string>(
    session.autopilotProgress?.activityNotes?.['07'] || ''
  );

  // Compute live derived readiness audit without mutating session
  const audit = auditMhcSession(session);

  const handleNoteChange = (text: string) => {
    setReviewNote(text);
    if (onUpdateEngineerNote) {
      onUpdateEngineerNote(text);
    }
  };

  const getStatusBadge = (item: MhcAuditItem) => {
    switch (item.status) {
      case 'COMPLETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span>✓</span>
            <span>COMPLETE</span>
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            <span>⚠</span>
            <span>NEEDS REVIEW</span>
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-400 border border-slate-700">
            <span>🔒</span>
            <span>LOCKED</span>
          </span>
        );
      case 'OPTIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800/60 text-slate-400 border border-slate-700/60">
            <span>—</span>
            <span>OPTIONAL</span>
          </span>
        );
      case 'INCOMPLETE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <span>○</span>
            <span>INCOMPLETE</span>
          </span>
        );
    }
  };

  // Group audit items by day for structured display
  const day1Items = audit.auditItems.filter(i => i.day === 'DAY 1');
  const day2Items = audit.auditItems.filter(i => i.day === 'DAY 2');
  const day3Items = audit.auditItems.filter(i => i.day === 'DAY 3');

  // Check optional evidence items attached in Activity 06
  const evidenceItems = session.temperatureEvidenceData?.evidenceItems || [];

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className={`p-4 rounded-2xl border ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
            audit.isReadyForReport
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
          }`}>
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                DAY 4 • 07
              </span>
              <h2 className="text-base font-bold tracking-tight">MHC Readiness Review</h2>
            </div>
            <p className="text-xs text-slate-400">
              Authoritative engineering session audit &amp; report generation gate
            </p>
          </div>
        </div>

        {/* Machine Context Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Model: <strong className="text-cyan-300">{machine.model}</strong>
          </span>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            S/N: <strong className="text-slate-200">{machine.serialNumber}</strong>
          </span>
        </div>
      </div>

      {/* HERO READINESS SUMMARY CARD */}
      <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden transition-all ${
        audit.isReadyForReport
          ? isDark
            ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40 text-emerald-100 ring-1 ring-emerald-500/30'
            : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border-emerald-300 text-slate-900 ring-1 ring-emerald-200'
          : isDark
            ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40 text-amber-100 ring-1 ring-amber-500/30'
            : 'bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border-amber-300 text-slate-900 ring-1 ring-amber-200'
      }`}>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3 max-w-2xl">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono border shadow-sm backdrop-blur-md">
              {audit.isReadyForReport ? (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/80 border-emerald-500/50 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>🟢 READY FOR REPORT</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400 bg-amber-950/80 border-amber-500/50 px-3 py-1 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>🟠 ATTENTION REQUIRED</span>
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold tracking-tight">
              {audit.isReadyForReport 
                ? '🟢 MHC COMPLETE — All Prerequisites Satisfied'
                : `🟠 MHC Incomplete — ${audit.blockers.length} Active Readiness Blocker${audit.blockers.length > 1 ? 's' : ''}`}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {audit.isReadyForReport
                ? 'All required engineering activities across Day 1, Day 2, and Day 3 have been completed and verified. The MHC session is ready for official report generation.'
                : 'Report Generation remains locked until all required engineering activities are completed and all flagged review items or out-of-specification results are resolved.'}
            </p>

            {/* Next Action Indicator */}
            <div className="pt-1 flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-400">NEXT ACTION:</span>
              <span className={`font-mono px-2 py-0.5 rounded border ${
                audit.isReadyForReport
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                → {audit.nextAction.text}
              </span>
            </div>
          </div>

          {/* KPI Gauge Cards & Action Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-4 w-full lg:w-auto shrink-0">
            
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="p-2">
                <div className="text-[10px] text-slate-400 font-mono">COMPLETED</div>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {audit.completedRequiredCount} / {audit.totalRequiredCount}
                </div>
              </div>
              <div className="p-2 border-x border-slate-800/80">
                <div className="text-[10px] text-slate-400 font-mono">SCORE</div>
                <div className="text-base font-bold text-cyan-400 font-mono">
                  {audit.readinessScore}%
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-slate-400 font-mono">BLOCKERS</div>
                <div className={`text-base font-bold font-mono ${
                  audit.blockers.length === 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {audit.blockers.length}
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            {audit.isReadyForReport ? (
              <button
                onClick={onProceedToReportGeneration}
                className="w-full py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-emerald-400/50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Unlock &amp; Proceed to Report Generation →</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateToActivity(audit.nextAction.targetCode)}
                className="w-full py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Resolve Blocker: {audit.nextAction.text} →</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* BLOCKERS SECTION (EXPLICIT LIST IF NOT READY) */}
      {audit.blockers.length > 0 && (
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
        } space-y-4 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold tracking-tight uppercase font-mono">
                BLOCKERS ({audit.blockers.length}) — REPORT GENERATION LOCKED
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-400/90 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
              Click any blocker to return to activity
            </span>
          </div>

          <p className="text-xs text-amber-300/80">
            The following requirements must be resolved before Autopilot unlocks Activity 08 Report Generation:
          </p>

          <div className="space-y-2">
            {audit.blockers.map((blocker, index) => (
              <div
                key={blocker.id}
                onClick={() => onNavigateToActivity(blocker.code)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isDark
                    ? 'bg-slate-900/80 border-amber-500/40 hover:border-amber-400 hover:bg-slate-900 text-slate-200'
                    : 'bg-white border-amber-300 hover:border-amber-400 hover:bg-amber-50 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>{blocker.reason}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {blocker.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Target Activity: {blocker.title}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToActivity(blocker.code);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                >
                  <span>Resolve</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* READINESS AUDIT MATRIX TABLE */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold tracking-tight uppercase font-mono text-slate-300">
              MHC AUTHORITATIVE SESSION AUDIT MATRIX
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Interactive Derived View • All items clickable
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          
          {/* DAY 1 GROUP */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>DAY 1</span>
                <span className="text-slate-500">•</span>
                <span>Laser System, Optics &amp; Head Inspection</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {day1Items.filter(i => i.status === 'COMPLETE').length} / {day1Items.length} Pass
              </span>
            </div>

            <div className="space-y-1">
              {day1Items.map(item => (
                <div
                  key={item.code}
                  onClick={() => onNavigateToActivity(item.code)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                    item.status === 'COMPLETE'
                      ? isDark
                        ? 'bg-slate-900/40 border-slate-800/80 hover:border-emerald-500/40 hover:bg-emerald-950/10'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                      : item.status === 'NEEDS_REVIEW'
                      ? isDark
                        ? 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/30'
                        : 'bg-amber-50 border-amber-300'
                      : isDark
                      ? 'bg-rose-950/10 border-rose-500/30 hover:bg-rose-950/20'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{getStatusBadge(item)}</div>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold shrink-0">{item.code}</span>
                    <span className="font-medium truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                      {item.detail}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToActivity(item.code);
                      }}
                      className="px-2 py-1 rounded text-[10px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>{item.status === 'COMPLETE' ? 'View' : 'Edit'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DAY 2 GROUP */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>DAY 2</span>
                <span className="text-slate-500">•</span>
                <span>Stage Calibration (X/Y Deviation ±2 µm)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {day2Items.filter(i => i.status === 'COMPLETE').length} / {day2Items.length} Pass
              </span>
            </div>

            <div className="space-y-1">
              {day2Items.map(item => (
                <div
                  key={item.code}
                  onClick={() => onNavigateToActivity(item.code)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                    item.status === 'COMPLETE'
                      ? isDark
                        ? 'bg-slate-900/40 border-slate-800/80 hover:border-emerald-500/40 hover:bg-emerald-950/10'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                      : item.status === 'NEEDS_REVIEW'
                      ? isDark
                        ? 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/30'
                        : 'bg-amber-50 border-amber-300'
                      : isDark
                      ? 'bg-rose-950/10 border-rose-500/30 hover:bg-rose-950/20'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{getStatusBadge(item)}</div>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold shrink-0">{item.code}</span>
                    <span className="font-medium truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                      {item.detail}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToActivity(item.code);
                      }}
                      className="px-2 py-1 rounded text-[10px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>{item.status === 'COMPLETE' ? 'View' : 'Edit'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DAY 3 GROUP */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>DAY 3</span>
                <span className="text-slate-500">•</span>
                <span>AGC Calibration &amp; Temperature Telemetry</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {day3Items.filter(i => i.status === 'COMPLETE').length} / {day3Items.length} Pass
              </span>
            </div>

            <div className="space-y-1">
              {day3Items.map(item => (
                <div
                  key={item.code}
                  onClick={() => onNavigateToActivity(item.code)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                    item.status === 'COMPLETE'
                      ? isDark
                        ? 'bg-slate-900/40 border-slate-800/80 hover:border-emerald-500/40 hover:bg-emerald-950/10'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                      : item.status === 'NEEDS_REVIEW'
                      ? isDark
                        ? 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/30'
                        : 'bg-amber-50 border-amber-300'
                      : isDark
                      ? 'bg-rose-950/10 border-rose-500/30 hover:bg-rose-950/20'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{getStatusBadge(item)}</div>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold shrink-0">{item.code}</span>
                    <span className="font-medium truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                      {item.detail}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToActivity(item.code);
                      }}
                      className="px-2 py-1 rounded text-[10px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>{item.status === 'COMPLETE' ? 'View' : 'Edit'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* OPTIONAL EVIDENCE & ATTACHMENTS (NON-BLOCKING) */}
      <div className={`p-4 rounded-2xl border ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
      } space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold tracking-tight uppercase font-mono text-slate-300">
              OPTIONAL EVIDENCE &amp; ATTACHMENTS ({evidenceItems.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            — OPTIONAL / DOES NOT BLOCK REPORT
          </span>
        </div>

        {evidenceItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {evidenceItems.map(item => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-cyan-400 font-bold">📄</span>
                  <span className="truncate font-medium">{item.fileName}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {item.fileSizeMb.toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            No optional evidence attachments uploaded. Standard report generation will include temperature log analytics.
          </p>
        )}
      </div>

      {/* ENGINEER OBSERVATIONS & READINESS NOTES */}
      <div className={`p-4 rounded-2xl border ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
      } space-y-2`}>
        <label className="text-xs font-bold tracking-tight uppercase font-mono text-slate-300 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>ENGINEER READINESS REVIEW OBSERVATIONS / REMARKS</span>
        </label>
        <textarea
          disabled={isReadOnly}
          value={reviewNote}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Enter authoritative observations, engineer sign-off notes, or special machine notes prior to report generation..."
          rows={3}
          className={`w-full p-3 rounded-xl border text-xs font-mono transition-all outline-none ${
            isDark
              ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-500'
              : 'bg-white border-slate-200 text-slate-900 focus:border-cyan-500'
          }`}
        />
      </div>

      {/* FOOTER ACTION BAR */}
      <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-800/80">
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>GATE STATUS:</span>
          <span className={`font-bold ${
            audit.isReadyForReport ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {audit.isReadyForReport ? 'UNLOCKED ✓' : 'LOCKED 🔒'}
          </span>
        </div>

        {audit.isReadyForReport ? (
          <button
            onClick={onProceedToReportGeneration}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Readiness &amp; Proceed to Report Generation →</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigateToActivity(audit.nextAction.targetCode)}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Action Required: {audit.nextAction.text} →</span>
          </button>
        )}
      </div>

    </div>
  );
};
