import React, { useState, useRef } from 'react';
import {
  Thermometer,
  Upload,
  Save,
  Plus,
  Trash2,
  FileText,
  Clock,
  BarChart2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Machine } from '../../types';
import {
  SavedTemperatureRecord,
  ManualTemperatureReading,
  ParsedTempPoint,
  ChannelDataMap,
  DayBoundary,
  ChannelStats
} from '../../types/temperature';
import { TemperatureEngine } from '../../utils/temperatureEngine';
import { TempRawStore } from '../../utils/tempRawStore';
import { TemperatureGraph, GraphPreset } from '../common/TemperatureGraph';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

interface MachineTemperatureWorkspaceProps {
  machine: Machine;
  onUpdateMachine: (updatedMachine: Machine) => void;
}

const CHANNEL_COLORS: Record<number, string> = {
  1: '#E63946',
  2: '#2A9D8F',
  3: '#E9C46A',
  4: '#457B9D',
  5: '#F4A261',
  6: '#6A4C93'
};

// In-memory cache for unsaved imported temperature drafts per machine
const tempDraftCache: Record<string, {
  selectedFiles: { name: string; text: string }[];
  analysisResult: any;
}> = {};

export const MachineTemperatureWorkspace: React.FC<MachineTemperatureWorkspaceProps> = ({
  machine,
  onUpdateMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const cachedDraft = machine?.id ? tempDraftCache[machine.id] : undefined;

  // State for raw log processing
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; text: string }[]>(cachedDraft?.selectedFiles || []);
  const [cmdFilter, setCmdFilter] = useState<string>('1');
  const [intervalSec, setIntervalSec] = useState<number>(30);
  const [filterMin, setFilterMin] = useState<number>(0);
  const [filterMax, setFilterMax] = useState<number>(9999);

  // Active temperature inspection session state
  const [analysisResult, setAnalysisResult] = useState<{
    rawRecords: ParsedTempPoint[];
    resampledChannels: ChannelDataMap;
    dayBoundaries: DayBoundary[];
    stats: ChannelStats | null;
    channelStats: Record<number, ChannelStats>;
    sourceFileNames: string[];
  } | null>(cachedDraft?.analysisResult || null);

  const [activeChannels, setActiveChannels] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [graphPreset, setGraphPreset] = useState<GraphPreset>('engineering');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<SavedTemperatureRecord | null>(null);

  // Manual Reading Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 16));
  const [manualTemp, setManualTemp] = useState<string>('24.0');
  const [manualChannel, setManualChannel] = useState<number>(1);
  const [manualNote, setManualNote] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File Upload Handlers
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const filePromises = files.map(
      (file) =>
        new Promise<{ name: string; text: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve({ name: file.name, text: (evt.target?.result as string) || '' });
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsText(file);
        })
    );

    Promise.all(filePromises)
      .then((readFiles) => {
        const updatedFiles = [...selectedFiles, ...readFiles];
        setSelectedFiles(updatedFiles);
        runEngineAnalysis(updatedFiles, cmdFilter, intervalSec, filterMin, filterMax);
      })
      .catch((err) => alert(err.message));
  };

  const runEngineAnalysis = (
    files: { name: string; text: string }[],
    cmd: string,
    interval: number,
    fMin: number,
    fMax: number
  ) => {
    if (!files.length) {
      setAnalysisResult(null);
      return;
    }

    const rawTexts = files.map((f) => f.text);
    const result = TemperatureEngine.analyzeTemperatureLogs(rawTexts, {
      cmdFilter: cmd,
      intervalSec: interval,
      filterMin: fMin,
      filterMax: fMax
    });

    const resData = {
      rawRecords: result.rawRecords,
      resampledChannels: result.resampledChannels,
      dayBoundaries: result.dayBoundaries,
      stats: result.combinedStats,
      channelStats: result.channelStats,
      sourceFileNames: files.map((f) => f.name)
    };

    setAnalysisResult(resData);
    tempDraftCache[machine.id] = { selectedFiles: files, analysisResult: resData };
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    setAnalysisResult(null);
    delete tempDraftCache[machine.id];
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleChannel = (ch: number) => {
    setActiveChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch].sort((a, b) => a - b)
    );
  };

  // Save current temperature analysis session to Machine Passport
  const handleSaveTemperatureRecord = () => {
    if (!analysisResult || !analysisResult.stats) return;

    const recordId = `TR-${Date.now()}`;

    // Downsample channelData points for each channel
    const downsampledChannelData: ChannelDataMap = {};
    if (analysisResult.resampledChannels) {
      Object.entries(analysisResult.resampledChannels).forEach(([chStr, pts]) => {
        const ch = parseInt(chStr, 10);
        downsampledChannelData[ch] = TemperatureEngine.downsamplePoints(pts, 1500);
      });
    }

    const newRecord: SavedTemperatureRecord = {
      id: recordId,
      machineId: machine.id,
      title: `${machine.model} Temperature Inspection (${analysisResult.sourceFileNames.length} log file${
        analysisResult.sourceFileNames.length > 1 ? 's' : ''
      })`,
      createdAt: new Date().toISOString(),
      sourceFileNames: analysisResult.sourceFileNames,
      rawRecordsCount: analysisResult.rawRecords.length,
      intervalSec,
      stats: analysisResult.stats,
      channelStats: analysisResult.channelStats,
      dayBoundaries: analysisResult.dayBoundaries,
      channelData: downsampledChannelData,
      records: []
    };

    // Store full raw records in IndexedDB
    TempRawStore.saveRawRecords(recordId, analysisResult.rawRecords);

    const existingRecords = machine.temperatureRecords || [];
    const updatedMachine: Machine = {
      ...machine,
      temperatureRecords: [newRecord, ...existingRecords]
    };

    onUpdateMachine(updatedMachine);
    delete tempDraftCache[machine.id];
    setSelectedFiles([]);
    setAnalysisResult(null);
    alert('Temperature inspection record saved successfully to Machine Passport history.');
  };

  const handleDeleteSavedRecord = (recordId: string) => {
    if (!confirm('Are you sure you want to delete this temperature record?')) return;
    TempRawStore.deleteRawRecords(recordId);
    const updatedRecords = (machine.temperatureRecords || []).filter((r) => r.id !== recordId);
    onUpdateMachine({
      ...machine,
      temperatureRecords: updatedRecords
    });
    if (selectedRecordForDetail?.id === recordId) {
      setSelectedRecordForDetail(null);
    }
  };

  // Manual Reading Handlers
  const handleSaveManualReading = (e: React.FormEvent) => {
    e.preventDefault();
    const tempVal = parseFloat(manualTemp);
    if (isNaN(tempVal)) return;

    const newReading: ManualTemperatureReading = {
      id: `MTR-${Date.now()}`,
      machineId: machine.id,
      timestamp: new Date(manualDate).toISOString(),
      temperature: tempVal,
      channel: manualChannel,
      note: manualNote,
      createdAt: new Date().toISOString()
    };

    const updatedReadings = [newReading, ...(machine.manualTemperatureReadings || [])];
    onUpdateMachine({
      ...machine,
      manualTemperatureReadings: updatedReadings
    });

    setIsManualModalOpen(false);
    setManualNote('');
  };

  const handleDeleteManualReading = (id: string) => {
    const updatedReadings = (machine.manualTemperatureReadings || []).filter((r) => r.id !== id);
    onUpdateMachine({
      ...machine,
      manualTemperatureReadings: updatedReadings
    });
  };

  const savedRecords = machine.temperatureRecords || [];
  const manualReadings = machine.manualTemperatureReadings || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-5 rounded-2xl border ${
          isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200 shadow-2xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Machine Temperature Telemetry & History
                </h2>
                <Badge variant="cyan" size="sm">
                  {machine.machineNumber}
                </Badge>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Parsed with native FSOS TemperatureEngine · {savedRecords.length} Saved Inspections · {manualReadings.length} Manual Readings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsManualModalOpen(true)}
              className="text-xs"
            >
              + Manual Reading
            </Button>
          </div>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Log Ingestion & Controls */}
        <div className="space-y-4">
          <Card title="Raw .log / .txt File Import">
            <div className="space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-5 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  isDark
                    ? 'border-[#2B323A] hover:border-rose-500/60 bg-[#111315]/50 hover:bg-[#1A1D21]'
                    : 'border-slate-300 hover:border-rose-500 bg-slate-50 hover:bg-rose-50/30'
                }`}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-rose-500 opacity-80" />
                <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Drop .log or .txt files here
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  or click to browse multiple files
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept=".log,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      Selected Files ({selectedFiles.length}):
                    </span>
                    <button
                      type="button"
                      onClick={handleClearFiles}
                      className="text-rose-400 hover:text-rose-300 text-[11px] underline"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {selectedFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between ${
                          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span className="truncate max-w-[200px] text-slate-300">{f.name}</span>
                        <Badge variant="emerald" size="sm">
                          Ready
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parsing Parameters */}
              <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Filter className="w-3.5 h-3.5 text-rose-400" />
                  <span>Parsing Parameters</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className={`block text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Command No Filter
                    </label>
                    <input
                      type="text"
                      value={cmdFilter}
                      onChange={(e) => {
                        setCmdFilter(e.target.value);
                        runEngineAnalysis(selectedFiles, e.target.value, intervalSec, filterMin, filterMax);
                      }}
                      className={`w-full mt-1 px-2.5 py-1.5 rounded-lg border font-mono ${
                        isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300'
                      }`}
                      placeholder="e.g. 1"
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Resample Bucket
                    </label>
                    <select
                      value={intervalSec}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setIntervalSec(val);
                        runEngineAnalysis(selectedFiles, cmdFilter, val, filterMin, filterMax);
                      }}
                      className={`w-full mt-1 px-2.5 py-1.5 rounded-lg border font-mono ${
                        isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300'
                      }`}
                    >
                      <option value={10}>10 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={300}>5 minutes</option>
                      <option value={600}>10 minutes</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className={`block text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Raw Min Cutoff
                    </label>
                    <input
                      type="number"
                      value={filterMin}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFilterMin(val);
                        runEngineAnalysis(selectedFiles, cmdFilter, intervalSec, val, filterMax);
                      }}
                      className={`w-full mt-1 px-2.5 py-1.5 rounded-lg border font-mono ${
                        isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Raw Max Cutoff
                    </label>
                    <input
                      type="number"
                      value={filterMax}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 9999;
                        setFilterMax(val);
                        runEngineAnalysis(selectedFiles, cmdFilter, intervalSec, filterMin, val);
                      }}
                      className={`w-full mt-1 px-2.5 py-1.5 rounded-lg border font-mono ${
                        isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (2 Spans): Active Result / Graphs / Statistics */}
        <div className="lg:col-span-2 space-y-4">
          {!analysisResult ? (
            <Card className="p-12 text-center space-y-3">
              <Thermometer className="w-10 h-10 mx-auto text-slate-500 opacity-50" />
              <h3 className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                No Active Log File Session
              </h3>
              <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Upload .log or .txt raw machine telemetry files to generate real-time temperature graphs, station statistics, and save history records.
              </p>
            </Card>
          ) : (
            <Card className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Active Log Inspection Results
                  </h3>
                  <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {analysisResult.rawRecords.length.toLocaleString()} raw points parsed · {analysisResult.sourceFileNames.length} file(s)
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  icon={<Save className="w-3.5 h-3.5" />}
                  onClick={handleSaveTemperatureRecord}
                >
                  Save Temperature Record
                </Button>
              </div>

              {/* Statistics Overview Grid */}
              {analysisResult.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>MIN TEMP</span>
                    <strong className="text-base text-sky-400 font-mono font-bold">{analysisResult.stats.min}°C</strong>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>MAX TEMP</span>
                    <strong className="text-base text-rose-400 font-mono font-bold">{analysisResult.stats.max}°C</strong>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>AVG TEMP</span>
                    <strong className="text-base text-emerald-400 font-mono font-bold">{analysisResult.stats.avg}°C</strong>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>RANGE</span>
                    <strong className="text-base text-amber-400 font-mono font-bold">{analysisResult.stats.range}°C</strong>
                  </div>
                  <div className={`p-3 rounded-xl border text-center col-span-2 sm:col-span-1 ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>POINTS</span>
                    <strong className="text-base text-indigo-400 font-mono font-bold">{analysisResult.stats.points}</strong>
                  </div>
                </div>
              )}

              {/* Channel Filter Toggles */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Channels/Stations:
                </span>
                {[1, 2, 3, 4, 5, 6].map((ch) => {
                  const isActive = activeChannels.includes(ch);
                  const st = analysisResult.channelStats[ch];
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                        isActive
                          ? 'border-transparent text-white shadow-xs'
                          : isDark
                          ? 'bg-[#1A1D21] border-[#2B323A] text-slate-500 opacity-60'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                      style={{
                        backgroundColor: isActive ? CHANNEL_COLORS[ch] : undefined
                      }}
                    >
                      <span>CH{ch}</span>
                      {st && <span className="text-[10px] opacity-80">({st.avg}°C)</span>}
                    </button>
                  );
                })}
              </div>

              {/* Preset Selector & Temperature Graph */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Telemetry Trend Visualization
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
                    {(['engineering', 'clean', 'report'] as GraphPreset[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setGraphPreset(p)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-mono capitalize transition-all ${
                          graphPreset === p
                            ? 'bg-rose-500 text-white font-bold shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                  <TemperatureGraph
                    channelData={analysisResult.resampledChannels}
                    activeChannels={activeChannels}
                    stats={analysisResult.stats}
                    preset={graphPreset}
                    height={300}
                  />
                </div>
              </div>

              {/* Parsed Temperature Readings Table Preview */}
              <div className="space-y-2 pt-2">
                <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Resampled Read Data Preview
                </h4>
                <div className="max-h-60 overflow-y-auto rounded-xl border font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className={isDark ? 'bg-[#111315] text-slate-400 border-b border-[#2B323A]' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}>
                      <tr>
                        <th className="p-2">Timestamp</th>
                        <th className="p-2">Channel</th>
                        <th className="p-2">Temperature (°C)</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-[#2B323A]/50' : 'divide-slate-200'}`}>
                      {Object.entries(analysisResult.resampledChannels)
                        .flatMap(([chStr, pts]) => (pts as Array<{ ts: Date; val: number }>).map((p) => ({ ch: parseInt(chStr, 10), ts: p.ts, val: p.val })))
                        .filter((p) => activeChannels.includes(p.ch))
                        .slice(0, 50)
                        .map((p, idx) => (
                          <tr key={idx} className={isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'}>
                            <td className="p-2 text-slate-300">{p.ts.toISOString().replace('T', ' ').slice(0, 19)}</td>
                            <td className="p-2">
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                                style={{ backgroundColor: CHANNEL_COLORS[p.ch] }}
                              >
                                CH{p.ch}
                              </span>
                            </td>
                            <td className="p-2 font-bold text-slate-100">{p.val.toFixed(1)} °C</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Saved Temperature History Records */}
      <Card title={`Saved Machine Temperature History (${savedRecords.length})`}>
        {savedRecords.length === 0 ? (
          <p className={`text-xs py-6 text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            No temperature data recorded for this machine. Upload log files above and click "Save Temperature Record".
          </p>
        ) : (
          <div className="space-y-3">
            {savedRecords.map((rec) => (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  isDark ? 'bg-[#14171A] border-[#2B323A] hover:bg-[#1A1D21]' : 'bg-slate-50 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {rec.title}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'}`}>
                      {rec.rawRecordsCount.toLocaleString()} pts
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>Date: {new Date(rec.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>Interval: {rec.intervalSec}s</span>
                    <span>•</span>
                    <span>Files: {rec.sourceFileNames.join(', ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                    <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-700/60">
                      <span className="text-[9px] text-slate-400 block">MIN</span>
                      <strong className="text-sky-400">{rec.stats.min}°C</strong>
                    </div>
                    <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-700/60">
                      <span className="text-[9px] text-slate-400 block">MAX</span>
                      <strong className="text-rose-400">{rec.stats.max}°C</strong>
                    </div>
                    <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-700/60">
                      <span className="text-[9px] text-slate-400 block">AVG</span>
                      <strong className="text-emerald-400">{rec.stats.avg}°C</strong>
                    </div>
                    <div className="px-2 py-1 rounded bg-slate-900/60 border border-slate-700/60">
                      <span className="text-[9px] text-slate-400 block">RANGE</span>
                      <strong className="text-amber-400">{rec.stats.range}°C</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRecordForDetail(rec)}
                      className="text-xs"
                    >
                      View Graph
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSavedRecord(rec.id)}
                      className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Manual Temperature Readings History */}
      <Card title={`Manual Spot Readings (${manualReadings.length})`}>
        {manualReadings.length === 0 ? (
          <p className={`text-xs py-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            No manual spot readings recorded.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {manualReadings.map((r) => (
              <div
                key={r.id}
                className={`p-3 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white font-mono"
                    style={{ backgroundColor: CHANNEL_COLORS[r.channel] || '#888' }}
                  >
                    CH{r.channel}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{r.temperature}°C</span>
                </div>
                <div className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {new Date(r.timestamp).toLocaleString()}
                </div>
                {r.note && <p className={`text-[11px] italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{r.note}</p>}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteManualReading(r.id)}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Manual Reading Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Add Manual Spot Temperature Reading"
        size="md"
      >
        <form onSubmit={handleSaveManualReading} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border font-mono ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={manualTemp}
                onChange={(e) => setManualTemp(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border font-mono ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Station / Channel
              </label>
              <select
                value={manualChannel}
                onChange={(e) => setManualChannel(parseInt(e.target.value, 10))}
                className={`w-full px-3 py-2 rounded-xl text-xs border font-mono ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300'
                }`}
              >
                {[1, 2, 3, 4, 5, 6].map((ch) => (
                  <option key={ch} value={ch}>
                    Channel {ch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Inspection Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Verified with calibrated thermal probe"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300'
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setIsManualModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Spot Reading
            </Button>
          </div>
        </form>
      </Modal>

      {/* Saved Record Detail Modal */}
      {selectedRecordForDetail && (
        <Modal
          isOpen={!!selectedRecordForDetail}
          onClose={() => setSelectedRecordForDetail(null)}
          title={selectedRecordForDetail.title}
          size="lg"
        >
          <div className="space-y-4">
            <div className={`p-3 rounded-xl border flex flex-wrap justify-between items-center text-xs font-mono gap-2 ${
              isDark ? 'bg-[#111315] border-[#2B323A] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <span>Recorded: {new Date(selectedRecordForDetail.createdAt).toLocaleString()}</span>
              <span>Raw Points: {selectedRecordForDetail.rawRecordsCount}</span>
              <span>Bucket: {selectedRecordForDetail.intervalSec}s</span>
            </div>

            <TemperatureGraph
              channelData={selectedRecordForDetail.channelData}
              activeChannels={[1, 2, 3, 4, 5, 6]}
              stats={selectedRecordForDetail.stats}
              preset={graphPreset}
              height={320}
            />

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedRecordForDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
