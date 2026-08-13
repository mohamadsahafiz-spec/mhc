import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Building2, 
  Cpu, 
  Play, 
  RefreshCw, 
  FileText, 
  Search, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Check, 
  Lock,
  Eye,
  Edit3,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { Customer, Machine, MHCSession } from '../../types';
import { StorageService } from '../../utils/persistence';
import { useTheme } from '../../context/ThemeContext';
import {
  MHC_WORKFLOW_SCHEDULE,
  ACTIONABLE_ACTIVITIES,
  createDefaultAutopilotProgress,
  getParentActivityStatus,
  computeAutopilotReadiness,
  auditMhcSession,
  advanceAutopilotActivity,
  flagDownstreamNeedsReview
} from '../../utils/mhcAutopilotBrain';
import { MhcLaserHoursActivity } from './autopilot/MhcLaserHoursActivity';
import { MhcLaserPowerActivity } from './autopilot/MhcLaserPowerActivity';
import { MhcLaserBeamActivity } from './autopilot/MhcLaserBeamActivity';
import { MhcLaserInspectionActivity } from './autopilot/MhcLaserInspectionActivity';
import { MhcStageCalibrationActivity } from './autopilot/MhcStageCalibrationActivity';
import { MhcAgcActivity } from './autopilot/MhcAgcActivity';
import { MhcTemperatureEvidenceActivity } from './autopilot/MhcTemperatureEvidenceActivity';
import { MhcReadinessReviewActivity } from './autopilot/MhcReadinessReviewActivity';
import { MhcFullPdfRenderer } from './report/MhcFullPdfRenderer';

export interface MhcAutopilotProps {
  machines: Machine[];
  selectedMachine: Machine;
  activeSession?: MHCSession;
  mhcSessions: MHCSession[];
  onSelectMachine: (machine: Machine) => void;
  onUpdateSession: (session: MHCSession) => void;
  onSaveNewSession: (session: MHCSession) => void;
  onSwitchToCanvas: () => void;
  onUpdateMachine?: (machine: Machine) => void;
}

export type SetupStep = 'welcome' | 'customer' | 'machine' | 'session_check' | 'session_active';

export function createNewMhcSession(machine: Machine, customerName?: string, engineerName?: string): MHCSession {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  return {
    id: `MHC-SESS-${Date.now()}`,
    machineId: machine.id,
    machineModel: machine.model,
    machineSerialNumber: machine.serialNumber,
    machineName: `${machine.model} (${machine.machineNumber || machine.serialNumber})`,
    customerId: machine.customerId || 'CUST-01',
    customerName: customerName || machine.customerName || 'Customer',
    plantName: machine.plantName || 'Main Plant',
    engineerName: engineerName || 'Field Service Engineer',
    startDate: dateStr,
    startTime: timeStr,
    lastUpdated: now.toISOString(),
    completionStatus: 'IN_PROGRESS',
    currentSection: 1,
    sectionStatuses: {
      '01': 'IN_PROGRESS',
      '02': 'NOT_STARTED',
      '03': 'NOT_STARTED',
      '04': 'NOT_STARTED',
      '05': 'NOT_STARTED',
      '06': 'NOT_STARTED',
      '07': 'NOT_STARTED',
      '08': 'NOT_STARTED',
    },
    autopilotProgress: createDefaultAutopilotProgress(),
    stage01_laserHours: [],
    stage02_laserProfile: {
      laserId: 'LASER-01',
      productName: 'Standard Optical Profile',
      recipeProgram: 'RECIPE-01',
      profileInfo: 'Gaussian Optical Beam Profile',
      measurementInfo: 'Initial Baseline Test',
      supportingEvidence: '',
      images: []
    },
    stage03_laserPower: [],
    stage04_opticsBeam: {
      cleanlinessScore: 100,
      beamWaistMm: 0.1,
      focusOffsetMm: 0,
      symmetryRatio: 0.98,
      m2Value: 1.1,
      beforeCondition: 'Clean',
      afterCondition: 'Clean',
      inspectionResult: 'PASS',
      images: [],
      notes: ''
    },
    stage05_cooling: {
      chillerTempCelsius: 20.0,
      chillerFlowLpm: 15.0,
      diConductivityUs: 1.2,
      coolingCondition: 'Optimal',
      thermalCondition: 'Stable',
      beforeCondition: 'Normal',
      afterCondition: 'Normal',
      result: 'PASS',
      notes: ''
    },
    stage06_productQuality: {
      sampleId: 'SAMP-001',
      viaDiameterUm: 100,
      viaShape: 'CIRCULAR',
      viaOffsetUm: 0,
      padQuality: 'EXCELLENT',
      visualVerification: 'CLEAN',
      beforeInspectionNotes: '',
      afterInspectionNotes: '',
      beforeImages: [],
      afterImages: [],
      result: 'PASS',
      notes: ''
    },
    stage07_spareParts: [],
    stage08_engineerRemarks: {
      generalFindings: '',
      observedIssues: '',
      correctiveActions: '',
      recommendations: '',
      followUpRequired: false,
      productionReleaseVerdict: 'APPROVED'
    }
  };
}

