import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw,
  Calendar, 
  Clock, 
  Building2, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  FileBarChart2, 
  CalendarDays,
  Activity,
  Sliders,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { NavigationTab, Machine, ExecutionScheduleItem, FieldEngineerTask, EngineerProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface StartPageModuleProps {
  onNavigate: (tab: NavigationTab) => void;
  schedule?: ExecutionScheduleItem[];
  machines?: Machine[];
  tasks?: FieldEngineerTask[];
  onSelectMachine?: (id: string) => void;
  profile?: EngineerProfile;
  unreadNotificationsCount?: number;
}

export const StartPageModule: React.FC<StartPageModuleProps> = ({
  onNavigate,
  onSelectMachine,
  profile,
  unreadNotificationsCount = 0
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Mission lifecycle state (persisted in local state, default to ready to start)
  const [isMissionActive, setIsMissionActive] = useState<boolean>(false);

  // Today's Date
  const todayDateString = 'Monday, 03 August 2026';

  const greetingName = profile?.name && profile.name.trim() !== '' ? profile.name : 'Engineer';

  const handlePrimaryAction = () => {
    if (!isMissionActive) {
      setIsMissionActive(true);
      onNavigate('workflow_guide');
    } else {
      onNavigate('workflow_guide');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-2 md:py-6 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header & Welcome Greeting */}
      <div className={`p-6 md:p-8 rounded-3xl border transition-all ${
        isDark 
          ? 'bg-[#1A1D21] border-[#2B323A]/80 text-[#F3F4F6]' 
          : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                isDark 
                  ? 'bg-[#8B9DFF]/15 text-[#8B9DFF] border-[#8B9DFF]/30' 
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}>
                OPERATIONAL HOME PAGE • v1.0.15
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Shift Active
              </span>
              {unreadNotificationsCount > 0 && (
                <button 
                  onClick={() => onNavigate('settings')}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                    isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  🔔 {unreadNotificationsCount} Notifications
                </button>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Good Morning, {greetingName}
            </h1>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-1">
              Welcome back. {profile?.company ? `${profile.company} • ${profile.department || 'Service Operations'}` : 'You have 2 scheduled missions assigned today.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 ${
              isDark ? 'bg-[#20252B] border-[#2B323A] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-[#8B9DFF]" />
              <span>{todayDateString}</span>
            </div>

            {/* Quick state switch toggle for testing active mission states */}
            <button
              onClick={() => setIsMissionActive(!isMissionActive)}
              title="Toggle Active Mission state for testing"
              className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1.5 font-mono ${
                isMissionActive
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  : 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden md:inline font-semibold">
                {isMissionActive ? 'Simulate Unstarted' : 'Simulate Active'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Today's Primary Mission Hero Section */}
      <div className={`p-6 md:p-8 rounded-3xl border transition-all relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-[#252B33] via-[#1C2026] to-[#171A1E] border-[#8B9DFF]/40 text-[#F3F4F6] shadow-xl ring-1 ring-[#8B9DFF]/20' 
          : 'bg-gradient-to-br from-indigo-50/90 via-slate-50 to-white border-indigo-200/90 text-slate-900 shadow-sm ring-1 ring-indigo-500/10'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-extrabold tracking-wider text-indigo-700 dark:text-[#8B9DFF] uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-[#8B9DFF]" />
                TODAY'S PRIMARY MISSION
              </span>
              <Badge variant={isMissionActive ? 'amber' : 'emerald'}>
                {isMissionActive ? 'IN PROGRESS' : 'READY TO START'}
              </Badge>
              <Badge variant="blue">HIGH PRIORITY</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isDark ? 'bg-[#1A1D21]/80 border-[#2B323A]/80' : 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-200'
              }`}>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-mono uppercase font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-[#8B9DFF]" />
                  <span>Customer</span>
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  STMicroelectronics Muar
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">Plant 2 Cleanroom</p>
              </div>

              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isDark ? 'bg-[#1A1D21]/80 border-[#2B323A]/80' : 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-200'
              }`}>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-mono uppercase font-semibold">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-[#7FD4A6]" />
                  <span>Machine</span>
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                  ASM Eagle XP-01
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">Precision Laser Dicing</p>
              </div>

              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isDark ? 'bg-[#1A1D21]/80 border-[#2B323A]/80' : 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-200'
              }`}>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-mono uppercase font-semibold">
                  <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-[#8ECDF7]" />
                  <span>Mission Type</span>
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Quarterly Health Check
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">8-Point MHC Audit</p>
              </div>

              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isDark ? 'bg-[#1A1D21]/80 border-[#2B323A]/80' : 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-200'
              }`}>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-mono uppercase font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-[#EFCB7A]" />
                  <span>Est. Duration</span>
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                  3 Days (SLA Active)
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">On Schedule</p>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="lg:shrink-0 flex flex-col justify-center gap-2 pt-2 lg:pt-0">
            <Button
              variant="primary"
              size="lg"
              icon={isMissionActive ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              onClick={handlePrimaryAction}
              className="w-full lg:w-auto text-base font-extrabold px-8 py-4 shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {isMissionActive ? 'Continue Mission' : 'Start Today\'s Mission'}
            </Button>
            <p className="text-[11px] text-center text-slate-600 dark:text-slate-400 font-mono font-medium">
              {isMissionActive ? 'Resume Active SOP Workflow' : 'Launches Guided Workflow (SOP)'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Status KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border space-y-1 ${
          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow'
        }`}>
          <p className="text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 font-bold">Machines Scheduled</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-mono font-extrabold text-slate-900 dark:text-slate-100">2</span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">On Site</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border space-y-1 ${
          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow'
        }`}>
          <p className="text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 font-bold">Contract Days Remaining</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-mono font-extrabold text-indigo-700 dark:text-[#8B9DFF]">68</span>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-semibold">SLA Active</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border space-y-1 ${
          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow'
        }`}>
          <p className="text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 font-bold">Reports Pending</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-mono font-extrabold text-amber-700 dark:text-[#EFCB7A]">1</span>
            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold">Draft Saved</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border space-y-1 ${
          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow'
        }`}>
          <p className="text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 font-bold">Overdue Tasks</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-mono font-extrabold text-emerald-700 dark:text-emerald-400">0</span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">All Clear</span>
          </div>
        </div>
      </div>

      {/* 4. Two Column Layout: Today's Schedule & Upcoming Work */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols wide): Today's Schedule Timeline */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#2B323A] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-[#8B9DFF]" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase font-mono tracking-wider">
                TODAY'S SCHEDULE
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold">3 Operational Slots</span>
          </div>

          <div className="space-y-3">
            {/* Slot 1 */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
              isDark 
                ? 'bg-[#20252B] border-[#2B323A] hover:border-[#8B9DFF]/50' 
                : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white shadow-2xs'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold shrink-0 ${
                  isDark ? 'bg-[#8B9DFF]/15 text-[#8B9DFF] border-[#8B9DFF]/30' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}>
                  09:00
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Machine Health Check
                  </h4>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                    ASM Eagle XP-01 • STMicroelectronics
                  </p>
                </div>
              </div>
              <Badge variant="emerald">ACTIVE SLOT</Badge>
            </div>

            {/* Slot 2 */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
              isDark 
                ? 'bg-[#20252B] border-[#2B323A] hover:border-[#7FD4A6]/50' 
                : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-white shadow-2xs'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold shrink-0 ${
                  isDark ? 'bg-[#7FD4A6]/15 text-[#7FD4A6] border-[#7FD4A6]/30' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  13:30
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Laser Calibration
                  </h4>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                    ASM Eagle XP-02 • STMicroelectronics
                  </p>
                </div>
              </div>
              <Badge variant="gray">UPCOMING</Badge>
            </div>

            {/* Slot 3 */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
              isDark 
                ? 'bg-[#20252B] border-[#2B323A] hover:border-[#EFCB7A]/50' 
                : 'bg-slate-50 border-slate-200 hover:border-amber-300 hover:bg-white shadow-2xs'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold shrink-0 ${
                  isDark ? 'bg-[#EFCB7A]/15 text-[#EFCB7A] border-[#EFCB7A]/30' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  16:00
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Generate Service Report
                  </h4>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                    Executive Sign-off & Client Archival
                  </p>
                </div>
              </div>
              <Badge variant="gray">PLANNED</Badge>
            </div>
          </div>
        </div>

        {/* Right Column (1 col wide): Upcoming Work Schedule */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#2B323A] pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-[#7FD4A6]" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase font-mono tracking-wider">
                UPCOMING WORK
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold">3 Days Out</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Tomorrow */}
            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#20252B] border-[#2B323A]' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <span className="font-mono text-[10px] uppercase font-bold text-indigo-700 dark:text-[#8B9DFF] block mb-1">
                TOMORROW (03 AUG)
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-mono text-xs">
                <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-[#7FD4A6]" />
                ASM Eagle XP-03
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">Laser Optics Alignment & Cleanroom Audit</p>
            </div>

            {/* Tuesday */}
            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#20252B] border-[#2B323A]' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <span className="font-mono text-[10px] uppercase font-bold text-sky-700 dark:text-[#8ECDF7] block mb-1">
                TUESDAY (04 AUG)
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-mono text-xs">
                <Cpu className="w-3.5 h-3.5 text-sky-600 dark:text-[#8ECDF7]" />
                ASM Eagle XP-04
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">Diode Power Offset Calibration</p>
            </div>

            {/* Wednesday */}
            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#20252B] border-[#2B323A]' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <span className="font-mono text-[10px] uppercase font-bold text-amber-700 dark:text-[#EFCB7A] block mb-1">
                WEDNESDAY (05 AUG)
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-mono text-xs">
                <Cpu className="w-3.5 h-3.5 text-amber-600 dark:text-[#EFCB7A]" />
                ASM Eagle XP-05
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">DI Water Filter Swap & PM Inspection</p>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Quick Access Module Shortcuts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
            QUICK ACCESS MODULES
          </h3>
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-semibold">Shortcut Access • Reuse Existing Modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Machine Passport */}
          <div 
            onClick={() => onNavigate('machines')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
              isDark 
                ? 'bg-[#1A1D21] border-[#2B323A] hover:border-[#8ECDF7]/50 hover:bg-[#20252B]' 
                : 'bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-md shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#8ECDF7]/15 text-[#8ECDF7]' : 'bg-sky-50 text-sky-700'
              }`}>
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-[#8ECDF7] transition-colors">
                  Machine Passport
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Laser fleet history & MHC
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Card 2: Workflow Guide */}
          <div 
            onClick={() => onNavigate('workflow_guide')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
              isDark 
                ? 'bg-[#1A1D21] border-[#2B323A] hover:border-[#8B9DFF]/50 hover:bg-[#20252B]' 
                : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#8B9DFF]/15 text-[#8B9DFF]' : 'bg-indigo-50 text-indigo-700'
              }`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-[#8B9DFF] transition-colors">
                  Workflow Guide
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  6-Phase Cleanroom SOP
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Card 3: Execution Planner */}
          <div 
            onClick={() => onNavigate('planner')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
              isDark 
                ? 'bg-[#1A1D21] border-[#2B323A] hover:border-[#7FD4A6]/50 hover:bg-[#20252B]' 
                : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-md shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#7FD4A6]/15 text-[#7FD4A6]' : 'bg-emerald-50 text-emerald-700'
              }`}>
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-[#7FD4A6] transition-colors">
                  Execution Planner
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  2-Year contract SLA schedule
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Card 4: Report Studio */}
          <div 
            onClick={() => onNavigate('reports')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
              isDark 
                ? 'bg-[#1A1D21] border-[#2B323A] hover:border-[#EFCB7A]/50 hover:bg-[#20252B]' 
                : 'bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-md shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#EFCB7A]/15 text-[#EFCB7A]' : 'bg-amber-50 text-amber-700'
              }`}>
                <FileBarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-[#EFCB7A] transition-colors">
                  Report Studio
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Executive PDF report engine
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </div>

        </div>
      </div>

    </div>
  );
};
