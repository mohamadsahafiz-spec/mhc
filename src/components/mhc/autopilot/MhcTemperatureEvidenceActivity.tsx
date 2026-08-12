import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Thermometer, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Image as ImageIcon, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  ShieldCheck,
  Cpu,
  Info
} from 'lucide-react';
import { 
  Machine, 
  MHCSession, 
  MHCTemperatureEvidenceData, 
  MHCEvidenceItem 
} from '../../../types';
import { SavedTemperatureRecord, ChannelStats } from '../../../types/temperature';
import { TemperatureEngine } from '../../../utils/temperatureEngine';
import { TempRawStore } from '../../../utils/tempRawStore';
import { StorageService } from '../../../utils/persistence';
import { advanceAutopilotActivity, flagDownstreamNeedsReview } from '../../../utils/mhcAutopilotBrain';

export interface MhcTemperatureEvidenceActivityProps {
  session: MHCSession;
  machine: Machine;
  isReadOnly: boolean;
  onUpdateSession: (updatedSession: MHCSession) => void;
  onUpdateMachine?: (updatedMachine: Machine) => void;
  onCompleteActivity: () => void;
  onSwitchToCanvas?: () => void;
  isDark: boolean;
  showNotification?: (msg: string) => void;
  activeCode?: string; // '06'
}

