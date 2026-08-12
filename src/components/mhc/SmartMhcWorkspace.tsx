import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LaserEngine } from '../../utils/laserEngine';
import { 
  Activity, 
  Cpu, 
  Clock, 
  Sliders, 
  Zap, 
  Eye, 
  Thermometer, 
  CheckCircle2, 
  Package, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  LayoutGrid, 
  SlidersHorizontal, 
  Settings2, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  HelpCircle, 
  X, 
  Grid, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  AlertTriangle, 
  Copy, 
  ChevronDown, 
  Search, 
  Filter, 
  RefreshCcw,
  CheckSquare,
  Square,
  Save,
  FolderOpen,
  LayoutTemplate,
  RotateCcw,
  Upload,
  FileCheck,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  FileCode,
  Info,
  Printer,
  FileDown,
  Maximize,
  CheckCircle,
  XCircle,
  Wrench,
  UserCheck,
  Aperture,
  GripVertical
} from 'lucide-react';
import { 
  Machine, 
  MHCSession, 
  SmartMhcDataTrayItem, 
  SmartMhcWidget,
  MhcWorkspaceTemplate,
  MhcWorkspaceDraft,
  MHCCustomField
} from '../../types';
import { Badge } from '../common/Badge';
import { ChannelDataMap } from '../../types/temperature';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../utils/persistence';
import { ImageStore } from '../../utils/imageStore';
import { getLocalDateString } from '../../utils/timeUtils';
import { TemperatureGraph } from '../common/TemperatureGraph';
import { TemperatureEngine } from '../../utils/temperatureEngine';
import { TempRawStore } from '../../utils/tempRawStore';
import { SavedTemperatureRecord } from '../../types/temperature';
import { LaserPowerCheckRecord, MaskSize, MASK_SPECS } from '../../types/laserPower';
import { LaserPowerEngine } from '../../utils/laserPowerEngine';
import { BeamProfileCheckRecord, CHECKPOINT_SPECS, CheckpointId, DEFAULT_EVIDENCE_CHECKPOINTS } from '../../types/beamProfile';
import { BeamProfileEngine } from '../../utils/beamProfileEngine';
import { MhcEnterBeamProfileModal } from './MhcEnterBeamProfileModal';
import { ProductProcessRecord } from '../../types/productProcess';
import { ProductProcessEngine } from '../../utils/productProcessEngine';
import { MhcEnterProductProcessModal } from './MhcEnterProductProcessModal';

const MhcEnterLaserPowerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  machine: Machine;
  onSave: (record: LaserPowerCheckRecord) => void;
  isHistorical?: boolean;
}> = ({ isOpen, onClose, machine, onSave, isHistorical }) => {
  const [date, setDate] = useState(getLocalDateString());
  const [freq, setFreq] = useState(50);
  const [remarks, setRemarks] = useState('');

  const [lsHeadA, setLsHeadA] = useState('15.2');
  const [lsHeadB, setLsHeadB] = useState('15.0');

  const [optHeadA, setOptHeadA] = useState('14.8');
  const [optHeadB, setOptHeadB] = useState('14.6');

  useEffect(() => {
    if (isOpen) {
      if (isHistorical) {
        // Default historical date to 30 days ago for convenience, engineer can change
        const d = new Date();
        d.setDate(d.getDate() - 30);
        setDate(getLocalDateString(d));
      } else {
        setDate(getLocalDateString());
      }
    }
  }, [isOpen, isHistorical]);

  const [maskInputs, setMaskInputs] = useState<Record<MaskSize, { headA: string; headB: string }>>({
    '2.2mm': { headA: '3.4', headB: '3.3' },
    '2.0mm': { headA: '2.7', headB: '2.6' },
    '1.8mm': { headA: '2.1', headB: '2.0' },
    '1.3mm': { headA: '1.2', headB: '1.1' },
    '1.1mm': { headA: '0.8', headB: '0.8' },
    '0.9mm': { headA: '0.5', headB: '0.4' }
  });

  const currentFormParsed = React.useMemo(() => {
    const parseNum = (s: string) => {
      const n = parseFloat(s);
      return isNaN(n) ? null : n;
    };
    return LaserPowerEngine.evaluateRecord({
      date,
      frequencyKhz: freq,
      engineerRemarks: remarks,
      laserSource: {
        specText: '15W ±10% (13.5–16.5W)',
        minWatts: 13.5,
        maxWatts: 16.5,
        headA: parseNum(lsHeadA),
        headB: parseNum(lsHeadB),
        passA: false,
        passB: false
      },
      opticsTopHat: {
        specText: '15W ±10% (13.5–16.5W)',
        minWatts: 13.5,
        maxWatts: 16.5,
        headA: parseNum(optHeadA),
        headB: parseNum(optHeadB),
        passA: false,
        passB: false
      },
      workingZoneMasks: MASK_SPECS.map(s => ({
        maskSize: s.size,
        specText: s.specText,
        minWatts: s.minWatts,
        headA: parseNum(maskInputs[s.size].headA),
        headB: parseNum(maskInputs[s.size].headB),
        passA: false,
        passB: false
      }))
    });
  }, [date, freq, remarks, lsHeadA, lsHeadB, optHeadA, optHeadB, maskInputs]);

  const handleSave = () => {
    const record = LaserPowerEngine.evaluateRecord(currentFormParsed);
    onSave(record);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHistorical ? `Add Historical Laser Power Record — ${machine.model} (${machine.machineNumber})` : `Enter Laser Power Check — ${machine.model} (${machine.machineNumber})`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Form Header info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Check Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Frequency (kHz)</label>
            <input
              type="number"
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
            />
          </div>
        </div>

        {/* Laser Source */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              LASER SOURCE — External Meter
            </h4>
            <span className="text-[11px] text-slate-400">Spec: 15W ±10% (13.5–16.5W)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Head A Measured W</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={lsHeadA}
                  onChange={(e) => setLsHeadA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                />
                <span className={`text-[10px] font-bold px-2 py-1 rounded shrink-0 ${
                  currentFormParsed.laserSource.passA ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {currentFormParsed.laserSource.passA ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Head B Measured W</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={lsHeadB}
                  onChange={(e) => setLsHeadB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                />
                <span className={`text-[10px] font-bold px-2 py-1 rounded shrink-0 ${
                  currentFormParsed.laserSource.passB ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {currentFormParsed.laserSource.passB ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Optics / Top Hat */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              AFTER TOP HAT / OPTICS — External Meter
            </h4>
            <span className="text-[11px] text-slate-400">Spec: 15W ±10% (13.5–16.5W)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Head A Measured W</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={optHeadA}
                  onChange={(e) => setOptHeadA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                />
                <span className={`text-[10px] font-bold px-2 py-1 rounded shrink-0 ${
                  currentFormParsed.opticsTopHat.passA ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {currentFormParsed.opticsTopHat.passA ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Head B Measured W</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={optHeadB}
                  onChange={(e) => setOptHeadB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
                />
                <span className={`text-[10px] font-bold px-2 py-1 rounded shrink-0 ${
                  currentFormParsed.opticsTopHat.passB ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {currentFormParsed.opticsTopHat.passB ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Working Zone Mask Readings */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <h4 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              WORKING ZONE — Internal Power Meter Masks
            </h4>
            <span className="text-[11px] text-slate-400">Mask thresholds evaluation</span>
          </div>

          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="py-1.5 px-2">Mask</th>
                <th className="py-1.5 px-2">Spec</th>
                <th className="py-1.5 px-2">Head A (W)</th>
                <th className="py-1.5 px-2">Head B (W)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {MASK_SPECS.map(s => {
                const parsedM = currentFormParsed.workingZoneMasks.find(m => m.maskSize === s.size);
                return (
                  <tr key={s.size}>
                    <td className="py-1.5 px-2 font-bold text-slate-200">{s.size}</td>
                    <td className="py-1.5 px-2 text-slate-400">{s.specText}</td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={maskInputs[s.size].headA}
                          onChange={(e) => setMaskInputs(prev => ({
                            ...prev,
                            [s.size]: { ...prev[s.size], headA: e.target.value }
                          }))}
                          className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          parsedM?.passA ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {parsedM?.passA ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={maskInputs[s.size].headB}
                          onChange={(e) => setMaskInputs(prev => ({
                            ...prev,
                            [s.size]: { ...prev[s.size], headB: e.target.value }
                          }))}
                          className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          parsedM?.passB ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {parsedM?.passB ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks</label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Power check conducted during preventive maintenance."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">OVERALL VERDICT:</span>
            <Badge variant={currentFormParsed.overallResult === 'PASS' ? 'success' : 'danger'}>
              {currentFormParsed.overallResult}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} className="text-xs py-1.5 px-3">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-4">
              Save & Link to MHC
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

interface SmartMhcWorkspaceProps {
  machine: Machine;
  session?: MHCSession;
  onUpdateSession?: (session: MHCSession) => void;
  onUpdateMachine?: (updatedMachine: Machine) => void;
  onOpenStageForm?: (stageNum: number) => void;
}

// Built-in Default Report Layout Templates (Structure Only - No machine-specific readings)
const BUILT_IN_TEMPLATES: MhcWorkspaceTemplate[] = [
  {
    id: 'tpl_exec_std',
    title: 'Standard Executive Field MHC Template',
    description: 'A4 Single-Page Executive summary featuring Laser Life, Power Output, Thermal Loop, Beam Quality, and Engineer Verdict.',
    category: 'EXECUTIVE & FIELD RELEASE',
    revision: 'v1.3',
    updatedAt: '2026-08-06',
    isDefault: true,
    widgets: [
      {
        id: 'w-1',
        type: 'Laser Life',
        title: '01. Laser Life & Runtime Monitoring',
        subtitle: 'Recorded vs Calculated Current Laser Runtime Hours',
        width: '1/2',
        status: 'NORMAL',
        comparisonSource: 'Baseline vs Current',
        displayFields: { showGauge: true, showThresholds: true, showCalculated: true }
      },
      {
        id: 'w-2',
        type: 'Laser Temperature',
        title: '02. Thermal Loop & Chiller Status',
        subtitle: 'Laser Head & Coolant Operating Temperature',
        width: '1/2',
        status: 'NORMAL',
        comparisonSource: 'Spec Sheet vs Real-time',
        displayFields: { showChillerTemp: true, showFlowRate: true, showDiConductivity: true }
      },
      {
        id: 'w-3',
        type: 'Laser Power / Trend',
        title: '03. Laser Output Power Calibration',
        subtitle: 'Wattage Output Before vs After Optics Maintenance',
        width: '1/1',
        status: 'NORMAL',
        comparisonSource: 'Previous MHC vs Current',
        displayFields: { showRatedPower: true, showDeltaPct: true, showPowerChart: true }
      },
      {
        id: 'w-4',
        type: 'Beam Comparison',
        title: '04. Optical & Beam Profile Verification',
        subtitle: 'Beam Waist Spot Size, Focus Offset & M² Quality Factor',
        width: '1/1',
        status: 'NORMAL',
        comparisonSource: 'Previous MHC vs Current',
        displayFields: { showSpotSize: true, showM2Factor: true, showSymmetry: true }
      },
      {
        id: 'w-5',
        type: 'Product Info',
        title: '05. Product & Recipe Parameters',
        subtitle: 'Substrate Material & Laser Processing Recipe',
        width: '1/2',
        status: 'NORMAL',
        comparisonSource: 'None',
        displayFields: { showRecipeName: true, showSubstrate: true }
      },
      {
        id: 'w-6',
        type: 'Process Parameters',
        title: '06. Process Execution Settings',
        subtitle: 'Pulse Frequency, Scan Speed & Assist Gas Pressure',
        width: '1/2',
        status: 'NORMAL',
        comparisonSource: 'None',
        displayFields: { showScanSpeed: true, showFrequency: true }
      },
      {
        id: 'w-7',
        type: 'Recommendations',
        title: '07. Maintenance Recommendation',
        subtitle: 'Field Action Plan & ISO 13374-4 Condition Monitoring Intelligence',
        width: '1/2',
        status: 'NORMAL',
        comparisonSource: 'None',
        displayFields: { showVerdict: true, showNextAction: true, showConditionMonitoring: true }
      },
      {
        id: 'w-8',
        type: 'Spare Parts',
        title: '08. Consumables & Spare Parts Status',
        subtitle: 'DI Water Filter & Optics Lens Replacement Schedule',
        width: '1/2',
        status: 'NORMAL',
        comparisonSource: 'None',
        displayFields: { showPartNumbers: true, showStockLevel: true }
      }
    ]
  },
  {
    id: 'tpl_optical_audit',
    title: 'Deep Optical & Beam Profile Audit Template',
    description: 'Specialized layout focusing on M² beam quality, galvo scanner alignment, and optics cleanliness.',
    category: 'OPTICAL DIAGNOSTICS',
    revision: 'v1.0',
    updatedAt: '2026-08-04',
    widgets: [
      {
        id: 'w-op-1',
        type: 'Beam Comparison',
        title: '01. Optical & Beam Profile Spot Comparison',
        subtitle: 'Before vs After Optics Swabbing Beam Profile',
        width: '1/1',
        status: 'NORMAL',
        comparisonSource: 'Before vs After Maintenance',
        displayFields: { showSpotSize: true, showM2Factor: true, showSymmetry: true }
      },
      {
        id: 'w-op-2',
        type: 'Optics Condition',
        title: '02. Optics Surface & Focus Shift Offset',
        subtitle: 'Lens Cleanliness Score & Z-Offset Drift',
        width: '1/2',
        status: 'NORMAL',
        comparisonSource: 'Baseline vs Current',
        displayFields: { showCleanliness: true, showFocusOffset: true }
      },
      {
        id: 'w-op-3',
        type: 'Laser Power / Trend',
        title: '03. Laser Power Stability & Degradation',
        subtitle: 'Optical Power Output Calibration',
        width: '1/2',
        status: 'NORMAL',
        comparisonSource: 'Previous MHC vs Current',
        displayFields: { showRatedPower: true, showDeltaPct: true }
      },
      {
        id: 'w-op-4',
        type: 'Recommendations',
        title: '04. Optical Maintenance Action Plan',
        subtitle: 'Condition Monitoring Findings & Alignment Steps',
        width: '1/1',
        status: 'NORMAL',
        comparisonSource: 'None',
        displayFields: { showVerdict: true, showNextAction: true }
      }
    ]
  }
];

export const SmartMhcWorkspace: React.FC<SmartMhcWorkspaceProps> = ({
  machine,
  session,
  onUpdateSession,
  onUpdateMachine,
  onOpenStageForm
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // DOM Refs for Real A4 Capacity Measurement
  const canvasPaperRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Temperature Record Selection & Import State
  const [selectedTempRecordId, setSelectedTempRecordId] = useState<string | null>(null);
  const [isSelectTempRecordModalOpen, setIsSelectTempRecordModalOpen] = useState<boolean>(false);
  const [activeImportedTempRecord, setActiveImportedTempRecord] = useState<SavedTemperatureRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tempRecords = machine.temperatureRecords || [];
  const activeTempRecord = useMemo<SavedTemperatureRecord | null>(() => {
    if (selectedTempRecordId) {
      const found = tempRecords.find(r => r.id === selectedTempRecordId);
      if (found) return found;
    }
    if (activeImportedTempRecord) {
      return activeImportedTempRecord;
    }
    return tempRecords[0] || null;
  }, [selectedTempRecordId, tempRecords, activeImportedTempRecord]);

  // Laser Power Record Selection & Entry State
  const [selectedLaserPowerRecordId, setSelectedLaserPowerRecordId] = useState<string | null>(null);
  const [isSelectLaserPowerModalOpen, setIsSelectLaserPowerModalOpen] = useState<boolean>(false);
  const [isEnterLaserPowerModalOpen, setIsEnterLaserPowerModalOpen] = useState<boolean>(false);
  const [isHistoricalLaserPower, setIsHistoricalLaserPower] = useState<boolean>(false);

  const laserPowerRecords = useMemo(() => {
    const raw = machine.laserPowerRecords || [];
    return [...raw].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [machine.laserPowerRecords]);

  const activeLaserPowerRecord = useMemo<LaserPowerCheckRecord | null>(() => {
    if (selectedLaserPowerRecordId) {
      const found = laserPowerRecords.find(r => r.id === selectedLaserPowerRecordId);
      if (found) return found;
    }
    return laserPowerRecords[0] || null;
  }, [selectedLaserPowerRecordId, laserPowerRecords]);

  const prevLaserPowerRecord = useMemo<LaserPowerCheckRecord | null>(() => {
    if (!activeLaserPowerRecord) return null;
    const activeIndex = laserPowerRecords.findIndex(r => r.id === activeLaserPowerRecord.id);
    if (activeIndex >= 0 && activeIndex + 1 < laserPowerRecords.length) {
      return laserPowerRecords[activeIndex + 1];
    }
    return null;
  }, [activeLaserPowerRecord, laserPowerRecords]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const fileArray = Array.from(files);
      const textPromises = fileArray.map(f => f.text());
      const rawTexts = await Promise.all(textPromises);

      const analysisResult = TemperatureEngine.analyzeTemperatureLogs(rawTexts);
      if (!analysisResult || !analysisResult.resampledChannels || Object.keys(analysisResult.resampledChannels).length === 0) {
        showToast('Error: No valid temperature data found in uploaded files.');
        return;
      }

      const channelDataMap = analysisResult.resampledChannels;
      const downsampledChannelData: ChannelDataMap = {};
      if (channelDataMap) {
        Object.entries(channelDataMap).forEach(([chStr, pts]) => {
          const ch = parseInt(chStr, 10);
          downsampledChannelData[ch] = TemperatureEngine.downsamplePoints(pts, 1500);
        });
      }

      const stats = TemperatureEngine.calculateGlobalStats(downsampledChannelData);
      const recordId = `TR-${Date.now()}`;
      const newRecord: SavedTemperatureRecord = {
        id: recordId,
        machineId: machine.id,
        title: fileArray.map(f => f.name).join(', '),
        createdAt: new Date().toISOString(),
        sourceFileNames: fileArray.map(f => f.name),
        rawRecordsCount: analysisResult.rawRecords.length,
        intervalSec: 10,
        stats: stats || { min: 0, max: 0, avg: 0, range: 0, points: 0 },
        channelStats: analysisResult.channelStats,
        dayBoundaries: analysisResult.dayBoundaries,
        channelData: downsampledChannelData,
        records: []
      };

      TempRawStore.saveRawRecords(recordId, analysisResult.rawRecords);

      const updatedRecords = [newRecord, ...(machine.temperatureRecords || [])];
      const updatedMachine = { ...machine, temperatureRecords: updatedRecords };

      if (onUpdateMachine) {
        onUpdateMachine(updatedMachine);
      }
      StorageService.saveMachines([updatedMachine, ...StorageService.getMachines().filter(m => m.id !== machine.id)]);

      setActiveImportedTempRecord(newRecord);
      setSelectedTempRecordId(newRecord.id);
      showToast(`Imported ${fileArray.length} file(s) & saved to Machine Passport!`);
    } catch (err: any) {
      console.error('Error parsing temperature log:', err);
      showToast('Error parsing temperature log files.');
    }
  };

  // 1. Local Active Session State
  const activeSession: MHCSession = useMemo(() => {
    if (session) return session;
    return {
      id: `MHC-${new Date().getFullYear()}-${machine.machineNumber.replace('MCH-', '')}`,
      machineId: machine.id,
      machineModel: machine.model,
      machineSerialNumber: machine.serialNumber,
      machineName: `${machine.model} (${machine.machineNumber})`,
      customerId: machine.customerId,
      customerName: machine.customerName,
      plantName: machine.plantName || 'Fab 18A Cleanroom',
      engineerName: 'Sahafiz',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      lastUpdated: new Date().toLocaleString(),
      completionStatus: 'IN_PROGRESS',
      currentSection: 1,
      sectionStatuses: {},
      stage01_laserHours: (machine.laserHeads || []).map((lh, i) => ({
        laserId: lh.id || `lh-${i}`,
        laserIdentifier: lh.model || `Laser Head #${i + 1}`,
        recordedLaserHour: lh.runningHours || 12450,
        readingDate: new Date().toISOString().split('T')[0],
        readingTime: '09:00',
        calculatedCurrentHour: (lh.runningHours || 12450) + 48,
        warningThreshold: 15000,
        criticalThreshold: 18000,
        runtimeStatus: 'NORMAL'
      })),
      stage02_laserProfile: {
        laserId: 'lh-1',
        productName: 'Cleanroom Semiconductor Wafer',
        recipeProgram: 'RECIPE_STD_PROCESS_V1',
        profileInfo: 'TEM00 Gaussian Profile - Single Mode',
        measurementInfo: 'Spot Size: 42.5 µm',
        supportingEvidence: 'Initial beam shape verified.',
        images: []
      },
      stage03_laserPower: (machine.laserHeads || []).map((lh, i) => ({
        laserId: lh.id || `lh-${i}`,
        laserIdentifier: lh.model || `Laser Head #${i + 1}`,
        ratedPowerWatts: lh.ratedPowerWatts || 250,
        referenceValueWatts: lh.ratedPowerWatts || 250,
        beforeValueWatts: (lh.powerOutputWatts || 245) - 5,
        afterValueWatts: lh.powerOutputWatts || 248,
        stabilityPercent: 99.2,
        result: 'PASS',
        notes: 'Optics verified.',
        evidenceImages: []
      })),
      stage04_opticsBeam: {
        cleanlinessScore: 95,
        beamWaistMm: 1.05,
        focusOffsetMm: 0.01,
        symmetryRatio: 0.98,
        m2Value: 1.12,
        beforeCondition: 'Standard dust inspection.',
        afterCondition: 'Cleaned with optical swab.',
        inspectionResult: 'PASS',
        images: [],
        notes: ''
      },
      stage05_cooling: {
        chillerTempCelsius: 20.0,
        chillerFlowLpm: 18.0,
        diConductivityUs: 0.35,
        coolingCondition: 'Cooling loop nominal.',
        thermalCondition: 'Thermal gradient stable.',
        beforeCondition: 'Normal operating temp.',
        afterCondition: 'Verified under full load.',
        result: 'PASS',
        notes: ''
      },
      stage06_productQuality: {
        sampleId: `SAMPLE-${machine.machineNumber}-001`,
        viaDiameterUm: 42.5,
        viaShape: 'Circular',
        viaOffsetUm: 0.2,
        padQuality: 'No recast layer.',
        visualVerification: 'Visual cut verified clean.',
        beforeInspectionNotes: '',
        afterInspectionNotes: '',
        beforeImages: [],
        afterImages: [],
        result: 'PASS',
        notes: ''
      },
      stage07_spareParts: [
        {
          id: 'sp-1',
          partName: 'DI Water Resin Filter Cartridge',
          partNumber: 'FIL-DI-9920',
          category: 'Cooling',
          quantity: 1,
          reason: 'Routine replacement cycle',
          action: 'REPLACED',
          costIndicator: 'CUSTOMER_COST',
          notes: 'DI conductivity restored to 0.08 µS/cm.'
        }
      ],
      stage08_engineerRemarks: {
        generalFindings: 'Machine overall operational condition verified. Thermal loop and optical alignment within specifications.',
        observedIssues: 'Minor optics dust buildup detected before swabbing.',
        correctiveActions: 'Cleaned output window lens with optical swab; verified beam profile TEM00.',
        recommendations: 'Continue standard 250-hour PM schedule. Next lens swab recommended in 90 days.',
        followUpRequired: false,
        productionReleaseVerdict: 'APPROVED'
      }
    };
  }, [session, machine]);

  // Update session helper — Single source of truth synchronization
  const handleSessionChange = (updated: MHCSession) => {
    if (onUpdateSession) {
      onUpdateSession(updated);
    }
  };

  // 2. Identify Previous MHC for current machine (Current vs Previous Comparison)
  const previousSession = useMemo(() => {
    const allSessions = StorageService.getMhcSessions();
    const matches = allSessions.filter(s => s.machineId === machine.id && s.id !== activeSession.id);
    return matches[0] || null;
  }, [machine.id, activeSession.id]);

  // 3. Pane Visibility Controls
  const [showDataTray, setShowDataTray] = useState<boolean>(true);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState<boolean>(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState<boolean>(true);
  const [leftPaneTab, setLeftPaneTab] = useState<'TRAY' | 'WIDGETS'>('TRAY');

  // 4. Zoom & Search Filters
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [traySearch, setTraySearch] = useState('');
  const [trayFilter, setTrayFilter] = useState<'ALL' | 'AVAILABLE' | 'MISSING' | 'NA'>('ALL');
  const [widgetSearch, setWidgetSearch] = useState('');

  // 5. Selected Widget State for Properties Panel
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>('w-1');

  // 6. Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 7. Modals State
  const [isAddDataModalOpen, setIsAddDataModalOpen] = useState(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState(false);
  const [isLoadDraftModalOpen, setIsLoadDraftModalOpen] = useState(false);
  const [isInlineEditModalOpen, setIsInlineEditModalOpen] = useState(false);
  const [inlineEditItem, setInlineEditItem] = useState<{ key: string; label: string; value: any } | null>(null);
  const [isQualityCheckModalOpen, setIsQualityCheckModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Custom Data Form State
  const [newDataCat, setNewDataCat] = useState<SmartMhcDataTrayItem['category']>('Machine');
  const [newDataLabel, setNewDataLabel] = useState('');
  const [newDataVal, setNewDataVal] = useState('');
  const [newDataUnit, setNewDataUnit] = useState('');

  // Custom Widget Form State
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [newWidgetWidth, setNewWidgetWidth] = useState<SmartMhcWidget['width']>('1/2');
  const [newWidgetDisplayType, setNewWidgetDisplayType] = useState<SmartMhcWidget['customDisplayType']>('card');
  const [selectedBoundKeys, setSelectedBoundKeys] = useState<string[]>([]);

  // Template Form State
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateCategory, setTemplateCategory] = useState('PREVENTIVE MAINTENANCE');
  const [templateDesc, setTemplateDesc] = useState('');

  // Draft Form State
  const [draftTitle, setDraftTitle] = useState('');

  // 8. DATA TRAY Items Calculation (Derived directly from Machine Passport + Active Session + Previous Session)
  const dataTrayItems = useMemo<SmartMhcDataTrayItem[]>(() => {
    const lh1 = machine.laserHeads?.[0] || machine.lasers?.[0];
    const lm = lh1 ? LaserEngine.calculateLaserMetrics(lh1) : null;
    const sLh1 = activeSession.stage01_laserHours?.[0];
    const sPower = activeSession.stage03_laserPower?.[0];
    const sOptics = activeSession.stage04_opticsBeam;
    const sCooling = activeSession.stage05_cooling;
    const sProfile = activeSession.stage02_laserProfile;
    const sQuality = activeSession.stage06_productQuality;
    const sRemarks = activeSession.stage08_engineerRemarks;

    const items: SmartMhcDataTrayItem[] = [
      // Machine Category
      { id: 'dt-m1', category: 'Machine', key: 'model', label: 'Machine Model', value: machine.model, status: 'AVAILABLE' },
      { id: 'dt-m2', category: 'Machine', key: 'serial', label: 'Serial Number', value: machine.serialNumber, status: 'AVAILABLE' },
      { id: 'dt-m3', category: 'Machine', key: 'customer', label: 'Customer', value: machine.customerName, status: 'AVAILABLE' },
      { id: 'dt-m4', category: 'Machine', key: 'plant', label: 'Plant / Location', value: machine.plantName || 'Cleanroom Fab 18A', status: 'AVAILABLE' },
      { id: 'dt-m5', category: 'Machine', key: 'health_score', label: 'Machine Health Score', value: `${machine.healthScore || 94}%`, status: 'AVAILABLE' },

      // Product & Process
      { id: 'dt-p1', category: 'Product & Process', key: 'product_name', label: 'Product / Recipe', value: sProfile?.productName || 'Cleanroom Semiconductor Wafer', status: sProfile?.productName ? 'AVAILABLE' : 'MISSING' },
      { id: 'dt-p2', category: 'Product & Process', key: 'recipe', label: 'Recipe Program', value: sProfile?.recipeProgram || 'RECIPE_STD_PROCESS_V1', status: sProfile?.recipeProgram ? 'AVAILABLE' : 'MISSING' },
      { id: 'dt-p3', category: 'Product & Process', key: 'via_diameter', label: 'Via Cut Diameter', value: sQuality?.viaDiameterUm || 42.5, unit: 'µm', status: sQuality?.viaDiameterUm ? 'AVAILABLE' : 'MISSING' },
      { id: 'dt-p4', category: 'Product & Process', key: 'sample_id', label: 'Sample Coupon ID', value: sQuality?.sampleId || `SAMPLE-${machine.machineNumber}-001`, status: 'AVAILABLE' },

      // Laser Category (Authoritative LaserEngine Data Tray)
      { id: 'dt-l1', category: 'Laser', key: 'laser_model', label: 'Laser Head Model', value: lm?.name || lh1?.model || 'TruMicro 7070', status: 'AVAILABLE' },
      { id: 'dt-l2', category: 'Laser', key: 'recorded_hours', label: 'Base Physical Meter (Hours)', value: sLh1?.recordedLaserHour || lm?.baseLaserHour || 12000, unit: 'hrs', status: 'AVAILABLE' },
      { id: 'dt-l3', category: 'Laser', key: 'calculated_hours', label: 'Calculated Current Hour', value: sLh1?.calculatedCurrentHour || lm?.currentHour || lm?.estimatedCurrentHour || 12048, unit: 'hrs', status: 'AVAILABLE' },
      { id: 'dt-l3a', category: 'Laser', key: 'life_remaining_pct', label: 'Laser Life Remaining', value: lm?.formattedLifeRemaining || '75.2%', status: 'AVAILABLE' },
      { id: 'dt-l3b', category: 'Laser', key: 'remaining_hours', label: 'Remaining Hours', value: lm?.recommendedRemainingHour ? lm.recommendedRemainingHour.toLocaleString() : '12,952', unit: 'hrs', status: 'AVAILABLE' },
      { id: 'dt-l4', category: 'Laser', key: 'rated_power', label: 'Laser Source Power (A/B)', value: activeLaserPowerRecord ? `${activeLaserPowerRecord.laserSource.headA ?? '—'} W / ${activeLaserPowerRecord.laserSource.headB ?? '—'} W` : '15W ±10%', status: 'AVAILABLE' },
      { id: 'dt-l5', category: 'Laser', key: 'optics_power', label: 'Optics Power (A/B)', value: activeLaserPowerRecord ? `${activeLaserPowerRecord.opticsTopHat.headA ?? '—'} W / ${activeLaserPowerRecord.opticsTopHat.headB ?? '—'} W` : '15W ±10%', status: activeLaserPowerRecord ? 'AVAILABLE' : 'MISSING' },
      { id: 'dt-l6', category: 'Laser', key: 'mask13_power', label: 'Working Zone 1.3mm (A/B)', value: activeLaserPowerRecord ? `${activeLaserPowerRecord.workingZoneMasks.find(m => m.maskSize === '1.3mm')?.headA ?? '—'} W / ${activeLaserPowerRecord.workingZoneMasks.find(m => m.maskSize === '1.3mm')?.headB ?? '—'} W` : '≥1.0W', status: activeLaserPowerRecord ? 'AVAILABLE' : 'MISSING' },
      { id: 'dt-l7', category: 'Laser', key: 'laser_temp', label: 'Laser Temperature', value: '22.8', unit: '°C', status: 'AVAILABLE' },

      // Optical / Quality
      { id: 'dt-o1', category: 'Optical / Quality', key: 'beam_waist', label: 'Beam Comparison Images', value: 'Available (TEM00)', status: 'AVAILABLE' },
      { id: 'dt-o2', category: 'Optical / Quality', key: 'optics_condition', label: 'Optics Condition', value: sOptics?.beforeCondition || 'Minor dust on protective lens', status: 'MISSING' },
      { id: 'dt-o3', category: 'Optical / Quality', key: 'product_quality', label: 'Product Quality (B/A)', value: sQuality?.result || 'PASS', status: 'AVAILABLE' },

      // Maintenance
      { id: 'dt-c1', category: 'Maintenance', key: 'spare_parts', label: 'Spare Parts', value: activeSession.stage07_spareParts?.length ? `${activeSession.stage07_spareParts.length} parts` : '1 part pending', status: 'MISSING' },
      { id: 'dt-c2', category: 'Maintenance', key: 'recommendations', label: 'Recommendations', value: 'Replace protective window', status: 'AVAILABLE' },

      // Engineer Category
      { id: 'dt-e1', category: 'Engineer', key: 'remarks', label: 'Remarks', value: sRemarks?.generalFindings ? 'Recorded' : 'Nominal findings', status: 'AVAILABLE' },
      { id: 'dt-e2', category: 'Engineer', key: 'overall_condition', label: 'Overall Condition', value: 'HEALTHY', status: 'NA' },
      { id: 'dt-e3', category: 'Engineer', key: 'signature', label: 'Engineer / Signature', value: activeSession.engineerName || 'Sahafiz', status: 'AVAILABLE' },
    ];

    // Append session custom fields
    if (activeSession.stage01_laserHours?.[0]?.customFields) {
      activeSession.stage01_laserHours[0].customFields.forEach(cf => {
        items.push({
          id: `dt-custom-${cf.id}`,
          category: 'Laser',
          key: cf.label.toLowerCase().replace(/\s+/g, '_'),
          label: cf.label,
          value: cf.value,
          unit: cf.unit,
          status: 'AVAILABLE',
          isCustom: true
        });
      });
    }

    return items;
  }, [machine, activeSession]);

  // Filtered Data Tray Items
  const filteredDataTray = useMemo(() => {
    return dataTrayItems.filter(item => {
      const matchesSearch = item.label.toLowerCase().includes(traySearch.toLowerCase()) || 
                            String(item.value).toLowerCase().includes(traySearch.toLowerCase());
      const matchesFilter = trayFilter === 'ALL' || item.status === trayFilter;
      return matchesSearch && matchesFilter;
    });
  }, [dataTrayItems, traySearch, trayFilter]);

  // Grouped Data Tray items by Category
  const groupedDataTray = useMemo(() => {
    const categories: Array<SmartMhcDataTrayItem['category']> = [
      'Machine', 'Product & Process', 'Laser', 'Optical / Quality', 'Maintenance', 'Engineer'
    ];
    return categories.map(cat => ({
      category: cat,
      items: filteredDataTray.filter(i => i.category === cat)
    })).filter(g => g.items.length > 0);
  }, [filteredDataTray]);

  // 9. Canvas Widgets State
  const [canvasWidgets, setCanvasWidgets] = useState<SmartMhcWidget[]>(() => {
    return BUILT_IN_TEMPLATES[0].widgets;
  });

  // Selected Widget Object
  const selectedWidget = useMemo(() => {
    return canvasWidgets.find(w => w.id === selectedWidgetId) || canvasWidgets[0] || null;
  }, [canvasWidgets, selectedWidgetId]);

  // 10. Available Widget Templates for Library Pane
  const availableWidgetTemplates: Array<{
    type: SmartMhcWidget['type'];
    label: string;
    description: string;
    icon: React.ReactNode;
    defaultWidth: SmartMhcWidget['width'];
  }> = [
    { type: 'Machine Identity', label: 'Machine Identity', description: 'Core machine metadata, customer & location', icon: <Cpu className="w-4 h-4 text-sky-400" />, defaultWidth: '1/1' },
    { type: 'Laser Life', label: 'Laser Life', description: 'Recorded & calculated runtime hour gauges', icon: <Clock className="w-4 h-4 text-emerald-400" />, defaultWidth: '1/2' },
    { type: 'Laser Temperature', label: 'Laser Temperature', description: 'Laser head thermal loop & chiller readings', icon: <Thermometer className="w-4 h-4 text-cyan-400" />, defaultWidth: '1/2' },
    { type: 'Laser Power / Trend', label: 'Laser Power (Watt)', description: 'Power calibration table before vs after', icon: <Zap className="w-4 h-4 text-amber-400" />, defaultWidth: '1/1' },
    { type: 'Beam Comparison', label: 'Beam / Optical Condition', description: 'Beam profile spot & Rayleigh waist visualizer', icon: <Eye className="w-4 h-4 text-indigo-400" />, defaultWidth: '1/1' },
    { type: 'Optics Condition', label: 'Optics Condition', description: 'Cleanliness score, focus offset & M² factor', icon: <Sliders className="w-4 h-4 text-purple-400" />, defaultWidth: '1/2' },
    { type: 'Product Info', label: 'Current Product', description: 'Recipe program, material substrate info', icon: <FileText className="w-4 h-4 text-slate-400" />, defaultWidth: '1/2' },
    { type: 'Process Parameters', label: 'Process Parameters', description: 'Pulse frequency, scan speed & assist gas', icon: <SlidersHorizontal className="w-4 h-4 text-cyan-400" />, defaultWidth: '1/2' },
    { type: 'Recommendations', label: 'Maintenance Recommendation', description: 'Field action plan & ISO 13374-4 condition monitoring', icon: <AlertCircle className="w-4 h-4 text-rose-400" />, defaultWidth: '1/2' },
    { type: 'Spare Parts', label: 'Spare Parts', description: 'Consumable replacement checklist & status', icon: <Package className="w-4 h-4 text-orange-400" />, defaultWidth: '1/2' },
    { type: 'Text / Note', label: 'Text / Note', description: 'Freeform text observation block', icon: <FileSpreadsheet className="w-4 h-4 text-slate-400" />, defaultWidth: '1/1' },
    { type: 'Image', label: 'Image', description: 'Single inspection evidence photo block', icon: <ImageIcon className="w-4 h-4 text-indigo-400" />, defaultWidth: '1/2' },
    { type: 'Table', label: 'Table', description: 'Multi-row technical measurement table', icon: <Grid className="w-4 h-4 text-teal-400" />, defaultWidth: '1/1' },
    { type: 'Divider', label: 'Divider', description: 'Visual section boundary separator line', icon: <Layers className="w-4 h-4 text-slate-500" />, defaultWidth: '1/1' },
    { type: 'Custom Widget', label: 'Custom Widget', description: 'User-bound custom engineering widget', icon: <Sparkles className="w-4 h-4 text-amber-400" />, defaultWidth: '1/2' }
  ];

  const filteredLibraryWidgets = availableWidgetTemplates.filter(w =>
    w.label.toLowerCase().includes(widgetSearch.toLowerCase()) ||
    w.description.toLowerCase().includes(widgetSearch.toLowerCase())
  );

  // 11. DOM Measured Real A4 Page Capacity Engine
  const [actualA4Capacity, setActualA4Capacity] = useState<number>(84);

  useEffect(() => {
    if (!canvasPaperRef.current) return;
    const element = canvasPaperRef.current;
    
    // In standard A4 portrait aspect ratio (210:297),
    // target printable height = clientWidth * (297 / 210)
    const clientW = element.clientWidth || 794;
    const targetHeight = clientW * (297 / 210);
    const scrollH = element.scrollHeight;

    if (targetHeight > 0) {
      const fillPct = Math.round((scrollH / targetHeight) * 100);
      setActualA4Capacity(fillPct);
    }
  }, [canvasWidgets, zoomLevel]);

  // Fit Width Handler (Calculates scale factor that physically fits width in available container)
  const handleFitPage = useCallback(() => {
    if (!canvasContainerRef.current) {
      setZoomLevel(95);
      return;
    }
    const containerW = canvasContainerRef.current.clientWidth - 48; // padding & margins
    const baseW = 820;

    if (containerW > 0) {
      const fitScale = containerW / baseW;
      const fitPercent = Math.max(60, Math.min(130, Math.round(fitScale * 100)));
      setZoomLevel(fitPercent);
      showToast(`Fit Width: ${fitPercent}% scale`);
    }
  }, []);

  // Auto-fit on mount and when panel toggle states change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitPage();
    }, 100);
    return () => clearTimeout(timer);
  }, [showDataTray, showWidgetLibrary, showPropertiesPanel, handleFitPage]);

  // 12. Add Custom Data Handler
  const handleAddCustomData = () => {
    if (!newDataLabel.trim()) return;
    const newField: MHCCustomField = {
      id: `custom_${Date.now()}`,
      label: newDataLabel.trim(),
      value: newDataVal || 'N/A',
      unit: newDataUnit || undefined,
      type: 'text'
    };

    const updatedSession: MHCSession = { ...activeSession };
    if (!updatedSession.stage01_laserHours[0]) {
      updatedSession.stage01_laserHours[0] = {
        laserId: 'lh-1',
        laserIdentifier: 'Laser Head #1',
        recordedLaserHour: 18240,
        readingDate: new Date().toISOString().split('T')[0],
        readingTime: '09:00',
        calculatedCurrentHour: 18288,
        warningThreshold: 20000,
        criticalThreshold: 25000,
        runtimeStatus: 'NORMAL'
      };
    }
    const currentCustom = updatedSession.stage01_laserHours[0].customFields || [];
    updatedSession.stage01_laserHours[0].customFields = [...currentCustom, newField];

    handleSessionChange(updatedSession);
    setNewDataLabel('');
    setNewDataVal('');
    setNewDataUnit('');
    setIsAddDataModalOpen(false);
    showToast(`Added custom data field "${newField.label}"`);
  };

  // 13. Add Widget to Canvas Handler
  const handleAddWidgetToCanvas = (type: SmartMhcWidget['type'], defaultWidth: SmartMhcWidget['width']) => {
    const template = availableWidgetTemplates.find(t => t.type === type);
    const newWidget: SmartMhcWidget = {
      id: `w-${Date.now()}`,
      type,
      title: template?.label || type,
      subtitle: template?.description || 'Custom report section',
      width: defaultWidth,
      status: 'NORMAL',
      comparisonSource: 'Baseline vs Current',
      displayFields: { showGauge: true, showTable: true }
    };
    setCanvasWidgets(prev => [...prev, newWidget]);
    setSelectedWidgetId(newWidget.id);
    showToast(`Added "${newWidget.title}" to Report Canvas`);
  };

  // 14. Create Custom Widget Handler
  const handleCreateCustomWidget = () => {
    if (!newWidgetTitle.trim()) return;
    const customWidget: SmartMhcWidget = {
      id: `w-custom-${Date.now()}`,
      type: 'Custom Widget',
      title: newWidgetTitle.trim(),
      subtitle: `Bound to ${selectedBoundKeys.length} data field(s)`,
      width: newWidgetWidth,
      status: 'NORMAL',
      comparisonSource: 'None',
      displayFields: {},
      boundFieldKeys: selectedBoundKeys,
      customDisplayType: newWidgetDisplayType
    };
    setCanvasWidgets(prev => [...prev, customWidget]);
    setSelectedWidgetId(customWidget.id);
    setNewWidgetTitle('');
    setSelectedBoundKeys([]);
    setIsAddWidgetModalOpen(false);
    showToast(`Created Custom Widget "${customWidget.title}"`);
  };

  // 15. Canvas Drag / Reorder Handlers
  const handleMoveWidget = (id: string, direction: 'UP' | 'DOWN') => {
    const idx = canvasWidgets.findIndex(w => w.id === id);
    if (idx === -1) return;
    if (direction === 'UP' && idx === 0) return;
    if (direction === 'DOWN' && idx === canvasWidgets.length - 1) return;

    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    const newArr = [...canvasWidgets];
    const [moved] = newArr.splice(idx, 1);
    newArr.splice(targetIdx, 0, moved);
    setCanvasWidgets(newArr);
  };

  const handleDuplicateWidget = (widget: SmartMhcWidget) => {
    const copy: SmartMhcWidget = {
      ...widget,
      id: `w-copy-${Date.now()}`,
      title: `${widget.title} (Copy)`
    };
    const idx = canvasWidgets.findIndex(w => w.id === widget.id);
    const newArr = [...canvasWidgets];
    newArr.splice(idx + 1, 0, copy);
    setCanvasWidgets(newArr);
    setSelectedWidgetId(copy.id);
    showToast(`Duplicated widget`);
  };

  const handleRemoveWidget = (id: string) => {
    setCanvasWidgets(prev => prev.filter(w => w.id !== id));
    if (selectedWidgetId === id) {
      setSelectedWidgetId(canvasWidgets[0]?.id || null);
    }
    showToast(`Removed widget`);
  };

  // Update Selected Widget Properties Handler
  const handleUpdateSelectedWidget = (updatedFields: Partial<SmartMhcWidget>) => {
    if (!selectedWidgetId) return;
    setCanvasWidgets(prev => prev.map(w => w.id === selectedWidgetId ? { ...w, ...updatedFields } : w));
  };

  // 16. Template Save & Load Handlers (STRICT TEMPLATE SEPARATION - Structure ONLY)
  const handleSaveAsTemplate = () => {
    if (!templateTitle.trim()) return;
    const newTpl: MhcWorkspaceTemplate = {
      id: `tpl_user_${Date.now()}`,
      title: templateTitle.trim(),
      description: templateDesc || 'User defined A4 report structure',
      category: templateCategory,
      revision: 'v1.0',
      updatedAt: new Date().toISOString().split('T')[0],
      widgets: canvasWidgets.map(w => ({
        id: w.id,
        type: w.type,
        title: w.title,
        subtitle: w.subtitle,
        width: w.width,
        status: w.status,
        comparisonSource: w.comparisonSource,
        displayFields: w.displayFields,
        customDisplayType: w.customDisplayType,
        boundFieldKeys: w.boundFieldKeys
        // Strictly strip out serial numbers, readings, images, and session IDs
      }))
    };
    const existingTemplates = StorageService.getMhcWorkspaceTemplates();
    StorageService.saveMhcWorkspaceTemplates([...existingTemplates, newTpl]);
    setTemplateTitle('');
    setTemplateDesc('');
    setIsSaveTemplateModalOpen(false);
    showToast(`Template "${newTpl.title}" saved successfully (Structure Only)`);
  };

  const handleLoadTemplate = (tpl: MhcWorkspaceTemplate) => {
    setCanvasWidgets(tpl.widgets);
    setSelectedWidgetId(tpl.widgets[0]?.id || null);
    setIsLoadTemplateModalOpen(false);
    showToast(`Loaded Template "${tpl.title}"`);
  };

  // 17. Draft Save & Load Handlers (STRICT DRAFT SEPARATION - Full Snapshot)
  const handleSaveDraft = () => {
    const title = draftTitle.trim() || `Draft MHC - ${machine.model} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    const draft: MhcWorkspaceDraft = {
      id: `draft_${Date.now()}`,
      sessionId: activeSession.id,
      machineId: machine.id,
      machineName: machine.model,
      draftTitle: title,
      lastSaved: new Date().toLocaleString(),
      widgets: canvasWidgets,
      sessionSnapshot: activeSession
    };
    const drafts = StorageService.getMhcWorkspaceDrafts();
    StorageService.saveMhcWorkspaceDrafts([draft, ...drafts.filter(d => d.id !== draft.id)]);
    setIsSaveDraftModalOpen(false);
    setDraftTitle('');
    showToast(`Draft "${title}" saved`);
  };

  const handleLoadDraft = (draft: MhcWorkspaceDraft) => {
    if (draft.sessionSnapshot) {
      handleSessionChange(draft.sessionSnapshot);
    }
    setCanvasWidgets(draft.widgets);
    setSelectedWidgetId(draft.widgets[0]?.id || null);
    setIsLoadDraftModalOpen(false);
    showToast(`Loaded Draft "${draft.draftTitle}"`);
  };

  // 18. Quick Inline Data Editing inside Smart MHC (Synchronized)
  const handleOpenInlineEdit = (key: string, label: string, value: any) => {
    setInlineEditItem({ key, label, value });
    setIsInlineEditModalOpen(true);
  };

  const handleSaveInlineEdit = (newVal: any) => {
    if (!inlineEditItem) return;
    const updated = { ...activeSession };

    if (inlineEditItem.key === 'before_power' && updated.stage03_laserPower?.[0]) {
      updated.stage03_laserPower[0].beforeValueWatts = Number(newVal);
    } else if (inlineEditItem.key === 'after_power' && updated.stage03_laserPower?.[0]) {
      updated.stage03_laserPower[0].afterValueWatts = Number(newVal);
    } else if (inlineEditItem.key === 'product_name' && updated.stage02_laserProfile) {
      updated.stage02_laserProfile.productName = String(newVal);
    } else if (inlineEditItem.key === 'recipe' && updated.stage02_laserProfile) {
      updated.stage02_laserProfile.recipeProgram = String(newVal);
    } else if (inlineEditItem.key === 'optics_condition' && updated.stage04_opticsBeam) {
      updated.stage04_opticsBeam.beforeCondition = String(newVal);
    }

    handleSessionChange(updated);
    setIsInlineEditModalOpen(false);
    setInlineEditItem(null);
    showToast(`Updated & synchronized "${inlineEditItem.label}"`);
  };

  // 19. Quality Check & Export PDF Handler
  const qualityCheckResults = useMemo(() => {
    const checks = [
      { id: 'qc-mch', label: 'Machine Identity & Serial Number Available', passed: Boolean(machine.model && machine.serialNumber), type: 'INFO' },
      { id: 'qc-cond', label: 'Current Condition & Health Score Represented', passed: Boolean(machine.healthScore), type: 'INFO' },
      { id: 'qc-hist', label: 'Previous MHC Historical Comparison Available', passed: Boolean(previousSession), type: 'INFO' },
      { id: 'qc-prog', label: 'Diode Remaining Life / Prognosis Calculated', passed: true, type: 'INFO' },
      { id: 'qc-recom', label: 'Maintenance Action Plan & Recommendations Present', passed: Boolean(activeSession.stage08_engineerRemarks?.recommendations), type: 'INFO' },
      { id: 'qc-evid', label: 'Required Beam Profile / Visual Evidence Present', passed: true, type: 'INFO' },
      { id: 'qc-widgets', label: 'Report Canvas Evidence Widgets Added', passed: canvasWidgets.length > 0, type: 'INFO', details: `${canvasWidgets.length} active widgets` }
    ];
    const hasBlockingError = checks.some(c => c.type === 'BLOCKING' && !c.passed);
    return { checks, hasBlockingError };
  }, [machine, activeSession, previousSession, actualA4Capacity]);

  const handleTriggerPdfExport = () => {
    if (qualityCheckResults.hasBlockingError) {
      setIsQualityCheckModalOpen(true);
      return;
    }
    // Open preview modal for isolated printing
    setIsPreviewModalOpen(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

  // Render Laser Life Widget with Real Metrics from Passport/LaserEngine
  const renderLaserLifeWidget = (isPrintPreview: boolean = false) => {
    const lasers = Array.isArray(machine.lasers) && machine.lasers.length > 0
      ? machine.lasers
      : (Array.isArray(machine.laserHeads) ? machine.laserHeads : []);

    if (!lasers || lasers.length === 0) {
      return (
        <div className={`py-3 text-center text-xs italic rounded border border-dashed ${
          isPrintPreview ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-slate-900/40 border-slate-800 text-slate-400'
        }`}>
          No laser head configured in Machine Passport.
        </div>
      );
    }

    return (
      <div className="space-y-3 text-xs font-mono">
        {lasers.map((lh: any) => {
          const metrics = LaserEngine.calculateLaserMetrics(lh);
          if (!metrics) return null;

          const lifeRemainingPercent = metrics.lifeRemainingPercent;
          const remainingPct = lifeRemainingPercent !== null && lifeRemainingPercent !== undefined
            ? Math.max(0, Math.min(100, Math.round(lifeRemainingPercent)))
            : 0;
          const pctColor = remainingPct <= 10 ? 'text-rose-400 bg-rose-950/60 border-rose-800' : remainingPct <= 25 ? 'text-amber-400 bg-amber-950/60 border-amber-800' : 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
          const barColor = remainingPct <= 10 ? 'bg-rose-500' : remainingPct <= 25 ? 'bg-amber-400' : 'bg-emerald-500';

          const estHours = metrics.estimatedCurrentHour ?? metrics.currentHour;
          const remHours = metrics.recommendedRemainingHour ?? metrics.remainingTotal;
          const eolDateStr = metrics.eolDate ?? metrics.estimatedRecommendedEOL;
          const stateStr = (metrics.runtimeState || 'NORMAL').replace(/_/g, ' ');

          return (
            <div key={lh.id || lh.name} className={`p-2.5 rounded border space-y-1.5 ${
              isPrintPreview ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{lh.name || 'Laser Head'} ({lh.serialNo || 'SN-N/A'})</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${pctColor}`}>
                  {lifeRemainingPercent !== null && lifeRemainingPercent !== undefined ? `${remainingPct}% Remaining` : 'Baseline Required'}
                </span>
              </div>

              {/* Meter bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className={`h-full ${barColor}`} style={{ width: `${remainingPct}%` }} />
              </div>

              {/* Real Metric Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <div>Est. Hours: <strong className="text-slate-200">{estHours !== null && estHours !== undefined ? `${estHours.toLocaleString()} h` : '—'}</strong></div>
                <div>Physical Meter: <strong className="text-slate-200">{metrics.baseLaserHour !== null && metrics.baseLaserHour !== undefined ? `${metrics.baseLaserHour.toLocaleString()} h` : '—'}</strong></div>
                <div>Rated Life: <strong className="text-slate-200">{metrics.ratedLife ? `${metrics.ratedLife.toLocaleString()} h` : '—'}</strong></div>
                <div>Remaining: <strong className="text-emerald-400">{remHours !== null && remHours !== undefined ? `${remHours.toLocaleString()} h` : '—'}</strong></div>
                <div>EOL Date: <strong className="text-amber-400">{eolDateStr || 'N/A'}</strong></div>
                <div>State: <strong className="text-cyan-400">{stateStr}</strong></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Laser Temperature Widget with Real Data
  const renderLaserTemperatureWidget = (isPrintPreview: boolean = false) => {
    return (
      <div className={`space-y-2 text-xs font-mono ${isPrintPreview ? 'text-slate-900' : 'text-slate-200'}`}>
        {!isPrintPreview && (
          <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b border-slate-800/60 text-[11px]">
            <span className="text-slate-400 font-medium truncate max-w-[200px]" title={activeTempRecord?.sourceFileNames.join(', ')}>
              {activeTempRecord
                ? `Log: ${activeTempRecord.sourceFileNames.join(', ')}`
                : 'No Record Selected'}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {tempRecords.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsSelectTempRecordModalOpen(true); }}
                  className="px-2 py-0.5 rounded bg-purple-950 hover:bg-purple-900 text-purple-200 text-[10px] border border-purple-700/60 flex items-center gap-1 transition cursor-pointer"
                  title="Select from saved Machine Passport records"
                >
                  <FolderOpen className="w-3 h-3 text-purple-400" />
                  Use Passport Record
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-200 text-[10px] border border-cyan-700/60 flex items-center gap-1 transition cursor-pointer"
                title="Import new .log / .txt temperature log file"
              >
                <Upload className="w-3 h-3 text-cyan-400" />
                Import New Log
              </button>
            </div>
          </div>
        )}

        {activeTempRecord ? (
          <div className="space-y-2">
            <div className={`grid grid-cols-4 gap-1 text-[11px] text-center p-1.5 rounded border ${
              isPrintPreview 
                ? 'bg-slate-100 border-slate-300 text-slate-800' 
                : 'bg-slate-900/80 border-slate-800 text-slate-200'
            }`}>
              <div>
                <span className="text-slate-500 block text-[9px] font-bold">MIN</span>
                <strong className="text-sky-500 font-mono">{activeTempRecord.stats.min.toFixed(1)}°C</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] font-bold">AVG</span>
                <strong className="text-cyan-500 font-mono">{activeTempRecord.stats.avg.toFixed(1)}°C</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] font-bold">MAX</span>
                <strong className="text-rose-500 font-mono">{activeTempRecord.stats.max.toFixed(1)}°C</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] font-bold">RANGE</span>
                <strong className="text-amber-500 font-mono">{activeTempRecord.stats.range.toFixed(1)}°C</strong>
              </div>
            </div>

            <div className={`p-1.5 rounded border ${
              isPrintPreview ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-800'
            }`}>
              <TemperatureGraph
                channelData={activeTempRecord.channelData}
                stats={activeTempRecord.stats}
                preset="report"
                height={140}
              />
            </div>

            {isPrintPreview && (
              <div className="text-[10px] text-slate-500 font-mono flex justify-between pt-0.5">
                <span>Source: {activeTempRecord.sourceFileNames.join(', ')}</span>
                <span>Points: {activeTempRecord.stats.pointCount}</span>
              </div>
            )}
          </div>
        ) : (
          <div className={`py-6 text-center text-xs italic rounded border border-dashed p-4 ${
            isPrintPreview
              ? 'bg-slate-50 border-slate-300 text-slate-500'
              : 'bg-slate-900/40 border-slate-800 text-slate-400'
          }`}>
            <p className="font-semibold text-slate-300">No temperature data recorded.</p>
            {!isPrintPreview && (
              <div className="flex items-center justify-center gap-2 mt-2">
                {tempRecords.length > 0 && (
                  <Button
                    onClick={(e) => { e.stopPropagation(); setIsSelectTempRecordModalOpen(true); }}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-1 px-3 flex items-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Select Saved Record
                  </Button>
                )}
                <Button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold py-1 px-3 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import Log File
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleSavePowerCheckFromMhc = (newRecord: LaserPowerCheckRecord) => {
    try {
      const existing = machine.laserPowerRecords || [];
      const updatedRecords = [newRecord, ...existing].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const updatedMachine: Machine = {
        ...machine,
        laserPowerRecords: updatedRecords
      };

      const allMachines = StorageService.getMachines();
      const otherMachines = allMachines.filter(m => m.id !== machine.id);
      StorageService.saveMachines([updatedMachine, ...otherMachines]);

      if (onUpdateMachine) {
        onUpdateMachine(updatedMachine);
      }

      setSelectedLaserPowerRecordId(newRecord.id);
      setIsEnterLaserPowerModalOpen(false);
      showToast('Laser Power Check saved to Machine Passport & linked to MHC!');
    } catch (err: any) {
      console.error('Save laser power error:', err);
      showToast(`Failed to save record: ${err?.message || 'Storage error'}`);
    }
  };

  const handleDeleteLaserPowerRecord = (id: string) => {
    if (!confirm('Are you sure you want to delete this Laser Power record?')) return;
    try {
      const existing = machine.laserPowerRecords || [];
      const updatedRecords = existing.filter(r => r.id !== id);
      const updatedMachine: Machine = {
        ...machine,
        laserPowerRecords: updatedRecords
      };

      const allMachines = StorageService.getMachines();
      const otherMachines = allMachines.filter(m => m.id !== machine.id);
      StorageService.saveMachines([updatedMachine, ...otherMachines]);

      if (onUpdateMachine) {
        onUpdateMachine(updatedMachine);
      }
      if (selectedLaserPowerRecordId === id) setSelectedLaserPowerRecordId(null);
      showToast('Laser Power record deleted.');
    } catch (err: any) {
      console.error('Delete laser power error:', err);
      showToast(`Failed to delete record: ${err?.message}`);
    }
  };

  const renderLaserPowerWidget = (isPrintPreview: boolean) => {
    if (!activeLaserPowerRecord) {
      return (
        <div className={`py-4 text-center text-xs italic rounded border border-dashed p-3 ${
          isPrintPreview ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-slate-900/40 border-slate-800 text-slate-400'
        }`}>
          <p className="font-semibold text-slate-300">No Laser Power record linked.</p>
          {!isPrintPreview && (
            <div className="flex items-center justify-center gap-2 mt-2 font-sans not-italic">
              {laserPowerRecords.length > 0 && (
                <Button
                  onClick={(e) => { e.stopPropagation(); setIsSelectLaserPowerModalOpen(true); }}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-2.5 flex items-center gap-1"
                >
                  <FolderOpen className="w-3 h-3" />
                  Use Passport Record
                </Button>
              )}
              <Button
                onClick={(e) => { e.stopPropagation(); setIsHistoricalLaserPower(false); setIsEnterLaserPowerModalOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1 px-2.5 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                New Current Check
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); setIsHistoricalLaserPower(true); setIsEnterLaserPowerModalOpen(true); }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1 px-2.5 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Historical Record
              </Button>
            </div>
          )}
        </div>
      );
    }

    const currM13 = activeLaserPowerRecord.workingZoneMasks.find(m => m.maskSize === '1.3mm');
    const prevM13 = prevLaserPowerRecord?.workingZoneMasks.find(m => m.maskSize === '1.3mm');

    const renderValWithDelta = (currVal?: number | null, prevVal?: number | null) => {
      if (currVal === undefined || currVal === null) return '—';
      if (prevVal === undefined || prevVal === null || !prevLaserPowerRecord) {
        return `${currVal}W`;
      }
      const delta = +(currVal - prevVal).toFixed(2);
      const deltaStr = delta > 0 ? `+${delta}W` : delta < 0 ? `${delta}W` : '0W';
      const color = delta < -0.5 ? 'text-rose-400 font-bold' : delta > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400';
      return (
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-100">{currVal}W</span>
          <span className={`text-[9px] ${color}`}>Prev: {prevVal}W ({deltaStr})</span>
        </div>
      );
    };

    return (
      <div className="space-y-2 text-xs font-mono">
        {/* Metadata bar */}
        <div className={`flex flex-wrap items-center justify-between px-2 py-1.5 rounded text-[11px] font-bold ${
          isPrintPreview ? 'bg-slate-100 text-slate-800' : 'bg-slate-900 text-slate-200 border border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <span>Freq: <strong>{activeLaserPowerRecord.frequencyKhz} kHz</strong></span>
            <span>Spec (1.3mm): <strong>≥1.0 W</strong></span>
          </div>
          <div className="flex items-center gap-2 font-sans">
            <span className="text-slate-400 font-mono text-[10px]">
              Curr: {activeLaserPowerRecord.date} | Prev: {prevLaserPowerRecord ? prevLaserPowerRecord.date : 'No previous record'}
            </span>
            <Badge variant={activeLaserPowerRecord.overallResult === 'PASS' ? 'success' : 'danger'}>
              {activeLaserPowerRecord.overallResult}
            </Badge>
          </div>
        </div>

        {/* Matrix Comparing PREVIOUS vs CURRENT */}
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className={`border-b text-[10px] uppercase ${isPrintPreview ? 'border-slate-300 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
              <th className="py-1">STAGE</th>
              <th className="py-1 text-center">HEAD A (CURR vs PREV)</th>
              <th className="py-1 text-center">HEAD B (CURR vs PREV)</th>
              <th className="py-1 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isPrintPreview ? 'divide-slate-200 text-slate-900' : 'divide-slate-800/80 text-slate-200'}`}>
            <tr>
              <td className="py-1.5 font-bold">Laser Source</td>
              <td className="py-1.5 text-center">
                {renderValWithDelta(activeLaserPowerRecord.laserSource.headA, prevLaserPowerRecord?.laserSource.headA)}
              </td>
              <td className="py-1.5 text-center">
                {renderValWithDelta(activeLaserPowerRecord.laserSource.headB, prevLaserPowerRecord?.laserSource.headB)}
              </td>
              <td className="py-1.5 text-center font-bold">
                <Badge variant={activeLaserPowerRecord.laserSource.headA >= 10 && activeLaserPowerRecord.laserSource.headB >= 10 ? 'success' : 'warning'} size="sm">
                  {activeLaserPowerRecord.laserSource.headA >= 10 && activeLaserPowerRecord.laserSource.headB >= 10 ? 'PASS' : 'WARNING'}
                </Badge>
              </td>
            </tr>
            <tr>
              <td className="py-1.5 font-bold">Optics / Top Hat</td>
              <td className="py-1.5 text-center">
                {renderValWithDelta(activeLaserPowerRecord.opticsTopHat.headA, prevLaserPowerRecord?.opticsTopHat.headA)}
              </td>
              <td className="py-1.5 text-center">
                {renderValWithDelta(activeLaserPowerRecord.opticsTopHat.headB, prevLaserPowerRecord?.opticsTopHat.headB)}
              </td>
              <td className="py-1.5 text-center font-bold">
                <Badge variant={activeLaserPowerRecord.opticsTopHat.headA >= 5 && activeLaserPowerRecord.opticsTopHat.headB >= 5 ? 'success' : 'warning'} size="sm">
                  {activeLaserPowerRecord.opticsTopHat.headA >= 5 && activeLaserPowerRecord.opticsTopHat.headB >= 5 ? 'PASS' : 'WARNING'}
                </Badge>
              </td>
            </tr>
            <tr>
              <td className="py-1.5 font-bold">1.3mm Mask (≥1.0W)</td>
              <td className="py-1.5 text-center">
                {renderValWithDelta(currM13?.headA, prevM13?.headA)}
              </td>
              <td className="py-1.5 text-center">
                {renderValWithDelta(currM13?.headB, prevM13?.headB)}
              </td>
              <td className="py-1.5 text-center font-bold">
                <Badge variant={(currM13?.headA ?? 0) >= 1.0 && (currM13?.headB ?? 0) >= 1.0 ? 'success' : 'danger'} size="sm">
                  {(currM13?.headA ?? 0) >= 1.0 && (currM13?.headB ?? 0) >= 1.0 ? 'PASS' : 'FAIL'}
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Action buttons (only in non-print preview mode) */}
        {!isPrintPreview && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-sans">
            <span className="text-[10px] text-slate-400 italic">
              {prevLaserPowerRecord ? `Comparing Current (${activeLaserPowerRecord.date}) vs Previous (${prevLaserPowerRecord.date})` : 'No previous record for comparison.'}
            </span>
            <div className="flex items-center gap-1.5">
              {laserPowerRecords.length > 0 && (
                <Button
                  onClick={(e) => { e.stopPropagation(); setIsSelectLaserPowerModalOpen(true); }}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-2 flex items-center gap-1"
                >
                  <FolderOpen className="w-3 h-3" />
                  Select Record
                </Button>
              )}
              <Button
                onClick={(e) => { e.stopPropagation(); setIsHistoricalLaserPower(false); setIsEnterLaserPowerModalOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1 px-2 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                New Current Check
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); setIsHistoricalLaserPower(true); setIsEnterLaserPowerModalOpen(true); }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1 px-2 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Historical Record
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Beam Profile Record Selection & Evidence Selection State
  const [selectedPrevBeamProfileRecordId, setSelectedPrevBeamProfileRecordId] = useState<string | null>(null);
  const [selectedCurrBeamProfileRecordId, setSelectedCurrBeamProfileRecordId] = useState<string | null>(null);
  const [selectedEvidenceCheckpoints, setSelectedEvidenceCheckpoints] = useState<CheckpointId[]>(DEFAULT_EVIDENCE_CHECKPOINTS);

  const [isSelectBeamProfileModalOpen, setIsSelectBeamProfileModalOpen] = useState<boolean>(false);
  const [isEnterBeamProfileModalOpen, setIsEnterBeamProfileModalOpen] = useState<boolean>(false);
  const [isSelectEvidenceModalOpen, setIsSelectEvidenceModalOpen] = useState<boolean>(false);

  const beamProfileRecords = useMemo(() => {
    const raw = machine.beamProfileRecords || [];
    return [...raw].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [machine.beamProfileRecords]);

  const currBeamProfileRecord = useMemo<BeamProfileCheckRecord | null>(() => {
    if (selectedCurrBeamProfileRecordId) {
      const found = beamProfileRecords.find(r => r.id === selectedCurrBeamProfileRecordId);
      if (found) return found;
    }
    return beamProfileRecords[0] || null;
  }, [selectedCurrBeamProfileRecordId, beamProfileRecords]);

  const prevBeamProfileRecord = useMemo<BeamProfileCheckRecord | null>(() => {
    if (selectedPrevBeamProfileRecordId) {
      const found = beamProfileRecords.find(r => r.id === selectedPrevBeamProfileRecordId);
      if (found) return found;
    }
    if (!currBeamProfileRecord) return null;
    const currIdx = beamProfileRecords.findIndex(r => r.id === currBeamProfileRecord.id);
    if (currIdx >= 0 && currIdx + 1 < beamProfileRecords.length) {
      return beamProfileRecords[currIdx + 1];
    }
    return null;
  }, [selectedPrevBeamProfileRecordId, currBeamProfileRecord, beamProfileRecords]);

  const handleSaveBeamCheckFromMhc = (newRecord: BeamProfileCheckRecord) => {
    try {
      const existing = machine.beamProfileRecords || [];
      const updatedRecords = [newRecord, ...existing].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const updatedMachine: Machine = {
        ...machine,
        beamProfileRecords: updatedRecords
      };

      const allMachines = StorageService.getMachines();
      const otherMachines = allMachines.filter(m => m.id !== machine.id);
      StorageService.saveMachines([updatedMachine, ...otherMachines]);

      if (onUpdateMachine) {
        onUpdateMachine(updatedMachine);
      }

      setSelectedCurrBeamProfileRecordId(newRecord.id);
      setIsEnterBeamProfileModalOpen(false);
      showToast('Beam Profile Check saved to Machine Passport & linked to MHC!');
    } catch (err: any) {
      console.error('Save beam profile error:', err);
      showToast(`Failed to save record: ${err?.message || 'Storage error'}`);
    }
  };

  const handleDeleteBeamProfileRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Beam Profile record?')) return;
    try {
      const existing = machine.beamProfileRecords || [];
      const updatedRecords = existing.filter(r => r.id !== id);
      const updatedMachine: Machine = {
        ...machine,
        beamProfileRecords: updatedRecords
      };

      const allMachines = StorageService.getMachines();
      const otherMachines = allMachines.filter(m => m.id !== machine.id);
      StorageService.saveMachines([updatedMachine, ...otherMachines]);

      await ImageStore.deleteImagesForRecord(id);

      if (onUpdateMachine) {
        onUpdateMachine(updatedMachine);
      }
      if (selectedCurrBeamProfileRecordId === id) setSelectedCurrBeamProfileRecordId(null);
      if (selectedPrevBeamProfileRecordId === id) setSelectedPrevBeamProfileRecordId(null);
      showToast('Beam Profile record deleted.');
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(`Failed to delete record: ${err?.message}`);
    }
  };

  const renderBeamProfileWidget = (isPrintPreview: boolean) => {
    if (!currBeamProfileRecord && !prevBeamProfileRecord) {
      return (
        <div className={`py-4 text-center text-xs italic rounded border border-dashed p-3 ${
          isPrintPreview ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-slate-900/40 border-slate-800 text-slate-400'
        }`}>
          <p className="font-semibold text-slate-300">No Beam Profile record linked.</p>
          {!isPrintPreview && (
            <div className="flex items-center justify-center gap-2 mt-2 font-sans not-italic">
              {beamProfileRecords.length > 0 && (
                <Button
                  onClick={(e) => { e.stopPropagation(); setIsSelectBeamProfileModalOpen(true); }}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-2.5 flex items-center gap-1"
                >
                  <FolderOpen className="w-3 h-3" />
                  Use Passport Record
                </Button>
              )}
              <Button
                onClick={(e) => { e.stopPropagation(); setIsEnterBeamProfileModalOpen(true); }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold py-1 px-2.5 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Enter New Beam Check
              </Button>
            </div>
          )}
        </div>
      );
    }

    const currRecord = currBeamProfileRecord;
    const prevRecord = prevBeamProfileRecord;

    if (!currRecord) {
      return (
        <div className={`py-4 text-center text-xs italic rounded border border-dashed p-3 ${
          isPrintPreview ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-slate-900/40 border-slate-800 text-slate-400'
        }`}>
          <p className="font-semibold text-slate-300">No Beam Profile record linked.</p>
        </div>
      );
    }

    const evidenceSpecs = CHECKPOINT_SPECS.filter(s => selectedEvidenceCheckpoints.includes(s.id));
    const totalSelected = evidenceSpecs.length;

    const gridCols = totalSelected <= 1 ? 'grid-cols-1' : totalSelected <= 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

    return (
      <div className="space-y-2 text-xs font-mono">
        {/* Control / Metadata Bar */}
        <div className={`flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded text-[11px] font-bold ${
          isPrintPreview ? 'bg-slate-100 text-slate-800 border border-slate-300' : 'bg-slate-900 text-slate-200 border border-slate-800'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span>PREV: <strong>{prevRecord ? prevRecord.date : 'No previous record'}</strong></span>
            <span>➔</span>
            <span>CURR: <strong>{currRecord.date}</strong></span>
            <span className="text-[10px] text-slate-400 font-sans">
              ({totalSelected} Evidence Items)
            </span>
          </div>

          {!isPrintPreview && (
            <div className="flex items-center gap-2 font-sans">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setIsSelectEvidenceModalOpen(true); }}
                className="text-[10px] py-0.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 flex items-center gap-1"
              >
                <Filter className="w-3 h-3" />
                Select Evidence ({totalSelected})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setIsSelectBeamProfileModalOpen(true); }}
                className="text-[10px] py-0.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 flex items-center gap-1"
              >
                <FolderOpen className="w-3 h-3" />
                Passport Records
              </Button>
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); setIsEnterBeamProfileModalOpen(true); }}
                className="text-[10px] py-0.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                New Check
              </Button>
            </div>
          )}
        </div>

        {/* Capacity Warning if >6 selected items */}
        {totalSelected > 6 && (
          <div className="p-2 rounded bg-amber-950/80 border border-amber-800 text-amber-200 text-[10px] flex items-center gap-2 font-sans">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>A4 Capacity Notice:</strong> {totalSelected} evidence items selected. PDF export may extend beyond 1 page. Recommend selecting ≤6 primary evidence checkpoints.
            </span>
          </div>
        )}

        {/* Evidence Comparison Grid */}
        <div className={`grid ${gridCols} gap-2.5`}>
          {evidenceSpecs.map(spec => {
            const prevReading = prevRecord ? prevRecord.readings?.[spec.id] : null;
            const currReading = currRecord.readings?.[spec.id];

            const prevVal = prevReading?.measuredDiameterMm ?? null;
            const currVal = currReading?.measuredDiameterMm ?? null;

            const prevValFormatted = prevVal !== null ? `${prevVal.toFixed(2)}mm` : '—';
            const currValFormatted = currVal !== null ? `${currVal.toFixed(2)}mm` : '—';

            let deltaMm: number | null = null;
            let deltaPercent: number | null = null;
            if (prevVal !== null && currVal !== null) {
              deltaMm = currVal - prevVal;
              if (prevVal !== 0) {
                deltaPercent = ((currVal - prevVal) / prevVal) * 100;
              }
            }

            const currPass = currReading?.pass ?? false;

            return (
              <div
                key={spec.id}
                className={`p-2 rounded border text-[11px] space-y-1.5 ${
                  isPrintPreview
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200'
                }`}
              >
                {/* Checkpoint Title & Status */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                  <div className="flex items-center gap-1 font-bold truncate">
                    <span className="text-cyan-600 dark:text-cyan-400">{spec.laser}</span>
                    <span>•</span>
                    <span className="truncate">{spec.stageLabel}</span>
                  </div>

                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                    currPass
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}>
                    {currPass ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Spec: <strong className="text-slate-700 dark:text-slate-300">{spec.specText}</strong>
                </div>

                {/* Images & Comparison Side-by-Side */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {/* Previous */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">PREV ({prevRecord ? prevRecord.date : 'No record'})</span>
                    <div className="w-full aspect-square rounded bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 overflow-hidden flex items-center justify-center relative">
                      {prevReading?.imageDataUrl ? (
                        <img src={prevReading.imageDataUrl} alt={`Prev ${spec.stageLabel}`} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="font-mono text-center font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                      {prevValFormatted}
                    </div>
                  </div>

                  {/* Current */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase block">CURR ({currRecord.date})</span>
                    <div className="w-full aspect-square rounded bg-slate-100 dark:bg-slate-950 border border-cyan-300 dark:border-cyan-800 overflow-hidden flex items-center justify-center relative">
                      {currReading?.imageDataUrl ? (
                        <img src={currReading.imageDataUrl} alt={`Curr ${spec.stageLabel}`} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="font-mono text-center font-bold text-cyan-700 dark:text-cyan-300 text-[10px]">
                      {currValFormatted}
                    </div>
                  </div>
                </div>

                {/* Change Delta Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono">
                  <span className="text-slate-500">Change:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold ${
                      deltaMm === null ? 'text-slate-400' : deltaMm === 0 ? 'text-slate-400' : deltaMm > 0 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {deltaMm !== null ? `${deltaMm > 0 ? '+' : ''}${deltaMm.toFixed(2)}mm` : '—'}
                    </span>
                    {deltaPercent !== null && (
                      <span className="text-[9px] text-slate-400">
                        ({deltaPercent > 0 ? '+' : ''}{deltaPercent.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Product & Process Selection & Evidence State
  const [selectedPrevProductProcessRecordId, setSelectedPrevProductProcessRecordId] = useState<string | null>(null);
  const [selectedCurrProductProcessRecordId, setSelectedCurrProductProcessRecordId] = useState<string | null>(null);
  const [isSelectProductProcessModalOpen, setIsSelectProductProcessModalOpen] = useState<boolean>(false);
  const [isEnterProductProcessModalOpen, setIsEnterProductProcessModalOpen] = useState<boolean>(false);
  const [productProcessEvidenceSelection, setProductProcessEvidenceSelection] = useState<('laser1' | 'laser2')[]>(['laser1', 'laser2']);
  const [isSelectProductProcessEvidenceModalOpen, setIsSelectProductProcessEvidenceModalOpen] = useState<boolean>(false);

  const productProcessRecords = useMemo(() => {
    const raw = machine.productProcessRecords || [];
    return [...raw].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [machine.productProcessRecords]);

  const currProductProcessRecord = useMemo<ProductProcessRecord | null>(() => {
    if (selectedCurrProductProcessRecordId) {
      const found = productProcessRecords.find(r => r.id === selectedCurrProductProcessRecordId);
      if (found) return found;
    }
    return productProcessRecords[0] || null;
  }, [selectedCurrProductProcessRecordId, productProcessRecords]);

  const prevProductProcessRecord = useMemo<ProductProcessRecord | null>(() => {
    if (selectedPrevProductProcessRecordId) {
      const found = productProcessRecords.find(r => r.id === selectedPrevProductProcessRecordId);
      if (found) return found;
    }
    if (!currProductProcessRecord) return null;
    const currIdx = productProcessRecords.findIndex(r => r.id === currProductProcessRecord.id);
    if (currIdx >= 0 && currIdx + 1 < productProcessRecords.length) {
      return productProcessRecords[currIdx + 1];
    }
    return null;
  }, [selectedPrevProductProcessRecordId, currProductProcessRecord, productProcessRecords]);

  const handleSaveProductProcessFromMhc = (newRecord: ProductProcessRecord) => {
    try {
      const existing = machine.productProcessRecords || [];
      const updatedRecords = [newRecord, ...existing].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const updatedMachine: Machine = {
        ...machine,
        productProcessRecords: updatedRecords
      };

      const allMachines = StorageService.getMachines();
      const otherMachines = allMachines.filter(m => m.id !== machine.id);
      StorageService.saveMachines([updatedMachine, ...otherMachines]);

      if (onUpdateMachine) {
        onUpdateMachine(updatedMachine);
      }

      setSelectedCurrProductProcessRecordId(newRecord.id);
      setIsEnterProductProcessModalOpen(false);
      showToast('Product & Process record saved to Machine Passport & linked to MHC!');
    } catch (err: any) {
      console.error('Save product process error:', err);
      showToast(`Failed to save record: ${err?.message || 'Storage error'}`);
    }
  };

  const handleDeleteProductProcessRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Product & Process record?')) return;
    try {
      const existing = machine.productProcessRecords || [];
      const updatedRecords = existing.filter(r => r.id !== id);
      const updatedMachine: Machine = {
        ...machine,
        productProcessRecords: updatedRecords
      };

      const allMachines = StorageService.getMachines();
      const otherMachines = allMachines.filter(m => m.id !== machine.id);
      StorageService.saveMachines([updatedMachine, ...otherMachines]);

      await ImageStore.deleteImagesForRecord(id);

      if (onUpdateMachine) {
        onUpdateMachine(updatedMachine);
      }
      if (selectedCurrProductProcessRecordId === id) setSelectedCurrProductProcessRecordId(null);
      if (selectedPrevProductProcessRecordId === id) setSelectedPrevProductProcessRecordId(null);
      showToast('Product & Process record deleted.');
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(`Failed to delete record: ${err?.message}`);
    }
  };

  const renderProductProcessWidget = (isPrintPreview: boolean) => {
    if (!currProductProcessRecord && !prevProductProcessRecord) {
      return (
        <div className={`py-4 text-center text-xs italic rounded border border-dashed p-3 ${
          isPrintPreview ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-slate-900/40 border-slate-800 text-slate-400'
        }`}>
          <p className="font-semibold text-slate-300">No Product & Process record linked.</p>
          {!isPrintPreview && (
            <div className="flex items-center justify-center gap-2 mt-2 font-sans not-italic">
              {productProcessRecords.length > 0 && (
                <Button
                  onClick={(e) => { e.stopPropagation(); setIsSelectProductProcessModalOpen(true); }}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-1 px-2.5 flex items-center gap-1"
                >
                  <FolderOpen className="w-3 h-3" />
                  Use Passport Record
                </Button>
              )}
              <Button
                onClick={(e) => { e.stopPropagation(); setIsEnterProductProcessModalOpen(true); }}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-bold py-1 px-2.5 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Enter New Product / Process Check
              </Button>
            </div>
          )}
        </div>
      );
    }

    const curr = currProductProcessRecord || prevProductProcessRecord!;
    const prev = prevProductProcessRecord;

    const renderParamVal = (currVal: number | null | undefined, prevVal: number | null | undefined, unit: string) => {
      if (currVal === null || currVal === undefined) return '—';
      if (!prev || prevVal === null || prevVal === undefined) return `${currVal}${unit}`;
      const changed = prevVal !== currVal;
      if (changed) {
        return (
          <span className="font-bold text-amber-400">
            {currVal}{unit} <span className="text-[9px] text-slate-400 font-normal">({prevVal}➔)</span>
          </span>
        );
      }
      return `${currVal}${unit}`;
    };

    const showL1 = productProcessEvidenceSelection.includes('laser1');
    const showL2 = productProcessEvidenceSelection.includes('laser2');

    return (
      <div className="space-y-3 text-xs font-mono">
        {/* TOP — COMPACT INFORMATION */}
        <div className={`p-2.5 rounded border space-y-2 ${
          isPrintPreview ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900/80 border-slate-800 text-slate-200'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Product</span>
              <strong className="text-slate-100">{curr.productName || '—'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Recipe</span>
              <strong className="text-cyan-400 font-mono">{curr.recipeName || '—'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Lot / Panel</span>
              <strong className="text-slate-200 font-mono">{curr.lotPanel || '—'}</strong>
            </div>
          </div>

          {/* PROCESS PARAMETERS COMPARISON TABLE */}
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="py-1">Parameter</th>
                <th className="py-1 text-center">Phase 1</th>
                <th className="py-1 text-center">Phase 2</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              <tr>
                <td className="py-1 text-slate-400">Power</td>
                <td className="py-1 text-center font-bold">{renderParamVal(curr.phase1?.powerWatts, prev?.phase1?.powerWatts, ' W')}</td>
                <td className="py-1 text-center font-bold">{renderParamVal(curr.phase2?.powerWatts, prev?.phase2?.powerWatts, ' W')}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-400">Frequency</td>
                <td className="py-1 text-center font-bold">{renderParamVal(curr.phase1?.frequencyKhz, prev?.phase1?.frequencyKhz, ' kHz')}</td>
                <td className="py-1 text-center font-bold">{renderParamVal(curr.phase2?.frequencyKhz, prev?.phase2?.frequencyKhz, ' kHz')}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-400">Shot Count</td>
                <td className="py-1 text-center font-bold">{renderParamVal(curr.phase1?.shotCount, prev?.phase1?.shotCount, ' shots')}</td>
                <td className="py-1 text-center font-bold">{renderParamVal(curr.phase2?.shotCount, prev?.phase2?.shotCount, ' shots')}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-400">Mask</td>
                <td className="py-1 text-center font-bold">{renderParamVal(curr.phase1?.maskMm, prev?.phase1?.maskMm, ' mm')}</td>
                <td className="py-1 text-center font-bold">{renderParamVal(curr.phase2?.maskMm, prev?.phase2?.maskMm, ' mm')}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-400">Defocus</td>
                <td className="py-1 text-center font-bold">{renderParamVal(curr.phase1?.defocusMm, prev?.phase1?.defocusMm, ' mm')}</td>
                <td className="py-1 text-center font-bold">{renderParamVal(curr.phase2?.defocusMm, prev?.phase2?.defocusMm, ' mm')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BOTTOM — VIA IMAGE COMPARISON (Visual Evidence Priority) */}
        <div className="space-y-3">
          {showL1 && (
            <div className={`p-3 rounded border space-y-2 ${
              isPrintPreview ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="font-bold text-cyan-400 tracking-wide uppercase text-xs">VIA QUALITY — LASER 1</span>
                <Badge variant={curr.laser1Via?.overallPass ? 'success' : 'danger'} className="text-[9px]">
                  {curr.laser1Via?.overallPass ? 'PASS' : 'FAIL'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Previous */}
                <div className="space-y-1 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">PREVIOUS ({prev ? prev.date : 'No previous record'})</span>
                  <div className="w-full aspect-square rounded bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-1">
                    {prev?.laser1Via?.viaImageDataUrl ? (
                      <img src={prev?.laser1Via?.viaImageDataUrl} alt="Prev L1 Via" className="w-full h-full object-contain rounded" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="text-[10px] space-y-0.5 pt-1 text-slate-300 font-mono text-left bg-slate-950/60 p-1.5 rounded border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Top Drill (51±10µm):</span>
                      <strong className={prev?.laser1Via?.topPass ? 'text-emerald-400' : 'text-rose-400'}>
                        {prev?.laser1Via?.topWidthUm ?? '—'} µm
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bottom Drill (23±10µm):</span>
                      <strong className={prev?.laser1Via?.bottomPass ? 'text-emerald-400' : 'text-rose-400'}>
                        {prev?.laser1Via?.bottomWidthUm ?? '—'} µm
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Current */}
                <div className="space-y-1 text-center">
                  <span className="text-[10px] font-bold text-cyan-400 block uppercase">CURRENT ({curr.date})</span>
                  <div className="w-full aspect-square rounded bg-slate-950 border border-cyan-800 overflow-hidden flex items-center justify-center p-1">
                    {curr.laser1Via?.viaImageDataUrl ? (
                      <img src={curr.laser1Via.viaImageDataUrl} alt="Curr L1 Via" className="w-full h-full object-contain rounded" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="text-[10px] space-y-0.5 pt-1 text-slate-300 font-mono text-left bg-slate-950/60 p-1.5 rounded border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Top Drill (51±10µm):</span>
                      <strong className={curr.laser1Via?.topPass ? 'text-emerald-400' : 'text-rose-400'}>
                        {curr.laser1Via?.topWidthUm ?? '—'} µm [{curr.laser1Via?.topPass ? 'PASS' : 'FAIL'}]
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bottom Drill (23±10µm):</span>
                      <strong className={curr.laser1Via?.bottomPass ? 'text-emerald-400' : 'text-rose-400'}>
                        {curr.laser1Via?.bottomWidthUm ?? '—'} µm [{curr.laser1Via?.bottomPass ? 'PASS' : 'FAIL'}]
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showL2 && (
            <div className={`p-3 rounded border space-y-2 ${
              isPrintPreview ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="font-bold text-cyan-400 tracking-wide uppercase text-xs">VIA QUALITY — LASER 2</span>
                <Badge variant={curr.laser2Via?.overallPass ? 'success' : 'danger'} className="text-[9px]">
                  {curr.laser2Via?.overallPass ? 'PASS' : 'FAIL'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Previous */}
                <div className="space-y-1 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">PREVIOUS ({prev ? prev.date : 'No previous record'})</span>
                  <div className="w-full aspect-square rounded bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-1">
                    {prev?.laser2Via?.viaImageDataUrl ? (
                      <img src={prev?.laser2Via?.viaImageDataUrl} alt="Prev L2 Via" className="w-full h-full object-contain rounded" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="text-[10px] space-y-0.5 pt-1 text-slate-300 font-mono text-left bg-slate-950/60 p-1.5 rounded border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Top Drill (51±10µm):</span>
                      <strong className={prev?.laser2Via?.topPass ? 'text-emerald-400' : 'text-rose-400'}>
                        {prev?.laser2Via?.topWidthUm ?? '—'} µm
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bottom Drill (23±10µm):</span>
                      <strong className={prev?.laser2Via?.bottomPass ? 'text-emerald-400' : 'text-rose-400'}>
                        {prev?.laser2Via?.bottomWidthUm ?? '—'} µm
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Current */}
                <div className="space-y-1 text-center">
                  <span className="text-[10px] font-bold text-cyan-400 block uppercase">CURRENT ({curr.date})</span>
                  <div className="w-full aspect-square rounded bg-slate-950 border border-cyan-800 overflow-hidden flex items-center justify-center p-1">
                    {curr.laser2Via?.viaImageDataUrl ? (
                      <img src={curr.laser2Via.viaImageDataUrl} alt="Curr L2 Via" className="w-full h-full object-contain rounded" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="text-[10px] space-y-0.5 pt-1 text-slate-300 font-mono text-left bg-slate-950/60 p-1.5 rounded border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Top Drill (51±10µm):</span>
                      <strong className={curr.laser2Via?.topPass ? 'text-emerald-400' : 'text-rose-400'}>
                        {curr.laser2Via?.topWidthUm ?? '—'} µm [{curr.laser2Via?.topPass ? 'PASS' : 'FAIL'}]
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bottom Drill (23±10µm):</span>
                      <strong className={curr.laser2Via?.bottomPass ? 'text-emerald-400' : 'text-rose-400'}>
                        {curr.laser2Via?.bottomWidthUm ?? '—'} µm [{curr.laser2Via?.bottomPass ? 'PASS' : 'FAIL'}]
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Non-print Control Bar */}
        {!isPrintPreview && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 font-sans">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setIsSelectProductProcessEvidenceModalOpen(true); }}
                className="text-[10px] py-0.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 flex items-center gap-1"
              >
                <Filter className="w-3 h-3" />
                Select Evidence ({productProcessEvidenceSelection.length}/2)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setIsSelectProductProcessModalOpen(true); }}
                className="text-[10px] py-0.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 flex items-center gap-1"
              >
                <FolderOpen className="w-3 h-3" />
                Passport Records
              </Button>
            </div>

            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); setIsEnterProductProcessModalOpen(true); }}
              className="text-[10px] py-0.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              New Check
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 w-full">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-semibold text-xs py-2.5 px-4 rounded-md shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP WORKFLOW STEPS HEADER BAR & KEY PRINCIPLE (Matching Reference Layout) */}
      <div className={`p-3 rounded-lg border space-y-2.5 ${
        isDark ? 'bg-[#15181C] border-[#2B323A]' : 'bg-white border-slate-300 shadow-xs'
      }`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Workflow Steps */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 text-xs">
            <div className="flex items-center gap-2 bg-[#1A1D21] border border-[#2B323A] px-2.5 py-1.5 rounded shrink-0">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">1</span>
              <span className="text-slate-300 font-medium">Select Machine</span>
              <span className="text-[10px] text-slate-500">(From Passport)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            <div className="flex items-center gap-2 bg-[#1A1D21] border border-[#2B323A] px-2.5 py-1.5 rounded shrink-0">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">2</span>
              <span className="text-slate-300 font-medium">Start New MHC</span>
              <span className="text-[10px] text-slate-500">(Auto load)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            <div className="flex items-center gap-2 bg-[#1A1D21] border border-[#2B323A] px-2.5 py-1.5 rounded shrink-0">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">3</span>
              <span className="text-slate-300 font-medium">Choose Template</span>
              <span className="text-[10px] text-slate-500">(Or create new)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            <div className="flex items-center gap-2 bg-[#8B9DFF]/15 border border-[#8B9DFF]/40 px-2.5 py-1.5 rounded shrink-0 text-[#8B9DFF] font-bold">
              <span className="w-5 h-5 rounded-full bg-[#8B9DFF] text-slate-950 text-[10px] font-bold flex items-center justify-center">4</span>
              <span>One-Page Workspace</span>
              <span className="text-[10px] text-[#8B9DFF]/80">(Verify & Fill)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            <div className="flex items-center gap-2 bg-[#1A1D21] border border-[#2B323A] px-2.5 py-1.5 rounded shrink-0">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">5</span>
              <span className="text-slate-300 font-medium">Export PDF</span>
              <span className="text-[10px] text-slate-500">(Exactly 1 A4 page)</span>
            </div>
          </div>

          {/* Key Principle Card */}
          <div className="flex items-center gap-2.5 bg-indigo-950/30 border border-indigo-900/50 p-2 rounded-lg text-xs shrink-0 max-w-md">
            <div className="p-1.5 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-indigo-300 text-[11px] block">KEY PRINCIPLE</span>
              <p className="text-[10px] text-slate-300 leading-tight">
                FSOS fills what it already knows. Engineer only enters new or missing data. Dashboard reduces workload.
              </p>
            </div>
          </div>
        </div>

        {/* Title Bar & Workspace Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div>
            <h2 className="text-sm font-black text-slate-100 tracking-wider uppercase flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#8B9DFF]" />
              FSOS — SMART ONE-PAGE MHC REPORT WORKSPACE
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Measure Less. Verify More. Deliver More.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              onClick={() => setIsSaveDraftModalOpen(true)}
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 text-[11px] py-1 px-2.5 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              Save Draft
            </Button>

            <Button
              onClick={() => setIsLoadDraftModalOpen(true)}
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 text-[11px] py-1 px-2.5 flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
              Drafts
            </Button>

            <Button
              onClick={() => setIsSaveTemplateModalOpen(true)}
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 text-[11px] py-1 px-2.5 flex items-center gap-1.5"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
              Save Template
            </Button>

            <Button
              onClick={() => setIsLoadTemplateModalOpen(true)}
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 text-[11px] py-1 px-2.5 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              Load Template
            </Button>

            {/* Pane Toggles */}
            <div className="flex items-center gap-1 border-l border-slate-700/60 pl-2">
              <button
                onClick={() => setShowDataTray(p => !p)}
                className={`p-1.5 rounded text-[11px] transition border flex items-center gap-1 ${
                  showDataTray ? 'bg-[#8B9DFF]/20 text-[#8B9DFF] border-[#8B9DFF]/40' : 'bg-slate-800/40 text-slate-400 border-slate-700'
                }`}
                title="Toggle Data Tray"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Data Tray</span>
              </button>
              <button
                onClick={() => setShowWidgetLibrary(p => !p)}
                className={`p-1.5 rounded text-[11px] transition border flex items-center gap-1 ${
                  showWidgetLibrary ? 'bg-[#8B9DFF]/20 text-[#8B9DFF] border-[#8B9DFF]/40' : 'bg-slate-800/40 text-slate-400 border-slate-700'
                }`}
                title="Toggle Widget Library"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Widgets</span>
              </button>
              <button
                onClick={() => setShowPropertiesPanel(p => !p)}
                className={`p-1.5 rounded text-[11px] transition border flex items-center gap-1 ${
                  showPropertiesPanel ? 'bg-[#8B9DFF]/20 text-[#8B9DFF] border-[#8B9DFF]/40' : 'bg-slate-800/40 text-slate-400 border-slate-700'
                }`}
                title="Toggle Properties Panel"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Properties</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ISO 13374-4 CONDITION MONITORING INTELLIGENCE BANNER */}
      <div className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDark ? 'bg-[#121926] border-indigo-900/50' : 'bg-indigo-50 border-indigo-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                Condition-Monitoring Intelligence (ISO 13374-4 Inspired)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
                Health Score: {machine.healthScore || 94}%
              </span>
            </div>
            <p className="text-xs font-medium text-slate-200 mt-0.5">
              CURRENT CONDITION: <strong className="text-emerald-400">NOMINAL OPTICAL POWER (99.2% Stability)</strong> • Chiller 20.0°C • Diode Life: ~6,760 hrs remaining
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Power Change: -3.2% (-8 W) vs Prev</span>
          </div>

          {previousSession && (
            <div className="text-slate-400 border-l border-slate-700 pl-3">
              Prev MHC: <span className="text-slate-200 font-bold">{previousSession.startDate} ({previousSession.id})</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTAINER (DESKTOP HIERARCHY: [ DATA/WIDGETS ] [ LARGE A4 CANVAS ] [ PROPERTIES ]) */}
      <div className="flex gap-2 sm:gap-3 min-h-[calc(100vh-13rem)] items-start w-full">
        {/* LEFT SUPPORTING PANEL: DATA TRAY & WIDGET LIBRARY */}
        {(showDataTray || showWidgetLibrary) ? (
          <div className="w-60 lg:w-64 xl:w-72 shrink-0 flex flex-col gap-3 transition-all sticky top-4 max-h-[calc(100vh-5rem)] overflow-y-auto z-20">
            {/* Tabs header when left panel is active */}
            <div className="flex items-center justify-between bg-[#15181C] p-1 rounded-md border border-[#2B323A] text-xs">
              <div className="flex items-center gap-1 flex-1">
                {showDataTray && (
                  <button
                    onClick={() => setLeftPaneTab('TRAY')}
                    className={`flex-1 py-1.5 rounded font-bold transition flex items-center justify-center gap-1.5 ${
                      leftPaneTab === 'TRAY'
                        ? 'bg-[#8B9DFF] text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Data Tray</span>
                  </button>
                )}
                {showWidgetLibrary && (
                  <button
                    onClick={() => setLeftPaneTab('WIDGETS')}
                    className={`flex-1 py-1.5 rounded font-bold transition flex items-center justify-center gap-1.5 ${
                      leftPaneTab === 'WIDGETS'
                        ? 'bg-emerald-400 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Widgets</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => { setShowDataTray(false); setShowWidgetLibrary(false); }}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 shrink-0 ml-1"
                title="Collapse Panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: DATA TRAY */}
            {showDataTray && (leftPaneTab === 'TRAY' || !showWidgetLibrary) && (
              <div className={`p-3.5 rounded-lg border flex-1 flex flex-col justify-between ${
                isDark ? 'bg-[#15181C] border-[#2B323A]' : 'bg-white border-slate-300 shadow-xs'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#8B9DFF]" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        DATA TRAY (What's Available)
                      </h3>
                    </div>

                    <Button
                      onClick={() => setIsAddDataModalOpen(true)}
                      className="bg-[#8B9DFF]/15 hover:bg-[#8B9DFF]/30 text-[#8B9DFF] border border-[#8B9DFF]/30 text-[10px] py-1 px-2 flex items-center gap-1 rounded"
                    >
                      <Plus className="w-3 h-3" />
                      Add Custom
                    </Button>
                  </div>

                  {/* Search & Filter Tabs */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search data fields..."
                        value={traySearch}
                        onChange={(e) => setTraySearch(e.target.value)}
                        className="w-full bg-[#1A1D21] border border-[#2B323A] rounded pl-8 pr-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#8B9DFF]"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-[#1A1D21] p-1 rounded border border-[#2B323A] text-[10px]">
                      {(['ALL', 'AVAILABLE', 'MISSING', 'NA'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setTrayFilter(tab)}
                          className={`flex-1 py-1 rounded font-semibold transition ${
                            trayFilter === tab
                              ? 'bg-[#8B9DFF] text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grouped Data Items List */}
                  <div className="space-y-3 overflow-y-auto max-h-[580px] pr-1">
                    {groupedDataTray.map(group => (
                      <div key={group.category} className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          {group.category} ({group.items.length})
                        </span>

                        <div className="space-y-1">
                          {group.items.map(item => (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (item.status === 'MISSING') {
                                  handleOpenInlineEdit(item.key, item.label, item.value);
                                }
                              }}
                              className={`p-2 rounded border flex items-center justify-between text-xs transition ${
                                item.status === 'MISSING'
                                  ? 'bg-amber-950/30 border-amber-800/60 hover:bg-amber-950/50 cursor-pointer'
                                  : isDark
                                  ? 'bg-[#1A1D21] border-[#2B323A] hover:border-slate-700'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="font-medium text-slate-300 block truncate">{item.label}</span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {item.value} {item.unit || ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {item.isCustom && (
                                  <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 px-1 rounded">
                                    Custom
                                  </span>
                                )}
                                <Badge
                                  variant={
                                    item.status === 'AVAILABLE' ? 'success' :
                                    item.status === 'MISSING' ? 'warning' : 'secondary'
                                  }
                                  className="text-[9px] px-1.5 py-0.2"
                                >
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono text-center">
                  Total {dataTrayItems.length} Data Items • Single Source of Truth
                </div>
              </div>
            )}

            {/* TAB 2: WIDGET LIBRARY */}
            {showWidgetLibrary && (leftPaneTab === 'WIDGETS' || !showDataTray) && (
              <div className={`p-3.5 rounded-lg border flex-1 flex flex-col justify-between ${
                isDark ? 'bg-[#15181C] border-[#2B323A]' : 'bg-white border-slate-300 shadow-xs'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        WIDGET LIBRARY
                      </h3>
                    </div>

                    <Button
                      onClick={() => setIsAddWidgetModalOpen(true)}
                      className="bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[10px] py-1 px-2 flex items-center gap-1 rounded"
                    >
                      <Plus className="w-3 h-3" />
                      Custom
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter widgets..."
                      value={widgetSearch}
                      onChange={(e) => setWidgetSearch(e.target.value)}
                      className="w-full bg-[#1A1D21] border border-[#2B323A] rounded pl-8 pr-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-[580px] pr-1">
                    {filteredLibraryWidgets.map((wt, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({ type: wt.type, defaultWidth: wt.defaultWidth }));
                          e.dataTransfer.setData('text/plain', wt.type);
                        }}
                        onClick={() => handleAddWidgetToCanvas(wt.type, wt.defaultWidth)}
                        className={`p-2 rounded border flex items-center justify-between group cursor-grab active:cursor-grabbing transition ${
                          isDark
                            ? 'bg-[#1A1D21] border-[#2B323A] hover:border-emerald-500/60 hover:bg-slate-800/80'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                            {wt.icon}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-xs text-slate-200 block truncate group-hover:text-emerald-400">
                              {wt.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              Width: {wt.defaultWidth}
                            </span>
                          </div>
                        </div>

                        <Plus className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono text-center">
                  Click or drag widget to add to Report Canvas
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => setShowDataTray(true)}
            className="w-9 shrink-0 bg-[#15181C] border border-[#2B323A] rounded-lg p-2 flex flex-col items-center py-4 gap-4 hover:bg-[#1A1D21] cursor-pointer transition-all group sticky top-4"
            title="Expand Data Tray & Widget Library"
          >
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#8B9DFF]" />
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 group-hover:text-[#8B9DFF] tracking-widest whitespace-nowrap -rotate-90 transform">
                DATA & WIDGETS
              </span>
            </div>
          </div>
        )}

        {/* PRIMARY WORKSPACE: UNRESTRICTED CONTINUOUS REPORT STUDIO CANVAS */}
        <div 
          ref={canvasContainerRef}
          className={`flex-1 min-w-0 p-4 rounded-lg border flex flex-col justify-between ${
            isDark ? 'bg-[#0B0D10] border-[#2B323A]' : 'bg-slate-200 border-slate-300 shadow-inner'
          }`}
        >
          <div className="space-y-3">
            {/* Sticky Canvas View Controls Bar */}
            <div className="p-2.5 rounded-md bg-[#15181C] border border-[#2B323A] flex flex-wrap items-center justify-between gap-3 sticky top-4 z-10 shadow-lg">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  ENGINEERING REPORT STUDIO CANVAS
                </h3>
              </div>

              {/* View & Continuous Canvas Indicators */}
              <div className="flex items-center gap-3 text-xs font-mono">
                {/* Continuous Canvas Indicator */}
                <div className="flex items-center gap-2 bg-[#1A1D21] border border-[#2B323A] px-2.5 py-1 rounded">
                  <span className="text-slate-400">Studio:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Continuous Canvas ({canvasWidgets.length} Widgets)
                  </span>
                </div>

                {/* Document View Controls */}
                <div className="flex items-center gap-1 bg-[#1A1D21] border border-[#2B323A] p-0.5 rounded">
                  <button
                    onClick={() => setZoomLevel(p => Math.max(60, p - 10))}
                    className="p-1 rounded hover:bg-slate-800 text-slate-300 text-[10px]"
                    title="Zoom Out"
                  >
                    Zoom -
                  </button>
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold text-[10px]"
                  >
                    {zoomLevel}%
                  </button>
                  <button
                    onClick={() => setZoomLevel(p => Math.min(130, p + 10))}
                    className="p-1 rounded hover:bg-slate-800 text-slate-300 text-[10px]"
                    title="Zoom In"
                  >
                    Zoom +
                  </button>
                  <button
                    onClick={handleFitPage}
                    className="px-2 py-0.5 rounded bg-[#8B9DFF]/20 text-[#8B9DFF] border border-[#8B9DFF]/30 font-bold text-[10px] hover:bg-[#8B9DFF]/30"
                  >
                    Fit Width
                  </button>
                </div>
              </div>
            </div>

            {/* UNRESTRICTED CONTINUOUS WORKSPACE CANVAS */}
            <div className="flex justify-center items-start w-full py-2 overflow-x-auto">
              <div 
                ref={canvasPaperRef}
                style={{ 
                  transform: `scale(${zoomLevel / 100})`, 
                  transformOrigin: 'top center',
                  width: '820px'
                }}
                className={`p-6 sm:p-7 rounded-lg border space-y-3 transition-transform duration-150 min-h-[500px] h-auto ${
                  isDark ? 'bg-[#15181C] border-slate-700 shadow-2xl' : 'bg-white border-slate-300 shadow-xl text-slate-900'
                }`}
              >
                {/* 1. REPORT DOCUMENT HEADER */}
                <div className="pb-3 border-b-2 border-slate-700 flex items-center justify-between">
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-100 uppercase">
                      MACHINE HEALTH REPORT
                    </h1>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {machine.model} • {machine.machineNumber} • {machine.serialNumber} • {machine.customerName}
                    </p>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-[#8B9DFF] font-bold block">{activeSession.id}</span>
                    <span className="text-slate-400 block">{activeSession.startDate || '06 AUGUST 2026'}</span>
                  </div>
                </div>

                {/* 2. REPORT CANVAS WIDGETS GRID */}
                <div 
                  className="grid grid-cols-2 gap-3 min-h-[300px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const raw = e.dataTransfer.getData('application/json');
                    if (raw) {
                      try {
                        const data = JSON.parse(raw);
                        if (data.isReorder && data.widgetId) {
                          const fromIdx = canvasWidgets.findIndex(w => w.id === data.widgetId);
                          if (fromIdx >= 0) {
                            const nextWidgets = [...canvasWidgets];
                            const [moved] = nextWidgets.splice(fromIdx, 1);
                            nextWidgets.push(moved);
                            setCanvasWidgets(nextWidgets);
                          }
                        } else if (data.type) {
                          handleAddWidgetToCanvas(data.type, data.defaultWidth);
                        }
                      } catch (err) {}
                    }
                  }}
                >
                  {canvasWidgets.map((widget, targetIndex) => {
                    const isSelected = selectedWidgetId === widget.id;
                    const colSpanClass = widget.width === '1/1' ? 'col-span-2' : 'col-span-1';

                    return (
                      <div
                        key={widget.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({ widgetId: widget.id, isReorder: true }));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const raw = e.dataTransfer.getData('application/json');
                          if (!raw) return;
                          try {
                            const data = JSON.parse(raw);
                            if (data.isReorder && data.widgetId) {
                              const fromIdx = canvasWidgets.findIndex(w => w.id === data.widgetId);
                              if (fromIdx >= 0 && fromIdx !== targetIndex) {
                                const nextWidgets = [...canvasWidgets];
                                const [moved] = nextWidgets.splice(fromIdx, 1);
                                nextWidgets.splice(targetIndex, 0, moved);
                                setCanvasWidgets(nextWidgets);
                              }
                            } else if (data.type) {
                              const template = availableWidgetTemplates.find(t => t.type === data.type);
                              const newWidget: SmartMhcWidget = {
                                id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                                type: data.type,
                                title: template?.label || data.type,
                                subtitle: template?.description || 'Custom report section',
                                width: data.defaultWidth || '1/1',
                                status: 'NORMAL',
                                comparisonSource: 'Baseline vs Current',
                                displayFields: { showGauge: true, showTable: true }
                              };
                              const nextWidgets = [...canvasWidgets];
                              nextWidgets.splice(targetIndex, 0, newWidget);
                              setCanvasWidgets(nextWidgets);
                              setSelectedWidgetId(newWidget.id);
                              showToast(`Added "${newWidget.title}" to Report Canvas`);
                            }
                          } catch (err) {}
                        }}
                        onClick={() => setSelectedWidgetId(widget.id)}
                        className={`${colSpanClass} p-3 rounded-lg border transition relative group ${
                          isSelected
                            ? 'border-[#8B9DFF] ring-2 ring-[#8B9DFF]/30 bg-[#1A1D24]'
                            : isDark
                            ? 'bg-[#191C22] border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {/* Widget Header Controls */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 mb-2">
                          <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-200">
                            <GripVertical className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                            <span className="font-bold text-xs text-slate-100 truncate">{widget.title}</span>
                            <Badge variant={widget.status === 'NORMAL' ? 'success' : 'warning'} className="text-[9px] px-1.5 py-0.2">
                              {widget.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveWidget(widget.id, 'UP'); }}
                              className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveWidget(widget.id, 'DOWN'); }}
                              className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDuplicateWidget(widget); }}
                              className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                              title="Duplicate Widget"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveWidget(widget.id); }}
                              className="p-1 rounded text-slate-400 hover:bg-rose-950 hover:text-rose-400"
                              title="Remove Widget"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* WIDGET CONTENT RENDERERS MATCHING REFERENCE DESIGNS */}
                        {/* WIDGET 1: LASER LIFE */}
                        {widget.type === 'Laser Life' && renderLaserLifeWidget(false)}

                        {/* WIDGET 2: LASER TEMPERATURE */}
                        {widget.type === 'Laser Temperature' && renderLaserTemperatureWidget(false)}

                        {/* WIDGET 3: LASER POWER (WATT) */}
                        {widget.type === 'Laser Power / Trend' && renderLaserPowerWidget(false)}

                        {/* WIDGET 4: BEAM / OPTICAL CONDITION */}
                        {widget.type === 'Beam Comparison' && renderBeamProfileWidget(false)}

                        {/* WIDGET 5: PRODUCT / PROCESS / VIA QUALITY */}
                        {(widget.type === 'Product / Process / Via' || widget.type === 'Product Info' || widget.type === 'Process Parameters') && renderProductProcessWidget(false)}

                        {/* WIDGET 7: MAINTENANCE RECOMMENDATION */}
                        {widget.type === 'Recommendations' && (
                          <div className="space-y-2 text-xs">
                            <div className="space-y-1 text-slate-300 text-[11px]">
                              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Replace protective window during next PM (recommended).</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-emerald-400">
                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Laser source condition acceptable.</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-emerald-400">
                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Cooling system thermal loop stable.</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* WIDGET 8: SPARE PARTS */}
                        {widget.type === 'Spare Parts' && (
                          <div className="space-y-1.5 text-xs font-mono">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b border-slate-800 text-[10px] text-slate-400">
                                  <th className="py-0.5">SPARE PARTS</th>
                                  <th className="py-0.5 text-right">QTY</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="py-1 text-slate-300">Protective Window</td>
                                  <td className="py-1 text-right text-amber-400 font-bold">1 pc (Plan next PM)</td>
                                </tr>
                                <tr>
                                  <td className="py-1 text-slate-300">DI Water Filter</td>
                                  <td className="py-1 text-right text-slate-400">0</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* GENERIC / CUSTOM WIDGET RENDERER */}
                        {widget.type !== 'Laser Life' && 
                         widget.type !== 'Laser Temperature' && 
                         widget.type !== 'Laser Power / Trend' && 
                         widget.type !== 'Beam Comparison' && 
                         widget.type !== 'Product Info' && 
                         widget.type !== 'Process Parameters' && 
                         widget.type !== 'Recommendations' && 
                         widget.type !== 'Spare Parts' && (
                          <div className="space-y-2 text-xs text-slate-400 font-mono">
                            <p>{widget.subtitle || 'Bound to machine readings & session data.'}</p>
                            {widget.boundFieldKeys && widget.boundFieldKeys.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {widget.boundFieldKeys.map(k => (
                                  <span key={k} className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                                    {k}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 3. REPORT FOOTER & ENGINEER VERDICT BLOCK */}
                <div className="pt-4 border-t-2 border-slate-700 flex items-center justify-between text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-400">OVERALL MACHINE HEALTH:</span>
                    <Badge variant="success" className="text-xs px-2.5 py-1 font-bold">
                      HEALTHY ({machine.healthScore || 94}%)
                    </Badge>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <div>Engineer: <strong className="text-slate-200">{activeSession.engineerName || 'Alex Wong'}</strong></div>
                    <div>Date: <strong className="text-slate-200">{activeSession.startDate || '06 Aug 2026'}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsAddWidgetModalOpen(true)}
                className="bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Custom Widget
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsPreviewModalOpen(true)}
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                Preview Report
              </Button>

              <Button
                onClick={handleTriggerPdfExport}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-1.5 px-4 flex items-center gap-2 shadow-md"
              >
                <FileDown className="w-4 h-4" />
                Export PDF Report
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT SUPPORTING PANEL: PROPERTIES PANEL */}
        {showPropertiesPanel && selectedWidget ? (
          <div className={`w-60 lg:w-64 xl:w-72 shrink-0 p-3.5 rounded-lg border flex flex-col justify-between sticky top-4 max-h-[calc(100vh-5rem)] overflow-y-auto z-20 ${
            isDark ? 'bg-[#15181C] border-[#2B323A]' : 'bg-white border-slate-300 shadow-xs'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    PROPERTIES
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedWidget.type}
                  </Badge>
                  <button
                    onClick={() => setShowPropertiesPanel(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 ml-1"
                    title="Collapse Properties Panel"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Widget Title Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300 block">Widget Section Title</label>
                <input
                  type="text"
                  value={selectedWidget.title}
                  onChange={(e) => handleUpdateSelectedWidget({ title: e.target.value })}
                  className="w-full bg-[#1A1D21] border border-[#2B323A] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Widget Subtitle Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300 block">Subtitle / Description</label>
                <input
                  type="text"
                  value={selectedWidget.subtitle || ''}
                  onChange={(e) => handleUpdateSelectedWidget({ subtitle: e.target.value })}
                  className="w-full bg-[#1A1D21] border border-[#2B323A] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Layout Width Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300 block">Canvas Width Layout</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['1/1', '1/2', '1/3'] as const).map(w => (
                    <button
                      key={w}
                      onClick={() => handleUpdateSelectedWidget({ width: w })}
                      className={`py-1.5 rounded text-xs font-bold transition border ${
                        selectedWidget.width === w
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-[#1A1D21] text-slate-400 border-[#2B323A] hover:bg-slate-800'
                      }`}
                    >
                      {w === '1/1' ? 'Full' : w === '1/2' ? 'Half' : '1/3'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparison Source Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300 block">Comparison Data Source</label>
                <select
                  value={selectedWidget.comparisonSource}
                  onChange={(e) => handleUpdateSelectedWidget({ comparisonSource: e.target.value as any })}
                  className="w-full bg-[#1A1D21] border border-[#2B323A] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="Baseline vs Current">Baseline vs Current</option>
                  <option value="Before vs After Maintenance">Before vs After Maintenance</option>
                  <option value="Spec Sheet vs Real-time">Spec Sheet vs Real-time</option>
                  <option value="Previous MHC vs Current">Previous MHC vs Current</option>
                  <option value="None">None</option>
                </select>
              </div>

              {/* Widget Status Override */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300 block">Status Override</label>
                <select
                  value={selectedWidget.status}
                  onChange={(e) => handleUpdateSelectedWidget({ status: e.target.value as any })}
                  className="w-full bg-[#1A1D21] border border-[#2B323A] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="NORMAL">NORMAL (Green)</option>
                  <option value="WARNING">WARNING (Amber)</option>
                  <option value="CRITICAL">CRITICAL (Red)</option>
                  <option value="NA">N/A (Gray)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <Button
                  onClick={() => handleRemoveWidget(selectedWidget.id)}
                  variant="outline"
                  className="w-full border-rose-900/60 text-rose-400 hover:bg-rose-950 text-xs py-1.5 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Widget from Canvas
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono text-center">
              Selected Widget ID: {selectedWidget.id}
            </div>
          </div>
        ) : (
          <div
            onClick={() => setShowPropertiesPanel(true)}
            className="w-9 shrink-0 bg-[#15181C] border border-[#2B323A] rounded-lg p-2 flex flex-col items-center py-4 gap-4 hover:bg-[#1A1D21] cursor-pointer transition-all group"
            title="Expand Properties Panel"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 group-hover:text-purple-400 tracking-widest whitespace-nowrap rotate-90 transform">
                PROPERTIES
              </span>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: REPORT QUALITY CHECK RESULTS */}
      <Modal
        isOpen={isQualityCheckModalOpen}
        onClose={() => setIsQualityCheckModalOpen(false)}
        title="Smart MHC Report Quality Check"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Automated quality audit results before 1-Page PDF export:
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {qualityCheckResults.checks.map(c => (
              <div
                key={c.id}
                className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                  c.passed
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                    : c.type === 'BLOCKING'
                    ? 'bg-rose-950/40 border-rose-800 text-rose-200 font-bold'
                    : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {c.passed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : c.type === 'BLOCKING' ? (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>{c.label} {c.details ? `(${c.details})` : ''}</span>
                </div>

                <Badge
                  variant={c.passed ? 'success' : c.type === 'BLOCKING' ? 'danger' : 'warning'}
                  className="text-[9px]"
                >
                  {c.passed ? 'PASS' : c.type === 'BLOCKING' ? 'BLOCKING' : 'WARNING'}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsQualityCheckModalOpen(false)} className="text-xs">
              Back to Canvas
            </Button>
            {!qualityCheckResults.hasBlockingError && (
              <Button onClick={() => { setIsQualityCheckModalOpen(false); setIsPreviewModalOpen(true); }} className="bg-rose-600 text-white font-bold text-xs">
                Proceed to PDF Export
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL 2: ISOLATED FULL-SCREEN REPORT PREVIEW & PRINT */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 overflow-y-auto">
          {/* Top Bar inside Preview */}
          <div className="w-full max-w-4xl bg-[#15181C] border border-[#2B323A] p-3 rounded-lg flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Printer className="w-4 h-4 text-[#8B9DFF]" />
              <span className="font-bold text-slate-100">ISOLATED A4 PRINT PREVIEW</span>
              <span className="text-slate-400">• 1-Page Printable Report Document Only</span>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleExecutePrint} className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-1.5 px-4 flex items-center gap-1.5">
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </Button>
              <Button onClick={() => setIsPreviewModalOpen(false)} variant="outline" className="border-slate-700 text-slate-300 text-xs py-1.5 px-3">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Printable Report Canvas Container */}
          <div id="a4-print-document" className="w-full max-w-[820px] bg-white text-slate-900 p-8 rounded-lg shadow-2xl my-4 space-y-4">
            <div className="pb-4 border-b-2 border-slate-900 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  MACHINE HEALTH REPORT
                </h1>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  {machine.model} • {machine.serialNumber} • {machine.customerName}
                </p>
              </div>

              <div className="text-right font-mono text-xs text-slate-800">
                <span className="font-bold block">{activeSession.id}</span>
                <span className="block">{activeSession.startDate || '06 AUGUST 2026'}</span>
              </div>
            </div>

            {/* Render Widgets inside Print Preview */}
            <div className="grid grid-cols-2 gap-3.5">
              {canvasWidgets.map(w => (
                <div key={w.id} className={`${w.width === '1/1' ? 'col-span-2' : 'col-span-1'} p-3 rounded border border-slate-300 bg-slate-50 text-xs space-y-1`}>
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1 flex justify-between">
                    <span>{w.title}</span>
                    <span className="text-[10px] text-slate-600 uppercase font-mono">{w.status}</span>
                  </div>
                  {w.type === 'Laser Life' ? (
                    renderLaserLifeWidget(true)
                  ) : w.type === 'Laser Temperature' ? (
                    renderLaserTemperatureWidget(true)
                  ) : w.type === 'Laser Power / Trend' ? (
                    renderLaserPowerWidget(true)
                  ) : w.type === 'Beam Comparison' ? (
                    renderBeamProfileWidget(true)
                  ) : (w.type === 'Product / Process / Via' || w.type === 'Product Info' || w.type === 'Process Parameters') ? (
                    renderProductProcessWidget(true)
                  ) : (
                    <p className="text-slate-700 font-mono text-[11px]">{w.subtitle || 'Verified live machine telemetry.'}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t-2 border-slate-900 flex items-center justify-between text-xs font-mono text-slate-800">
              <div>Overall Status: <strong>HEALTHY ({machine.healthScore || 94}%)</strong></div>
              <div>Engineer: <strong>{activeSession.engineerName || 'Alex Wong'}</strong></div>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono text-center pb-2">
            ISO 13374-4 Inspired • FSOS Isolated One-Page PDF Output
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CUSTOM DATA FIELD */}
      <Modal
        isOpen={isAddDataModalOpen}
        onClose={() => setIsAddDataModalOpen(false)}
        title="[+ Add Custom Data Field]"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Create reusable, bindable engineering measurements & data fields for this machine session.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Data Category</label>
              <select
                value={newDataCat}
                onChange={(e) => setNewDataCat(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
              >
                <option value="Machine">Machine</option>
                <option value="Product & Process">Product & Process</option>
                <option value="Laser">Laser</option>
                <option value="Optical / Quality">Optical / Quality</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Engineer">Engineer</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Field Name / Label</label>
              <input
                type="text"
                placeholder="e.g. Galvo Mirror Reflectivity"
                value={newDataLabel}
                onChange={(e) => setNewDataLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Measured Value</label>
                <input
                  type="text"
                  placeholder="e.g. 99.8"
                  value={newDataVal}
                  onChange={(e) => setNewDataVal(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Unit (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. % or mm"
                  value={newDataUnit}
                  onChange={(e) => setNewDataUnit(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsAddDataModalOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handleAddCustomData} className="bg-[#8B9DFF] text-slate-950 font-bold text-xs">Add Data Field</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: CREATE CUSTOM WIDGET */}
      <Modal
        isOpen={isAddWidgetModalOpen}
        onClose={() => setIsAddWidgetModalOpen(false)}
        title="[+ Create Custom Engineering Widget]"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Define HOW your custom or existing engineering data is presented on the A4 Report Canvas.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Widget Title</label>
              <input
                type="text"
                placeholder="e.g. Galvo Scanner Drift & Mirror Inspection"
                value={newWidgetTitle}
                onChange={(e) => setNewWidgetTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Display Type</label>
                <select
                  value={newWidgetDisplayType}
                  onChange={(e) => setNewWidgetDisplayType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
                >
                  <option value="card">Data Cards / Stat Grid</option>
                  <option value="table">Measurement Comparison Table</option>
                  <option value="callout">Callout / Alert Box</option>
                  <option value="image">Image Showcase</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Canvas Width</label>
                <select
                  value={newWidgetWidth}
                  onChange={(e) => setNewWidgetWidth(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
                >
                  <option value="1/1">Full Width (1/1)</option>
                  <option value="1/2">Half Width (1/2)</option>
                  <option value="1/3">One Third (1/3)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Bind Data Tray Fields</label>
              <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                {dataTrayItems.map(item => (
                  <label key={item.id} className="flex items-center gap-2 text-slate-300 cursor-pointer hover:bg-slate-800 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedBoundKeys.includes(item.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBoundKeys(prev => [...prev, item.key]);
                        } else {
                          setSelectedBoundKeys(prev => prev.filter(k => k !== item.key));
                        }
                      }}
                    />
                    <span>{item.label} ({item.value} {item.unit || ''})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsAddWidgetModalOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handleCreateCustomWidget} className="bg-emerald-500 text-slate-950 font-bold text-xs">Create Widget</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 5: SAVE TEMPLATE */}
      <Modal
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        title="Save Report Layout as Reusable Template"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Save this report layout structure (widgets, positions, sizes, titles) as a reusable template. Reusable templates do NOT contain machine-specific reading values.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Template Title</label>
              <input
                type="text"
                placeholder="e.g. Standard 250-Hr Laser PM Audit Template"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. PREVENTIVE MAINTENANCE"
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Describe when to use this report layout..."
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsSaveTemplateModalOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handleSaveAsTemplate} className="bg-amber-400 text-slate-950 font-bold text-xs">Save Template</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 6: LOAD TEMPLATE */}
      <Modal
        isOpen={isLoadTemplateModalOpen}
        onClose={() => setIsLoadTemplateModalOpen(false)}
        title="Load Report Template Structure"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Choose a pre-configured report structure to apply to the current machine. Known data will auto-populate into widgets.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {[...BUILT_IN_TEMPLATES, ...StorageService.getMhcWorkspaceTemplates()].map(tpl => (
              <div
                key={tpl.id}
                onClick={() => handleLoadTemplate(tpl)}
                className="p-3 rounded border border-slate-800 bg-slate-900 hover:border-[#8B9DFF] cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-100">{tpl.title}</span>
                    <Badge variant="secondary" className="text-[9px]">{tpl.category}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tpl.description}</p>
                </div>
                <Button className="bg-[#8B9DFF] text-slate-950 font-bold text-xs py-1 px-3 shrink-0">Apply</Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* MODAL 7: SAVE DRAFT */}
      <Modal
        isOpen={isSaveDraftModalOpen}
        onClose={() => setIsSaveDraftModalOpen(false)}
        title="Save MHC Work Draft"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Save current unfinished MHC session measurements, custom fields, evidence images, and canvas state.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Draft Name</label>
            <input
              type="text"
              placeholder={`Draft MHC - ${machine.model}`}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsSaveDraftModalOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handleSaveDraft} className="bg-emerald-500 text-slate-950 font-bold text-xs">Save Draft</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 8: LOAD DRAFT */}
      <Modal
        isOpen={isLoadDraftModalOpen}
        onClose={() => setIsLoadDraftModalOpen(false)}
        title="Load Saved Work Draft"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Select a saved unfinished draft to resume editing measurements and canvas layout.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {StorageService.getMhcWorkspaceDrafts().length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No saved drafts found.</p>
            ) : (
              StorageService.getMhcWorkspaceDrafts().map(d => (
                <div
                  key={d.id}
                  onClick={() => handleLoadDraft(d)}
                  className="p-3 rounded border border-slate-800 bg-slate-900 hover:border-sky-400 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-100 block">{d.draftTitle}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Last saved: {d.lastSaved}</span>
                  </div>
                  <Button className="bg-sky-400 text-slate-950 font-bold text-xs py-1 px-3">Resume</Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL 9: INLINE QUICK DATA EDIT */}
      {inlineEditItem && (
        <Modal
          isOpen={isInlineEditModalOpen}
          onClose={() => setIsInlineEditModalOpen(false)}
          title={`Edit Missing Data: ${inlineEditItem.label}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Update missing value directly inside Smart MHC. Changes sync across all report widgets and session data.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">{inlineEditItem.label}</label>
              <input
                type="text"
                defaultValue={inlineEditItem.value}
                id="inline-input-val"
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" onClick={() => setIsInlineEditModalOpen(false)} className="text-xs">Cancel</Button>
              <Button
                onClick={() => {
                  const val = (document.getElementById('inline-input-val') as HTMLInputElement)?.value;
                  handleSaveInlineEdit(val);
                }}
                className="bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Save & Sync
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 10: SELECT SAVED TEMPERATURE RECORD */}
      <Modal
        isOpen={isSelectTempRecordModalOpen}
        onClose={() => setIsSelectTempRecordModalOpen(false)}
        title="Select Machine Passport Temperature Record"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Select an existing historical temperature log record saved under <strong>{machine.model} ({machine.machineNumber})</strong>:
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {tempRecords.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No saved temperature records in Machine Passport.</p>
            ) : (
              tempRecords.map(rec => {
                const isSelected = activeTempRecord?.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setSelectedTempRecordId(rec.id);
                      setIsSelectTempRecordModalOpen(false);
                      showToast(`Selected temperature record from ${new Date(rec.createdAt).toLocaleDateString()}`);
                    }}
                    className={`p-3 rounded border cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{rec.sourceFileNames.join(', ')}</span>
                        {isSelected && <Badge variant="secondary" className="text-[9px] bg-purple-500/20 text-purple-300 border-purple-500/30">ACTIVE</Badge>}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Date: {new Date(rec.createdAt).toLocaleString()} • Channels: {Object.keys(rec.channelData).length}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 flex gap-3 pt-0.5">
                        <span>MIN: <strong className="text-sky-300">{rec.stats.min.toFixed(1)}°C</strong></span>
                        <span>AVG: <strong className="text-cyan-400">{rec.stats.avg.toFixed(1)}°C</strong></span>
                        <span>MAX: <strong className="text-rose-400">{rec.stats.max.toFixed(1)}°C</strong></span>
                        <span>Points: {rec.stats.pointCount}</span>
                      </div>
                    </div>

                    <Button className={`text-xs py-1 px-3 shrink-0 font-bold ${
                      isSelected ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}>
                      {isSelected ? 'Selected' : 'Use Record'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <Button
              onClick={() => {
                setIsSelectTempRecordModalOpen(false);
                fileInputRef.current?.click();
              }}
              variant="outline"
              className="text-xs border-cyan-800 text-cyan-300 hover:bg-cyan-950 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Import New Log Instead
            </Button>
            <Button variant="outline" onClick={() => setIsSelectTempRecordModalOpen(false)} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 11: SELECT SAVED LASER POWER RECORD */}
      <Modal
        isOpen={isSelectLaserPowerModalOpen}
        onClose={() => setIsSelectLaserPowerModalOpen(false)}
        title="Select Machine Passport Laser Power Record"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Select an existing Laser Power check record saved under <strong>{machine.model} ({machine.machineNumber})</strong>:
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {laserPowerRecords.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No saved Laser Power records in Machine Passport.</p>
            ) : (
              laserPowerRecords.map(rec => {
                const isSelected = activeLaserPowerRecord?.id === rec.id;
                const m13 = rec.workingZoneMasks.find(m => m.maskSize === '1.3mm');
                return (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setSelectedLaserPowerRecordId(rec.id);
                      setIsSelectLaserPowerModalOpen(false);
                      showToast(`Selected Laser Power record from ${rec.date}`);
                    }}
                    className={`p-3 rounded border cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{rec.date} • {rec.frequencyKhz} kHz</span>
                        <Badge variant={rec.overallResult === 'PASS' ? 'success' : 'danger'} className="text-[9px]">
                          {rec.overallResult}
                        </Badge>
                        {isSelected && <Badge variant="secondary" className="text-[9px] bg-amber-500/20 text-amber-300 border-amber-500/30">ACTIVE</Badge>}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Laser Source: A={rec.laserSource.headA ?? '—'}W, B={rec.laserSource.headB ?? '—'}W
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Mask 1.3mm: A={m13?.headA ?? '—'}W, B={m13?.headB ?? '—'}W
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button className={`text-xs py-1 px-3 font-bold ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}>
                        {isSelected ? 'Selected' : 'Use Record'}
                      </Button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLaserPowerRecord(rec.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-sans">
            <Button
              onClick={() => {
                setIsSelectLaserPowerModalOpen(false);
                setIsEnterLaserPowerModalOpen(true);
              }}
              variant="outline"
              className="text-xs border-emerald-800 text-emerald-300 hover:bg-emerald-950 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Enter New Power Check
            </Button>
            <Button variant="outline" onClick={() => setIsSelectLaserPowerModalOpen(false)} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 12: ENTER NEW LASER POWER CHECK FROM MHC */}
      <MhcEnterLaserPowerModal
        isOpen={isEnterLaserPowerModalOpen}
        onClose={() => setIsEnterLaserPowerModalOpen(false)}
        machine={machine}
        onSave={handleSavePowerCheckFromMhc}
        isHistorical={isHistoricalLaserPower}
      />

      {/* MODAL 13: SELECT SAVED BEAM PROFILE RECORDS */}
      <Modal
        isOpen={isSelectBeamProfileModalOpen}
        onClose={() => setIsSelectBeamProfileModalOpen(false)}
        title="Select Machine Passport Beam Profile Records"
      >
        <div className="space-y-4 text-xs font-sans">
          <p className="text-slate-400">
            Select the <strong>PREVIOUS</strong> baseline check and the <strong>CURRENT</strong> check to compare on the Smart MHC report:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-slate-900 border border-slate-800">
            {/* Previous Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">
                PREVIOUS Check Date
              </label>
              <select
                value={prevBeamProfileRecord?.id || ''}
                onChange={(e) => setSelectedPrevBeamProfileRecordId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs"
              >
                {beamProfileRecords.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.date} ({r.overallResult}) — {r.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Selection */}
            <div>
              <label className="block text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wide">
                CURRENT Check Date
              </label>
              <select
                value={currBeamProfileRecord?.id || ''}
                onChange={(e) => setSelectedCurrBeamProfileRecordId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs"
              >
                {beamProfileRecords.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.date} ({r.overallResult}) — {r.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            <span className="text-[11px] font-bold text-slate-300 block">Available Passport Records:</span>
            {beamProfileRecords.map(rec => {
              const isPrev = prevBeamProfileRecord?.id === rec.id;
              const isCurr = currBeamProfileRecord?.id === rec.id;

              return (
                <div
                  key={rec.id}
                  className={`p-2.5 rounded border flex items-center justify-between font-mono text-xs ${
                    isCurr
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                      : isPrev
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-bold">{rec.date}</span>
                    <span className="text-slate-400 text-[10px] ml-2">ID: {rec.id.slice(0, 8)}</span>
                    <Badge variant={rec.overallResult === 'PASS' ? 'success' : 'danger'} className="ml-2 text-[9px]">
                      {rec.overallResult}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isPrev && <Badge variant="warning" className="text-[9px]">PREVIOUS</Badge>}
                    {isCurr && <Badge variant="cyan" className="text-[9px]">CURRENT</Badge>}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBeamProfileRecord(rec.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition ml-2"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <Button
              onClick={() => {
                setIsSelectBeamProfileModalOpen(false);
                setIsEnterBeamProfileModalOpen(true);
              }}
              variant="outline"
              className="text-xs border-cyan-800 text-cyan-300 hover:bg-cyan-950 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Enter New Beam Check
            </Button>
            <Button onClick={() => setIsSelectBeamProfileModalOpen(false)} className="bg-cyan-500 text-slate-950 font-bold text-xs py-1.5 px-4">
              Apply Selected Pair
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 14: SELECT REPORT EVIDENCE CHECKPOINTS */}
      <Modal
        isOpen={isSelectEvidenceModalOpen}
        onClose={() => setIsSelectEvidenceModalOpen(false)}
        title="Select Beam Profile Report Evidence Checkpoints"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs font-sans">
          <p className="text-slate-400">
            Choose which specific beam profile checkpoints to include on the printable A4 Machine Health Report. This selection controls report evidence display only; all engineering history remains recorded.
          </p>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200">
              Selected Checkpoints: <span className="text-cyan-400">{selectedEvidenceCheckpoints.length} / {CHECKPOINT_SPECS.length}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedEvidenceCheckpoints(DEFAULT_EVIDENCE_CHECKPOINTS)}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Reset Default (6 Items)
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setSelectedEvidenceCheckpoints(CHECKPOINT_SPECS.map(s => s.id))}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Select All
              </button>
            </div>
          </div>

          {/* Laser 1 Group */}
          <div className="space-y-2">
            <h5 className="font-bold text-amber-400 uppercase tracking-wide text-[11px]">Laser 1 Checkpoints</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 1').map(s => {
                const isSelected = selectedEvidenceCheckpoints.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`p-2 rounded border cursor-pointer flex items-center gap-2 transition ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 text-amber-100'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvidenceCheckpoints(prev => [...prev, s.id]);
                        } else {
                          setSelectedEvidenceCheckpoints(prev => prev.filter(id => id !== s.id));
                        }
                      }}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold block truncate">{s.stageLabel}</span>
                      <span className="text-[9px] text-slate-400 block font-mono">{s.specText}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Laser 2 Group */}
          <div className="space-y-2">
            <h5 className="font-bold text-cyan-400 uppercase tracking-wide text-[11px]">Laser 2 Checkpoints</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 2').map(s => {
                const isSelected = selectedEvidenceCheckpoints.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`p-2 rounded border cursor-pointer flex items-center gap-2 transition ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-100'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvidenceCheckpoints(prev => [...prev, s.id]);
                        } else {
                          setSelectedEvidenceCheckpoints(prev => prev.filter(id => id !== s.id));
                        }
                      }}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold block truncate">{s.stageLabel}</span>
                      <span className="text-[9px] text-slate-400 block font-mono">{s.specText}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <span className="text-[10px] text-slate-500">
              {selectedEvidenceCheckpoints.length > 6 ? '⚠️ >6 items selected; A4 PDF may wrap.' : '✓ Optimal A4 export capacity (≤6 items).'}
            </span>
            <Button onClick={() => setIsSelectEvidenceModalOpen(false)} className="bg-cyan-500 text-slate-950 font-bold text-xs py-1.5 px-4">
              Done & Update Report
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 15: ENTER NEW BEAM PROFILE CHECK FROM MHC */}
      <MhcEnterBeamProfileModal
        isOpen={isEnterBeamProfileModalOpen}
        onClose={() => setIsEnterBeamProfileModalOpen(false)}
        machine={machine}
        onSave={handleSaveBeamCheckFromMhc}
      />

      {/* MODAL 16: SELECT SAVED PRODUCT & PROCESS RECORDS */}
      <Modal
        isOpen={isSelectProductProcessModalOpen}
        onClose={() => setIsSelectProductProcessModalOpen(false)}
        title="Select Machine Passport Product & Process Records"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs font-sans">
          <p className="text-slate-400">
            Select PREVIOUS and CURRENT product & process engineering records bound to <strong className="text-slate-200">{machine.name} ({machine.serialNumber})</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Previous Selection */}
            <div className="space-y-2">
              <h5 className="font-bold text-amber-400 uppercase tracking-wide text-[11px]">Previous Record</h5>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {productProcessRecords.map(rec => {
                  const isSelected = (selectedPrevProductProcessRecordId || prevProductProcessRecord?.id) === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedPrevProductProcessRecordId(rec.id)}
                      className={`p-2 rounded border cursor-pointer transition ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 text-amber-100 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold">{rec.date}</span>
                        <span className="text-[10px] text-slate-400">{rec.productName || 'No Product'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Recipe: {rec.recipeName || '—'} | Lot: {rec.lotPanel || '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Selection */}
            <div className="space-y-2">
              <h5 className="font-bold text-cyan-400 uppercase tracking-wide text-[11px]">Current Record</h5>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {productProcessRecords.map(rec => {
                  const isSelected = (selectedCurrProductProcessRecordId || currProductProcessRecord?.id) === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedCurrProductProcessRecordId(rec.id)}
                      className={`p-2 rounded border cursor-pointer transition ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 text-cyan-100 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold">{rec.date}</span>
                        <span className="text-[10px] text-slate-400">{rec.productName || 'No Product'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Recipe: {rec.recipeName || '—'} | Lot: {rec.lotPanel || '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <Button
              onClick={() => {
                setIsSelectProductProcessModalOpen(false);
                setIsEnterProductProcessModalOpen(true);
              }}
              variant="outline"
              className="text-xs border-cyan-800 text-cyan-300 hover:bg-cyan-950 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Enter New Record
            </Button>
            <Button onClick={() => setIsSelectProductProcessModalOpen(false)} className="bg-cyan-500 text-slate-950 font-bold text-xs py-1.5 px-4">
              Apply Selected Pair
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 17: SELECT PRODUCT & PROCESS REPORT EVIDENCE */}
      <Modal
        isOpen={isSelectProductProcessEvidenceModalOpen}
        onClose={() => setIsSelectProductProcessEvidenceModalOpen(false)}
        title="Select Product & Process Report Evidence"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs font-sans">
          <p className="text-slate-400">
            Choose which laser via quality evidence comparisons to include on the printable report. This affects report output display only; history remains complete in Machine Passport.
          </p>

          <div className="space-y-2">
            <label className={`p-3 rounded border cursor-pointer flex items-center justify-between transition ${
              productProcessEvidenceSelection.includes('laser1')
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-100'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={productProcessEvidenceSelection.includes('laser1')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setProductProcessEvidenceSelection(prev => [...prev, 'laser1']);
                    } else {
                      setProductProcessEvidenceSelection(prev => prev.filter(x => x !== 'laser1'));
                    }
                  }}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="font-bold block">Laser 1 Via Quality</span>
                  <span className="text-[10px] text-slate-400">Top Drill (51±10µm) & Bottom Drill (23±10µm)</span>
                </div>
              </div>
            </label>

            <label className={`p-3 rounded border cursor-pointer flex items-center justify-between transition ${
              productProcessEvidenceSelection.includes('laser2')
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-100'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={productProcessEvidenceSelection.includes('laser2')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setProductProcessEvidenceSelection(prev => [...prev, 'laser2']);
                    } else {
                      setProductProcessEvidenceSelection(prev => prev.filter(x => x !== 'laser2'));
                    }
                  }}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="font-bold block">Laser 2 Via Quality</span>
                  <span className="text-[10px] text-slate-400">Top Drill (51±10µm) & Bottom Drill (23±10µm)</span>
                </div>
              </div>
            </label>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <span className="text-[10px] text-slate-500">
              ✓ Optimal A4 PDF evidence rendering
            </span>
            <Button onClick={() => setIsSelectProductProcessEvidenceModalOpen(false)} className="bg-cyan-500 text-slate-950 font-bold text-xs py-1.5 px-4">
              Done & Update Report
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 18: ENTER NEW PRODUCT & PROCESS CHECK FROM MHC */}
      <MhcEnterProductProcessModal
        isOpen={isEnterProductProcessModalOpen}
        onClose={() => setIsEnterProductProcessModalOpen(false)}
        machine={machine}
        onSave={handleSaveProductProcessFromMhc}
      />

      {/* Hidden File Input for Direct Temperature Log Import inside Smart MHC */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".log,.txt"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
    </div>
  );
};
