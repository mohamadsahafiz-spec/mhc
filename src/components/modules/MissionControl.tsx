import React from 'react';
import { 
  FieldEngineerTask, 
  AlertItem, 
  Contract, 
  Machine, 
  ExecutionScheduleItem, 
  MHCRecord, 
  NavigationTab 
} from '../../types';
import { ActiveWorkOrderHeader } from '../mission/ActiveWorkOrderHeader';
import { MachineSnapshotPanel } from '../mission/MachineSnapshotPanel';
import { InspectionStageStepper } from '../mission/InspectionStageStepper';
import { OperationalPrerequisites } from '../mission/OperationalPrerequisites';
import { WorkOrderChecklist } from '../mission/WorkOrderChecklist';
import { TodayActivityLog } from '../mission/TodayActivityLog';

interface MissionControlProps {
  tasks: FieldEngineerTask[];
  onToggleTask: (taskId: string) => void;
  alerts: AlertItem[];
  contracts: Contract[];
  machines: Machine[];
  schedule: ExecutionScheduleItem[];
  recentMhcs: MHCRecord[];
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickMhc: () => void;
  onSelectMachine: (machineId: string) => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  tasks,
  onToggleTask,
  alerts,
  contracts,
  machines,
  schedule,
  recentMhcs,
  onNavigate,
  onOpenQuickMhc,
  onSelectMachine
}) => {
  const currentMachine = machines[0];

  return (
    <div className="space-y-6 pb-12 transition-all duration-300">
      {/* 1. Hero Operational Desk (Customer, Machine, Mission, Current Stage, Direct Primary Action) */}
      <ActiveWorkOrderHeader 
        onNavigate={onNavigate}
        onOpenQuickMhc={onOpenQuickMhc}
        customerName={currentMachine?.customerName}
        plantName={currentMachine?.plantName}
        machineName={currentMachine?.model}
        machineNumber={currentMachine?.machineNumber}
      />

      {/* 2. Machine Snapshot Panel (Health, Heads, Cooling, Runtime, Remaining Life, Contract) */}
      <MachineSnapshotPanel 
        machine={currentMachine}
      />

      {/* 3. Sequential 5-Stage Inspection Stepper with Embedded Contextual AI Guidance */}
      <InspectionStageStepper 
        onNavigate={onNavigate}
        onOpenQuickMhc={onOpenQuickMhc}
      />

      {/* 4. Operational Cleanroom Prerequisites & Active Machine Telemetry Risks */}
      <OperationalPrerequisites 
        alerts={alerts}
      />

      {/* 5. Today's Work Order Sequential Execution Checklist */}
      <WorkOrderChecklist 
        tasks={tasks}
        onToggleTask={onToggleTask}
        onNavigate={onNavigate}
      />

      {/* 6. Today's On-Site Activity Audit Trace */}
      <TodayActivityLog 
        recentMhcs={recentMhcs}
        onNavigate={onNavigate}
      />
    </div>
  );
};
