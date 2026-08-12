import React, { useState } from 'react';
import { History, FileText, CheckCircle2, Clock, Search, Filter, Cpu, Building2, User, ArrowRight, Eye, Calendar } from 'lucide-react';
import { MHCSession, Machine } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useTheme } from '../../context/ThemeContext';

interface MhcHistoryViewProps {
  sessions: MHCSession[];
  machines: Machine[];
  onOpenSmartWorkspace: (sessionId: string) => void;
  onOpenStageForm?: (sessionId: string, stageNum: number) => void;
}

export const MhcHistoryView: React.FC<MhcHistoryViewProps> = ({
  sessions,
  machines,
  onOpenSmartWorkspace,
  onOpenStageForm
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS'>('ALL');

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.engineerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.completionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-sm border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#15181C] border-[#2B323A]' : 'bg-white border-slate-300 shadow-xs'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold tracking-tight text-slate-100 dark:text-slate-100">
              MHC INSPECTION HISTORY & CERTIFICATE RECORDS
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical audit log of all completed and active Machine Health Check sessions across the equipment fleet.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search session ID, machine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`text-xs rounded pl-8 pr-3 py-1.5 border ${
                isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`text-xs rounded px-2.5 py-1.5 border ${
              isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>
      </div>

      {/* History Table / Cards */}
      <div className="space-y-3">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((s) => {
            const isCompleted = s.completionStatus === 'COMPLETED';

            return (
              <div
                key={s.id}
                className={`p-4 rounded-sm border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  isDark ? 'bg-[#13161A] border-[#2B323A] hover:border-slate-700' : 'bg-white border-slate-300 shadow-xs hover:border-slate-400'
                }`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-100">{s.id}</span>
                    <Badge variant={isCompleted ? 'success' : 'warning'}>
                      {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {s.startDate} ({s.startTime})
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-sky-400" />
                      {s.machineName}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {s.customerName} ({s.plantName || 'Fab 1'})
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {s.engineerName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    icon={<FileText className="w-3.5 h-3.5" />}
                    onClick={() => onOpenSmartWorkspace(s.id)}
                  >
                    Open Smart MHC Workspace
                  </Button>
                  {!isCompleted && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => onOpenStageForm ? onOpenStageForm(s.id, s.currentSection || 1) : onOpenSmartWorkspace(s.id)}
                    >
                      Continue Inspection
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className={`p-8 text-center rounded-sm border ${
            isDark ? 'bg-[#13161A] border-[#2B323A] text-slate-400' : 'bg-white border-slate-300 text-slate-600'
          }`}>
            <History className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">No MHC Session Records Found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search filter or start a new MHC inspection from the Smart MHC Workspace.</p>
          </div>
        )}
      </div>
    </div>
  );
};