export const MhcTemperatureEvidenceActivity: React.FC<MhcTemperatureEvidenceActivityProps> = ({
  session,
  machine,
  isReadOnly,
  onUpdateSession,
  onUpdateMachine,
  onCompleteActivity,
  onSwitchToCanvas,
  isDark,
  showNotification
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);

  // Existing saved temperature records for this machine
  const savedTempRecords = useMemo(() => {
    return machine.temperatureRecords || [];
  }, [machine.temperatureRecords]);

  // Current session temperature data
  const tempEvidenceData = useMemo<MHCTemperatureEvidenceData | undefined>(() => {
    return session.temperatureEvidenceData;
  }, [session.temperatureEvidenceData]);

  // Local state for uploading / processing
  const [isProcessingLog, setIsProcessingLog] = useState(false);

  // Local state for adding custom evidence
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvCategory, setNewEvCategory] = useState<MHCEvidenceItem['category']>('inspection_image');
  const [newEvNotes, setNewEvNotes] = useState('');
  const [newEvImageDataUrl, setNewEvImageDataUrl] = useState<string>('');
  const [engineerNote, setEngineerNote] = useState<string>(tempEvidenceData?.engineerNote || '');

  useEffect(() => {
    if (tempEvidenceData?.engineerNote !== undefined) {
      setEngineerNote(tempEvidenceData.engineerNote);
    }
  }, [tempEvidenceData?.engineerNote]);

  // Handle uploading raw .log / .txt files using TemperatureEngine
  const handleLogFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingLog(true);

    try {
      const fileArray = Array.from(files);
      const textPromises = fileArray.map(f => f.text());
      const rawTexts = await Promise.all(textPromises);

      // 1. Run authoritative Temperature Engine analysis
      const analysisResult = TemperatureEngine.analyzeTemperatureLogs(rawTexts);
      if (!analysisResult || !analysisResult.resampledChannels || Object.keys(analysisResult.resampledChannels).length === 0) {
        if (showNotification) showNotification('Error: No valid temperature data found in uploaded files.');
        setIsProcessingLog(false);
        return;
      }

      // 2. Downsample and calculate stats
      const channelDataMap = analysisResult.resampledChannels;
      const downsampledChannelData: Record<number, Array<{ ts: Date; val: number }>> = {};
      if (channelDataMap) {
        Object.entries(channelDataMap).forEach(([chStr, pts]) => {
          const ch = parseInt(chStr, 10);
          downsampledChannelData[ch] = TemperatureEngine.downsamplePoints(pts, 1500);
        });
      }

      const stats = TemperatureEngine.calculateGlobalStats(downsampledChannelData);
      const recordId = `TR-${Date.now()}`;
      const title = fileArray.map(f => f.name).join(', ');

      // 3. Create SavedTemperatureRecord
      const newRecord: SavedTemperatureRecord = {
        id: recordId,
        machineId: machine.id,
        title,
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

      // 4. Save raw records to IndexedDB without loss
      TempRawStore.saveRawRecords(recordId, analysisResult.rawRecords);

      // 5. Update Machine records
      const updatedRecords = [newRecord, ...(machine.temperatureRecords || [])];
      const updatedMachine = { ...machine, temperatureRecords: updatedRecords };

      if (onUpdateMachine) {
        onUpdateMachine(updatedMachine);
      }
      StorageService.saveMachines([updatedMachine, ...StorageService.getMachines().filter(m => m.id !== machine.id)]);

      // 6. Attach to session
      attachRecordToSession(newRecord);

      if (showNotification) {
        showNotification(`Temperature log parsed successfully! ${analysisResult.rawRecords.length.toLocaleString()} points processed.`);
      }
    } catch (err) {
      console.error('Error processing temperature log:', err);
      if (showNotification) showNotification('Failed to parse temperature log file.');
    } finally {
      setIsProcessingLog(false);
    }
  };

  // Attach a SavedTemperatureRecord to the session
  const attachRecordToSession = (rec: SavedTemperatureRecord) => {
    const updatedData: MHCTemperatureEvidenceData = {
      ...session.temperatureEvidenceData,
      temperatureRecordId: rec.id,
      temperatureRecordTitle: rec.title,
      temperatureLogFileName: rec.sourceFileNames.join(', '),
      rawRecordsCount: rec.rawRecordsCount,
      stats: rec.stats,
      channelStats: rec.channelStats,
      hasValidTemperatureAnalysis: true,
      updatedAt: new Date().toISOString()
    };

    const updatedSession: MHCSession = {
      ...session,
      temperatureEvidenceData: updatedData
    };

    onUpdateSession(updatedSession);
  };

  // Select an existing record from Machine Passport
  const handleSelectExistingRecord = (recordId: string) => {
    const found = savedTempRecords.find(r => r.id === recordId);
    if (found) {
      attachRecordToSession(found);
      if (showNotification) showNotification(`Selected record "${found.title}" attached to MHC session.`);
    }
  };

  // Add custom evidence item
  const handleAddEvidenceItem = () => {
    if (!newEvTitle.trim()) {
      if (showNotification) showNotification('Please enter an evidence title');
      return;
    }

    const newItem: MHCEvidenceItem = {
      id: `EV-${Date.now()}`,
      category: newEvCategory,
      title: newEvTitle.trim(),
      imageDataUrl: newEvImageDataUrl || undefined,
      notes: newEvNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const currentEvidences = session.temperatureEvidenceData?.evidences || [];
    const updatedEvidences = [...currentEvidences, newItem];

    const updatedSession: MHCSession = {
      ...session,
      temperatureEvidenceData: {
        ...session.temperatureEvidenceData,
        hasValidTemperatureAnalysis: session.temperatureEvidenceData?.hasValidTemperatureAnalysis ?? false,
        evidences: updatedEvidences,
        updatedAt: new Date().toISOString()
      }
    };

    onUpdateSession(updatedSession);

    // Reset local inputs
    setNewEvTitle('');
    setNewEvNotes('');
    setNewEvImageDataUrl('');
    if (showNotification) showNotification('MHC Evidence item added.');
  };

  const handleEvidenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showNotification) showNotification('File size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewEvImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEvidenceItem = (id: string) => {
    const currentEvidences = session.temperatureEvidenceData?.evidences || [];
    const updatedEvidences = currentEvidences.filter(e => e.id !== id);

    const updatedSession: MHCSession = {
      ...session,
      temperatureEvidenceData: {
        ...session.temperatureEvidenceData,
        hasValidTemperatureAnalysis: session.temperatureEvidenceData?.hasValidTemperatureAnalysis ?? false,
        evidences: updatedEvidences,
        updatedAt: new Date().toISOString()
      }
    };

    onUpdateSession(updatedSession);
    if (showNotification) showNotification('Evidence item removed.');
  };

  // Save Activity 06 & Complete
  const handleCompleteActivity06 = () => {
    if (!tempEvidenceData?.hasValidTemperatureAnalysis || !tempEvidenceData?.stats) {
      if (showNotification) showNotification('Valid temperature analysis log is required before completing Activity 06.');
      return;
    }

    const currentCode = '06';

    let updatedSession: MHCSession = {
      ...session,
      temperatureEvidenceData: {
        ...session.temperatureEvidenceData,
        hasValidTemperatureAnalysis: true,
        engineerNote: engineerNote || undefined,
        updatedAt: new Date().toISOString()
      }
    };

    // Flag downstream if editing previously completed
    if (session.autopilotProgress?.activityStatuses?.[currentCode] === 'COMPLETED') {
      updatedSession = flagDownstreamNeedsReview(updatedSession, currentCode);
    }

    // Advance autopilot state for Activity 06 -> COMPLETED
    updatedSession = advanceAutopilotActivity(
      updatedSession,
      currentCode,
      'COMPLETED',
      engineerNote
    );

    onUpdateSession(updatedSession);

    if (showNotification) {
      showNotification('Activity 06 Temperature & Evidence COMPLETED! Advanced to Day 4 MHC Readiness Review.');
    }

    onCompleteActivity();
  };

  const hasValidAnalysis = Boolean(tempEvidenceData?.hasValidTemperatureAnalysis && tempEvidenceData?.stats);
  const stats = tempEvidenceData?.stats;
  const channelStats = tempEvidenceData?.channelStats;
  const customEvidences = tempEvidenceData?.evidences || [];

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border space-y-6 ${
      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                DAY 3 • 06
              </span>
              <h2 className="text-lg font-bold text-slate-100">Temperature & Evidence Integration</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Machine thermal telemetry log analysis & authoritative MHC evidence collection
            </p>
          </div>
        </div>

        {/* Workspace Canvas Jump Button */}
        {onSwitchToCanvas && (
          <button
            type="button"
            onClick={onSwitchToCanvas}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Interactive Temperature Canvas</span>
          </button>
        )}
      </div>

      {/* 1. TEMPERATURE LOG IMPORT / SELECTION WORKSPACE */}
      <div className={`p-5 rounded-xl border space-y-5 ${
        isDark ? 'bg-slate-800/30 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>1. Machine Temperature Telemetry Log Integration</span>
          </h3>

          {hasValidAnalysis && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Valid Analysis Attached</span>
            </span>
          )}
        </div>

        {/* Upload / Select Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Upload Box */}
          <div className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 text-center transition-colors ${
            isDark ? 'bg-slate-900/60 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-300 hover:border-slate-400'
          }`}>
            <Upload className="w-6 h-6 text-cyan-400" />
            <div className="text-xs font-semibold text-slate-200">Import Raw Machine Log File (.log / .txt)</div>
            <p className="text-[11px] text-slate-400">
              Parses machine stations & thermal sensors using the engine
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isReadOnly || isProcessingLog}
              className="mt-1 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              {isProcessingLog ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Log...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse .log / .txt Files</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".log,.txt"
              multiple
              onChange={(e) => handleLogFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Select Saved Record from Machine Passport */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
            isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-300'
          }`}>
            <div>
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Or Select from Saved Machine Records</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Attach an existing temperature record saved under {machine.model} ({machine.machineNumber || machine.serialNumber}).
              </p>
            </div>

            {savedTempRecords.length > 0 ? (
              <select
                onChange={(e) => {
                  if (e.target.value) handleSelectExistingRecord(e.target.value);
                }}
                value={tempEvidenceData?.temperatureRecordId || ''}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-mono transition-all ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="">-- Choose Saved Record --</option>
                {savedTempRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({new Date(r.createdAt).toLocaleDateString()}) - {r.stats.avg.toFixed(1)}°C avg
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[11px] text-slate-500 italic">
                No saved temperature records in Machine Passport yet. Upload a log file above.
              </div>
            )}
          </div>
        </div>

        {/* DISPLAY CONCISE TEMPERATURE SUMMARY (No duplicate graph, pure authoritative stats) */}
        {hasValidAnalysis && stats && (
          <div className="space-y-4 pt-2 border-t border-slate-700/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-200">
                  Attached Record: {tempEvidenceData?.temperatureRecordTitle || 'Temperature Log Analysis'}
                </span>
                {tempEvidenceData?.rawRecordsCount && (
                  <span className="ml-2 text-[11px] font-mono text-cyan-400">
                    ({tempEvidenceData.rawRecordsCount.toLocaleString()} parsed points)
                  </span>
                )}
              </div>

              {onSwitchToCanvas && (
                <button
                  type="button"
                  onClick={onSwitchToCanvas}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  <span>View Full Interactive Temperature Chart</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Global Thermal Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Min Temperature</div>
                <div className="text-lg font-mono font-bold text-cyan-300 mt-0.5">{stats.min.toFixed(2)} °C</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Max Temperature</div>
                <div className="text-lg font-mono font-bold text-amber-300 mt-0.5">{stats.max.toFixed(2)} °C</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Average Temperature</div>
                <div className="text-lg font-mono font-bold text-emerald-300 mt-0.5">{stats.avg.toFixed(2)} °C</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Thermal Delta (Range)</div>
                <div className="text-lg font-mono font-bold text-slate-200 mt-0.5">{stats.range.toFixed(2)} °C</div>
              </div>
            </div>

            {/* Channel Station Breakdown Table */}
            {channelStats && Object.keys(channelStats).length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700/60 uppercase text-[10px]">
                      <th className="py-2 px-3">Station / Channel</th>
                      <th className="py-2 px-3">Min (°C)</th>
                      <th className="py-2 px-3">Max (°C)</th>
                      <th className="py-2 px-3">Avg (°C)</th>
                      <th className="py-2 px-3">Range (°C)</th>
                      <th className="py-2 px-3">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {Object.entries(channelStats).map(([chStr, rawStat]) => {
                      const chStat = rawStat as ChannelStats;
                      return (
                        <tr key={chStr} className="hover:bg-slate-800/40 font-mono">
                          <td className="py-2 px-3 font-bold text-cyan-300">Station {chStr}</td>
                          <td className="py-2 px-3 text-slate-300">{chStat.min.toFixed(2)}</td>
                          <td className="py-2 px-3 text-slate-300">{chStat.max.toFixed(2)}</td>
                          <td className="py-2 px-3 font-semibold text-emerald-400">{chStat.avg.toFixed(2)}</td>
                          <td className="py-2 px-3 text-slate-400">{chStat.range.toFixed(2)}</td>
                          <td className="py-2 px-3 text-slate-500">{chStat.points.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Warning if no valid analysis */}
        {!hasValidAnalysis && (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Machine temperature telemetry log file required to complete Activity 06. Upload or select a saved record above.</span>
          </div>
        )}
      </div>

      {/* 2. LIGHTWEIGHT EVIDENCE COLLECTION WORKSPACE */}
      <div className={`p-5 rounded-xl border space-y-5 ${
        isDark ? 'bg-slate-800/30 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span>2. Authoritative MHC Evidence Collection</span>
          </h3>
          <span className="text-xs text-slate-400">Linked to Session {session.id}</span>
        </div>

        {/* Evidence List */}
        <div className="space-y-3">
          {/* Auto-linked Temperature Analysis Evidence Card */}
          {hasValidAnalysis && (
            <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    [System Auto-Linked] {tempEvidenceData?.temperatureRecordTitle || 'Temperature Analysis Record'}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300/80">
                    Avg {stats?.avg.toFixed(1)}°C • Range {stats?.range.toFixed(1)}°C ({tempEvidenceData?.rawRecordsCount?.toLocaleString()} points)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                TEMPERATURE ANALYSIS
              </span>
            </div>
          )}

          {/* Custom Evidence List */}
          {customEvidences.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customEvidences.map((ev) => (
                <div key={ev.id} className="p-3 rounded-xl border border-slate-700 bg-slate-900/60 flex items-start gap-3 relative group">
                  {ev.imageDataUrl ? (
                    <img
                      src={ev.imageDataUrl}
                      alt={ev.title}
                      className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 text-xs">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {ev.category.replace('_', ' ')}
                    </span>
                    <div className="font-semibold text-slate-200 mt-1 truncate">{ev.title}</div>
                    {ev.notes && <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{ev.notes}</p>}
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidenceItem(ev.id)}
                      className="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
                      title="Remove Evidence"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {customEvidences.length === 0 && !hasValidAnalysis && (
            <div className="text-xs text-slate-500 italic p-3 text-center border border-dashed border-slate-700 rounded-xl">
              No evidence items attached yet.
            </div>
          )}
        </div>

        {/* Form to Add New Custom Evidence */}
        {!isReadOnly && (
          <div className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/40 space-y-3 pt-3">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Attach Additional MHC Evidence (Photo / Calibration Document)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Evidence Title</label>
                <input
                  type="text"
                  placeholder="e.g. Laser Head 1 Optics Inspection Photo"
                  value={newEvTitle}
                  onChange={(e) => setNewEvTitle(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Evidence Category</label>
                <select
                  value={newEvCategory}
                  onChange={(e) => setNewEvCategory(e.target.value as any)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="inspection_image">Inspection Image</option>
                  <option value="calibration_evidence">Calibration Evidence</option>
                  <option value="temperature_result">Temperature Result Document</option>
                  <option value="other_evidence">Other MHC Evidence</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              {newEvImageDataUrl ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Image attached</span>
                  <button
                    type="button"
                    onClick={() => setNewEvImageDataUrl('')}
                    className="text-[10px] text-rose-400 underline ml-1"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => evidenceInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Attach Image File (PNG, JPG)</span>
                  </button>
                  <input
                    ref={evidenceInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEvidenceImageUpload}
                    className="hidden"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleAddEvidenceItem}
                className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Evidence Item</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Engineer Remarks & Activity Completion Footer */}
      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Activity 06 Engineer Observations & Remarks
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Thermal equilibrium verified at 24.2°C across 4-hour test run."
            value={engineerNote}
            onChange={(e) => setEngineerNote(e.target.value)}
            disabled={isReadOnly}
            className={`w-full px-3 py-2 rounded-lg border text-xs transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500'
                : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
            }`}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-700/50">
          <div className="text-xs text-slate-400">
            Target Activity: <span className="font-bold text-slate-200">06 Temperature & Evidence</span>
          </div>

          {hasValidAnalysis && !isReadOnly ? (
            <button
              type="button"
              onClick={handleCompleteActivity06}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Complete Activity 06</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs border border-slate-700/60 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Import Valid Temperature Log to Complete Activity 06</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
