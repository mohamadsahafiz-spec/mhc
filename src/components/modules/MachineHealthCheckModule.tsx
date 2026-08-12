import React, { useState, useEffect } from 'react';
import { Machine, MHCRecord, MHCSession, NavigationTab } from '../../types';
import { StorageService } from '../../utils/persistence';

// Active Subcomponents
import { SmartMhcWorkspace } from '../mhc/SmartMhcWorkspace';
import { MhcHistoryView } from '../mhc/MhcHistoryView';
import { MhcAutopilot } from '../mhc/MhcAutopilot';

interface MachineHealthCheckProps {
  machines: Machine[];
  initialMachineId?: string;
  activeSubTab?: NavigationTab;
  onSaveMhcRecord?: (record: MHCRecord) => void;
  onUpdateMachine?: (machine: Machine) => void;
}

export const MachineHealthCheckModule: React.FC<MachineHealthCheckProps> = ({
  machines,
  initialMachineId,
  activeSubTab = 'mhc_autopilot',
  onUpdateMachine
}) => {
  // 1. Selected Machine
  const [selectedMachineId, setSelectedMachineId] = useState<string>(
    initialMachineId || machines[0]?.id || ''
  );
  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];

  // 2. All MHC Sessions persistence state
  const [mhcSessions, setMhcSessions] = useState<MHCSession[]>(() =>
    StorageService.getMhcSessions()
  );

  // Active Session for current machine
  const activeSession = mhcSessions.find(
    (s) => s.machineId === selectedMachineId && s.completionStatus !== 'COMPLETED'
  ) || mhcSessions.find((s) => s.machineId === selectedMachineId) || mhcSessions[0];

  // 3. View Mode: 'mhc_autopilot' | 'smart_workspace' | 'mhc_history'
  const [viewMode, setViewMode] = useState<'mhc_autopilot' | 'smart_workspace' | 'mhc_history'>('mhc_autopilot');

  // Handle activeSubTab mapping from sidebar navigation
  useEffect(() => {
    if (!activeSubTab) return;

    if (activeSubTab === 'mhc_history') {
      setViewMode('mhc_history');
    } else if (activeSubTab === 'mhc') {
      setViewMode('smart_workspace');
    } else if (activeSubTab === 'mhc_autopilot') {
      setViewMode('mhc_autopilot');
    }
  }, [activeSubTab]);

  // Update session state helper
  const handleUpdateSession = (updatedSession: MHCSession) => {
    const exists = mhcSessions.some(s => s.id === updatedSession.id);
    const updatedList = exists 
      ? mhcSessions.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      : [updatedSession, ...mhcSessions];
    setMhcSessions(updatedList);
    StorageService.saveMhcSessions(updatedList);
  };

  return (
    <div className="space-y-4">
      {/* 1. PRIMARY MHC AUTOPILOT OVERLAY EXPERIENCE */}
      {viewMode === 'mhc_autopilot' && (
        <div className="relative min-h-[650px]">
          {/* Background Canvas (Dimmed + Blurred) */}
          <div className="opacity-30 blur-[4px] pointer-events-none select-none transition-all duration-300">
            <SmartMhcWorkspace
              machine={selectedMachine}
              session={activeSession}
              onUpdateSession={handleUpdateSession}
              onUpdateMachine={onUpdateMachine}
            />
          </div>

          {/* Focused Central Autopilot Experience */}
          <MhcAutopilot
            machines={machines}
            selectedMachine={selectedMachine}
            activeSession={activeSession}
            mhcSessions={mhcSessions}
            onSelectMachine={(m) => setSelectedMachineId(m.id)}
            onUpdateSession={handleUpdateSession}
            onSaveNewSession={handleUpdateSession}
            onSwitchToCanvas={() => setViewMode('smart_workspace')}
            onUpdateMachine={onUpdateMachine}
          />
        </div>
      )}

      {/* 2. SECONDARY SMART MHC WORKSPACE (CANVAS) */}
      {viewMode === 'smart_workspace' && (
        <SmartMhcWorkspace
          machine={selectedMachine}
          session={activeSession}
          onUpdateSession={handleUpdateSession}
          onUpdateMachine={onUpdateMachine}
        />
      )}

      {/* 3. MHC HISTORY VIEW */}
      {viewMode === 'mhc_history' && (
        <MhcHistoryView
          sessions={mhcSessions}
          machines={machines}
          onOpenSmartWorkspace={(sessionId) => {
            const target = mhcSessions.find(s => s.id === sessionId);
            if (target) {
              setSelectedMachineId(target.machineId);
              setViewMode('smart_workspace');
            }
          }}
        />
      )}
    </div>
  );
};
