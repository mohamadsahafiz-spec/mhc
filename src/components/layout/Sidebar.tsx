import React, { useState, useEffect } from 'react';
import { 
  Compass,
  BookOpenCheck,
  LayoutDashboard, 
  FileText, 
  CalendarDays, 
  Building2, 
  Cpu, 
  Activity, 
  Zap, 
  SlidersHorizontal, 
  AlertOctagon, 
  FileBarChart, 
  LineChart, 
  BookOpen, 
  Settings, 
  Users,
  User,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Clock,
  Sliders,
  Eye,
  Thermometer,
  CheckCircle2,
  Package,
  Sparkles,
  LayoutTemplate,
  History,
  FolderTree,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { NavigationTab, EngineerProfile, WorkspaceMode } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { UserAvatar } from '../common/UserAvatar';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  urgentAlertsCount: number;
  profile?: EngineerProfile;
  workspaceMode?: WorkspaceMode;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  isSubItem?: boolean;
}

interface NavGroup {
  key: string;
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  urgentAlertsCount,
  profile,
  workspaceMode = 'MHC_MODE'
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const isMhcMode = workspaceMode === 'MHC_MODE';

  // Sidebar Rail Collapse State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('fsos_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('fsos_sidebar_collapsed', String(nextState));
  };

  // Engineering Data sub-collapse state
  const [isEngDataOpen, setIsEngDataOpen] = useState<boolean>(() => {
    return activeTab.startsWith('mhc_0');
  });

  const rawNavGroups: NavGroup[] = [
    {
      key: 'daily_work',
      title: 'DAILY WORK',
      items: [
        { id: 'start_page', label: 'Daily Work', icon: <Compass className="w-4 h-4" /> },
        { id: 'mission_control', label: 'Mission Control', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'workflow_guide', label: 'Workflow Guide (SOP)', icon: <BookOpenCheck className="w-4 h-4" /> },
      ]
    },
    {
      key: 'mhc_category',
      title: 'MACHINE HEALTH CHECK',
      items: [
        { id: 'mhc', label: '★ Smart MHC Workspace', icon: <Sparkles className="w-4 h-4 text-[#8B9DFF]" /> },
        { id: 'mhc_templates', label: 'Report Templates', icon: <LayoutTemplate className="w-4 h-4 text-sky-400" /> },
        { id: 'mhc_history', label: 'MHC History', icon: <History className="w-4 h-4 text-emerald-400" /> },
        { id: 'mhc_01', label: '01 Current Laser Hour', icon: <Clock className="w-4 h-4 text-sky-400" />, isSubItem: true },
        { id: 'mhc_02', label: '02 Laser Profile / Product', icon: <Sliders className="w-4 h-4 text-purple-400" />, isSubItem: true },
        { id: 'mhc_03', label: '03 Laser Output & Power', icon: <Zap className="w-4 h-4 text-amber-400" />, isSubItem: true },
        { id: 'mhc_04', label: '04 Optics & Beam Profile', icon: <Eye className="w-4 h-4 text-indigo-400" />, isSubItem: true },
        { id: 'mhc_05', label: '05 Cooling System', icon: <Thermometer className="w-4 h-4 text-cyan-400" />, isSubItem: true },
        { id: 'mhc_06', label: '06 Product Quality / Visual', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, isSubItem: true },
        { id: 'mhc_07', label: '07 Spare Parts & Consumable', icon: <Package className="w-4 h-4 text-orange-400" />, isSubItem: true },
        { id: 'mhc_08', label: '08 Engineer Remarks', icon: <FileText className="w-4 h-4 text-rose-400" />, isSubItem: true },
      ]
    },
    {
      key: 'service_execution',
      title: 'SERVICE EXECUTION',
      items: [
        { id: 'machines', label: 'Machine Passport', icon: <Cpu className="w-4 h-4" /> },
        { id: 'laser_calibration', label: 'Laser Calibration', icon: <Zap className="w-4 h-4" /> },
        { id: 'baseline_check', label: 'Baseline Checks', icon: <SlidersHorizontal className="w-4 h-4" /> },
        { id: 'quality_investigation', label: 'Quality Investigation', icon: <AlertOctagon className="w-4 h-4" />, badge: urgentAlertsCount },
        { id: 'planner', label: 'Execution Planner', icon: <CalendarDays className="w-4 h-4" /> },
        { id: 'reports', label: 'Executive Reports', icon: <FileBarChart className="w-4 h-4" /> },
      ]
    },
    {
      key: 'operations',
      title: 'OPERATIONS',
      items: [
        { id: 'customers', label: 'Customers & Plants', icon: <Building2 className="w-4 h-4" /> },
        { id: 'contracts', label: 'Contracts', icon: <FileText className="w-4 h-4" /> },
        { id: 'analytics', label: 'Analytics', icon: <LineChart className="w-4 h-4" /> },
      ]
    },
    {
      key: 'smart_tools',
      title: 'SMART TOOLS',
      items: [
        { id: 'knowledge_base', label: 'Knowledge Base', icon: <BookOpen className="w-4 h-4" /> },
      ]
    },
    {
      key: 'system',
      title: 'SYSTEM',
      items: [
        { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
        { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
      ]
    }
  ];

  // Filter nav items based on Workspace Mode
  const navGroups: NavGroup[] = rawNavGroups.map(group => {
    if (!isMhcMode) return group;

    // In MHC Mode, keep only operationally relevant tabs
    let allowedIds: NavigationTab[] = [];
    if (group.key === 'daily_work') {
      allowedIds = ['start_page', 'mission_control'];
    } else if (group.key === 'mhc_category') {
      allowedIds = ['mhc', 'mhc_templates', 'mhc_history', 'mhc_01', 'mhc_02', 'mhc_03', 'mhc_04', 'mhc_05', 'mhc_06', 'mhc_07', 'mhc_08'];
    } else if (group.key === 'service_execution') {
      allowedIds = ['machines', 'reports'];
    } else if (group.key === 'system') {
      allowedIds = ['profile', 'settings'];
    }

    return {
      ...group,
      items: group.items.filter(item => allowedIds.includes(item.id))
    };
  }).filter(group => group.items.length > 0);

  // Collapsible Groups State
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const activeGroup = navGroups.find(g => g.items.some(i => i.id === activeTab));
    const initialState: Record<string, boolean> = {
      daily_work: false,
      mhc_category: true,
      service_execution: false,
      operations: false,
      smart_tools: false,
      system: false
    };
    if (activeGroup) {
      initialState[activeGroup.key] = true;
    } else {
      initialState.mhc_category = true;
    }
    return initialState;
  });

  useEffect(() => {
    const activeGroup = navGroups.find(g => g.items.some(i => i.id === activeTab));
    if (activeGroup) {
      setOpenGroups(prev => ({
        ...prev,
        [activeGroup.key]: true
      }));
    }
    if (activeTab.startsWith('mhc_0')) {
      setIsEngDataOpen(true);
    }
  }, [activeTab]);

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-60'} border-r flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-200 ${
      isDark 
        ? 'bg-[#111315] border-[#2B323A]/80 text-slate-300' 
        : 'bg-white border-slate-300/80 text-slate-900 shadow-xs'
    }`}>
      {/* Brand Header */}
      <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'bg-[#111315] border-[#2B323A]/60' : 'bg-slate-50 border-slate-200'}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isDark ? 'bg-[#8B9DFF]/20 text-[#8B9DFF] border border-[#8B9DFF]/30' : 'bg-indigo-600 text-white shadow-xs'
            }`}>
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>FIELD OPS</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                  isDark ? 'bg-[#8B9DFF]/10 text-[#8B9DFF] border-[#8B9DFF]/30' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}>
                  v0.9.1
                </span>
              </div>
              <p className={`text-[10px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Precision Laser Eng</p>
            </div>
          </div>
        ) : (
          <div className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center font-bold text-xs ${
            isDark ? 'bg-[#8B9DFF]/20 text-[#8B9DFF] border border-[#8B9DFF]/30' : 'bg-indigo-600 text-white shadow-xs'
          }`}>
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
        )}

        <button
          onClick={toggleSidebarCollapse}
          className={`p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Engineer Status Card */}
      {!isCollapsed ? (
        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2B323A]/40' : 'border-slate-100'}`}>
          <div 
            onClick={() => setActiveTab('profile')}
            title="Open My Profile"
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
              activeTab === 'profile'
                ? isDark ? 'bg-[#8B9DFF]/15 border-[#8B9DFF]/40 text-white' : 'bg-indigo-100 border-indigo-300 text-indigo-900'
                : isDark ? 'bg-[#1A1D21]/60 border-[#2B323A]/60 text-slate-300 hover:bg-[#20252B] hover:border-[#8B9DFF]/30' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <UserAvatar user={profile} size="sm" showStatus={true} status="Online" />
              <div className="truncate">
                <p className="text-[11px] font-semibold truncate">{profile?.name || 'Sahafiz'}</p>
                <p className={`text-[9px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>{profile?.role || 'Field Service Engineer'}</p>
              </div>
            </div>
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#8B9DFF]' : 'text-indigo-600'}`} />
          </div>
        </div>
      ) : (
        <div className="p-2 border-b flex justify-center">
          <div onClick={() => setActiveTab('profile')} className="cursor-pointer" title={profile?.name || 'My Profile'}>
            <UserAvatar user={profile} size="sm" showStatus={true} status="Online" />
          </div>
        </div>
      )}

      {/* Grouped Workflow Nav List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-3">
        {navGroups.map((group) => {
          const isOpen = !!openGroups[group.key];
          const hasActiveChild = group.items.some(i => i.id === activeTab);
          const groupBadgeCount = group.items.reduce((sum, item) => sum + (item.badge || 0), 0);

          const mainItems = group.items.filter(i => !i.isSubItem);
          const subItems = group.items.filter(i => i.isSubItem);

          return (
            <div key={group.key} className="space-y-1">
              {/* Group Header Button */}
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase transition-colors ${
                    hasActiveChild
                      ? isDark ? 'text-[#8B9DFF]' : 'text-indigo-700 font-bold'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isOpen ? <ChevronDown className="w-3 h-3 opacity-70" /> : <ChevronRight className="w-3 h-3 opacity-70" />}
                    <span>{group.title}</span>
                  </div>

                  {!isOpen && groupBadgeCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-[#E98A8A]/20 text-[#E98A8A] border border-[#E98A8A]/40">
                      {groupBadgeCount}
                    </span>
                  )}
                </button>
              ) : (
                <div className="w-full text-center py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" title={group.title} />
                </div>
              )}

              {/* Group Items Container */}
              {(isOpen || isCollapsed) && (
                <div className={`space-y-0.5 ${!isCollapsed ? 'pl-1 ml-1 border-l border-slate-200 dark:border-[#2B323A]/50' : ''}`}>
                  {/* Primary Group Items */}
                  {mainItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-all duration-150 group ${
                          isActive
                            ? isDark
                              ? 'bg-[#8B9DFF]/15 text-[#8B9DFF] font-medium border border-[#8B9DFF]/30'
                              : 'bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200/90 shadow-2xs'
                            : isDark
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1D21]/60'
                            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <div className={`flex items-center gap-2 min-w-0 ${isCollapsed ? 'mx-auto justify-center' : ''}`}>
                          <span className={`shrink-0 ${isActive ? (isDark ? 'text-[#8B9DFF]' : 'text-indigo-700') : 'text-slate-400 opacity-80 group-hover:opacity-100'}`}>
                            {item.icon}
                          </span>
                          {!isCollapsed && <span className="truncate text-left">{item.label}</span>}
                        </div>
                        {!isCollapsed && (
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {item.badge && item.badge > 0 ? (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                {item.badge}
                              </span>
                            ) : null}
                            {isActive && <ChevronRight className={`w-3 h-3 ${isDark ? 'text-[#8B9DFF]' : 'text-indigo-700'}`} />}
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Collapsed Sub-Group for Engineering Data (01-08) */}
                  {subItems.length > 0 && !isCollapsed && (
                    <div className="pt-1.5">
                      <button
                        onClick={() => setIsEngDataOpen(!isEngDataOpen)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          activeTab.startsWith('mhc_0')
                            ? isDark ? 'text-amber-400 font-bold' : 'text-amber-800 font-bold'
                            : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                          <span>Engineering Data</span>
                        </div>
                        {isEngDataOpen ? <ChevronDown className="w-3 h-3 opacity-70" /> : <ChevronRight className="w-3 h-3 opacity-70" />}
                      </button>

                      {isEngDataOpen && (
                        <div className="pl-3 mt-1 space-y-0.5 border-l border-amber-500/30 ml-2">
                          {subItems.map((sItem) => {
                            const isSubActive = activeTab === sItem.id;
                            return (
                              <button
                                key={sItem.id}
                                onClick={() => setActiveTab(sItem.id)}
                                className={`w-full flex items-center gap-2 px-2 py-1 rounded text-[11px] transition-all ${
                                  isSubActive
                                    ? isDark
                                      ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/40'
                                      : 'bg-amber-100 text-amber-900 font-semibold border border-amber-300'
                                    : isDark
                                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                              >
                                <span className="shrink-0">{sItem.icon}</span>
                                <span className="truncate text-left">{sItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer System Indicator */}
      <div className={`p-2.5 border-t text-[10px] font-mono flex items-center justify-between ${
        isDark ? 'bg-[#111315] border-[#2B323A]/60 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>FSO Engine</span>
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">v1.0.15</span>
          </>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500 mx-auto" title="FSO Engine Online v1.0.15" />
        )}
      </div>
    </aside>
  );
};
