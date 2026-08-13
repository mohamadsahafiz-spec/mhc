import React, { useState } from 'react';
import { CheckCircle2, Clock, Wrench, Play, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { NavigationTab } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { getThemeClasses } from '../../theme/tokens';

interface InspectionStageStepperProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickMhc: () => void;
}

export const InspectionStageStepper: React.FC<InspectionStageStepperProps> = ({
  onNavigate,
  onOpenQuickMhc
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const themeCls = getThemeClasses(isDark);
  const [activeStageId, setActiveStageId] = useState<number>(3);

  const stages = [
    {
      id: 1,
      title: 'ISO 4 Gowning & Safety Check',
      time: '08:10 AM',
      status: 'completed' as const,
      description: 'ESD wristband grounded, particulate count <10/m³, laser safety curtains verified.'
    },
    {
      id: 2,
      title: 'DI Filter Swap & De-aeration',
      time: '08:35 AM',
      status: 'completed' as const,
      description: 'Spent 0.2µm cartridge replaced. Chiller loop pressure re-established at 3.2 bar.'
    },
    {
      id: 3,
      title: 'Galvo Realignment & Beam Profiling',
      time: '08:50 AM (Active)',
      status: 'active' as const,
      description: 'Dual-axis galvo motor servo gain check & focal plane grid matrix mapping.'
    },
    {
      id: 4,
      title: '8-Point MHC Health Scan',
      time: 'Pending Stage 3',
      status: 'pending' as const,
      description: 'Automated laser power output, AGC circuit, and beam waist quality scoring.'
    },
    {
      id: 5,
      title: 'Executive Report & Sign-off',
      time: 'Pending Stage 4',
      status: 'pending' as const,
      description: 'Generate PDF report and request plant manager digital signature.'
    }
  ];

  return (
    <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-250 space-y-5 ${
      isDark 
        ? 'bg-[#20252B] border-[#2B323A]/80 text-[#F3F4F6]' 
        : 'bg-white border-slate-300/80 text-slate-900 shadow-sm'
    }`}>
      {/* Title & Sequential Stepper Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3.5 ${
        isDark ? 'border-[#2B323A]/50' : 'border-slate-200'
      }`}>
        <div>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5 ${
            isDark ? 'text-[#8B9DFF]' : 'text-indigo-700'
          }`}>
            WORKFLOW SEQUENCE
          </span>
          <h3 className="text-base font-bold tracking-tight">Today's Sequential Inspection Stages</h3>
        </div>
        <div className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
          Progress: <span className={`font-bold ${isDark ? 'text-[#8B9DFF]' : 'text-indigo-800'}`}>2 / 5 Completed</span>
        </div>
      </div>

      {/* Sequential Stepper Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const isCompleted = stage.status === 'completed';
          const isActive = stage.status === 'active';

          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? isDark 
                    ? 'bg-[#1A1D21] border-[#8B9DFF] text-slate-100 shadow-xs' 
                    : 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs ring-1 ring-indigo-200 font-semibold'
                  : isCompleted
                  ? isDark 
                    ? 'bg-[#1A1D21]/60 border-[#2B323A]/60 text-slate-300 hover:border-[#8B9DFF]/40' 
                    : 'bg-slate-50 border-slate-300/80 text-slate-800 hover:bg-slate-100'
                  : isDark 
                    ? 'bg-[#1A1D21]/30 border-[#2B323A]/40 text-slate-500' 
                    : 'bg-slate-50/70 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isActive 
                    ? isDark ? 'bg-[#8B9DFF] text-slate-950' : 'bg-indigo-600 text-white'
                    : isCompleted 
                    ? isDark ? 'bg-[#7FD4A6]/20 text-[#7FD4A6] border border-[#7FD4A6]/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isDark ? 'bg-[#2B323A]/60 text-slate-400' : 'bg-slate-200 text-slate-700'
                }`}>
                  STAGE {stage.id}
                </span>
                {isCompleted ? (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#7FD4A6]' : 'text-emerald-700'}`} />
                ) : isActive ? (
                  <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#8B9DFF]' : 'bg-indigo-600'}`} />
                ) : (
                  <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                )}
              </div>
              <p className="text-xs font-semibold truncate leading-snug">{stage.title}</p>
              <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{stage.time}</p>
            </button>
          );
        })}
      </div>

      {/* Active Stage Focus Detail Panel */}
      <div className={`p-4 rounded-xl border space-y-3.5 ${
        isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/80'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
          isDark ? 'border-[#2B323A]/50' : 'border-slate-200'
        }`}>
          <div>
            <span className={`text-[10px] font-mono font-bold uppercase block mb-0.5 ${
              isDark ? 'text-[#8B9DFF]' : 'text-indigo-700'
            }`}>ACTIVE STAGE DETAIL</span>
            <h4 className="text-sm font-bold">
              Stage 3: Galvo Scanner Realignment & Beam Profiling
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Wrench className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('laser_calibration')}
            >
              Calibration Studio
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
              onClick={onOpenQuickMhc}
            >
              Proceed to Stage 4 MHC
            </Button>
          </div>
        </div>

        {/* Contextual AI Workflow Advisory */}
        <div className={`p-3.5 rounded-xl border space-y-1.5 ${
          isDark 
            ? 'bg-[#8B9DFF]/10 border-[#8B9DFF]/25 text-slate-200' 
            : 'bg-indigo-50 border-indigo-200 text-slate-900 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-1.5 text-xs font-mono font-bold ${
              isDark ? 'text-[#8B9DFF]' : 'text-indigo-800'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              CONTEXTUAL AI ADVISORY
            </span>
            <span className="text-[10px] font-mono font-semibold opacity-90">98.4% Confidence</span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            "Galvo X-Axis step response latency changed by <strong className={isDark ? 'text-[#EFCB7A]' : 'text-amber-800 font-bold'}>2.1µs</strong> following filter swap. Recommended action: Trim X-galvo motor servo gain pot until step latency drops below 12µs before executing Stage 4 MHC."
          </p>
        </div>

        {/* Stage 3 Sub-tasks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-0.5">
          <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#20252B] border-[#2B323A]/60' : 'bg-white border-slate-300/70'}`}>
            <span className={`text-[10px] font-mono uppercase block mb-0.5 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Step 3.1: Target</span>
            <p className="font-semibold">Mount 9-point quartz target grid onto galvo focal plane</p>
            <span className={`text-[10px] font-mono flex items-center gap-1 mt-1 font-bold ${isDark ? 'text-[#7FD4A6]' : 'text-emerald-800'}`}>
              <CheckCircle2 className="w-3 h-3" /> VERIFIED
            </span>
          </div>

          <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#20252B] border-[#8B9DFF]/40' : 'bg-indigo-50 border-indigo-300'}`}>
            <span className={`text-[10px] font-mono uppercase font-bold block mb-0.5 ${isDark ? 'text-[#8B9DFF]' : 'text-indigo-800'}`}>Step 3.2: Gain Trim</span>
            <p className="font-semibold">Adjust X/Y galvo servo gain & trim latency &lt;12µs</p>
            <span className={`text-[10px] font-mono flex items-center gap-1 mt-1 font-bold ${isDark ? 'text-[#EFCB7A]' : 'text-amber-800'}`}>
              • IN PROGRESS
            </span>
          </div>

          <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#20252B] border-[#2B323A]/60' : 'bg-white border-slate-300/70'}`}>
            <span className={`text-[10px] font-mono uppercase block mb-0.5 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Step 3.3: Matrix Upload</span>
            <p className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Execute 81-point grid scan & upload 2D matrix</p>
            <span className={`text-[10px] font-mono block mt-1 font-bold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              PENDING STEP 3.2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

