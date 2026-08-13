import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { FieldEngineerTask, NavigationTab } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { getThemeClasses } from '../../theme/tokens';

interface WorkOrderChecklistProps {
  tasks: FieldEngineerTask[];
  onToggleTask: (taskId: string) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const WorkOrderChecklist: React.FC<WorkOrderChecklistProps> = ({
  tasks,
  onToggleTask,
  onNavigate
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const themeCls = getThemeClasses(isDark);
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-250 space-y-4 ${
      isDark 
        ? 'bg-[#20252B] border-[#2B323A]/80 text-[#F3F4F6]' 
        : 'bg-white border-slate-300/80 text-slate-900 shadow-sm'
    }`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
        isDark ? 'border-[#2B323A]/50' : 'border-slate-200'
      }`}>
        <div>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5 ${
            isDark ? 'text-[#8B9DFF]' : 'text-indigo-700'
          }`}>
            WORK ORDER CHECKLIST
          </span>
          <h3 className="text-base font-bold">
            Field Execution Checklist (#WO-EXECUTION)
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
            Progress: <strong className={`font-bold ${isDark ? 'text-[#8B9DFF]' : 'text-indigo-800'}`}>{completedCount} / {tasks.length} Done</strong>
          </span>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('planner')}>
            Full Planner
          </Button>
        </div>
      </div>

      {/* Checklist Action Items */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onToggleTask(task.id)}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              task.completed
                ? isDark ? 'bg-[#1A1D21]/40 border-[#2B323A]/40 text-slate-500 line-through' : 'bg-slate-50 border-slate-200 text-slate-500 line-through'
                : task.priority === 'URGENT'
                ? isDark ? 'bg-[#E98A8A]/10 border-[#E98A8A]/25 text-slate-100 hover:bg-[#E98A8A]/15' : 'bg-rose-50 border-rose-300 text-slate-900'
                : isDark ? 'bg-[#1A1D21] border-[#2B323A]/60 text-slate-200 hover:border-[#8B9DFF]/40' : 'bg-slate-50 border-slate-300/70 text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  task.completed
                    ? 'bg-[#7FD4A6] border-[#7FD4A6] text-slate-950 font-bold'
                    : isDark ? 'border-[#2B323A] bg-[#111315]' : 'border-slate-300 bg-white'
                }`}
              >
                {task.completed && <CheckCircle2 className="w-3 h-3" />}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold truncate">{task.title}</p>
                <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  {task.customerName} • {task.machineName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>{task.dueDate}</span>
              <Badge
                variant={
                  task.completed
                    ? 'gray'
                    : task.priority === 'URGENT'
                    ? 'rose'
                    : task.priority === 'HIGH'
                    ? 'amber'
                    : 'blue'
                }
                size="sm"
              >
                {task.completed ? 'DONE' : task.priority}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

