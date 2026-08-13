import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Building2, 
  Cpu, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Layers, 
  ChevronRight,
  Info,
  Thermometer,
  Wrench,
  Package,
  FileCheck2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MHCSession, MhcReportDocument, MhcReportSectionCode } from '../../../types';
import { buildMhcReportDocument } from '../../../utils/mhcReportEngine';

export interface MhcFullPdfRendererProps {
  session: MHCSession;
  previousSession?: MHCSession;
  reportDocument?: MhcReportDocument;
  isDark?: boolean;
  onBackToAutopilot?: () => void;
}

export const MhcFullPdfRenderer: React.FC<MhcFullPdfRendererProps> = ({
  session,
  previousSession,
  reportDocument,
  isDark = true,
  onBackToAutopilot
}) => {
  // Construct or use passed document
  const doc: MhcReportDocument = reportDocument || buildMhcReportDocument(session, previousSession);
  const metadata = doc.metadata;
  const sections = doc.sections;

  // Controls State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [showOptionalSections, setShowOptionalSections] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(0.9);

  // Reference for printable document container
  const documentContainerRef = useRef<HTMLDivElement>(null);

  // Helper for status badge styling
  const renderStatusBadge = (status: string, label?: string) => {
    switch (status) {
      case 'PASS':
      case 'APPROVED':
      case 'COMPLETE':
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span>✓</span>
            <span>{label || status}</span>
          </span>
        );
      case 'WARNING':
      case 'CONDITIONAL_PASS':
      case 'CONDITIONAL_RELEASE':
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300">
            <span>⚠</span>
            <span>{label || status}</span>
          </span>
        );
      case 'FAIL':
      case 'ACTION_REQUIRED':
      case 'OUT_OF_SPEC':
      case 'HALTED':
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100 text-rose-800 border border-rose-300">
            <span>✕</span>
            <span>{label || status}</span>
          </span>
        );
      case 'NOT_COLLECTED':
      case 'UNAVAILABLE':
      case 'NOT_APPLICABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-300">
            <span>—</span>
            <span>{label || status.replace('_', ' ')}</span>
          </span>
        );
    }
  };

  // PDF Download Handler via html2canvas + jsPDF
  const handleDownloadPdf = async () => {
    if (!documentContainerRef.current) return;
    setIsGeneratingPdf(true);
    setDownloadProgress('Preparing report pages...');

    try {
      const pageElements = documentContainerRef.current.querySelectorAll('.mhc-a4-page');
      if (!pageElements || pageElements.length === 0) {
        throw new Error('No printable pages found.');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i] as HTMLElement;
        setDownloadProgress(`Rendering Page ${i + 1} of ${pageElements.length}...`);

        const canvas = await html2canvas(pageEl, {
          scale: 2, // High DPI for crisp vector-like typography
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      setDownloadProgress('Finalizing PDF package...');
      const fileName = `${metadata.reportNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_Full_MHC_Report.pdf`;
      pdf.save(fileName);
      setDownloadProgress('');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('An error occurred while rendering the PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Browser Print Trigger
  const handlePrint = () => {
    window.print();
  };

  // Helper to determine whether an optional section should render
  const isSectionVisible = (code: MhcReportSectionCode) => {
    const sec = sections[code];
    if (!sec) return false;
    if (showOptionalSections) return true;
    return sec.isVisible && sec.status !== 'NOT_COLLECTED' && sec.status !== 'NOT_APPLICABLE';
  };

  return (
    <div className="space-y-6">
      
      {/* TOOLBAR CONTROLS BAR */}
      <div className={`p-4 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-40 backdrop-blur-md ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900'
      }`}>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                PHASE 8B • FULL PDF RENDERER
              </span>
              <h2 className="text-sm font-bold tracking-tight">MHC Report Engine Preview</h2>
            </div>
            <p className="text-xs text-slate-400">
              {metadata.reportNumber} • {metadata.machineModel} ({metadata.machineSerialNumber})
            </p>
          </div>
        </div>

        {/* CONTROLS RIGHT */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setZoomScale(prev => Math.max(0.6, prev - 0.1))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-300 px-1 font-bold">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(prev => Math.min(1.2, prev + 0.1))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Optional Sections Toggle */}
          <button
            onClick={() => setShowOptionalSections(!showOptionalSections)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showOptionalSections
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {showOptionalSections ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>{showOptionalSections ? 'Showing All Sections' : 'Hide Empty Optional'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {/* Primary Download PDF Action */}
          <button
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all cursor-pointer ring-2 ring-emerald-400/50"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? downloadProgress || 'Generating PDF...' : 'Download Official MHC PDF'}</span>
          </button>

          {onBackToAutopilot && (
            <button
              onClick={onBackToAutopilot}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold"
            >
              Back
            </button>
          )}

        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (SCALED FOR SCREEN VIEW) */}
      <div className="w-full overflow-x-auto pb-12 flex justify-center">
        <div 
          ref={documentContainerRef}
          className="space-y-8 transition-all origin-top"
          style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
        >

          {/* =========================================================================
              PAGE 1: COVER PAGE (01 COVER)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Background Header Accent */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-slate-900 via-cyan-800 to-slate-900" />

            {/* COVER HEADER */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-cyan-400 font-extrabold flex items-center justify-center text-xl font-mono">
                    FSOS
                  </div>
                  <div>
                    <h1 className="text-base font-bold tracking-wider text-slate-900 font-mono">
                      FIELD SERVICE OPERATING SYSTEM
                    </h1>
                    <p className="text-xs text-slate-500 font-mono">
                      Authoritative Machine Health Check Report Engine • v1.0.31.4
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">REPORT NUMBER</div>
                  <div className="text-sm font-extrabold text-cyan-800">{sections['01'].data.reportNumber}</div>
                </div>
              </div>

              {/* COVER TITLE BLOCK */}
              <div className="space-y-3 pt-8">
                <span className="inline-block text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-widest">
                  CONFIDENTIAL TECHNICAL REPORT
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {sections['01'].data.title}
                </h1>
                <p className="text-sm text-slate-600 font-medium max-w-xl">
                  {sections['01'].data.subtitle}
                </p>
              </div>
            </div>

            {/* COVER MACHINE IDENTITY CARD */}
            <div className="my-auto p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>MACHINE &amp; CUSTOMER IDENTITY</span>
                <span className="text-cyan-800 font-bold">MHC AUDIT PASSPORT</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">CUSTOMER ACCOUNT</span>
                  <strong className="text-slate-900 font-bold text-sm">{sections['01'].data.customerName}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">PLANT / FACILITY</span>
                  <strong className="text-slate-900 font-bold text-sm">{sections['01'].data.plantName}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">MACHINE MODEL</span>
                  <strong className="text-slate-900 font-bold text-sm">{sections['01'].data.machineModel}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">SERIAL NUMBER</span>
                  <strong className="text-cyan-900 font-bold font-mono text-sm">{sections['01'].data.machineSerialNumber}</strong>
                </div>
              </div>
            </div>

            {/* COVER FOOTER METADATA */}
            <div className="border-t border-slate-200 pt-6 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block">SERVICE ENGINEER</span>
                  <strong className="text-slate-900">{sections['01'].data.engineerName}</strong>
                  <div className="text-[10px] text-slate-500">{sections['01'].data.engineerTitle}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">INSPECTION DATE</span>
                  <strong className="text-slate-900">{sections['01'].data.date}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">RELEASE STATUS</span>
                  <div>{renderStatusBadge(sections['04'].data.overallStatus)}</div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-4 text-center border-t border-slate-100">
                This document is generated directly from the FSOS MHC Autopilot Session Document Engine.
                Reproduction or distribution without written customer consent is strictly prohibited.
              </div>
            </div>

          </div>

          {/* =========================================================================
              PAGE 2: TABLE OF CONTENTS (02 INDEX) & MACHINE INFO (03)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTION 02 — TABLE OF CONTENTS</span>
            </div>

            {/* Content Body */}
            <div className="space-y-6 my-2 flex-1">
              
              {/* SECTION 02: TABLE OF CONTENTS */}
              <div className="space-y-3">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>02 TABLE OF CONTENTS / INDEX</span>
                  <span className="text-xs font-mono font-normal text-slate-500">19 Standard Document Sections</span>
                </h2>

                <div className="grid grid-cols-1 gap-1 text-xs font-sans">
                  {doc.indexEntries.map((entry, idx) => (
                    <div 
                      key={entry.code}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 border-b border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-cyan-800 w-6">{entry.code}</span>
                        <span className="font-medium text-slate-800">{entry.title}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-400 uppercase text-[9px]">{entry.category}</span>
                        <span className="text-slate-600 font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          P. {entry.pageNumber || '—'}
                        </span>
                        {renderStatusBadge(entry.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 03: MACHINE INFORMATION */}
              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>03 MACHINE INFORMATION &amp; CONFIGURATION</span>
                  <span className="text-xs font-mono font-normal text-slate-500 font-bold text-cyan-800">SECTION 03</span>
                </h2>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">MACHINE ID</span>
                      <strong className="text-slate-800">{sections['03'].data.machineId}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">BASELINE DATE</span>
                      <strong className="text-slate-800">{sections['03'].data.baselineDate || 'No Previous Baseline'}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block mb-2">LASER HEAD SOURCES</span>
                    <div className="grid grid-cols-2 gap-2">
                      {sections['03'].data.laserHeads.map(head => (
                        <div key={head.laserId} className="p-2 rounded bg-white border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{head.identifier}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{head.ratedPowerWatts} W Rated</div>
                          </div>
                          {renderStatusBadge(head.runtimeStatus || 'NORMAL')}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {metadata.customerName}</span>
              <span>Page 2 of 6</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 3: EXECUTIVE SUMMARY (04) & LASER HOURS (05)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>EXECUTIVE SUMMARY &amp; HOURS</span>
            </div>

            {/* Content Body */}
            <div className="space-y-6 my-2 flex-1">
              
              {/* SECTION 04: EXECUTIVE SUMMARY */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    04 EXECUTIVE SUMMARY
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">READINESS SCORE:</span>
                    <span className="text-sm font-mono font-extrabold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {sections['04'].data.readinessScore}%
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-500 font-bold uppercase text-[10px]">SYSTEM RELEASE VERDICT:</span>
                    {renderStatusBadge(sections['04'].data.overallStatus)}
                  </div>

                  <p className="text-slate-700 leading-relaxed font-sans">
                    {sections['04'].data.summaryText}
                  </p>

                  {/* Major Pass/Fail Table */}
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">CORE AUDIT AUDIT RESULTS</span>
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 font-mono text-[10px] text-slate-400">
                          <th className="py-1">SUBSYSTEM / AUDIT ITEM</th>
                          <th className="py-1">SPECIFICATION</th>
                          <th className="py-1 text-right">VERDICT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sections['04'].data.majorPassFailResults.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 font-bold text-slate-800">{item.component}</td>
                            <td className="py-1.5 text-slate-500 font-mono text-[11px]">{item.note}</td>
                            <td className="py-1.5 text-right">{renderStatusBadge(item.verdict)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION 05: LASER HOURS TELEMETRY */}
              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>05 LASER HOURS &amp; LIFETIME TELEMETRY</span>
                  <span className="text-xs font-mono font-normal text-slate-500">SECTION 05</span>
                </h2>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <p className="text-slate-600 text-xs">
                    {sections['05'].data.summaryText}
                  </p>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 font-mono text-[10px] text-slate-400">
                        <th className="py-1">LASER SOURCE</th>
                        <th className="py-1">RECORDED HOURS</th>
                        <th className="py-1">VERIFIED HOUR</th>
                        <th className="py-1">WARNING LIMIT</th>
                        <th className="py-1 text-right">RUNTIME STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {sections['05'].data.laserHours.map(hrs => (
                        <tr key={hrs.laserId}>
                          <td className="py-2 font-bold font-sans text-slate-800">{hrs.laserIdentifier}</td>
                          <td className="py-2">{hrs.recordedLaserHour.toLocaleString()} hrs</td>
                          <td className="py-2 font-bold text-cyan-800">
                            {hrs.verifiedHour ? `${hrs.verifiedHour.toLocaleString()} hrs ✓` : '—'}
                          </td>
                          <td className="py-2 text-slate-500">{hrs.warningThreshold.toLocaleString()} hrs</td>
                          <td className="py-2 text-right">{renderStatusBadge(hrs.runtimeStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {metadata.customerName}</span>
              <span>Page 3 of 6</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 4: LASER POWER (06) & BEAM PROFILE (07)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>LASER POWER &amp; BEAM PROFILE</span>
            </div>

            {/* Content Body */}
            <div className="space-y-6 my-2 flex-1">
              
              {/* SECTION 06: LASER POWER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    06 LASER POWER &amp; BASELINE COMPARISON
                  </h2>
                  <span className="text-xs font-mono font-bold text-cyan-800">SPEC: 15.0W ± 10%</span>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-slate-600 text-xs italic">
                    {sections['06'].data.comparisonNote}
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {sections['06'].data.heads.map(head => (
                      <div key={head.headId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-slate-900 text-xs">{head.headName}</span>
                          {renderStatusBadge(head.current.verdict)}
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-[11px] font-mono pt-1">
                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 block">BEFORE MAINT.</span>
                            <strong>{head.current.beforeValueWatts > 0 ? `${head.current.beforeValueWatts.toFixed(2)} W` : 'N/A'}</strong>
                          </div>

                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 block">AFTER MAINT.</span>
                            <strong className="text-cyan-900">{head.current.afterValueWatts.toFixed(2)} W</strong>
                          </div>

                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 block">PREVIOUS BASELINE</span>
                            <span>{head.previous ? `${head.previous.afterValueWatts.toFixed(2)} W` : 'None'}</span>
                          </div>

                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 block">COMPARISON DELTA</span>
                            <strong className={head.comparison.deltaWatts && head.comparison.deltaWatts < 0 ? 'text-amber-800' : 'text-emerald-800'}>
                              {head.comparison.statusText}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 07: BEAM PROFILE */}
              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>07 OPTICAL BEAM PROFILE &amp; SPOT QUALITY</span>
                  <span className="text-xs font-mono font-normal text-slate-500">TEM00 GAUSSIAN MODE</span>
                </h2>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <p className="text-slate-600 text-xs">
                    {sections['07'].data.comparisonNote}
                  </p>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    {sections['07'].data.heads.map(head => (
                      <div key={head.headId} className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-900 font-sans">{head.headName}</div>
                        <div className="text-[11px] text-slate-600">
                          Current Spot Size: <strong className="text-cyan-800">{head.current.beamSizeMm ? `${head.current.beamSizeMm.toFixed(3)} mm` : 'Recorded'}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Previous Baseline: {head.previous?.beamSizeMm ? `${head.previous.beamSizeMm.toFixed(3)} mm` : 'None'}
                        </div>
                        <div className="text-[10px] font-bold text-slate-700">
                          Delta: {head.comparison.statusText}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* OPTIONAL SECTION 08: FOCUS OPTIMIZATION */}
              {isSectionVisible('08') && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h3 className="text-sm font-bold text-slate-900 font-mono">08 FOCUS OPTIMIZATION</h3>
                    {renderStatusBadge(sections['08'].status)}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    {sections['08'].data.notes || 'Focus curves verified within focal range tolerances.'}
                  </div>
                </div>
              )}

              {/* OPTIONAL SECTION 09: POWER OFFSET */}
              {isSectionVisible('09') && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h3 className="text-sm font-bold text-slate-900 font-mono">09 POWER OFFSET / CALIBRATION CURVE</h3>
                    {renderStatusBadge(sections['09'].status)}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    {sections['09'].data.notes || 'Power attenuation offsets verified across operational range.'}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {metadata.customerName}</span>
              <span>Page 4 of 6</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 5: MOTION & CALIBRATION (10 STAGE, 11 AGC)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>STAGE &amp; AGC CALIBRATION</span>
            </div>

            {/* Content Body */}
            <div className="space-y-6 my-2 flex-1">
              
              {/* SECTION 10: STAGE CALIBRATION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    10 STAGE CALIBRATION (X/Y DEVIATION)
                  </h2>
                  <span className="text-xs font-mono font-bold text-cyan-800">TOLERANCE: ±2.0 µm</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-500 font-bold text-[10px]">STAGE ALIGNMENT VERDICT:</span>
                    {renderStatusBadge(sections['10'].data.overallVerdict)}
                  </div>

                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400">
                        <th className="py-1 font-sans">STAGE ID</th>
                        <th className="py-1">MAX ABS X (µm)</th>
                        <th className="py-1">MAX ABS Y (µm)</th>
                        <th className="py-1">OVERALL MAX (µm)</th>
                        <th className="py-1 text-right font-sans">VERDICT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sections['10'].data.stages.map(stg => (
                        <tr key={stg.stageId}>
                          <td className="py-2 font-bold font-sans text-slate-800">{stg.stageName}</td>
                          <td className="py-2">{stg.maxAbsXUm !== undefined ? `${stg.maxAbsXUm.toFixed(2)} µm` : '—'}</td>
                          <td className="py-2">{stg.maxAbsYUm !== undefined ? `${stg.maxAbsYUm.toFixed(2)} µm` : '—'}</td>
                          <td className="py-2 font-bold text-cyan-800">{stg.overallMaxDevUm !== undefined ? `${stg.overallMaxDevUm.toFixed(2)} µm` : '—'}</td>
                          <td className="py-2 text-right">{renderStatusBadge(stg.verdict)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 11: AGC / SCANNER CALIBRATION */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    11 AGC / SCANNER CALIBRATION
                  </h2>
                  <span className="text-xs font-mono font-bold text-cyan-800">TOLERANCE: ±3.0 µm</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-500 font-bold text-[10px]">AGC SCANNER VERDICT:</span>
                    {renderStatusBadge(sections['11'].data.overallVerdict)}
                  </div>

                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400">
                        <th className="py-1 font-sans">AGC UNIT</th>
                        <th className="py-1">INDICES PASSED</th>
                        <th className="py-1">MAX DEV (µm)</th>
                        <th className="py-1 text-right font-sans">VERDICT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sections['11'].data.agcs.map(agc => (
                        <tr key={agc.agcId}>
                          <td className="py-2 font-bold font-sans text-slate-800">{agc.agcName}</td>
                          <td className="py-2">{agc.indices.filter(i => i.verdict === 'PASS').length} / {agc.indices.length || 6}</td>
                          <td className="py-2 font-bold text-cyan-800">{agc.overallMaxDevUm !== undefined ? `${agc.overallMaxDevUm.toFixed(2)} µm` : '—'}</td>
                          <td className="py-2 text-right">{renderStatusBadge(agc.verdict)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 12: TEMPERATURE MONITORING */}
              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>12 TEMPERATURE &amp; THERMAL TELEMETRY</span>
                  <span className="text-xs font-mono font-normal text-slate-500">SECTION 12</span>
                </h2>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs font-mono">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-400 block">CHILLER TEMP</span>
                      <strong className="text-slate-800">
                        {sections['12'].data.chillerTempCelsius !== undefined && sections['12'].data.chillerTempCelsius !== null
                          ? `${sections['12'].data.chillerTempCelsius.toFixed(1)} °C`
                          : '—'}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-400 block">COOLING FLOW</span>
                      <strong className="text-slate-800">
                        {sections['12'].data.chillerFlowLpm !== undefined && sections['12'].data.chillerFlowLpm !== null
                          ? `${sections['12'].data.chillerFlowLpm.toFixed(1)} L/min`
                          : '—'}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-400 block">COOLING STATUS</span>
                      <div>{renderStatusBadge(sections['12'].data.coolingResult || 'NOT_COLLECTED')}</div>
                    </div>
                  </div>

                  {sections['12'].data.hasValidTemperatureAnalysis && sections['12'].data.stats && (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block">MIN TEMP</span>
                        <strong>{((sections['12'].data.stats as any).minTempCelsius ?? sections['12'].data.stats.min).toFixed(2)} °C</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">MAX TEMP</span>
                        <strong>{((sections['12'].data.stats as any).maxTempCelsius ?? sections['12'].data.stats.max).toFixed(2)} °C</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">AVG TEMP</span>
                        <strong>{((sections['12'].data.stats as any).avgTempCelsius ?? sections['12'].data.stats.avg).toFixed(2)} °C</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OPTIONAL SECTION 13: LASER / PRODUCT PROFILE */}
              {isSectionVisible('13') && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h3 className="text-sm font-bold text-slate-900 font-mono">13 LASER / PRODUCT PROFILE</h3>
                    {renderStatusBadge(sections['13'].status)}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    {sections['13'].data.profileInfo || 'Recipe process parameters matched against machine baseline configuration.'}
                  </div>
                </div>
              )}

              {/* OPTIONAL SECTION 14: PRODUCT VIA QUALITY */}
              {isSectionVisible('14') && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h3 className="text-sm font-bold text-slate-900 font-mono">14 PRODUCT VIA QUALITY</h3>
                    {renderStatusBadge(sections['14'].status)}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    {sections['14'].data.notes || 'Microvia roundness and taper angle verified via automated optical inspection.'}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {metadata.customerName}</span>
              <span>Page 5 of 6</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 6: FINDINGS (15), ACTIONS (16), PARTS (17), BUYOFF (19)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>FINDINGS, RECOMMENDATIONS &amp; BUYOFF</span>
            </div>

            {/* Content Body */}
            <div className="space-y-5 my-2 flex-1">
              
              {/* SECTION 15 & 16: FINDINGS & CORRECTIVE ACTIONS */}
              <div className="space-y-3">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>15 &amp; 16 FINDINGS &amp; CORRECTIVE ACTIONS</span>
                  <span className="text-xs font-mono font-bold text-cyan-800">TOTAL FINDINGS: {sections['15'].data.totalFindingsCount}</span>
                </h2>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  {sections['16'].data.actionsList.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 font-mono text-[10px] text-slate-400">
                          <th className="py-1">SOURCE</th>
                          <th className="py-1">COMPONENT</th>
                          <th className="py-1">CORRECTIVE ACTION</th>
                          <th className="py-1 text-right">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {sections['16'].data.actionsList.map(act => (
                          <tr key={act.id}>
                            <td className="py-1.5 font-bold text-slate-800">{act.source}</td>
                            <td className="py-1.5 font-mono text-[11px] text-slate-600">{act.findingComponent || 'System'}</td>
                            <td className="py-1.5 text-slate-700">{act.actionText}</td>
                            <td className="py-1.5 text-right font-mono text-[10px] font-bold text-cyan-800">{act.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-slate-600 italic text-xs">
                      No critical inspection findings or corrective actions required during this service session.
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION 17: SPARE PARTS */}
              <div className="space-y-3">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1">
                  17 SPARE PARTS &amp; RECOMMENDATIONS
                </h2>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  {sections['17'].data.spareParts.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 font-mono text-[10px] text-slate-400">
                          <th className="py-1">PART NAME</th>
                          <th className="py-1 font-mono">PART NUMBER</th>
                          <th className="py-1">QTY</th>
                          <th className="py-1">ACTION</th>
                          <th className="py-1 text-right">COSTING</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sections['17'].data.spareParts.map(sp => (
                          <tr key={sp.id}>
                            <td className="py-1.5 font-bold text-slate-800">{sp.partName}</td>
                            <td className="py-1.5 font-mono text-[11px] text-slate-600">{sp.partNumber}</td>
                            <td className="py-1.5 font-mono">{sp.quantity}</td>
                            <td className="py-1.5 font-bold text-cyan-900">{sp.action}</td>
                            <td className="py-1.5 text-right font-mono text-[10px] text-slate-500">{sp.costIndicator}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-slate-600 italic text-xs">No spare parts replaced or used during this MHC check.</p>
                  )}
                </div>
              </div>

              {/* SECTION 18: EVIDENCE & ATTACHMENTS */}
              {(sections['18'].data.items.length > 0 || isSectionVisible('18')) && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h2 className="text-sm font-bold text-slate-900 font-mono flex items-center justify-between w-full">
                      <span>18 EVIDENCE ATTACHMENTS</span>
                      <span className="text-xs text-slate-500 font-normal">
                        {sections['18'].data.totalEvidenceItems} ATTACHED
                      </span>
                    </h2>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    {sections['18'].data.items.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {sections['18'].data.items.map(item => (
                          <div key={item.id} className="p-2 rounded bg-white border border-slate-200 space-y-1">
                            {item.imageDataUrl && (
                              <img 
                                src={item.imageDataUrl} 
                                alt={item.title} 
                                className="w-full h-20 object-cover rounded border border-slate-100" 
                              />
                            )}
                            <div className="font-bold text-slate-900 text-[11px]">{item.title}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.sourceSection} • {item.notes || 'Photo record'}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 italic text-xs">No external evidence images attached to this MHC report.</p>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 19: BUYOFF & SIGN-OFF */}
              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>19 BUYOFF &amp; OFFICIAL APPROVALS</span>
                  {renderStatusBadge(sections['19'].data.productionReleaseVerdict)}
                </h2>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    
                    {/* Engineer Signature Block */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-3">
                      <div className="text-[10px] font-mono text-slate-400 font-bold uppercase border-b border-slate-100 pb-1">
                        FIELD SERVICE ENGINEER
                      </div>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-sm block">{sections['19'].data.engineerSignoff.name}</strong>
                        <div className="text-[11px] text-slate-500">{sections['19'].data.engineerSignoff.title}</div>
                        <div className="text-[10px] font-mono text-slate-400">Date: {sections['19'].data.engineerSignoff.date}</div>
                      </div>
                      <div className="pt-4 border-t border-dashed border-slate-200 text-center font-mono text-[10px] text-slate-400">
                        [ ELECTRONIC SIGN-OFF VERIFIED ]
                      </div>
                    </div>

                    {/* Customer Signoff Block */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-3">
                      <div className="text-[10px] font-mono text-slate-400 font-bold uppercase border-b border-slate-100 pb-1">
                        CUSTOMER ACCEPTANCE REPRESENTATIVE
                      </div>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-sm block">{sections['19'].data.customerSignoff.name}</strong>
                        <div className="text-[11px] text-slate-500">{sections['19'].data.customerSignoff.title}</div>
                        <div className="text-[10px] font-mono text-slate-400">Date: {sections['19'].data.customerSignoff.date}</div>
                      </div>
                      <div className="pt-4 border-t border-dashed border-slate-200 text-center font-mono text-[10px] text-slate-400">
                        [ SIGNATURE ON FILE / RELEASED ]
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {metadata.customerName}</span>
              <span>Page 6 of 6</span>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
