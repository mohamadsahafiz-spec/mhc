/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  NavigationTab, 
  Customer, 
  Plant, 
  ProductionLine, 
  Machine, 
  Contract, 
  ExecutionScheduleItem, 
  MHCRecord, 
  FieldEngineerTask, 
  AlertItem, 
  QualityInvestigation, 
  BaselineCheck,
  EngineerProfile,
  NotificationItem,
  SystemUser,
  WorkspaceMode,
  UserSession
} from './types';
import { StorageService } from './utils/persistence';
import { ImageStore } from './utils/imageStore';
import { SyncEngine } from './utils/syncEngine';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './components/auth/LoginPage';

// Modules
import { StartPageModule } from './components/modules/StartPageModule';
import { MHCModeHome } from './components/modules/MHCModeHome';
import { WorkflowGuideModule } from './components/modules/WorkflowGuideModule';
import { MissionControl } from './components/modules/MissionControl';
import { ContractsModule } from './components/modules/ContractsModule';
import { ExecutionPlannerModule } from './components/modules/ExecutionPlannerModule';
import { CustomersPlantsModule } from './components/modules/CustomersPlantsModule';
import { MachinePassportModule } from './components/modules/MachinePassportModule';
import { MachineHealthCheckModule } from './components/modules/MachineHealthCheckModule';
import { LaserCalibrationModule } from './components/modules/LaserCalibrationModule';
import { BaselineCheckModule } from './components/modules/BaselineCheckModule';
import { QualityInvestigationModule } from './components/modules/QualityInvestigationModule';
import { AnalyticsModule } from './components/modules/AnalyticsModule';
import { KnowledgeBaseModule } from './components/modules/KnowledgeBaseModule';
import { UsersModule } from './components/modules/UsersModule';
import { ProfileModule } from './components/modules/ProfileModule';
import { SettingsModule } from './components/modules/SettingsModule';

