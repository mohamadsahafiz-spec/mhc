import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Maximize2, 
  Plus, 
  Check, 
  X, 
  FileText, 
  Wrench, 
  Search,
  ArrowRight,
  Info
} from 'lucide-react';
import { Machine, MHCSession, MHCInspectionFindingItem, MHCHeadInspectionState } from '../../../types';
import { StorageService } from '../../../utils/persistence';
import { generateFindingWording } from '../../../utils/aiFindingGenerator';

export interface MhcLaserInspectionActivityProps {
  session: MHCSession;
  machine: Machine;
  isReadOnly: boolean;
  onUpdateSession: (updatedSession: MHCSession) => void;
  onCompleteActivity: () => void;
  onUpdateMachine?: (updatedMachine: Machine) => void;
  isDark: boolean;
  showNotification?: (msg: string) => void;
  activeCode?: string; // '02_findings' | '03_findings'
}

const COMPONENT_OPTIONS = [
  'TTL camera',
  'High Vision camera',
  'TC lens',
  'Scanner X lens',
  'Scanner Y lens',
  'Optics / transmitting lens',
  'Mirrors / reflective optics',
  'Other'
];

const CONDITION_OPTIONS = [
  'Burn mark',
  'Power drop / loss',
  'Contamination',
  'Physical damage',
  'Coating damage',
  'Blur / low brightness',
  'Other'
];

const ACTION_OPTIONS = [
  'Clean',
  'Monitor',
  'Recommended replacement',
  'Replacement required',
  'Other'
];

// Transmitting optics components subject to burned lens replacement engineering rule
const TRANSMITTING_OPTICS = [
  'TC lens',
  'Scanner X lens',
  'Scanner Y lens',
  'Optics / transmitting lens'
];