export const MhcAutopilot: React.FC<MhcAutopilotProps> = ({
  machines,
  selectedMachine,
  activeSession,
  mhcSessions,
  onSelectMachine,
  onUpdateSession,
  onSaveNewSession,
  onSwitchToCanvas,
  onUpdateMachine
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Step state in the Autopilot setup flow
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');

  // Read-only review mode state
  const [isReadOnlyMode, setIsReadOnlyMode] = useState<boolean>(false);

  // Active activity observation note text input
  const [activeNoteText, setActiveNoteText] = useState<string>('');

  // Customer selection state
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    if (selectedMachine) {
      const match = customers.find(c => c.id === selectedMachine.customerId || c.name === selectedMachine.customerName);
      if (match) return match;
    }
    return customers[0] || null;
  });
  const [customerSearch, setCustomerSearch] = useState('');

  // Machine search state
  const [machineSearch, setMachineSearch] = useState('');
  const [localSelectedMachine, setLocalSelectedMachine] = useState<Machine>(selectedMachine || machines[0]);

  // Toast / Status Message
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync state if selectedMachine changes externally
  useEffect(() => {
    if (selectedMachine && selectedMachine.id !== localSelectedMachine.id) {
      setLocalSelectedMachine(selectedMachine);
      const match = customers.find(c => c.id === selectedMachine.customerId || c.name === selectedMachine.customerName);
      if (match) setSelectedCustomer(match);
    }
  }, [selectedMachine]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const term = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.industry.toLowerCase().includes(term) ||
      c.contactPerson.toLowerCase().includes(term)
    );
  }, [customers, customerSearch]);

  // Filtered machines for selected customer
  const customerMachines = useMemo(() => {
    if (!selectedCustomer) return machines;
    const match = machines.filter(m => m.customerId === selectedCustomer.id || m.customerName === selectedCustomer.name);
    return match.length > 0 ? match : machines;
  }, [machines, selectedCustomer]);

  const filteredMachines = useMemo(() => {
    if (!machineSearch.trim()) return customerMachines;
    const term = machineSearch.toLowerCase();
    return customerMachines.filter(m =>
      m.model.toLowerCase().includes(term) ||
      m.serialNumber.toLowerCase().includes(term) ||
      (m.machineNumber && m.machineNumber.toLowerCase().includes(term)) ||
      m.plantName.toLowerCase().includes(term)
    );
  }, [customerMachines, machineSearch]);

  // Existing session for selected machine
  const existingIncompleteSession = useMemo(() => {
    return mhcSessions.find(s => s.machineId === localSelectedMachine.id && s.completionStatus !== 'COMPLETED');
  }, [mhcSessions, localSelectedMachine]);

  // Effective Active Session with Session Brain Progress initialized
  const effectiveSession = useMemo(() => {
    if (!activeSession) return null;
    if (!activeSession.autopilotProgress) {
      return {
        ...activeSession,
        autopilotProgress: createDefaultAutopilotProgress()
      };
    }
    return activeSession;
  }, [activeSession]);

  const progress = useMemo(() => {
    return effectiveSession?.autopilotProgress || createDefaultAutopilotProgress();
  }, [effectiveSession]);

  // Compute Readiness Analysis Report
  const readiness = useMemo(() => {
    return computeAutopilotReadiness(progress, effectiveSession);
  }, [progress, effectiveSession]);

  // Previous completed session for baseline comparison in PDF report
  const previousSession = useMemo(() => {
    if (!effectiveSession) return undefined;
    return mhcSessions.find(s => 
      s.machineId === effectiveSession.machineId && 
      s.id !== effectiveSession.id && 
      s.completionStatus === 'COMPLETED'
    );
  }, [mhcSessions, effectiveSession]);

  // Sync activeNoteText when currentActivityCode changes
  useEffect(() => {
    const currentCode = progress.currentActivityCode;
    const savedNote = progress.activityNotes?.[currentCode] || '';
    setActiveNoteText(savedNote);
  }, [progress.currentActivityCode, progress.activityNotes?.[progress.currentActivityCode]]);

  // Handle Continue Existing Session
  const handleContinueExisting = () => {
    if (existingIncompleteSession) {
      onSelectMachine(localSelectedMachine);
      const hydratedSession: MHCSession = {
        ...existingIncompleteSession,
        autopilotProgress: existingIncompleteSession.autopilotProgress || createDefaultAutopilotProgress()
      };
      onUpdateSession(hydratedSession);
      setIsReadOnlyMode(false);
      setCurrentStep('session_active');
      showNotification(`Restored active session for ${localSelectedMachine.model} (${existingIncompleteSession.id})`);
    }
  };

  // Handle Start New Session
  const handleStartNew = () => {
    onSelectMachine(localSelectedMachine);
    const newSession = createNewMhcSession(
      localSelectedMachine,
      selectedCustomer?.name || localSelectedMachine.customerName,
      'Field Service Engineer'
    );
    onSaveNewSession(newSession);
    setIsReadOnlyMode(false);
    setCurrentStep('session_active');
    showNotification(`Created new MHC session (${newSession.id}) for ${localSelectedMachine.model}`);
  };

  // Handle Review Progress (Read-Only Mode)
  const handleReviewProgress = () => {
    if (existingIncompleteSession) {
      onSelectMachine(localSelectedMachine);
      const hydratedSession: MHCSession = {
        ...existingIncompleteSession,
        autopilotProgress: existingIncompleteSession.autopilotProgress || createDefaultAutopilotProgress()
      };
      onUpdateSession(hydratedSession);
    }
    setIsReadOnlyMode(true);
    setCurrentStep('session_active');
    showNotification(`Entered Read-Only Review Mode`);
  };

  // Handle Action: Mark Complete & Advance
  const handleCompleteCurrentActivity = () => {
    if (isReadOnlyMode || !effectiveSession) return;
    const currentCode = progress.currentActivityCode;
    let updated = advanceAutopilotActivity(effectiveSession, currentCode, 'COMPLETED', activeNoteText);

    // If completing 02_power (Laser Head 1 Power), also mark 03_power (Laser Head 2 Power) completed since both heads were measured side-by-side
    if (currentCode === '02_power') {
      updated = advanceAutopilotActivity(updated, '03_power', 'COMPLETED', 'Completed in side-by-side Power Workspace');
      if (updated.autopilotProgress) {
        updated.autopilotProgress.currentActivityCode = '02_beam';
      }
    }

    // If completing 02_beam or 03_beam (Laser Head 1 / 2 Beam Profile), mark both completed since both heads were measured side-by-side
    if (currentCode === '02_beam' || currentCode === '03_beam') {
      updated = advanceAutopilotActivity(updated, '02_beam', 'COMPLETED', activeNoteText || 'Completed in side-by-side Beam Profile Workspace');
      updated = advanceAutopilotActivity(updated, '03_beam', 'COMPLETED', activeNoteText || 'Completed in side-by-side Beam Profile Workspace');
      if (updated.autopilotProgress) {
        updated.autopilotProgress.currentActivityCode = '02_findings';
      }
    }

    onUpdateSession(updated);
    showNotification(`Activity ${currentCode} marked COMPLETED ✓`);
  };

  // Handle Action: Flag for Review
  const handleFlagCurrentNeedsReview = () => {
    if (isReadOnlyMode || !effectiveSession) return;
    const currentCode = progress.currentActivityCode;
    const updated = flagDownstreamNeedsReview(effectiveSession, currentCode);
    const withNote = advanceAutopilotActivity(updated, currentCode, 'NEEDS_REVIEW', activeNoteText);
    onUpdateSession(withNote);
    showNotification(`Activity ${currentCode} flagged for review ⚠`);
  };

  // Handle Action: Re-open Activity for Editing
  const handleReopenActivity = (code: string) => {
    if (isReadOnlyMode || !effectiveSession) return;
    const updated = flagDownstreamNeedsReview(effectiveSession, code);
    const withStatus = advanceAutopilotActivity(updated, code, 'IN_PROGRESS');
    onUpdateSession(withStatus);
    showNotification(`Activity ${code} re-opened for editing`);
  };

  // Update note for specific activity
  const handleUpdateNoteForActivity = (code: string, note: string) => {
    if (isReadOnlyMode || !effectiveSession) return;
    const currP = effectiveSession.autopilotProgress || createDefaultAutopilotProgress();
    const updated: MHCSession = {
      ...effectiveSession,
      autopilotProgress: {
        ...currP,
        activityNotes: {
          ...(currP.activityNotes || {}),
          [code]: note
        }
      }
    };
    onUpdateSession(updated);
  };

  // Proceed to Report Generation from Readiness Review
  const handleProceedToReportGeneration = () => {
    if (!effectiveSession) return;
    const audit = auditMhcSession(effectiveSession);
    if (!audit.isReadyForReport) {
      showNotification("Cannot proceed: Active readiness blockers remain. Please resolve all blockers first.");
      return;
    }

    const currProgress = effectiveSession.autopilotProgress || createDefaultAutopilotProgress();
    const updatedStatuses = {
      ...currProgress.activityStatuses,
      '07': 'COMPLETED' as const,
      '08': 'IN_PROGRESS' as const
    };

    const updatedSession: MHCSession = {
      ...effectiveSession,
      autopilotProgress: {
        ...currProgress,
        activityStatuses: updatedStatuses,
        currentActivityCode: '08',
        currentDay: 'DAY 4',
        lastActiveTimestamp: new Date().toISOString()
      }
    };

    onUpdateSession(updatedSession);
    showNotification("MHC Session Readiness verified! Activity 08 Report Generation unlocked ✓");
  };

  // Handle Activity Navigation Jump
  const handleJumpToActivityCode = (code: string) => {
    if (!effectiveSession) return;
    const currProgress = effectiveSession.autopilotProgress || createDefaultAutopilotProgress();
    const targetActivity = ACTIONABLE_ACTIVITIES.find(a => a.code === code);
    
    const currentStatus = currProgress.activityStatuses[code] || 'LOCKED';
    const updatedStatuses = { ...currProgress.activityStatuses };

    // If jumping to a locked or upcoming activity directly from Readiness Review, initialize as IN_PROGRESS
    if (currentStatus === 'LOCKED' || currentStatus === 'UPCOMING') {
      updatedStatuses[code] = 'IN_PROGRESS';
    }

    const updatedSession: MHCSession = {
      ...effectiveSession,
      autopilotProgress: {
        ...currProgress,
        activityStatuses: updatedStatuses,
        currentActivityCode: code,
        currentDay: targetActivity?.day || currProgress.currentDay,
        lastActiveTimestamp: new Date().toISOString()
      }
    };
    onUpdateSession(updatedSession);
  };

  // Journey Rail Step Items definition for Setup
  const journeyRailSteps = [
    {
      id: 'welcome' as SetupStep,
      title: 'Autopilot Setup',
      subtext: 'Welcome & Introduction',
      status: currentStep === 'welcome' 
        ? 'current' 
        : ['customer', 'machine', 'session_check', 'session_active'].includes(currentStep) 
        ? 'completed' 
        : 'upcoming'
    },
    {
      id: 'customer' as SetupStep,
      title: 'Customer Passport',
      subtext: selectedCustomer ? selectedCustomer.name : 'Select Account',
      status: currentStep === 'customer' 
        ? 'current' 
        : ['machine', 'session_check', 'session_active'].includes(currentStep) 
        ? 'completed' 
        : 'upcoming'
    },
    {
      id: 'machine' as SetupStep,
      title: 'Machine Passport',
      subtext: localSelectedMachine ? `${localSelectedMachine.model}` : 'Select Machine',
      status: currentStep === 'machine' 
        ? 'current' 
        : ['session_check', 'session_active'].includes(currentStep) 
        ? 'completed' 
        : 'upcoming'
    },
    {
      id: 'session_check' as SetupStep,
      title: 'Session Detection',
      subtext: existingIncompleteSession ? 'Session Found' : 'Restore or Create',
      status: currentStep === 'session_check' 
        ? 'current' 
        : currentStep === 'session_active' 
        ? 'completed' 
        : 'upcoming'
    },
    {
      id: 'session_active' as SetupStep,
      title: 'MHC Journey Rail',
      subtext: `Day ${progress.currentDay.replace('DAY ', '')} — ${progress.currentActivityCode}`,
      status: currentStep === 'session_active' ? 'current' : 'upcoming'
    }
  ];

  const currentActionableItem = useMemo(() => {
    return ACTIONABLE_ACTIVITIES.find(a => a.code === progress.currentActivityCode) || ACTIONABLE_ACTIVITIES[0];
  }, [progress.currentActivityCode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto backdrop-blur-md bg-slate-950/80">
      
      {/* Toast Notification */}
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs shadow-xl flex items-center gap-2 border border-emerald-400"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </motion.div>
      )}

      {/* Main Autopilot Container */}
      <div className={`w-full max-w-5xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[620px] ${
        isDark 
          ? 'bg-[#0f1319] border-slate-800 text-slate-100 shadow-cyan-950/20' 
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
      }`}>

        {/* LEFT COLUMN: MHC JOURNEY RAIL & SESSION BRAIN */}
        <div className={`w-full md:w-80 shrink-0 p-5 border-b md:border-b-0 md:border-r flex flex-col justify-between ${
          isDark ? 'bg-[#0b0d11] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                    <span>MHC Autopilot</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-semibold border border-cyan-500/30">v1.0.27</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">Guided Engineering Journey</p>
                </div>
              </div>
            </div>

            {/* SETUP FLOW STEPS (JOURNEY RAIL) */}
            <div className="space-y-3 mb-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
                SETUP SEQUENCE
              </div>
              
              <div className="space-y-1">
                {journeyRailSteps.map((step) => {
                  const isClickable = step.status === 'completed';
                  return (
                    <button
                      key={step.id}
                      disabled={!isClickable && step.status !== 'current'}
                      onClick={() => {
                        if (isClickable) setCurrentStep(step.id);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center gap-2.5 border ${
                        step.status === 'current'
                          ? isDark 
                            ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/30' 
                            : 'bg-cyan-50 border-cyan-300 text-cyan-900 font-medium'
                          : step.status === 'completed'
                          ? isDark
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/40 cursor-pointer'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60 cursor-pointer'
                          : isDark
                          ? 'bg-slate-900/40 border-slate-800/60 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {step.status === 'completed' && (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </div>
                        )}
                        {step.status === 'current' && (
                          <div className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 flex items-center justify-center text-[9px] animate-pulse">
                            ◉
                          </div>
                        )}
                        {step.status === 'upcoming' && (
                          <div className="w-4 h-4 rounded-full bg-slate-800/40 border border-slate-700/50 text-slate-500 flex items-center justify-center text-[9px]">
                            ○
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[11px] truncate">{step.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{step.subtext}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE WORKFLOW SCHEDULE ON RAIL (JOURNEY RAIL BRAIN) */}
            <div className="pt-3 border-t border-slate-800/60 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1 flex items-center justify-between">
                <span>WORKFLOW SCHEDULE</span>
                <span className="text-[9px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                  {readiness.readinessScore}% READY
                </span>
              </div>
              
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {MHC_WORKFLOW_SCHEDULE.map((dayGroup) => (
                  <div key={dayGroup.code + dayGroup.day} className="space-y-1">
                    {/* Activity Code Item */}
                    {(() => {
                      const isParent = dayGroup.subItems && dayGroup.subItems.length > 0;
                      const actStatus = isParent 
                        ? getParentActivityStatus(dayGroup.code, progress.activityStatuses)
                        : (progress.activityStatuses[dayGroup.code] || 'LOCKED');
                      
                      const isCurrentActive = progress.currentActivityCode === dayGroup.code;

                      return (
                        <div className="space-y-1">
                          <button
                            disabled={actStatus === 'LOCKED'}
                            onClick={() => {
                              if (!isParent) handleJumpToActivityCode(dayGroup.code);
                            }}
                            className={`w-full text-left p-1.5 rounded-lg text-[11px] border flex items-center justify-between transition-all ${
                              isCurrentActive
                                ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-200 ring-1 ring-cyan-500/40'
                                : actStatus === 'COMPLETED'
                                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/50 cursor-pointer'
                                : actStatus === 'NEEDS_REVIEW'
                                ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-950/50 cursor-pointer'
                                : actStatus === 'IN_PROGRESS'
                                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 cursor-pointer'
                                : 'bg-slate-900/30 border-slate-800/50 text-slate-500 cursor-not-allowed opacity-70'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {/* Status indicator */}
                              <span className="font-mono text-[10px] font-bold">
                                {actStatus === 'COMPLETED' && <span className="text-emerald-400">✓</span>}
                                {actStatus === 'IN_PROGRESS' && <span className="text-cyan-400 animate-pulse">◉</span>}
                                {actStatus === 'NEEDS_REVIEW' && <span className="text-amber-400 font-bold">⚠</span>}
                                {actStatus === 'UPCOMING' && <span className="text-slate-400">○</span>}
                                {actStatus === 'LOCKED' && <span className="text-slate-600">🔒</span>}
                              </span>
                              <span className="font-mono text-[10px] text-cyan-400/90 font-bold">{dayGroup.code}</span>
                              <span className="truncate font-medium">{dayGroup.title}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 shrink-0">{dayGroup.day}</span>
                          </button>

                          {/* Sub items if present */}
                          {isParent && (
                            <div className="pl-4 space-y-1 pt-0.5 border-l border-slate-800 ml-2">
                              {dayGroup.subItems?.map((sub, sIdx) => {
                                const subStatus = progress.activityStatuses[sub.code] || 'LOCKED';
                                const isSubActive = progress.currentActivityCode === sub.code;
                                const isLast = sIdx === (dayGroup.subItems?.length || 0) - 1;

                                return (
                                  <button
                                    key={sub.code}
                                    disabled={subStatus === 'LOCKED'}
                                    onClick={() => handleJumpToActivityCode(sub.code)}
                                    className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono flex items-center justify-between border transition-all ${
                                      isSubActive
                                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold'
                                        : subStatus === 'COMPLETED'
                                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300 hover:bg-emerald-900/40 cursor-pointer'
                                        : subStatus === 'NEEDS_REVIEW'
                                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-300 hover:bg-amber-900/40 cursor-pointer'
                                        : subStatus === 'IN_PROGRESS'
                                        ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 cursor-pointer'
                                        : 'bg-slate-950/20 border-slate-800/40 text-slate-600 cursor-not-allowed'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="text-slate-600 font-bold">{isLast ? '└─' : '├─'}</span>
                                      <span className="truncate">{sub.title}</span>
                                    </div>
                                    <span className="shrink-0 font-bold">
                                      {subStatus === 'COMPLETED' && <span className="text-emerald-400">✓</span>}
                                      {subStatus === 'IN_PROGRESS' && <span className="text-cyan-400 animate-pulse">◉</span>}
                                      {subStatus === 'NEEDS_REVIEW' && <span className="text-amber-400">⚠</span>}
                                      {subStatus === 'UPCOMING' && <span className="text-slate-500">○</span>}
                                      {subStatus === 'LOCKED' && <span className="text-slate-700">🔒</span>}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CANVAS WORKSPACE ESCAPE HATCH */}
          <div className="pt-4 border-t border-slate-800/80">
            <button
              onClick={onSwitchToCanvas}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-cyan-300' 
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Canvas / Workspace</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: FOCUSED AUTOPILOT STEPS */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          
          <AnimatePresence mode="wait">
            
            {/* QUESTION STEP 1: WELCOME & OVERVIEW */}
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 my-auto"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Interactive MHC Autopilot</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Let's build your Machine Health Check.
                  </h1>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                    Autopilot guides you step-by-step through account selection, machine selection, and session tracking across Days 1–4 without losing engineering data.
                  </p>
                </div>

                {/* FEATURE HIGHLIGHTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold text-xs text-cyan-300">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <span>Customer & Machine Passport</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Instant synchronization with customer accounts and machine passports.
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold text-xs text-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Session Brain & Recovery</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Auto-detects active incomplete inspections and restores progress seamlessly.
                    </p>
                  </div>
                </div>

                {/* PRIMARY ACTION */}
                <div className="pt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">Step 1 of 4 • Welcome</span>
                  <button
                    onClick={() => setCurrentStep('customer')}
                    className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <span>Start Autopilot Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* QUESTION STEP 2: SELECT CUSTOMER */}
            {currentStep === 'customer' && (
              <motion.div
                key="customer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 my-auto"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Question 1 of 3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Which customer account are you servicing today?
                  </h2>
                  <p className="text-xs text-slate-400">
                    Select a Customer Passport account to view associated machine assets.
                  </p>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by customer name, industry, or contact..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                    }`}
                  />
                </div>

                {/* CUSTOMER SELECTION LIST */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredCustomers.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    const machineCount = machines.filter(m => m.customerId === c.id || m.customerName === c.name).length;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          const firstM = machines.find(m => m.customerId === c.id || m.customerName === c.name);
                          if (firstM) {
                            setLocalSelectedMachine(firstM);
                            onSelectMachine(firstM);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/30'
                            : isDark
                            ? 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs">{c.name}</div>
                            <div className="text-[10px] text-slate-400">{c.industry} • {c.contactPerson}</div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {machineCount} Assets
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* NEXT ACTION */}
                <div className="pt-3 flex items-center justify-between border-t border-slate-800/60">
                  <span className="text-xs text-slate-400">
                    Selected: <strong className="text-cyan-300">{selectedCustomer?.name || 'None'}</strong>
                  </span>
                  <button
                    disabled={!selectedCustomer}
                    onClick={() => setCurrentStep('machine')}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all"
                  >
                    <span>Next: Select Machine</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* QUESTION STEP 3: SELECT MACHINE */}
            {currentStep === 'machine' && (
              <motion.div
                key="machine"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 my-auto"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Question 2 of 3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Select target machine for {selectedCustomer?.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Choose an active machine passport asset to perform Machine Health Check.
                  </p>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={machineSearch}
                    onChange={(e) => setMachineSearch(e.target.value)}
                    placeholder="Search by model, serial number, plant..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                    }`}
                  />
                </div>

                {/* MACHINE SELECTION LIST */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredMachines.map((m) => {
                    const isSelected = localSelectedMachine.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setLocalSelectedMachine(m);
                          onSelectMachine(m);
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/30'
                            : isDark
                            ? 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs">{m.model}</div>
                            <div className="text-[10px] text-slate-400">
                              SN: {m.serialNumber} • Plant: {m.plantName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            m.status === 'OPERATIONAL' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* NEXT ACTION */}
                <div className="pt-3 flex items-center justify-between border-t border-slate-800/60">
                  <span className="text-xs text-slate-400">
                    Selected: <strong className="text-cyan-300">{localSelectedMachine.model} ({localSelectedMachine.serialNumber})</strong>
                  </span>
                  <button
                    onClick={() => setCurrentStep('session_check')}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all"
                  >
                    <span>Next: Check Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* QUESTION STEP 4: SESSION RECOVERY & DETECTION */}
            {currentStep === 'session_check' && (
              <motion.div
                key="session_check"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 my-auto"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Question 3 of 3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Session Detection & Brain Recovery
                  </h2>
                  <p className="text-xs text-slate-400">
                    Checking active inspection history for {localSelectedMachine.model} ({localSelectedMachine.serialNumber}).
                  </p>
                </div>

                {/* IF INCOMPLETE SESSION EXISTS */}
                {existingIncompleteSession ? (
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-cyan-50/60 border-cyan-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="font-bold text-xs text-cyan-300 uppercase tracking-wider">Incomplete Session Found</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {existingIncompleteSession.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Start Date</div>
                        <div className="font-semibold text-slate-200">{existingIncompleteSession.startDate}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Last Updated</div>
                        <div className="font-semibold text-slate-200">
                          {new Date(existingIncompleteSession.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Engineer</div>
                        <div className="font-semibold text-slate-200">{existingIncompleteSession.engineerName || 'Field Engineer'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Readiness</div>
                        <div className="font-semibold text-cyan-400">
                          {computeAutopilotReadiness(existingIncompleteSession.autopilotProgress).readinessScore}% Complete
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      An active inspection session was detected for this machine. You can continue the existing session without losing data or start a new clean session.
                    </p>

                    {/* ACTIONS */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleContinueExisting}
                        className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Continue Existing Session</span>
                      </button>

                      <button
                        onClick={handleStartNew}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-xs border transition-all ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        <span>Start New Session</span>
                      </button>

                      <button
                        onClick={handleReviewProgress}
                        className="px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 font-semibold transition-colors ml-auto flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Review Progress (Read-Only)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* IF NO INCOMPLETE SESSION FOUND */
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3 text-slate-400">
                      <Clock className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="font-bold text-xs text-slate-200">No Active Session Found</div>
                        <div className="text-[11px] text-slate-400">Ready to launch a new Machine Health Check session for this machine.</div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleStartNew}
                        className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Create & Start New MHC Session</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 5: SESSION BRAIN ACTIVE INSPECTION VIEW */}
            {currentStep === 'session_active' && (
              <motion.div
                key="session_active"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 my-auto"
              >
                {/* TOP HEADER & READ-ONLY TOGGLE */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Autopilot Active</span>
                    </div>
                    {isReadOnlyMode && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>READ-ONLY MODE</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      ID: <strong className="text-slate-200">{effectiveSession?.id}</strong>
                    </span>
                    
                    <button
                      onClick={() => setIsReadOnlyMode(!isReadOnlyMode)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 border transition-all ${
                        isReadOnlyMode
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isReadOnlyMode ? (
                        <>
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Enable Editing</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Read-Only Mode</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* MACHINE & CUSTOMER TITLE */}
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    {localSelectedMachine.model} ({localSelectedMachine.machineNumber || localSelectedMachine.serialNumber})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Customer: <strong className="text-slate-200">{selectedCustomer?.name || localSelectedMachine.customerName}</strong> • Plant: <strong className="text-slate-200">{localSelectedMachine.plantName}</strong> • Start Date: <strong className="text-slate-200">{effectiveSession?.startDate}</strong>
                  </p>
                </div>

                {/* READ-ONLY BANNER IF ACTIVE */}
                {isReadOnlyMode && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>Read-Only Review Mode:</strong> Viewing MHC progress without modifying session data.</span>
                    </div>
                    <button
                      onClick={() => setIsReadOnlyMode(false)}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-100 underline decoration-dotted shrink-0"
                    >
                      Switch to Editing
                    </button>
                  </div>
                )}

                {/* READINESS OVERVIEW BAR */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-cyan-400" />
                      <span>MHC Readiness Analysis</span>
                    </span>
                    <span className="font-mono text-cyan-400">{readiness.readinessScore}% Complete</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${readiness.readinessScore}%` }}
                    />
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                      <div className="text-[10px] text-emerald-400/80 font-mono">COMPLETED</div>
                      <div className="font-bold text-xs">{readiness.completedCount} / {readiness.totalCount}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300">
                      <div className="text-[10px] text-cyan-400/80 font-mono">CURRENT DAY</div>
                      <div className="font-bold text-xs">{progress.currentDay}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300">
                      <div className="text-[10px] text-amber-400/80 font-mono">NEEDS REVIEW</div>
                      <div className="font-bold text-xs">{readiness.needsReviewList.length} Items</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-300">
                      <div className="text-[10px] text-slate-400 font-mono">REPORT STATUS</div>
                      <div className="font-bold text-[10px] truncate">
                        {readiness.isReadyForReport ? (
                          <span className="text-emerald-400">✓ READY</span>
                        ) : (
                          <span className="text-amber-400">PENDING CORE</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOCUSED JOURNEY ACTIVITY CONTROL ("SESSION BRAIN") */}
                {progress.currentActivityCode === '01' ? (
                  <MhcLaserHoursActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                  />
                ) : (progress.currentActivityCode === '02_power' || progress.currentActivityCode === '03_power') ? (
                  <MhcLaserPowerActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                  />
                ) : (progress.currentActivityCode === '02_beam' || progress.currentActivityCode === '03_beam') ? (
                  <MhcLaserBeamActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                  />
                ) : (progress.currentActivityCode === '02_findings' || progress.currentActivityCode === '03_findings') ? (
                  <MhcLaserInspectionActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                    activeCode={progress.currentActivityCode}
                  />
                ) : (progress.currentActivityCode === '04_stage1' || progress.currentActivityCode === '04_stage2' || progress.currentActivityCode === '04') ? (
                  <MhcStageCalibrationActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                    activeCode={progress.currentActivityCode}
                  />
                ) : (progress.currentActivityCode === '05_agc1' || progress.currentActivityCode === '05_agc2' || progress.currentActivityCode === '05') ? (
                  <MhcAgcActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    isDark={isDark}
                    showNotification={showNotification}
                    activeCode={progress.currentActivityCode}
                  />
                ) : progress.currentActivityCode === '06' ? (
                  <MhcTemperatureEvidenceActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isReadOnly={isReadOnlyMode}
                    onUpdateSession={onUpdateSession}
                    onUpdateMachine={onUpdateMachine}
                    onCompleteActivity={handleCompleteCurrentActivity}
                    onSwitchToCanvas={onSwitchToCanvas}
                    isDark={isDark}
                    showNotification={showNotification}
                    activeCode={progress.currentActivityCode}
                  />
                ) : (progress.currentActivityCode === '07' || progress.currentActivityCode === '07_review') ? (
                  <MhcReadinessReviewActivity
                    session={effectiveSession!}
                    machine={localSelectedMachine}
                    isDark={isDark}
                    isReadOnly={isReadOnlyMode}
                    onNavigateToActivity={handleJumpToActivityCode}
                    onProceedToReportGeneration={handleProceedToReportGeneration}
                    onUpdateEngineerNote={(note) => handleUpdateNoteForActivity('07', note)}
                  />
                ) : (progress.currentActivityCode === '08' || progress.currentActivityCode === '08_report') ? (
                  <MhcFullPdfRenderer
                    session={effectiveSession!}
                    previousSession={previousSession}
                    isDark={isDark}
                    onBackToAutopilot={() => handleJumpToActivityCode('07')}
                  />
                ) : (
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-cyan-50/60 border-cyan-200'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {currentActionableItem.day} • {currentActionableItem.code}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-slate-100">
                          {currentActionableItem.title}
                        </h3>
                      </div>

                      {/* Status Pill */}
                      {(() => {
                        const st = progress.activityStatuses[currentActionableItem.code] || 'IN_PROGRESS';
                        return (
                          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border ${
                            st === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : st === 'NEEDS_REVIEW'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}>
                            {st === 'COMPLETED' && '✓ COMPLETED'}
                            {st === 'IN_PROGRESS' && '◉ IN PROGRESS'}
                            {st === 'NEEDS_REVIEW' && '⚠ NEEDS REVIEW'}
                            {st === 'UPCOMING' && '○ UPCOMING'}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Observation Note Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-400 font-bold flex items-center justify-between">
                        <span>ENGINEER OBSERVATION NOTES</span>
                        <span className="text-[10px] text-slate-500">Persisted in Session Brain</span>
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnlyMode}
                        value={activeNoteText}
                        onChange={(e) => {
                          setActiveNoteText(e.target.value);
                          if (!isReadOnlyMode && effectiveSession) {
                            const updated = { ...effectiveSession };
                            const currP = updated.autopilotProgress || createDefaultAutopilotProgress();
                            updated.autopilotProgress = {
                              ...currP,
                              activityNotes: {
                                ...(currP.activityNotes || {}),
                                [currentActionableItem.code]: e.target.value
                              }
                            };
                            onUpdateSession(updated);
                          }
                        }}
                        placeholder={isReadOnlyMode ? "Read-only mode active..." : "Add quick measurement notes or findings..."}
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                        }`}
                      />
                    </div>

                    {/* ACTION CONTROLS */}
                    {!isReadOnlyMode ? (
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={handleCompleteCurrentActivity}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Mark Complete & Advance</span>
                        </button>

                        <button
                          onClick={handleFlagCurrentNeedsReview}
                          className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-2 transition-all"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Flag for Review</span>
                        </button>

                        {progress.activityStatuses[currentActionableItem.code] === 'COMPLETED' && (
                          <button
                            onClick={() => handleReopenActivity(currentActionableItem.code)}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold border border-slate-700"
                          >
                            Re-open Activity
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 text-xs text-amber-300 font-mono flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Action controls locked in Read-Only mode. Toggle "Enable Editing" above to modify.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* BOTTOM FOOTER ACTIONS */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60">
                  <button
                    onClick={() => setCurrentStep('customer')}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ← Change Machine or Customer
                  </button>

                  <button
                    onClick={onSwitchToCanvas}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Open Full Canvas / Workspace</span>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
