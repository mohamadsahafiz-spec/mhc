import React from 'react';
import { 
  Activity, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Zap, 
  Thermometer, 
  Eye, 
  Sliders, 
  FileCheck2, 
  Plus, 
  FileText, 
  ShieldCheck, 
  Play, 
  RotateCcw,
  Building2,
  ChevronRight
} from 'lucide-react';
import { Machine, MHCRecord } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { HealthGauge } from '../common/HealthGauge';
import { Button } from '../common/Button';

interface MHCModeHomeProps {
  machines: Machine[];
  mhcRecords: MHCRecord[];
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  onOpenMhcInspection: (machineId: string) => void;
  onAddMachine?: () => void;
}

export const MHCModeHome: React.FC<MHCModeHomeProps> = ({
  machines,
  mhcRecords,
  selectedMachineId,
  onSelectMachine,
  onOpenMhcInspection,
  onAddMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];

  // Find recent MHC records for selected machine
  const machineRecords = selectedMachine ? mhcRecords.filter((r) => r.machineId === selectedMachine.id) : [];
  const latestRecord = machineRecords[0];

  // Workflow steps pipeline definition
  const workflowSteps = [
    { num: 1, title: 'Machine Passport Summary', desc: 'Identify machine, customer, line, installation date & baseline date', icon: <Cpu className="w-4 h-4 text-indigo-400" /> },
    { num: 2, title: 'Laser Hour Monitoring', desc: 'Verify lifetime hours vs baseline & warning/critical thresholds', icon: <Clock className="w-4 h-4 text-sky-400" /> },
    { num: 3, title: 'Laser Output & Power', desc: 'Measure main oscillator & auxiliary amplifier power stability', icon: <Zap className="w-4 h-4 text-amber-400" /> },
    { num: 4, title: 'Optics & Beam Profile', desc: 'Evaluate beam waist, focus offset, cleanliness score & M² value', icon: <Eye className="w-4 h-4 text-purple-400" /> },
    { num: 5, title: 'Chiller / Thermal Cooling', desc: 'Check flow rate (LPM), coolant temperature & DI water conductivity', icon: <Thermometer className="w-4 h-4 text-cyan-400" /> },
    { num: 6, title: 'Before & After Inspection', desc: 'Upload high-resolution cleanroom photos of components', icon: <Sliders className="w-4 h-4 text-emerald-400" /> },
    { num: 7, title: 'Engineer Remarks', desc: 'Document observations, recommendations & production release verdict', icon: <FileText className="w-4 h-4 text-rose-400" /> },
    { num: 8, title: 'Generate MHC Report', desc: 'Produce official customer-ready executive inspection certificate', icon: <FileCheck2 className="w-4 h-4 text-indigo-400" /> }
  ];

  return (
    <div className="max-w-6xl mx-auto py-2 md:py-6 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-[#181C22] via-[#14171A] to-[#1A1E24] border-[#2B323A] text-slate-100' 
          : 'bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-400" />
                MHC OPERATIONAL WORKSPACE MODE
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Focused Field Mode Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Machine Health Check (MHC)
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
              Select a target laser system from the cleanroom fleet to launch or continue a comprehensive 8-stage Health Check inspection.
            </p>
          </div>

          {selectedMachine && (
            <div className="shrink-0 flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <HealthGauge score={selectedMachine.healthScore} size="sm" />
              <div>
                <p className="text-[10px] font-mono text-slate-300 uppercase">Selected Machine</p>
                <p className="text-xs font-bold font-mono text-white">{selectedMachine.model}</p>
                <p className="text-[11px] text-slate-300 font-mono">SN: {selectedMachine.serialNumber}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Part 13: Empty State Handling (No Machines) */}
      {machines.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-300' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <Cpu className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold">No Machines Registered</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            There are currently no laser machines in the system directory. Register a machine to start Health Check inspections.
          </p>
          {onAddMachine && (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={onAddMachine}>
              Add Machine to System
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Section 1: Select Machine Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Step 1: Select Laser Machine
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>
                  Choose from {machines.length} operational machines assigned to your cleanroom mission
                </p>
              </div>

              {onAddMachine && (
                <button
                  onClick={onAddMachine}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                    isDark ? 'bg-[#1C2024] border-[#2B323A] text-slate-200 hover:bg-[#252A30]' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Register Machine</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machines.map((machine) => {
                const isSelected = machine.id === selectedMachine?.id;
                const recs = mhcRecords.filter(r => r.machineId === machine.id);
                const hasIncomplete = recs.some(r => r.releaseVerdict === 'CONDITIONAL_RELEASE');
                
                return (
                  <div
                    key={machine.id}
                    onClick={() => onSelectMachine(machine.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative group ${
                      isSelected
                        ? isDark
                          ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/30 text-white shadow-lg'
                          : 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 shadow-md'
                        : isDark
                          ? 'bg-[#14171A] border-[#2B323A] hover:bg-[#1A1E22] text-slate-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isSelected
                            ? 'bg-indigo-500 text-white'
                            : isDark ? 'bg-[#20252B] text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {machine.machineNumber}
                        </span>
                        <h3 className="text-sm font-bold mt-1 font-mono tracking-tight group-hover:text-indigo-400 transition-colors">
                          {machine.model}
                        </h3>
                      </div>
                      <HealthGauge score={machine.healthScore} size="sm" showLabel={false} />
                    </div>

                    <p className="text-xs font-medium text-slate-400 flex items-center gap-1 truncate mb-3">
                      <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{machine.customerName}</span>
                      <span className="opacity-60">•</span>
                      <span>{machine.plantName}</span>
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-200/20">
                      <span className="text-slate-500">S/N: {machine.serialNumber}</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold ${
                        machine.status === 'OPERATIONAL'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {machine.status}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Selected Machine Actions & Inspection Triggers */}
          {selectedMachine && (
            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                      Step 2: Operational Action
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Target: {selectedMachine.model} ({selectedMachine.machineNumber})
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Ready to Execute Health Check Inspection
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xl">
                    Launch the 8-stage cleanroom inspection checklist for {selectedMachine.customerName} ({selectedMachine.plantName}) line {selectedMachine.productionLineName}.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Action 1: Continue or Start MHC */}
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Play className="w-4 h-4 fill-current" />}
                    onClick={() => onOpenMhcInspection(selectedMachine.id)}
                  >
                    {latestRecord ? 'Continue MHC Workspace' : 'Start Smart MHC Workspace'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: 8-Stage MHC Inspection Pipeline Overview */}
          <div className="space-y-4 pt-2">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Stage 3: 8-Stage Inspection Sequence
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>
                Sequential cleanroom inspection workflow required to generate certified customer MHC report
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {workflowSteps.map((step) => (
                <div
                  key={step.num}
                  onClick={() => selectedMachine && onOpenMhcInspection(selectedMachine.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all group ${
                    isDark
                      ? 'bg-[#14171A] border-[#2B323A] hover:bg-[#1C2024] hover:border-indigo-500/50'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-indigo-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">
                      {step.num}
                    </span>
                    <div className="p-1 rounded bg-slate-800/40 opacity-80 group-hover:opacity-100 transition-opacity">
                      {step.icon}
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