function AppLayout() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('start_page');
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Auth & Workspace Mode State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('MHC_MODE');

  // Operational State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [schedule, setSchedule] = useState<ExecutionScheduleItem[]>([]);
  const [mhcRecords, setMhcRecords] = useState<MHCRecord[]>([]);
  const [tasks, setTasks] = useState<FieldEngineerTask[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [investigations, setInvestigations] = useState<QualityInvestigation[]>([]);
  const [baselines, setBaselines] = useState<BaselineCheck[]>([]);
  const [profile, setProfile] = useState<EngineerProfile>(StorageService.getProfile());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [activeUser, setActiveUser] = useState<SystemUser>({
    id: 'usr-8801',
    employeeId: 'EMP-EO-8801',
    fullName: 'Sahafiz',
    email: 'sahafiz@eotechnics.com',
    phone: '+60 12-882 1042',
    company: 'EO Technics',
    department: 'Service Operations',
    role: 'Field Service Engineer',
    status: 'Online',
    lastLogin: 'Active now',
    timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    bio: 'Lead Field Engineer specialized in TRUMPFTruMicro ultra-fast laser systems.'
  });

  // Load state from StorageService on mount
  useEffect(() => {
    // Check Auth Session
    const authSession = StorageService.getAuth();
    // Preload IDB images and initialize app state
    ImageStore.preloadAllImagesFromIDB().then(() => {
      const loadedMachines = StorageService.getMachines();
      setMachines(loadedMachines);
    });

    if (authSession && authSession.isAuthenticated) {
      setIsAuthenticated(true);
      const storedMode = authSession.workspaceMode || StorageService.getWorkspaceMode() || 'MHC_MODE';
      setWorkspaceMode(storedMode);
    } else {
      setIsAuthenticated(false);
    }

    setCustomers(StorageService.getCustomers());
    setPlants(StorageService.getPlants());
    setLines(StorageService.getLines());
    const loadedMachines = StorageService.getMachines();
    setMachines(loadedMachines);
    if (loadedMachines.length > 0 && !loadedMachines.some(m => m.id === selectedMachineId)) {
      setSelectedMachineId(loadedMachines[0].id);
    }
    setContracts(StorageService.getContracts());
    setSchedule(StorageService.getSchedule());
    setMhcRecords(StorageService.getMhcRecords());
    setTasks(StorageService.getTasks());
    setAlerts(StorageService.getAlerts());
    setInvestigations(StorageService.getInvestigations());
    setBaselines(StorageService.getBaselines());
    setProfile(StorageService.getProfile());
    setNotifications(StorageService.getNotifications());

    const loadedUsers = StorageService.getUsers();
    setUsers(loadedUsers);
    if (loadedUsers.length > 0) {
      setActiveUser(loadedUsers[0]);
    }

    // Auto-migrate existing IndexedDB / StorageService data to Cloud D1 queue
    SyncEngine.autoMigrateExistingData(StorageService.getAllLocalData);

    // Subscribe to SyncEngine remote updates to synchronize React UI
    const unsubscribeSync = SyncEngine.subscribe(() => {
      setMachines(StorageService.getMachines());
      setMhcRecords(StorageService.getMhcRecords());
      setCustomers(StorageService.getCustomers());
      setPlants(StorageService.getPlants());
      setLines(StorageService.getLines());
      setContracts(StorageService.getContracts());
      setTasks(StorageService.getTasks());
      setAlerts(StorageService.getAlerts());
    });

    return () => {
      unsubscribeSync();
    };
  }, []);

  // Auth & Workspace Mode Handlers
  const handleLoginSuccess = (session: UserSession) => {
    setIsAuthenticated(true);
    setWorkspaceMode(session.workspaceMode);
    StorageService.saveAuth(session);
    
    const matchedUser = users.find(u => u.id === session.userId);
    if (matchedUser) {
      setActiveUser(matchedUser);
    }

    if (session.workspaceMode === 'MHC_MODE') {
      setActiveTab('start_page');
    }
  };

  const handleLogout = () => {
    StorageService.clearAuth();
    setIsAuthenticated(false);
  };

  const handleModeChange = (newMode: WorkspaceMode) => {
    setWorkspaceMode(newMode);
    StorageService.saveWorkspaceMode(newMode);
    const currentAuth = StorageService.getAuth();
    if (currentAuth) {
      StorageService.saveAuth({ ...currentAuth, workspaceMode: newMode });
    }

    // Auto-redirect to start page if current active tab is not visible in MHC Mode
    if (newMode === 'MHC_MODE') {
      const mhcAllowedTabs: NavigationTab[] = ['start_page', 'workflow_guide', 'machines', 'mhc_autopilot', 'mhc', 'mhc_history', 'profile'];
      if (!mhcAllowedTabs.includes(activeTab)) {
        setActiveTab('start_page');
      }
    }
  };

  const handleSetActiveUser = (user: SystemUser) => {
    setActiveUser(user);
    const newProfile: EngineerProfile = {
      name: user.fullName,
      company: user.company,
      role: user.role,
      department: user.department,
      email: user.email,
      phone: user.phone
    };
    setProfile(newProfile);
    StorageService.saveProfile(newProfile);
  };

  const handleAddUser = (newUser: SystemUser) => {
    const updated = [newUser, ...users];
    setUsers(updated);
    StorageService.saveUsers(updated);
  };

  const handleUpdateUser = (updatedUser: SystemUser) => {
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    StorageService.saveUsers(updated);
    if (activeUser.id === updatedUser.id) {
      handleSetActiveUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    StorageService.saveUsers(updated);
  };

  const handleSaveProfile = (newProfile: EngineerProfile) => {
    setProfile(newProfile);
    StorageService.saveProfile(newProfile);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleMarkAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    StorageService.saveNotifications([]);
  };

  // Machine Management Helpers
  const handleAddMachine = (newMachine: Machine) => {
    const updated = [newMachine, ...machines];
    setMachines(updated);
    StorageService.saveMachines(updated);
    setSelectedMachineId(newMachine.id);
  };

  const handleEditMachine = (updatedMachine: Machine) => {
    const updated = machines.map((m) => (m.id === updatedMachine.id ? updatedMachine : m));
    setMachines(updated);
    StorageService.saveMachines(updated);
  };

  const handleDeleteMachine = (machineId: string) => {
    const updated = machines.filter((m) => m.id !== machineId);
    setMachines(updated);
    StorageService.saveMachines(updated);
    if (selectedMachineId === machineId) {
      setSelectedMachineId(updated.length > 0 ? updated[0].id : '');
    }
  };

  const handleBatchImportMachines = (importedMachines: Machine[]) => {
    setMachines(importedMachines);
    StorageService.saveMachines(importedMachines);
    if (importedMachines.length > 0) {
      setSelectedMachineId(importedMachines[0].id);
    }
  };

  // Customer Management Helpers
  const handleAddCustomer = (newCustomer: Customer) => {
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    StorageService.saveCustomers(updated);
  };

  const handleEditCustomer = (updatedCustomer: Customer) => {
    const updated = customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c));
    setCustomers(updated);
    StorageService.saveCustomers(updated);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const updated = customers.filter((c) => c.id !== customerId);
    setCustomers(updated);
    StorageService.saveCustomers(updated);
  };

  // Sync to persistence helpers
  const handleUpdateContract = (updatedContract: Contract) => {
    const updated = contracts.map((c) => (c.id === updatedContract.id ? updatedContract : c));
    setContracts(updated);
    StorageService.saveContracts(updated);
  };

  const handleAddScheduleItem = (newItem: ExecutionScheduleItem) => {
    const updated = [newItem, ...schedule];
    setSchedule(updated);
    StorageService.saveSchedule(updated);
  };

  const handleUpdateScheduleItem = (updatedItem: ExecutionScheduleItem) => {
    const updated = schedule.map((s) => (s.id === updatedItem.id ? updatedItem : s));
    setSchedule(updated);
    StorageService.saveSchedule(updated);
  };

  const handleDeleteScheduleItem = (itemId: string) => {
    const updated = schedule.filter((s) => s.id !== itemId);
    setSchedule(updated);
    StorageService.saveSchedule(updated);
  };

  const handleSaveMhcRecord = (record: MHCRecord) => {
    const updated = [record, ...mhcRecords];
    setMhcRecords(updated);
    StorageService.saveMhcRecords(updated);
  };

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    StorageService.saveTasks(updated);
  };

  const handleAddInvestigation = (inv: QualityInvestigation) => {
    const updated = [inv, ...investigations];
    setInvestigations(updated);
    StorageService.saveInvestigations(updated);
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all operational data to factory defaults?")) {
      StorageService.resetToDefaults();
      window.location.reload();
    }
  };

  const nextPriorityAction = machines.length > 0
    ? `Execute scheduled maintenance on ${machines[0].model} (${machines[0].machineNumber})`
    : "Awaiting Customer & Machine registration. Add equipment in Machine Passport to begin service.";

  if (!isAuthenticated) {
    return (
      <LoginPage
        users={users}
        activeUser={activeUser}
        savedWorkspaceMode={workspaceMode}
        onLoginSuccess={handleLoginSuccess}
        onLogin={(selectedUser) => {
          setActiveUser(selectedUser);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-250 ${
      isDark ? 'bg-[#111315] text-[#F3F4F6]' : 'bg-slate-100/80 text-slate-900'
    }`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        urgentAlertsCount={alerts.filter((a) => a.severity === 'CRITICAL').length}
        profile={profile}
        workspaceMode={workspaceMode}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          alerts={alerts}
          notifications={notifications}
          activeUser={activeUser}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onOpenQuickMhc={() => setActiveTab('mhc')}
          nextPriorityAction={nextPriorityAction}
          workspaceMode={workspaceMode}
          onModeChange={handleModeChange}
          onLogout={handleLogout}
        />

        <main className={`flex-1 ${
          (activeTab === 'mhc' || activeTab.startsWith('mhc_'))
            ? 'p-2 sm:p-3 max-w-none w-full overflow-y-auto'
            : activeTab === 'workflow_guide'
            ? 'p-4 md:p-6 max-w-7xl w-full mx-auto overflow-hidden flex flex-col h-[calc(100vh-4rem)]'
            : 'p-4 md:p-6 max-w-7xl w-full mx-auto overflow-y-auto'
        }`}>
          {activeTab === 'start_page' && (
            workspaceMode === 'MHC_MODE' ? (
              <MHCModeHome
                machines={machines}
                mhcRecords={mhcRecords}
                selectedMachineId={selectedMachineId}
                onSelectMachine={(id) => setSelectedMachineId(id)}
                onOpenMhcInspection={(id) => {
                  setSelectedMachineId(id);
                  setActiveTab('mhc');
                }}
                onAddMachine={() => {
                  setActiveTab('machines');
                }}
              />
            ) : (
              <StartPageModule
                onNavigate={setActiveTab}
                schedule={schedule}
                machines={machines}
                tasks={tasks}
                profile={profile}
                unreadNotificationsCount={notifications.filter(n => !n.read).length}
                onSelectMachine={(id) => {
                  setSelectedMachineId(id);
                  setActiveTab('machines');
                }}
              />
            )
          )}

          {activeTab === 'workflow_guide' && (
            <WorkflowGuideModule
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'mission_control' && (
            <MissionControl
              tasks={tasks}
              onToggleTask={handleToggleTask}
              alerts={alerts}
              contracts={contracts}
              machines={machines}
              schedule={schedule}
              recentMhcs={mhcRecords}
              onNavigate={setActiveTab}
              onOpenQuickMhc={() => setActiveTab('mhc')}
              onSelectMachine={(id) => {
                setSelectedMachineId(id);
                setActiveTab('machines');
              }}
            />
          )}

          {activeTab === 'contracts' && (
            <ContractsModule
              contracts={contracts}
              onUpdateContract={handleUpdateContract}
              onOpenPlannerForContract={() => setActiveTab('planner')}
            />
          )}

          {activeTab === 'planner' && (
            <ExecutionPlannerModule
              schedule={schedule}
              contracts={contracts}
              machines={machines}
              onAddScheduleItem={handleAddScheduleItem}
              onUpdateScheduleItem={handleUpdateScheduleItem}
              onDeleteScheduleItem={handleDeleteScheduleItem}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersPlantsModule
              customers={customers}
              plants={plants}
              lines={lines}
              machines={machines}
              onSelectMachine={(id) => {
                setSelectedMachineId(id);
                setActiveTab('machines');
              }}
            />
          )}

          {activeTab === 'machines' && (
            <MachinePassportModule
              machines={machines}
              customers={customers}
              selectedMachineId={selectedMachineId}
              onSelectMachine={setSelectedMachineId}
              mhcRecords={mhcRecords}
              onOpenMhcForMachine={(id) => {
                setSelectedMachineId(id);
                setActiveTab('mhc');
              }}
              onAddMachine={handleAddMachine}
              onEditMachine={handleEditMachine}
              onDeleteMachine={handleDeleteMachine}
              onBatchImportMachines={handleBatchImportMachines}
              onAddCustomer={handleAddCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {(activeTab === 'mhc' || activeTab.startsWith('mhc_')) && (
            <MachineHealthCheckModule
              machines={machines}
              initialMachineId={selectedMachineId}
              activeSubTab={activeTab}
              onSaveMhcRecord={handleSaveMhcRecord}
              onUpdateMachine={handleEditMachine}
            />
          )}

          {activeTab === 'laser_calibration' && (
            <LaserCalibrationModule machines={machines} />
          )}

          {activeTab === 'baseline_check' && (
            <BaselineCheckModule baselines={baselines} machines={machines} />
          )}

          {activeTab === 'quality_investigation' && (
            <QualityInvestigationModule
              investigations={investigations}
              machines={machines}
              onAddInvestigation={handleAddInvestigation}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsModule machines={machines} />
          )}

          {activeTab === 'knowledge_base' && (
            <KnowledgeBaseModule />
          )}

          {activeTab === 'users' && (
            <UsersModule
              users={users}
              activeUser={activeUser}
              onSetActiveUser={handleSetActiveUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileModule
              activeUser={activeUser}
              onUpdateUser={handleUpdateUser}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule 
              onResetData={handleResetData} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}