export const MhcLaserInspectionActivity: React.FC<MhcLaserInspectionActivityProps> = ({
  session,
  machine,
  isReadOnly,
  onUpdateSession,
  onCompleteActivity,
  onUpdateMachine,
  isDark,
  showNotification,
  activeCode = '02_findings'
}) => {
  // Laser Heads Discovery
  const laserHeads = useMemo(() => {
    if (machine.laserHeads && machine.laserHeads.length > 0) return machine.laserHeads;
    if (machine.lasers && machine.lasers.length > 0) return machine.lasers;
    return [
      { id: 'lh1', name: 'Laser Head 1', model: machine.model, serialNo: `${machine.serialNumber}-L1` },
      { id: 'lh2', name: 'Laser Head 2', model: machine.model, serialNo: `${machine.serialNumber}-L2` }
    ];
  }, [machine]);

  // Active Head Selection (Default to Head 1 for 02_findings, Head 2 for 03_findings)
  const defaultHeadId = activeCode === '03_findings' ? 'lh2' : 'lh1';
  const [activeHeadId, setActiveHeadId] = useState<string>(defaultHeadId);

  useEffect(() => {
    if (activeCode === '03_findings') {
      setActiveHeadId('lh2');
    } else {
      setActiveHeadId('lh1');
    }
  }, [activeCode]);

  // Hydrate findings from session
  const inspectionData = session.inspectionFindings || {};

  const activeHeadObj = laserHeads.find(h => h.id === activeHeadId || (activeHeadId === 'lh1' && h.id.includes('1')) || (activeHeadId === 'lh2' && h.id.includes('2'))) || laserHeads[0];
  const activeHeadKey = activeHeadId === 'lh2' ? 'lh2' : 'lh1';

  const headState: MHCHeadInspectionState = inspectionData[activeHeadKey] || {
    headId: activeHeadKey,
    headName: activeHeadObj?.name || (activeHeadKey === 'lh1' ? 'Laser Head 1' : 'Laser Head 2'),
    decision: 'UNANSWERED',
    findings: [],
    status: 'NOT_STARTED'
  };

  // Local Form state for active finding draft
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [customComponent, setCustomComponent] = useState<string>('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customConditionDetail, setCustomConditionDetail] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [engineerNote, setEngineerNote] = useState<string>('');
  const [evidenceImage, setEvidenceImage] = useState<string | undefined>(undefined);
  const [aiWording, setAiWording] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Check engineering rule violation
  const isTransmittingOptic = TRANSMITTING_OPTICS.includes(selectedComponent) || 
    (selectedComponent === 'Other' && customComponent.toLowerCase().includes('lens') || customComponent.toLowerCase().includes('optic'));
  const hasBurnMark = selectedConditions.includes('Burn mark');
  const isBurnedOptic = isTransmittingOptic && hasBurnMark;
  const isCleaningBurnedOptic = isBurnedOptic && selectedAction === 'Clean';

  // Decision Handler (No issue found vs Issue found)
  const handleSelectDecision = (decision: 'NO_ISSUE' | 'ISSUE_FOUND') => {
    if (isReadOnly) return;

    let updatedHeadState: MHCHeadInspectionState;

    if (decision === 'NO_ISSUE') {
      updatedHeadState = {
        ...headState,
        decision: 'NO_ISSUE',
        findings: [],
        status: 'COMPLETED',
        updatedAt: new Date().toISOString()
      };
    } else {
      updatedHeadState = {
        ...headState,
        decision: 'ISSUE_FOUND',
        status: headState.findings.length > 0 
          ? (headState.findings.some(f => f.actionRecommendation === 'Replacement required' || f.actionRecommendation === 'Recommended replacement') ? 'NEEDS_REVIEW' : 'COMPLETED')
          : 'IN_PROGRESS',
        updatedAt: new Date().toISOString()
      };
    }

    const updatedSession: MHCSession = {
      ...session,
      inspectionFindings: {
        ...inspectionData,
        [activeHeadKey]: updatedHeadState
      },
      lastUpdated: new Date().toISOString()
    };

    onUpdateSession(updatedSession);

    if (showNotification) {
      showNotification(decision === 'NO_ISSUE' 
        ? `✓ Marked ${headState.headName}: No Issues Found`
        : `Selected ${headState.headName}: Issue / Recommendation Found`
      );
    }
  };

  // Condition toggle handler
  const handleToggleCondition = (cond: string) => {
    if (isReadOnly) return;
    setSelectedConditions(prev => 
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  // Image Upload Handler
  const handleImageUpload = (file: File) => {
    if (isReadOnly || !file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (url) {
        setEvidenceImage(url);
        if (showNotification) showNotification('✓ Evidence image attached');
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Wording Generator trigger
  const handleGenerateAiWording = async () => {
    if (isReadOnly) return;
    const compName = selectedComponent === 'Other' ? (customComponent || 'Custom Component') : selectedComponent;
    if (!compName || selectedConditions.length === 0) {
      if (showNotification) showNotification('⚠ Please select a component and at least one condition first.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const resultWording = await generateFindingWording({
        component: compName,
        conditions: selectedConditions,
        actionRecommendation: selectedAction || 'Further inspection',
        engineerNote: engineerNote
      });
      setAiWording(resultWording);
      if (showNotification) showNotification('✨ AI Finding Wording generated!');
    } catch (err) {
      console.error('AI Generation error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Add Finding Item to active head
  const handleAddFinding = () => {
    if (isReadOnly) return;

    const compName = selectedComponent === 'Other' ? customComponent.trim() : selectedComponent;
    if (!compName) {
      if (showNotification) showNotification('⚠ Please select or enter a component name.');
      return;
    }

    if (selectedConditions.length === 0) {
      if (showNotification) showNotification('⚠ Please select at least one condition or damage.');
      return;
    }

    if (!selectedAction) {
      if (showNotification) showNotification('⚠ Please select an action / recommendation.');
      return;
    }

    if (isCleaningBurnedOptic) {
      if (showNotification) showNotification('⚠ ENGINEERING RULE: A burned transmitting optic cannot be cleaned. Please select Replacement Required.');
      return;
    }

    const newFinding: MHCInspectionFindingItem = {
      id: `find-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      headId: activeHeadKey,
      headName: headState.headName,
      component: compName,
      isCustomComponent: selectedComponent === 'Other',
      conditions: selectedConditions,
      customConditionDetail: selectedConditions.includes('Other') ? customConditionDetail : undefined,
      actionRecommendation: selectedAction,
      engineerNote: engineerNote.trim() || undefined,
      evidenceImage: evidenceImage,
      aiGeneratedWording: aiWording.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const updatedFindings = [...headState.findings, newFinding];
    const hasReplacement = updatedFindings.some(f => f.actionRecommendation === 'Replacement required' || f.actionRecommendation === 'Recommended replacement');
    
    const updatedHeadState: MHCHeadInspectionState = {
      ...headState,
      decision: 'ISSUE_FOUND',
      findings: updatedFindings,
      status: hasReplacement ? 'NEEDS_REVIEW' : 'COMPLETED',
      updatedAt: new Date().toISOString()
    };

    const updatedSession: MHCSession = {
      ...session,
      inspectionFindings: {
        ...inspectionData,
        [activeHeadKey]: updatedHeadState
      },
      lastUpdated: new Date().toISOString()
    };

    onUpdateSession(updatedSession);

    // Reset Form
    setSelectedComponent('');
    setCustomComponent('');
    setSelectedConditions([]);
    setCustomConditionDetail('');
    setSelectedAction('');
    setEngineerNote('');
    setEvidenceImage(undefined);
    setAiWording('');

    if (showNotification) showNotification(`✓ Finding added to ${headState.headName}`);
  };

  // Delete Finding Item
  const handleDeleteFinding = (findingId: string) => {
    if (isReadOnly) return;
    const updatedFindings = headState.findings.filter(f => f.id !== findingId);
    const hasReplacement = updatedFindings.some(f => f.actionRecommendation === 'Replacement required' || f.actionRecommendation === 'Recommended replacement');

    const updatedHeadState: MHCHeadInspectionState = {
      ...headState,
      findings: updatedFindings,
      decision: updatedFindings.length === 0 ? 'UNANSWERED' : 'ISSUE_FOUND',
      status: updatedFindings.length === 0 ? 'NOT_STARTED' : (hasReplacement ? 'NEEDS_REVIEW' : 'COMPLETED'),
      updatedAt: new Date().toISOString()
    };

    const updatedSession: MHCSession = {
      ...session,
      inspectionFindings: {
        ...inspectionData,
        [activeHeadKey]: updatedHeadState
      },
      lastUpdated: new Date().toISOString()
    };

    onUpdateSession(updatedSession);
    if (showNotification) showNotification('Finding removed.');
  };

  // Complete and Advance Activity in Autopilot
  const handleSaveAndAdvance = () => {
    if (isReadOnly) return;

    if (headState.decision === 'UNANSWERED') {
      if (showNotification) showNotification(`⚠ Please answer "Any component requiring attention?" for ${headState.headName}.`);
      return;
    }

    if (headState.decision === 'ISSUE_FOUND' && headState.findings.length === 0) {
      if (showNotification) showNotification(`⚠ Please add at least one finding for ${headState.headName} or select "No issue found".`);
      return;
    }

    // Determine target code & status for Autopilot advancement
    const isHead1 = activeHeadKey === 'lh1';
    const targetCode = isHead1 ? '02_findings' : '03_findings';
    const finalStatus = headState.findings.some(f => f.actionRecommendation === 'Replacement required' || f.actionRecommendation === 'Recommended replacement') 
      ? 'NEEDS_REVIEW' 
      : 'COMPLETED';

    // Update head status in session
    const updatedHeadState: MHCHeadInspectionState = {
      ...headState,
      status: finalStatus,
      updatedAt: new Date().toISOString()
    };

    const updatedSession: MHCSession = {
      ...session,
      inspectionFindings: {
        ...inspectionData,
        [activeHeadKey]: updatedHeadState
      },
      lastUpdated: new Date().toISOString()
    };

    onUpdateSession(updatedSession);

    if (showNotification) {
      showNotification(`✓ ${headState.headName} Inspection recorded (${finalStatus})`);
    }

    // Call journey advancement handler
    onCompleteActivity();
  };

  // Evaluate status badges for both heads
  const head1Data = inspectionData['lh1'] || { decision: 'UNANSWERED', status: 'NOT_STARTED', findings: [] };
  const head2Data = inspectionData['lh2'] || { decision: 'UNANSWERED', status: 'NOT_STARTED', findings: [] };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className={`p-4 rounded-2xl border space-y-2 ${
        isDark ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
              Day 1 • Activity 02 & 03: Optical & Mechanical Inspection Workspace
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            HEAD INDEPENDENCE ACTIVE
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Record optical and mechanical inspection findings independently for Laser Head 1 and Laser Head 2. Capture component damage, actionable recommendations, and optional evidence image attachments.
        </p>
      </div>

      {/* LASER HEAD SWITCHER TABS & INDEPENDENT STATUS BAR */}
      <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          {/* Head 1 Tab */}
          <button
            onClick={() => setActiveHeadId('lh1')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeHeadKey === 'lh1'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Laser Head 1</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold border ${
              head1Data.status === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : head1Data.status === 'NEEDS_REVIEW'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}>
              {head1Data.status === 'COMPLETED' ? '✓ DONE' : head1Data.status === 'NEEDS_REVIEW' ? '⚠ REVIEW' : 'PENDING'}
            </span>
          </button>

          {/* Head 2 Tab */}
          <button
            onClick={() => setActiveHeadId('lh2')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeHeadKey === 'lh2'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Laser Head 2</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold border ${
              head2Data.status === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : head2Data.status === 'NEEDS_REVIEW'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}>
              {head2Data.status === 'COMPLETED' ? '✓ DONE' : head2Data.status === 'NEEDS_REVIEW' ? '⚠ REVIEW' : 'PENDING'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">ACTIVE:</span>
          <span className="font-extrabold text-cyan-300">{headState.headName}</span>
        </div>
      </div>

      {/* START QUESTION CARD */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        headState.decision === 'NO_ISSUE'
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : headState.decision === 'ISSUE_FOUND'
          ? 'bg-amber-950/20 border-amber-500/30'
          : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400 shrink-0" />
            <h4 className="font-extrabold text-sm sm:text-base text-slate-100">
              {headState.headName} — Any component requiring attention?
            </h4>
          </div>

          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
            headState.decision === 'NO_ISSUE'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : headState.decision === 'ISSUE_FOUND'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {headState.decision === 'NO_ISSUE' ? 'NO ISSUE FOUND' : headState.decision === 'ISSUE_FOUND' ? 'ISSUE / RECOMMENDATION FOUND' : 'DECISION REQUIRED'}
          </span>
        </div>

        {/* Start Decision Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => handleSelectDecision('NO_ISSUE')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              headState.decision === 'NO_ISSUE'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30'
                : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${headState.decision === 'NO_ISSUE' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div>
              <div className="font-bold text-xs uppercase font-mono">No issue found</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                All cameras, lenses, optics, and mirrors on {headState.headName} are clean and in nominal working condition.
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => handleSelectDecision('ISSUE_FOUND')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              headState.decision === 'ISSUE_FOUND'
                ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-2 ring-amber-500/30'
                : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${headState.decision === 'ISSUE_FOUND' ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <div className="font-bold text-xs uppercase font-mono">Issue / recommendation found</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Record damage, burn marks, contamination, or recommended replacement on {headState.headName}.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* IF NO ISSUE FOUND CONFIRMATION */}
      {headState.decision === 'NO_ISSUE' && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>✓ {headState.headName} inspection confirmed: No issues detected. Inspection marked Complete.</span>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => handleSelectDecision('ISSUE_FOUND')}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Change Decision
            </button>
          )}
        </div>
      )}

      {/* IF ISSUE FOUND — PROGRESSIVE FINDING FORM */}
      {headState.decision === 'ISSUE_FOUND' && (
        <div className="space-y-6">
          {/* ADD NEW FINDING DRAFT FORM */}
          {!isReadOnly && (
            <div className={`p-5 rounded-2xl border space-y-5 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-sm text-slate-100">
                    Record Inspection Finding on {headState.headName}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">PROGRESSIVE FORM</span>
              </div>

              {/* 1. COMPONENT SELECTION */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-[10px]">1</span>
                  <span>Select Affected Component / Area *</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COMPONENT_OPTIONS.map(comp => (
                    <button
                      key={`comp-${comp}`}
                      type="button"
                      onClick={() => setSelectedComponent(comp)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        selectedComponent === comp
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>

                {selectedComponent === 'Other' && (
                  <div className="pt-2">
                    <input
                      type="text"
                      value={customComponent}
                      onChange={e => setCustomComponent(e.target.value)}
                      placeholder="Specify custom component name (e.g. Beam Expander Optic)"
                      className="w-full px-3.5 py-2 rounded-xl border bg-slate-950 border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* 2. CONDITION / DAMAGE SELECTION */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-[10px]">2</span>
                  <span>Select Observed Condition / Damage (Multi-select) *</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map(cond => {
                    const isSelected = selectedConditions.includes(cond);
                    return (
                      <button
                        key={`cond-${cond}`}
                        type="button"
                        onClick={() => handleToggleCondition(cond)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-slate-600" />}
                        <span>{cond}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedConditions.includes('Other') && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={customConditionDetail}
                      onChange={e => setCustomConditionDetail(e.target.value)}
                      placeholder="Specify custom condition details"
                      className="w-full px-3 py-1.5 rounded-lg border bg-slate-950 border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* KNOWN ENGINEERING RULE BANNER */}
              {isBurnedOptic && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-300 uppercase">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Known Engineering Constraint</span>
                  </div>
                  <p className="text-xs leading-relaxed text-rose-200">
                    A burned transmitting lens/optic cannot be restored by cleaning and requires replacement.
                  </p>
                </div>
              )}

              {/* 3. ACTION / RECOMMENDATION */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-[10px]">3</span>
                  <span>Action / Recommendation *</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ACTION_OPTIONS.map(act => (
                    <button
                      key={`act-${act}`}
                      type="button"
                      onClick={() => setSelectedAction(act)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedAction === act
                          ? act === 'Replacement required'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-200 ring-1 ring-rose-500/30'
                            : 'bg-indigo-500/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>

                {isCleaningBurnedOptic && (
                  <p className="text-[11px] font-mono text-rose-400 font-bold pt-1">
                    ⚠ Warning: Burned transmitting optics cannot be restored by cleaning. Please select "Replacement required" or "Recommended replacement".
                  </p>
                )}
              </div>

              {/* 4. OPTIONAL ENGINEER NOTE & EVIDENCE IMAGE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Note */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Engineer Observation Note (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={engineerNote}
                    onChange={e => setEngineerNote(e.target.value)}
                    placeholder="e.g. Center burn mark observed on optic lens with 15% power drop"
                    className="w-full px-3 py-2 rounded-xl border bg-slate-950 border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {/* Optional Image */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Evidence Image Attachment (Optional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {evidenceImage ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal(evidenceImage)}
                          className="relative group rounded overflow-hidden border border-cyan-500/40 w-8 h-8 shrink-0 cursor-pointer"
                        >
                          <img src={evidenceImage} alt="Finding evidence" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-3 h-3 text-cyan-300" />
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEvidenceImage(undefined)}
                          className="p-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-all flex items-center gap-2 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Attach Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. AI FINDING ASSISTANCE */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>AI Finding Report Wording (Editable)</span>
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingAi}
                    onClick={handleGenerateAiWording}
                    className="px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>{isGeneratingAi ? 'Formatting...' : 'Generate Finding Wording'}</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={aiWording}
                  onChange={e => setAiWording(e.target.value)}
                  placeholder="Click 'Generate Finding Wording' or type formal technical report text here..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-900 border-slate-700 text-xs text-slate-100 outline-none focus:border-indigo-500 font-mono resize-none"
                />
              </div>

              {/* ADD FINDING BUTTON */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddFinding}
                  disabled={isCleaningBurnedOptic}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
                    isCleaningBurnedOptic
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Finding to {headState.headName}</span>
                </button>
              </div>
            </div>
          )}

          {/* RECORDED FINDINGS LIST FOR ACTIVE HEAD */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Recorded Findings for {headState.headName} ({headState.findings.length})</span>
            </h5>

            {headState.findings.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 text-xs font-mono">
                No individual component findings recorded for {headState.headName} yet. Use the form above to add an issue finding or select "No issue found".
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {headState.findings.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 transition-all hover:border-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-bold text-xs text-slate-100">{item.component}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          item.actionRecommendation === 'Replacement required'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        }`}>
                          {item.actionRecommendation}
                        </span>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFinding(item.id)}
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                            title="Remove finding"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Conditions */}
                    <div className="flex flex-wrap gap-1.5">
                      {item.conditions.map(c => (
                        <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* AI Wording or Engineer Note */}
                    {item.aiGeneratedWording ? (
                      <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <strong className="text-indigo-400">Report Wording:</strong> {item.aiGeneratedWording}
                      </p>
                    ) : item.engineerNote ? (
                      <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <strong className="text-cyan-400">Note:</strong> {item.engineerNote}
                      </p>
                    ) : null}

                    {/* Evidence Image */}
                    {item.evidenceImage && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal(item.evidenceImage!)}
                          className="relative group rounded overflow-hidden border border-cyan-500/40 w-10 h-10 shrink-0 cursor-pointer"
                        >
                          <img src={item.evidenceImage} alt="Evidence" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                          </div>
                        </button>
                        <span className="text-[10px] font-mono text-cyan-400">Evidence Image Attached</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPLETION GATE & ACTION BUTTON */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        headState.status === 'COMPLETED'
          ? 'bg-emerald-950/20 border-emerald-500/40'
          : headState.status === 'NEEDS_REVIEW'
          ? 'bg-amber-950/20 border-amber-500/40'
          : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${headState.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}`} />
              <h4 className="font-extrabold text-sm sm:text-base text-slate-100">
                {headState.headName} Inspection Gate
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              {headState.decision === 'UNANSWERED'
                ? 'Please select whether any component on this laser head requires attention.'
                : headState.decision === 'NO_ISSUE'
                ? 'No issues reported. Ready to confirm inspection completion for this head.'
                : headState.findings.length === 0
                ? 'Please add at least one finding before completing.'
                : 'Findings recorded. Ready to save inspection and advance Journey Rail.'}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300">
            <span>HEAD STATUS:</span>
            <span className={
              headState.status === 'COMPLETED' ? 'text-emerald-400' : headState.status === 'NEEDS_REVIEW' ? 'text-amber-400' : 'text-slate-500'
            }>
              {headState.status}
            </span>
          </div>
        </div>

        {/* SAVE & ADVANCE BUTTON */}
        {!isReadOnly && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={headState.decision === 'UNANSWERED' || (headState.decision === 'ISSUE_FOUND' && headState.findings.length === 0)}
              onClick={handleSaveAndAdvance}
              className={`px-6 py-3 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all ${
                headState.decision !== 'UNANSWERED' && (headState.decision === 'NO_ISSUE' || headState.findings.length > 0)
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save & Complete {headState.headName} Inspection</span>
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
              <span>FINDING EVIDENCE PREVIEW</span>
              <button 
                onClick={() => setPreviewImageModal(null)}
                className="text-slate-400 hover:text-slate-100 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img 
              src={previewImageModal} 
              alt="Finding evidence preview" 
              className="max-h-[70vh] w-auto mx-auto object-contain rounded-lg border border-slate-800" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
