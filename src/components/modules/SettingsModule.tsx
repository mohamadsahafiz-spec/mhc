import React from 'react';
import { RefreshCw, Bot, User, History, Compass, Cpu, Calendar, Tag, Activity, ShieldCheck } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

interface SettingsProps {
  onResetData: () => void;
}

export const SettingsModule: React.FC<SettingsProps> = ({ onResetData }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const changelog = [
    {
      version: 'v1.0.31.4',
      date: '2026-08-13',
      type: 'Complete Operational Data Reset',
      highlights: [
        'COMPLETE OPERATIONAL DATA RESET: Fully cleared all runtime operational data (Customers, Machines, MHC Sessions, Reports, Contracts, Schedules, Tasks, Investigations, Plants, Lines, Evidence).',
        'CLEAN EMPTY STATE: Application starts with zero customer and machine records, ensuring no ghost/fixture data (TSMC, Hyundai, ASML) is ever hydration-seeded.',
        'ONE-TIME AUTOMATIC PURGE: Executed one-time localStorage and sync queue purge for v1.0.31.4 upgrade, resetting persistent state completely.',
        'MANUAL ENTRY MANDATE: Customer Passport and Machine Passport render clean empty state prompting explicit manual equipment entry.',
        'ENGINEERING ENGINES PRESERVED: Temperature Engine, Laser Power Engine, Beam Profile Engine, Calibration, Autopilot, Report Renderer, and calculations fully preserved.'
      ]
    },
    {
      version: 'v1.0.31.3',
      date: '2026-08-13',
      type: 'Customer Storage Authority Repair',
      highlights: [
        'SINGLE AUTHORITATIVE CUSTOMER PERSISTENCE: StorageService is now the single authoritative storage path for Customer data across FSOS.',
        'REMOVED DUAL STORAGE AUTHORITY: Eliminated MachinePassportModule independent fsos_customer_list state and legacy storage key.',
        'REMOVED RUNTIME FIXTURE FALLBACK: Discontinued INITIAL_CUSTOMERS runtime fallback; empty Customer store remains empty without generating ghost records.',
        'SYNC ENGINE TOMBSTONE PROTECTION: Prevented stale fixture lists from enqueuing delete tombstones against legitimate Customer records.',
        'SAFE DATA MIGRATION: Seamlessly migrated and merged any legitimate records from legacy fsos_customer_list before key removal.'
      ]
    },
    {
      version: 'v1.0.31.2',
      date: '2026-08-13',
      type: 'MHC Autopilot Render Loop Fix',
      highlights: [
        'MHC AUTOPILOT RENDER LOOP FIX: Resolved React infinite update loop caused by object reference dependency on progress.activityNotes in useEffect.',
        'PRIMITIVE DEPENDENCY STABILIZATION: Updated useEffect dependency to primitive progress.activityNotes?.[currentCode] string.',
        'FULL SYSTEM STABILITY: Verified startup, normal render, activity note persistence, and Customer/Machine Passport rendering without recursion.'
      ]
    },
    {
      version: 'v1.0.28',
      date: '2026-08-12',
      type: 'Phase 7 — MHC Readiness Review (Day 4)',
      highlights: [
        'MHC AUTHORITATIVE SESSION AUDIT: Performs comprehensive live readiness audit across all Day 1–3 engineering activities (01 through 06) without modifying or duplicating underlying session data.',
        'DERIVED AUDIT MATRIX: Dynamically evaluates Laser Hours, Head 1 & 2 Power, Beam Profile, Optical Inspections & Findings, Stage 1 & 2 Calibration, AGC 1 & 2, and Temperature Telemetry.',
        'READINESS STATE CATEGORIZATION: Clearly classifies session status into 🟢 READY FOR REPORT or 🟠 ATTENTION REQUIRED with explicit blocker counts and next actionable steps.',
        'INTERACTIVE DIRECT NAVIGATION: Every audit row and blocker item is clickable, allowing instant jump navigation back to the relevant activity to resolve issues.',
        'REPORT GATE ENFORCEMENT: Locks Activity 08 Report Generation until all required engineering activities pass without blockers; automatically unlocks Activity 08 when readiness criteria are satisfied.',
        'NON-BLOCKING OPTIONAL EVIDENCE: Correctly treats optional attachments as non-blocking items, ensuring engineers are never stuck on optional evidence.'
      ]
    },
    {
      version: 'v1.0.27',
      date: '2026-08-12',
      type: 'Phase 6 — Temperature & Evidence Integration (Day 3)',
      highlights: [
        'PROTECTED TEMPERATURE ENGINE INTEGRATION: Directly connects the proven TemperatureEngine log parser and analysis pipeline into Autopilot without rewriting or duplicating code.',
        'AUTOMATIC LOG ANALYSIS & PASSPORT RECORDING: Parses raw .log/.txt telemetry files or attaches saved Machine Passport records into the active MHC session.',
        'AUTHORITATIVE SUMMARY DASHBOARD: Displays concise global thermal statistics (Min, Max, Avg, Delta) and Station 1–6 channel breakdowns inside Autopilot.',
        'CANVAS JUMP ACTION: Provides direct "Open Interactive Temperature Canvas" action button for deep chart analysis.',
        'LIGHTWEIGHT AUTHORITATIVE EVIDENCE COLLECTION: Supports attaching and linking inspection images, calibration documents, and temperature evidence to the session.',
        'DAY 3 COMPLETION & DAY 4 READINESS UNLOCK: Completing Activity 06 automatically unlocks Day 4 MHC Readiness Review (07) while keeping Report Generation locked.'
      ]
    },
    {
      version: 'v1.0.26',
      date: '2026-08-12',
      type: 'Phase 5 — AGC Autopilot (Day 3)',
      highlights: [
        'INDEPENDENT AGC 1 & AGC 2 WORKSPACES: Dedicated final-result entry workspaces for AGC 1 and AGC 2 scanners/laser heads with independent tracking.',
        'FULL INDEX 0–5 RECORDING: Captures final X and Y deviation results in µm for all 6 indices (Index 0 through 5).',
        'REAL-TIME ±3.0 µm SPECIFICATION ENGINE: Computes Max Abs X, Max Abs Y, and Overall Max Deviation against the ±3.0 µm tolerance limit.',
        'POKA-YOKE SPEC ENFORCEMENT: Values outside ±3.0 µm trigger OUT OF SPEC state, block PASS completion, and flag stage as NEEDS_REVIEW.',
        'SCANNER CONDITION WARNING: Out-of-spec readings flag "Scanner calibration outside specification — scanner condition requires engineering attention" with 2-year planning datum advisory.',
        'RE-RUN REVISION & OPTIONAL EVIDENCE: Allows re-entry for physical re-run verifications and optional external AGC report image attachment.',
        'DAY 3 ADVANCEMENT: Dual PASS on AGC 1 & AGC 2 automatically marks 05 AGC COMPLETED and unlocks Day 3 Temperature & Evidence (06).'
      ]
    },
    {
      version: 'v1.0.25',
      date: '2026-08-12',
      type: 'Phase 4 — Stage Calibration Autopilot (Day 2)',
      highlights: [
        'INDEPENDENT STAGE 1 & STAGE 2 WORKSPACES: Authoritative final-result calibration entry workspaces for Stage 1 and Stage 2 with independent status tracking and tab switching.',
        'X/Y MIN & MAX DEVIATION RECORDING: Captures X Min, X Max, Y Min, and Y Max deviation readings in µm per stage.',
        'REAL-TIME SPECIFICATION ASSESSMENT (±2.0 µm): Automatically calculates Max Abs X, Max Abs Y, and Overall Max Deviation against the ±2.0 µm tolerance benchmark.',
        'POKA-YOKE SPEC ENFORCEMENT: Exceeding ±2.0 µm triggers OUT OF SPEC state, marks stage NEEDS_REVIEW, and prevents granting PASS status.',
        'RE-RUN CORRECTION & OPTIONAL EVIDENCE: Supports physical re-run entry revisions and optional external calibration report image attachment.',
        'AUTOPILOT DAY 3 ADVANCEMENT: Unlocks Day 3 AGC upon completing both Stage 1 and Stage 2 calibration with PASS.'
      ]
    },
    {
      version: 'v1.0.24',
      date: '2026-08-12',
      type: 'Day 1 Autopilot Integration + Poka-Yoke Hardening',
      highlights: [
        'SESSION RESUME & HYDRATION: Verified seamless session progress, measurements, findings, and Journey Rail state restoration upon reload/reopen.',
        'HEAD INDEPENDENCE: Strictly decoupled Laser Head 1 and Laser Head 2 inspection findings and completion status; Day 1 requires both heads to satisfy requirements before advancing.',
        'NEEDS REVIEW PROPAGATION: Reopening or editing earlier completed activities flags downstream dependent steps as NEEDS_REVIEW until re-verified.',
        'POKA-YOKE HARDENING: Enforced strict validation across required fields, out-of-spec power/beam handling, and material engineering constraints without introducing artificial blockers.',
        'DAY 1 COMPLETION & DAY 2 TRANSITION: Seamless transition to Day 2 actionable state upon completing all Day 1 activities while keeping Stage Calibration locked until Day 2.'
      ]
    },
    {
      version: 'v1.0.23',
      date: '2026-08-12',
      type: 'Phase 3D — Optical / Mechanical Inspection + Findings',
      highlights: [
        'INDEPENDENT LASER HEAD INSPECTIONS: Allows recording optical/mechanical inspection findings independently for Laser Head 1 and Laser Head 2 with dedicated completion tracking.',
        'FAST NO-ISSUE PATH & PROGRESSIVE FOLLOW-UPS: Directly completes clean laser heads with one-click "No issue found", or activates progressive component damage follow-ups when an issue is reported.',
        'RELEVANT OPTICAL COMPONENTS & DAMAGE SELECTION: Supports cameras, TC lens, scanner lenses, transmitting optics, and custom components paired with multi-select damage conditions and action recommendations.',
        'ENGINEERING RULE ENFORCEMENT: Enforces known constraint that burned transmitting optics cannot be restored by cleaning and require replacement.',
        'AI FINDING ASSISTANCE: Provides controlled "Generate Finding Wording" assistance to convert facts into editable report-ready summaries without blocking offline execution.'
      ]
    },
    {
      version: 'v1.0.22',
      date: '2026-08-12',
      type: 'Phase 3C — Beam Profile / Mode Autopilot',
      highlights: [
        'SIDE-BY-SIDE BEAM WORKSPACE: Interactive measurement workspace displaying Laser Head 1 and Laser Head 2 side-by-side across 8 measurement stations (Laser Source, After Optics, Index Masks 0–5).',
        'DATA CAPTURE & HISTORICAL BASELINE: Captures current beam diameters, computes PASS/FAIL against BeamProfileEngine specifications, and calculates Delta mm and Delta % against historical machine records.',
        'OPTIONAL EVIDENCE IMAGE ATTACHMENT: Preserves real uploaded beam profile evidence images without forcing evidence upload (missing image does not block completion).',
        'POKA-YOKE & OUT-OF-SPEC VALIDATION: Enforces complete, valid numeric beam diameter measurements for all 16 stations and flags out-of-spec values before allowing Journey Rail advancement.',
        'AUTHORITATIVE PERSISTENCE: Saves evaluated BeamProfileCheckRecord directly to the active MHC session model and Machine Passport record.'
      ]
    },
    {
      version: 'v1.0.21',
      date: '2026-08-12',
      type: 'Phase 3B — Laser Power Autopilot',
      highlights: [
        'SIDE-BY-SIDE POWER WORKSPACE: Replaced manual report entry with a fast engineering measurement workspace displaying Laser Head 1 and Laser Head 2 side-by-side.',
        '8 MEASUREMENT POINTS PER HEAD: Measures Laser Source, After Optics, and Index Masks 0 through 5 using native LaserPowerEngine and MASK_SPECS constants.',
        'PREVIOUS VS CURRENT BASELINE COMPARISON: Automatically retrieves the most relevant historical MHC record for the machine and displays previous values, Delta W, and Delta %.',
        'POKA-YOKE & OUT-OF-SPEC VALIDATION: Instantly evaluates entered values, flags out-of-spec or invalid measurements, and enforces complete resolution before marking Activity 02 Power COMPLETED.',
        'AUTHORITATIVE SESSION PERSISTENCE: Saves validated power check records into the MHC session model and Machine Passport while updating the Journey Rail status.'
      ]
    },
    {
      version: 'v1.0.20',
      date: '2026-08-12',
      type: 'Phase 3A — Day 1 Laser Hours Autopilot',
      highlights: [
        'DAY 1 LASER HOURS INTEGRATION: Connected Machine Passport data and native LaserEngine to Autopilot so Laser Hours becomes the first real engineering activity.',
        'DUAL LASER HEAD DISCOVERY: Automatically retrieves and displays operating hours, baseline records, operating deltas, and lifecycle health for Laser Head 1 and Laser Head 2.',
        'ENGINEER VERIFICATION & RECALIBRATION: Allows engineers to confirm retrieved readings or record recalibrated/adjusted operating hours for offline runtime without destroying original source info.',
        'COMPLETION GATE & JOURNEY RAIL: Requires verification of both laser heads before marking Activity 01 COMPLETED, automatically advancing Autopilot progress and unlocking downstream activities.'
      ]
    },
    {
      version: 'v1.0.19',
      date: '2026-08-12',
      type: 'MHC Autopilot Session Brain Sprint',
      highlights: [
        'SESSION BRAIN ENGINE: Built persistent session/progress layer tracking Customer, Machine, MHC Session ID, Start Date, Current Day, Active Activity, and Readiness Score across Days 1–4.',
        'ACTIVITY STATE ARCHITECTURE: Tracks atomic status per activity (✓ COMPLETED, ◉ CURRENT / IN PROGRESS, ⚠ NEEDS REVIEW, ○ UPCOMING, 🔒 LOCKED).',
        'JOURNEY RAIL BRAIN: Interactive Journey Rail displays real-time status tree indicators and supports direct jump navigation to any unlocked or completed activity.',
        'READINESS MODEL: Lightweight readiness calculator computes completed count, incomplete count, needs review items, next actionable activity, and core engineering report readiness.',
        'READ-ONLY REVIEW MODE: "Review Progress" allows inspection of session state and readiness without mutating session data.',
        'SESSION RECOVERY & START NEW: Start New creates genuinely new sessions without overwriting existing sessions, while Continue Existing restores exact progress.'
      ]
    },
    {
      version: 'v1.0.18',
      date: '2026-08-12',
      type: 'MHC Journey Rail Correction Sprint',
      highlights: [
        'JOURNEY RAIL STRUCTURE: Corrected MHC Autopilot Journey Rail labels and hierarchy to reflect the actual multi-day MHC workflow.',
        'DAY 1: 01 Laser Hours, 02 Laser Head 1 (Power, Beam Profile / Mode, Inspection / Findings), 03 Laser Head 2 (Power, Beam Profile / Mode, Inspection / Findings).',
        'DAY 2: 04 Stage Calibration (Stage 1, Stage 2).',
        'DAY 3: 05 AGC (AGC 1, AGC 2), 06 Temperature & Evidence.',
        'DAY 4: 07 MHC Readiness Review, 08 Report Generation, 09 Buyoff / Complete.',
        'PLANNED / LOCKED ACTIVITIES: Activities are visually planned/locked on the Journey Rail without adding measurement logic yet, preserving setup flows and canvas engines intact.'
      ]
    },
    {
      version: 'v1.0.17',
      date: '2026-08-12',
      type: 'MHC Autopilot Foundation Sprint',
      highlights: [
        'MHC AUTOPILOT ENTRY: Introduced MHC Autopilot as the primary Machine Health Check experience asking ONE focused question at a time.',
        'MHC JOURNEY RAIL: Introduced the Journey Rail status model (completed, current, needs review, upcoming) supporting setup and planned activities.',
        'SESSION RECOVERY & DETECTION: Auto-detects existing incomplete sessions with options to Continue Existing, Start New, or Review Progress without data loss.',
        'CANVAS INTEGRATION: Retained full Smart MHC Workspace canvas accessibility under "Canvas / Workspace" without modifying existing engines.'
      ]
    },
    {
      version: 'v1.0.15',
      date: '2026-08-09',
      type: 'Client-Side Storage Quota Optimization & Raw Telemetry IndexedDB Offloading',
      highlights: [
        'LOCALSTORAGE QUOTA FIX: Raw telemetry points array stripped from SavedTemperatureRecord inside localStorage and D1 sync payload.',
        'INDEXEDDB RAW STORAGE: Full raw temperature points preserved in browser IndexedDB (fsos_temperature_db) for zero-loss auditability.',
        'AUTOMATIC SANITIZATION: StorageService automatically sanitizes machine records on load and save, resolving QuotaExceededError for large log imports.'
      ]
    },
    {
      version: 'v1.0.14',
      date: '2026-08-09',
      type: 'Version Harmonization & Runtime Deployment Identity',
      highlights: [
        'VERSION HARMONIZATION: Updated package.json, in-app Sidebar, StartPage, and Settings badges to v1.0.14.',
        'RUNTIME DEPLOYMENT IDENTITY: Integrated Cloudflare Worker version metadata binding (CF_VERSION_METADATA) and APP_VERSION environment variable on /api/sync/status.',
        'PERFORMANCE INDEXES: Versioned migration 0001_add_indexes.sql prepared for D1 indexing.'
      ]
    },
    {
      version: 'v1.0.2',
      date: '2026-08-08',
      type: 'Migration Finalization & UI Version Harmonization',
      highlights: [
        'SYSTEM VERSION HARMONIZATION: Updated all in-app version badges, banners, and footers across the application to v1.0.2.',
        'OPERATIONAL BUILD STATUS: Updated in-app Operational Build Status to Cloudflare Workers Engine (CFW-20260808-102).',
        'PRODUCT EVOLUTION LOG: Updated Product Evolution Log to document native Cloudflare Workers and D1 database foundation.',
        'DOCUMENTATION: Updated in-app Version/Changelog page and release notes summary.'
      ]
    },
    {
      version: 'v1.0.1',
      date: '2026-08-08',
      type: 'Cloudflare Deployment & Validation',
      highlights: [
        'Wrangler & D1 Binding Verification: Confirmed wrangler.toml assets (./dist) and D1 database binding (DB).',
        'Cloud Run Decoupling: Application runtime decoupled from Cloud Run container dependencies.',
        'Deployment Documentation: Created step-by-step Wrangler deploy instructions in README.md.'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2026-08-08',
      type: 'Cloudflare Workers Foundation',
      highlights: [
        'Cloudflare Workers Runtime Integration: Migrated application server endpoints to Cloudflare Workers native fetch standard.',
        'Native API Routing: Implemented worker handlers for /api/health, /api/sync, /api/changes, /api/images, /api/record, and /api/sync/status.',
        'D1 Database & Static Assets: Bound Cloudflare D1 database (DB) and served static React SPA assets (ASSETS).'
      ]
    },
    {
      version: 'v0.9.1',
      date: '2026-08-07',
      type: 'Data Integrity Hotfix (v0.9.1)',
      highlights: [
        'Browser-Local Time Semantics: Updated default dates and timestamps to browser-local time (getLocalDateString).',
        'Laser Power History: Added [+ New Current Check] and [+ Add Historical Record] workflows with strict date sorting.',
        'IndexedDB Image Persistence: Removed localStorage quota errors and silent payload pruning. Evidence stored safely in browser IndexedDB.',
        'Product / Process / Via Null-Safety: Fixed null-pointer errors for previous records with optional chaining and fallback empty state.',
        'Beam Profile Record Management: Added reliable record deletion with automatic IndexedDB blob cleanup.',
        'Save Transaction Safety: Atomic persistence ensures form data is retained and error feedback shown if storage fails.'
      ]
    },
    {
      version: 'v0.9.0',
      date: '2026-08-06',
      type: 'Phase 1.3: Smart MHC Refine & Release (ECO-20260806-038)',
      highlights: [
        'CRITICAL WORKSPACE CORRECTION: Expanded Smart MHC across full viewport width while preserving exact A4 210:297 portrait aspect ratio and centering canvas.',
        'NEW: Canvas View Controls — integrated Zoom -, 100%, Zoom +, and Fit Page auto-scaling to fit A4 document perfectly inside viewport.',
        'NEW: DOM-Measured A4 Capacity Engine — real-time calculation of rendered document height against standard A4 printable height with visual fill meter.',
        'NEW: Automated Quality Check & Over-Capacity Guard — blocks PDF export when report height exceeds 1 page and alerts engineer to adjust widget layout.',
        'NEW: ISO 13374-4 Inspired Condition Monitoring Intelligence — automated Current Condition, Degradation Trend, Health Score, Prognosis Life, and Recommended Actions.',
        'NEW: Isolated A4 Print & PDF Export Engine — full-screen print preview modal generating clean 1-page A4 PDF output with zero UI chrome.',
        'NEW: Automatic Previous MHC Historical Comparison — automatically identifies and compares power, beam spot size, and thermal loop against previous machine session.',
        'NEW: Single Source of Truth Synchronization — inline data edits in Smart MHC sync instantly to active session data and data tray.',
        'NEW: Strict Separation of Templates & Drafts — Templates store structure/layout only; Drafts store full session measurements, custom fields, and canvas state.'
      ]
    },
    {
      version: 'v0.9.0 Phase 1.2',
      date: '2026-08-06',
      type: 'Phase 1.2: Smart MHC Core Build (ECO-20260806-037)',
      highlights: [
        'NEW: Smart MHC Engine Single Source of Truth — direct bind to Machine Passport static identity, active MHCSession readings, and previous MHC historical data.',
        'NEW: Functional Data Tray availability engine — real-time AVAILABLE / MISSING / N/A status badges based on machine and session data state.',
        'NEW: [+ Add Custom Data] — create reusable, bindable MHC fields/measurements with text, number/unit, date/time, status, note, image, or measurement field types.',
        'NEW: Data-Connected Canvas Widgets — Laser Life, Laser Temp/Thermal Loop, Laser Power Calibration, Beam Comparison, Optics Condition, Process Parameters, Spare Parts, and Recommendations.',
        'NEW: Inline Missing Data Edit & Sync — fill missing readings directly inside Smart MHC without redirecting to Stage 01–08 forms; changes sync instantly across widgets and session.',
        'NEW: [+ Create Custom Widget] — build user-defined widgets binding existing or custom Data Tray fields with customizable display types (Cards, Tables, Callouts, Images).',
        'NEW: Interactive A4 Portrait Canvas — full drag/reorder controls (Move Up/Down, Duplicate, Remove), 1/1, 1/2, 1/3 column layouts, and A4 page fill capacity indicator.',
        'NEW: ISO 13374-4 Inspired Condition-Monitoring Intelligence — automated Current Condition, Degradation Trend, Overall Health Score, Prognosis Remaining Life, and Recommended Actions.',
        'NEW: Automatic Previous MHC Historical Comparison — compares current wattage, beam spot size, and thermal loop against previous completed MHC session without manual re-entry.',
        'NEW: Strict Separation of Templates & Drafts — Templates store structure/layout only (Save/Load/Duplicate); Drafts store actual machine session work, measurements, evidence, and canvas state.'
      ]
    },
    {
      version: 'v0.8.1',
      date: '2026-08-03',
      type: 'MHC CRUD & Machine Passport UX Refinement (ECO-20260803-035)',
      highlights: [
        'FIXED: Machine Passport Customer deletion logic — customer deletion is strictly blocked when machines are assigned.',
        'FIXED: Machine Passport Machine deletion — deleting the last machine deletes ONLY that machine; customer account remains intact.',
        'FIXED: Removed duplicate "Machine Actions" dropdown from the Machine Detail panel; retained 3-dot card menu as primary CRUD control.',
        'NEW: Stage 01 (Current Laser Hour) CRUD controls — added "+ Add Laser" and per-laser "Delete Laser" actions with customizable identifiers.',
        'NEW: Stage 01 Remaining Hours indicator — calculated dynamic remaining hours with prominent alert badge when ≤500 hrs remaining.',
        'NEW: Stage 03 (Laser Output & Power) CRUD controls — added "+ Add Power Head" and per-head "Delete Laser Head" actions with customizable identifiers.',
        'NEW: Stage 03 Evidence Photo Management — added photo upload and thumbnail deletion for each laser power head.',
        'NEW: Photo evidence upload & instant thumbnail removal for Stages 02, 04, 05, and 06.',
        'COMPLETED: Version bump to v0.8.1 with complete system documentation harmonization.'
      ]
    },
    {
      version: 'v0.8.0',
      date: '2026-08-03',
      type: 'MHC Operations Workspace Release (ECO-20260803-034)',
      highlights: [
        'NEW: Machine Health Check (MHC) operational workspace promoted to first-class primary category.',
        'NEW: Saved Report Draft Management featuring Load Draft, Duplicate Draft, and Delete Draft with confirmation.',
        'NEW: Real CSV Parsing & Data Hydration supporting field mapping with SUCCESS, PARTIAL, and ERROR feedback.',
        'NEW: Multi-Section CSV Data Export containing complete structured engineering data from Stages 01 through 08.',
        'NEW: Stage 01 Laser Hour auto-calculation model: Recorded Laser Hour + Reading Date + Reading Time + Elapsed Runtime = Calculated Current Laser Hour.',
        'NEW: Dynamic Engineer Identity integration removing all remaining hardcoded engineer names across MHC workflows.',
        'IMPROVED: Live Customer MHC Report Builder preview, document canvas, and executive sign-off blocks.',
        'COMPLETED: Full Definition of Done for v0.8.0 MHC Operations Workspace.'
      ]
    },
    {
      version: 'v0.7.8',
      date: '2026-08-03',
      type: 'Machine Passport Stability Sprint (ECO-20260803-032)',
      highlights: [
        'NEW: Adopted Engineering Rule #004 (Empty State Recovery) across FSOS.',
        'IMPROVED: Machine Passport empty-state workflow and recovery.',
        'IMPROVED: Add Machine creation flow and form state initialization.',
        'IMPROVED: Machine management usability and layout consistency.',
        'FIXED: Empty-state Add Machine button not responding when all machines are deleted.',
        'FIXED: Duplicate "+" button in Add Machine interface.',
        'KNOWN ISSUES: Machine Health Check workflow improvements scheduled for future sprint.',
        'KNOWN ISSUES: Workflow Navigator UX refinement deferred.',
        'KNOWN ISSUES: Google AI Studio Git synchronization may intermittently fail.'
      ]
    },
    {
      version: 'v0.7.7',
      date: '2026-08-03',
      type: 'Machine Health Check Workflow Sprint (ECO-20260803-031)',
      highlights: [
        'NEW: Machine Health Check (MHC) operational workflow overhaul.',
        'NEW: Active Inspection Target Machine selection grid with real-time status and health score filters.',
        'NEW: Laser Hour Monitoring & Lifecycle Threshold management (Recorded Hours, Current Reading, Runtime Delta, Warning/Critical Thresholds).',
        'NEW: Dynamic Laser Output & Power Calibration Check supporting multi-laser configurations (Add/Edit/Delete laser heads).',
        'NEW: Dynamic Editable Inspection Sections (Optics Cleanliness, Chiller Thermal Loop, Executive Release Verdict).',
        'NEW: 1-Click Customer MHC Report Generation reusing shared Executive Report engine.',
        'NEW: Standalone Customer-Ready MHC Report Document View with print, PDF export, sign-off blocks, and Before/After photos.',
        'FIXED: Customer account deletion following Engineering Rule #001 CRUD consistency with confirmation dialog.',
        'FIXED: Machine addition workflow keeps engineer inside active customer fleet workspace.',
        'NEW: Machine Card 3-Dot Action Menu (Edit Specifications, Rename Asset, Duplicate Machine, Delete Machine).',
        'NEW: Machine Photo Management (Upload, Change, and Remove image support for JPG, PNG, WEBP).'
      ]
    },
    {
      version: 'v0.7.6',
      date: '2026-08-03',
      type: 'Premium Light Experience (ECO-20260803-030)',
      highlights: [
        'NEW: Premium Light Theme refinement milestone.',
        'NEW: UI polishing phase officially introduced across all system views.',
        'IMPROVED: Overall visual consistency, typography hierarchy, and enterprise presentation quality.',
        'IMPROVED: Increased text contrast across headings, body text, and labels for WCAG compliance.',
        'IMPROVED: Introduced depth between layout layers (off-white bg-slate-50 canvas vs pure white cards).',
        'IMPROVED: Distinct sidebar surface separation and refined subtle borders.',
        'IMPROVED: Card hierarchy with consistent spacing, subtle elevation, and stronger hero emphasis.',
        'FIXED: Visual refinement issues addressed during the Premium Light Experience sprint.',
        'KNOWN ISSUES: Workflow Navigator UX refinement deferred to a future sprint.',
        'KNOWN ISSUES: Cloudflare deployment currently requires platform-aware Vite base path configuration.',
        'KNOWN ISSUES: Google AI Studio Git synchronization may intermittently fail.'
      ]
    },
    {
      version: 'v0.7.5',
      date: '2026-08-03',
      type: 'Identity Experience Refinement (ECO-20260802-029)',
      highlights: [
        'UX REFINEMENT: Centralized Engineer Profile management into dedicated My Profile workspace.',
        'CLEANUP: Completely removed duplicate profile fields (photo, name, role, email, phone, company, department) from Settings.',
        'DESKTOP ERGONOMICS: Re-architected My Profile into balanced 2-column layout (Personal Info vs Account Context & Certifications).',
        'HEADER POLISH: Compacted top header account menu trigger to [Avatar ▼], removing redundant text clutter.',
        'NAVIGATION HARMONIZATION: Direct profile access links from Sidebar Engineer Card, Header Account Menu, Users Directory, and Profile Panel.',
        'USERS DIRECTORY REDESIGN: Simplified Users table to 5 core columns with zero horizontal scrolling.',
        'OVERLAY STANDARDIZATION: Unified outside click, ESC key dismissal, and navigation auto-close across Notification Center and Account Dropdowns.',
        'FSOS DISCIPLINE: Synchronized system version v0.7.5 across all headers, sidebar, settings, and release documentation.'
      ]
    },
    {
      version: 'v0.7.4',
      date: '2026-08-03',
      type: 'Engineer Profile Photos & Identity System (ECO-20260802-028)',
      highlights: [
        'NEW: Individual Engineer Profile Photos for multi-engineer system readiness.',
        'NEW: Photo Upload, Change Photo, Remove Photo, and Restore Default Avatar controls in My Profile.',
        'NEW: Instant photo preview with 5MB file size validation and JPG/JPEG/PNG/WEBP format checks.',
        'NEW: Automatic system-wide photo propagation across Sidebar, Header Account Menu, Users Directory, Profile Drawer, Activity Log, and Report Studio.',
        'NEW: Clean Initials Avatar generator fallback (e.g. Sahafiz -> SA) ensuring zero broken image icons.',
        'NEW: Users Table now begins every engineer row with [Avatar] | Full Name | Role | Company | Department | Status.',
        'NEW: Report Studio includes engineer avatars beside Prepared By, Approved By, and Reviewed By signatures.',
        'NEW: Activity Log renders [Avatar] Sahafiz updated Machine Passport for high-fidelity accountability.',
        'FSOS RULE #001: Enforced CRUD consistency & version synchronization to v0.7.4 across all workspaces.'
      ]
    },
    {
      version: 'v0.7.3',
      date: '2026-08-03',
      type: 'Identity & User Management (ECO-20260802-027)',
      highlights: [
        'NEW: First-class "Users" module positioned in main sidebar above Settings for comprehensive team & identity governance.',
        'NEW: System Users directory table displaying Avatar, Full Name, Employee ID, Company, Department, Role, Status, and Last Login.',
        'NEW: Multi-Role hierarchy support with custom styled badges: Administrator, Field Service Engineer, Senior Engineer, Supervisor, Manager, and Viewer.',
        'NEW: Dynamic Real-time User Status tracking: Online, Offline, On Leave, Busy, and Inactive.',
        'NEW: Detailed User Profile drawer & editor with contact details, regional timezone/language settings, bio, and identity metadata.',
        'NEW: Top-right Header User Account menu with avatar, quick identity switch, notifications, appearance, and settings shortcuts.',
        'NEW: Multi-Engineer foundation enabling seamless active signed-in user switching with zero hardcoded engineer names remaining.',
        'SYSTEM HARMONIZATION: Version updated to v0.7.3 across Sidebar, Settings, About System, Release Notes, and Product Evolution Log.'
      ]
    },
    {
      version: 'v0.7.2',
      date: '2026-08-03',
      type: 'Founder Identity & Notification Center (ECO-20260802-026)',
      highlights: [
        'NEW: Founder Identity dynamic engineer profile greeting (e.g. "Good Morning, Sahafiz").',
        'NEW: Functional Notification Center bell with real-time operational notifications, unread badge counter, category tags, and click-to-navigate capabilities.',
        'NEW: Notification management controls including "Mark as Read", "Mark All as Read", and "Clear All".',
        'NEW: Configurable Engineer Profile source in System Settings allowing instant customization of Name, Company, Role, and Department.',
        'IMPROVED: Removed all remaining placeholder/demo engineer names ("Alex") across Machine Health Check, Execution Planner, Quality Investigation, Machine Passport, and Today\'s Activity Log.',
        'IMPROVED: Operational realism and user identity continuity across all FSOS workspaces.',
        'FIXED: Version and system build documentation synchronized to v0.7.2 across Sidebar, Settings, About System, and Report Studio.',
        'KNOWN ISSUES: Workflow Navigator UX refinement deferred to a future sprint.'
      ]
    },
    {
      version: 'v0.7.1',
      date: '2026-08-02',
      type: 'Daily Work Orchestration (ECO-20260802-025)',
      highlights: [
        'NEW: Daily Work operational entry point serving as the engineer\'s primary operational home upon opening FSOS.',
        'NEW: Mission orchestration providing unified visibility into customer (STMicroelectronics Muar), machine status (ASM Eagle XP-01), mission progress, and priority actions.',
        'NEW: Start Mission workflow for seamless execution initialization on new field service assignments.',
        'NEW: Continue Mission workflow enabling instant one-click resumption of active on-site work orders.',
        'NEW: Integrated Today\'s Schedule timeline and 3-day Upcoming Work outlook directly into the operational home page.',
        'NEW: Status KPI row tracking Machines Scheduled (2), Contract Days Remaining (68), Reports Pending (1), and Overdue Tasks (0).',
        'IMPROVED: Quick Access shortcuts providing direct 1-click navigation to Machine Passport, Workflow Guide, Planner, and Report Studio.',
        'IMPROVED: Navigation flow between existing modules, eliminating manual module searching and cognitive friction.'
      ]
    },
    {
      version: 'v0.7.0',
      date: '2026-08-02',
      type: 'Daily Work Operational Entry Point (ECO-20260802-025)',
      highlights: [
        'NEW: Daily Work operational entry point serving as the engineer\'s primary operational home upon opening FSOS.',
        'NEW: Mission orchestration providing unified visibility into customer, machine status, mission progress, and priority actions.',
        'NEW: Continue Mission workflow enabling instant one-click resumption of active on-site work orders.',
        'NEW: Start Mission workflow for seamless execution initialization on new field service assignments.',
        'IMPROVED: Navigation flow between existing modules (Dashboard, Machine Passport, Workflow Guide, Planner, Report Studio).',
        'IMPROVED: Engineer workflow continuity, eliminating manual module searching and cognitive friction.'
      ]
    },
    {
      version: 'v0.6.8',
      date: '2026-08-02',
      type: 'Mission Companion Floating Guide Rail Refactor (ECO-20260802-023B)',
      highlights: [
        'Floating Scroll-Sync Companion: Refactored Mission Companion container with responsive sticky positioning (`top-3 sm:top-4 z-20`) so the guide rail seamlessly floats along with the screen as engineers scroll down SOP steps.',
        'Elevated Backdrop Blur Styling: Enhanced Mission Companion container with backdrop blur filter, subtle shadow, and border rings so it visually floats alongside the SOP timeline content stream.',
        'Cross-Device Scroll Tracking: Ensured mobile, tablet, and desktop viewports all maintain active step scroll syncing and instant jump navigation.',
        'Cleanroom Operational Ergonomics: Optimized layout for single-column and two-column cleanroom tablet display ergonomics.',
        'System Version Harmonization: Synchronized v0.6.8 across Sidebar, Settings, About System, Report Studio, and Internal Changelog.'
      ]
    },
    {
      version: 'v0.6.7',
      date: '2026-08-02',
      type: 'Mission Companion Behaviour Fix (ECO-20260802-023A)',
      highlights: [
        'Founder Intent UX Alignment: Corrected Mission Companion behaviour to function as a quiet, ambient guide rail naturally embedded in the Workflow Guide.',
        'Zero Sidebar Chrome Perception: Removed heavy card borders and floating box aesthetics so engineers perceive guidance as part of the SOP document flow.',
        'Frameless Ambient Guide Rail: Blended step progress indicators and scroll tracking quietly into the page margin without intrusive visual popups or drawer chrome.',
        'Continuous Shift Ergonomics: Preserved smooth step jumping, active step scroll sync, and percentage progress indicators for 8-hour cleanroom shifts.',
        'System Version Harmonization: Synchronized v0.6.7 across Sidebar, Settings, About System, Report Studio, and Internal Changelog.'
      ]
    },
    {
      version: 'v0.6.6',
      date: '2026-08-02',
      type: 'Mission Companion Integration (ECO-20260802-023)',
      highlights: [
        'Product Vision Standard: Officially integrated Mission Companion as an ambient, quiet, and predictable guide rail within the Workflow Guide.',
        'Zero Visual Friction Execution: Removed explicit sidebar chrome perceptions, letting the Mission Companion visually blend directly into the SOP document flow.',
        'Continuous Shift Ergonomics: Designed for cleanroom Field Service Engineers operating for 8-hour shifts without cognitive overhead or manual scroll-backs.',
        'Real-time SOP Synchronization: Preserved precision scroll observer, instant step jumping, progress percentage tracking, and active step highlighting.',
        'PWA Cross-Platform Packaging: Strengthened Web App Manifest, standalone display mode, and icon support across Windows, macOS, Android, and iOS.'
      ]
    },
    {
      version: 'v0.6.5',
      date: '2026-08-01',
      type: 'Workflow Companion UX Alignment (ECO-20260801-022E)',
      highlights: [
        'Product Engineering UX Analysis: Formulated invisible, ambient Workflow Companion paradigm focusing on cleanroom operational ergonomic flow.',
        'Zero Visual Friction Principle: Shifted design criteria away from explicit "sticky sidebar" perception toward seamless ambient progress HUD.',
        'Continuous Operational Sync: Preserved real-time scroll observer, instant step jump, and step status tracking without intrusive UI chrome.',
        'PWA Foundation Enhancements: Enhanced web app manifest, stand-alone display tags, iOS web app capabilities, and cross-platform mobile icon paths.',
        'System Version Harmonization: Synchronized v0.6.5 across Sidebar, Settings, About System, Report Studio, and Internal Changelog.'
      ]
    },
    {
      version: 'v0.6.4',
      date: '2026-08-01',
      type: 'Workflow Navigator Behaviour Correction (ECO-20260801-022D)',
      highlights: [
        'Founder Intent UX Alignment: Configured Workflow Navigator as a persistent left-hand working companion (`sticky top-4`) during SOP scrolling.',
        'Zero-Scroll Jump Navigation: Guaranteed engineers always see Current Step, Completed Steps, Next Steps, and can jump instantly without scrolling back to top.',
        'Preserved SOP Aesthetics: Maintained clean 2-column SOP timeline flow without redesigning layout or creating unrequested secondary chromes.',
        'Automatic Step Observer: Real-time scroll detection keeps active step status, completion badges, and progress bar in continuous sync.',
        'Full PWA Foundation Established: Web App Manifest, standalone display mode, theme settings, and cross-platform mobile icons (Windows, macOS, Android, iOS).'
      ]
    },
    {
      version: 'v0.6.3',
      date: '2026-08-01',
      type: 'Unified Workflow Layout (ECO-20260801-022C)',
      highlights: [
        'Founder Layout Refactor: Completely eliminated the separate Workflow Navigator column, merging navigation and SOP into one continuous engineering document.',
        'Integrated Inline SOP Sequence Ribbon: Embedded quick-nav roadmap directly inside document flow, eliminating independent floating sidebar perception.',
        'Maximized Engineering Content Space: Removed left workspace column so SOP section cards expand naturally across full container width.',
        'Unified Scroll Architecture: Document content and embedded navigation scroll together naturally as a single operational manual.',
        'PWA Architecture Foundation: Established PWA manifest, theme colors, display standards, and mobile icon configurations.'
      ]
    },
    {
      version: 'v0.6.2',
      date: '2026-08-01',
      type: 'Workflow Navigator Follow Behaviour (ECO-20260801-022B)',
      highlights: [
        'Founder UX Correction: Configured Workflow Navigator to naturally follow the engineer while reading through long SOP sections.',
        'SOP Working Companion: Styled navigator as a document guide rail (`sticky top-4`) attached to the SOP timeline left margin.',
        'Eliminated Floating Sidebar Feeling: Preserved lightweight, calm document-rail visual identity without creating a secondary application chrome.',
        'Unbroken Navigation Access: Guaranteed engineers never need to scroll back to the top to jump between SOP phases.',
        'Maintained Real-Time Sync: Full support for active step scroll detection, step-jump smooth scrolling, and dark/light themes.'
      ]
    },
    {
      version: 'v0.6.1',
      date: '2026-08-01',
      type: 'Workflow Navigator Polish & Integration (ECO-20260801-022A)',
      highlights: [
        'Established FSOS Workflow Presentation Principle: Every workflow feels like one continuous operational document.',
        'Refined Workflow Navigator into a sleek, integrated SOP Guide Rail that attaches seamlessly to the timeline content stream.',
        'Eliminated duplicate navigation headers and redundant step labels to establish single-source visual clarity.',
        'Subordinated Navigator container styling with lighter footprints, left border indicator pills, and refined typography.',
        'Optimized desktop spatial grid spacing and responsive mobile guide rail alignment.',
        'Concluded Workflow Navigator milestone in full preparation for Daily Work Orchestration.'
      ]
    },
    {
      version: 'v0.6.0',
      date: '2026-08-01',
      type: 'Service Execution Foundation — SOP Navigation Enhancement (ECO-20260801-022)',
      highlights: [
        'Established FSOS Workflow Navigation Principle: Exists once, remains visible, reflects progress.',
        'Replaced top horizontal Mission Progression bar with persistent sticky vertical Workflow Navigator.',
        'Implemented automatic scroll-position synchronization with real-time active step detection.',
        'Added visual step indicators for completed (✓), active (►), and upcoming (○) SOP stages.',
        'Integrated smooth-scroll click jumping across all 6 SOP phases (Mission, Passport, MHC, Planner, Report, Complete).',
        'Extracted WorkflowNavigator as a reusable component for future execution modules (Calibration, Quality, Reports).'
      ]
    },
    {
      version: 'v0.5.3',
      date: '2026-07-31',
      type: 'Machine Passport Production Ready (ECO-20260731-021)',
      highlights: [
        'Declared Machine Passport feature-complete for Founder Release v0.5.3.',
        'Validated two-tier workspace interaction standard: Workspace Management vs Selected Object Management.',
        'Refined Customer & Machine Workspace card visual consistency, dashed creation tiles, and hover states.',
        'Verified zero modal clipping issues on Machine Hero Cockpit dropdowns across Light and Dark themes.',
        'Established Machine Passport as the gold-standard reference implementation for upcoming Service Execution and Report Studio milestones.'
      ]
    },
    {
      version: 'v0.5.2',
      date: '2026-07-31',
      type: 'Workspace Interaction Standardization (ECO-20260731-019)',
      highlights: [
        'Established FSOS permanent Workspace Interaction Principle: Creation is a Workspace Action, Management is an Object Action.',
        'Extracted "Add Machine" from Machine Actions dropdown and implemented dedicated "+ Add Machine" card tile in Machine Workspace grid.',
        'Maintained strict visual consistency between Customer Workspace cards and Machine Workspace cards (proportions, border-radius, hover transitions, dashed creation tiles).',
        'Enhanced Managed Laser Fleet header with rich customer account site, asset count, and operational availability status indicators.',
        'Kept Machine Actions dropdown strictly contextual to the selected machine (Edit, Rename, Duplicate, Archive, Delete).',
        'Updated version discipline across system sidebar, settings, report studio, and CTO notes.'
      ]
    },
    {
      version: 'v0.5.1',
      date: '2026-07-31',
      type: 'Customer Workspace Management (ECO-20260731-018)',
      highlights: [
        'Resolved MP-001 Machine Hero Cockpit dropdown menu clipping issue by eliminating parent overflow constraints.',
        'Completed full Customer CRUD suite (Add, Edit Details, Quick Rename, Delete Account) with persistent state.',
        'Integrated overflow dropdown menu (⋮) on all Layer 1 Customer Cards for inline account management.',
        'Added Add Customer card to Layer 1 grid for streamlined account creation.',
        'Enforced full version alignment to v0.5.1 across system sidebar, settings, and release notes.'
      ]
    },
    {
      version: 'v0.5.0',
      date: '2026-07-31',
      type: 'Customer Workspace Foundation (ECO-20260731-017)',
      highlights: [
        'Architected Layer 1 Customer Workspace with high-precision account cards displaying machine counts, average health, PM due, and critical alert badges.',
        'Architected Layer 2 Machine Workspace displaying filtered laser asset cards for the active customer account.',
        'Seamlessly bound Layer 3 Machine Hero Cockpit to selected machine cards for unified 3-tier navigation: Customer → Machine → Workspace.',
        'Preserved all existing CRUD features (Add, Edit, Rename, Duplicate, Archive, Delete) and 8-Point MHC execution workflows.',
        'Scaled navigation architecture for multi-customer, multi-site, and 100+ machine expansion.',
        'Updated system version discipline to v0.5.0 across all application modules.'
      ]
    },
    {
      version: 'v0.4.2',
      date: '2026-07-30',
      type: 'Machine Passport UX Enhancement (ECO-20260730-016)',
      highlights: [
        'Redesigned Machine Passport top section into a high-precision industrial hero cockpit.',
        'Created Fleet Navigator strip with Previous/Next machine controls and active status counts.',
        'Promoted selected machine to prominent Hero Card displaying core identity, health gauge, and location.',
        'Grouped all management functions (Add, Edit, Rename, Duplicate, Archive, Delete) into a sleek Machine Actions dropdown.',
        'Streamlined primary workflow actions (Execute 8-Point MHC, View Reports) for immediate engineer clarity.',
        'Maintained complete backward compatibility and system version discipline at v0.4.2.'
      ]
    },
    {
      version: 'v0.4.1',
      date: '2026-07-30',
      type: 'Machine Passport Management (ECO-20260730-015)',
      highlights: [
        'Integrated complete Machine Passport Management suite inside MachinePassportModule.',
        'Added Add Machine feature with complete telemetry baseline, laser heads, and consumable defaults.',
        'Added Edit Machine feature for updating machine specifications, customer allocations, and health scores.',
        'Added Rename Machine feature for fast inline re-designation of machine models and IDs.',
        'Added Delete Machine feature with confirmation dialog and automatic fleet re-selection.',
        'Positioned high-visibility management toolbar for <5-second discovery in Machine Passport.',
        'Updated system version discipline to v0.4.1 across sidebar, settings, and release notes.'
      ]
    },
    {
      version: 'v0.3.1',
      date: '2026-07-30',
      type: 'Theme Consistency (ECO-20260730-013)',
      highlights: [
        'Completed system-wide Light Theme compliance audit across all 15 operational modules.',
        'Standardized shared theme tokens across reusable UI primitives (Card, Button, Badge, Modal, Tables).',
        'Eliminated hardcoded theme color overrides to ensure automatic theme inheritance.',
        'Improved readability, font weights, and surface elevation contrast for bright site operations.',
        'Unified Dark Mode and Light Mode visual fidelity and component behavior.',
        'Engineering Metrics: 28 Files Reviewed, 14 Files Modified, 112 Hardcoded Theme Colors Converted, 0 Remaining Violations.'
      ]
    },
    {
      version: 'v0.3.0',
      date: '2026-07-30',
      type: 'Premium Light Experience (ECO-20260730-012)',
      highlights: [
        'Rebuilt Light Theme Design System for enhanced clarity, accessibility, and professional polish.',
        'Elevated text contrast hierarchy across headings, body text, and labels for comfortable reading.',
        'Improved surface elevation and border separation for clean card visibility across all system views.',
        'Refined sticky workflow navigation, badges, timeline connectors, and buttons for light mode operations.',
        'Enhanced sidebar readability with distinct section group titles and active item indicators.',
        'Dark theme token values strictly preserved and verified.'
      ]
    },
    {
      version: 'v0.2.9',
      date: '2026-07-30',
      type: 'Information Architecture (ECO-20260730-011)',
      highlights: [
        'Sidebar reorganized into workflow-based groups (DAILY WORK, SERVICE EXECUTION, OPERATIONS, SMART TOOLS, SYSTEM).',
        'Added collapsible navigation sections with auto-expansion for the active workflow tab.',
        'Reduced navigation complexity and cognitive load for field service engineers.',
        'Improved engineer workflow discovery following operational journey instead of flat/alphabetical lists.',
        'Preserved existing module functionality and routing architecture across all 15 system modules.'
      ]
    },
    {
      version: 'v0.2.8',
      date: '2026-07-30',
      type: 'Guided Navigation (ECO-20260730-010)',
      highlights: [
        'Added sticky Mission Progression navigation bar for effortless orientation during field operations.',
        'Added smooth scroll workflow navigation with stable section anchors (#mission, #passport, #mhc, #planner, #report, #complete).',
        'Active workflow step now tracks scrolling automatically via IntersectionObserver without layout flashing.',
        'Improved Workflow Guide usability for new field service engineers entering cleanroom sites.',
        'Existing workflow architecture, 6-phase SOP journey, and direct quick-action buttons preserved.'
      ]
    },
    {
      version: 'v0.2.7',
      date: '2026-07-30',
      type: 'Workflow Guide (ECO-20260730-009)',
      highlights: [
        'Introduced new Workflow Guide module providing 6-phase Standard Operating Procedure (SOP).',
        'Standardized step structure: Purpose, What To Do (max 4 bullets), Expected Outcome, Quick Action Buttons.',
        'Added visual progress indicator bar and end-of-workflow completion badge.'
      ]
    },
    {
      version: 'v0.2.5',
      date: '2026-07-30',
      type: 'Mission Control Signature Design (ECO-20260730-003)',
      highlights: [
        'Transformed Mission Control into an engineer\'s Operational Desk with signature visual identity.',
        'Implemented full pastel color language (#111315, #1A1D21, #20252B, #2B323A, #8B9DFF, #7FD4A6, #8ECDF7, #EFCB7A, #E98A8A).',
        'Implemented complete Theme Engine supporting Dark, Light, and System modes with smooth 250ms transitions.',
        'Refined Hero Section answering the 5 core operational questions in under 5 seconds.',
        'Added dedicated compact Machine Snapshot panel (Health, Heads, Cooling, Runtime, Remaining Service Life, SLA Progress).',
        'Reduced visual noise, softened borders, increased whitespace and mathematical typographic hierarchy.'
      ]
    },
    {
      version: 'v0.2.2',
      date: '2026-07-29',
      type: 'Mission Control Re-Architecture (ECO-20260729-004)',
      highlights: [
        "Re-architected Mission Control from a generic dashboard into a true operational workspace (like opening today's work order).",
        "Starts immediately with today's operation: Customer, Machine, Purpose, Inspection Stage, and Next Action.",
        "Split Mission Control into modular components: ActiveWorkOrderHeader, InspectionStageStepper, WorkOrderChecklist, OperationalPrerequisites, TodayActivityLog.",
        "Removed quick-action buttons grid and statistics charts from Mission Control in favor of sequence-based action flow.",
        "Embedded contextual AI guidance directly inside active inspection stages."
      ]
    },
    {
      version: 'v0.2.1',
      date: '2026-07-29',
      type: 'CTO Design Revision',
      highlights: [
        'Shifted interface to calm, quiet, industrial operations workspace for field engineers.',
        'Implemented intentional Light & Dark theme transition between dark operational workspace and bright customer documents.',
        'Redesigned Executive Reports & Knowledge Base into crisp, document-oriented light theme.',
        'Removed artificial stats blocks and glowing visual noise in favor of mission-first hierarchy.',
        'Enforced strict version discipline across all footers, settings, and documentation.'
      ]
    },
    {
      version: 'v0.2.0',
      date: '2026-07-15',
      type: 'Core System Expansion',
      highlights: [
        'Added 2-Year Execution Planner for long-term contract SLA maintenance scheduling.',
        'Integrated 8-Point Machine Health Check (MHC) automated score calculator.',
        'Added Laser Optics Beam Profiler & Galvo Scanner Calibration module.'
      ]
    },
    {
      version: 'v0.1.0',
      date: '2026-06-01',
      type: 'Initial Platform Release',
      highlights: [
        'Initial release of Field Service Operations System with Machine Passport & Contract Tracking.'
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Version Status Banner */}
      <Card title="System Version & Operational Build Status">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-4 ${
          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border font-mono font-bold text-lg ${
              isDark ? 'bg-[#8B9DFF]/15 border-[#8B9DFF]/30 text-[#8B9DFF]' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}>
              v1.0.20
            </div>
            <div>
              <h3 className="text-base font-bold">Field Service Operations System</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                Cloudflare Workers Runtime v1.0.20 — Native Cloud Engine & D1 Sync Foundation
              </p>
            </div>
          </div>
          <Badge variant="blue">v1.0.20 OPERATIONAL</Badge>
        </div>
      </Card>

      {/* About System Card */}
      <Card title="About System — Operational Specification">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Tag className="w-3.5 h-3.5 text-[#8B9DFF]" />
              <span className="font-mono uppercase text-[10px]">Version</span>
            </div>
            <p className="font-mono font-bold text-sm text-[#8B9DFF]">v1.0.20</p>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-[#8B9DFF]" />
              <span className="font-mono uppercase text-[10px]">Build ID</span>
            </div>
            <p className="font-mono font-bold text-sm">CFW-20260808-102</p>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Compass className="w-3.5 h-3.5 text-[#8B9DFF]" />
              <span className="font-mono uppercase text-[10px]">Release Codename</span>
            </div>
            <p className="font-semibold text-xs text-emerald-400">Cloudflare Workers Engine</p>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-[#8B9DFF]" />
              <span className="font-mono uppercase text-[10px]">Release Date</span>
            </div>
            <p className="font-mono text-xs">2026-08-08</p>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Activity className="w-3.5 h-3.5 text-[#8B9DFF]" />
              <span className="font-mono uppercase text-[10px]">Build Status</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="font-mono font-bold text-xs text-emerald-400">OPERATIONAL</p>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B9DFF]" />
              <span className="font-mono uppercase text-[10px]">Target Deployment</span>
            </div>
            <p className="font-semibold text-xs">Cloudflare Workers & D1 Storage</p>
          </div>
        </div>
      </Card>

      {/* CTO Strategic Directive & Product Evolution Log */}
      <Card title="CTO Directive & Product Evolution Log">
        <div className="space-y-4 text-xs">
          {/* CTO Note */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#8B9DFF]/10 border-[#8B9DFF]/30 text-slate-200' : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[#8B9DFF]">
                <Bot className="w-4 h-4" />
                <span>CTO STRATEGIC DIRECTIVE</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#8B9DFF]/20 text-[#8B9DFF] border border-[#8B9DFF]/30 font-semibold">
                v1.0.2 CLOUDFLARE WORKERS MIGRATION FINALIZATION
              </span>
            </div>
            <p className="leading-relaxed font-medium">
              v1.0.2 finalizes the complete migration of FSOS from legacy Cloud Run container runtime to Cloudflare Workers native edge infrastructure with D1 database persistence.
            </p>
            <p className="leading-relaxed text-slate-300">
              Native Cloudflare Architecture:
            </p>
            <div className="font-mono text-[11px] font-bold text-emerald-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 tracking-wide">
              Cloudflare Worker (src/worker.ts) → Cloudflare D1 (env.DB) → Asset Edge (env.ASSETS) → FSOS React SPA
            </div>
          </div>

          {/* Product Evolution Log */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
              <History className="w-4 h-4 text-[#8B9DFF]" />
              <span>Product Evolution Log: Cloudflare Workers Foundation</span>
            </div>

            <div className="space-y-3 text-slate-300 dark:text-slate-300">
              <div className="space-y-1">
                <p className="font-semibold text-[#8B9DFF]">FROM: Cloud Run Server Container Dependency</p>
                <p className="font-semibold text-emerald-400">TO: Serverless Edge Cloudflare Workers & D1 Binding</p>
                <p className="text-slate-400 leading-relaxed pt-1">
                  The application runtime has been migrated to Cloudflare Workers (`src/worker.ts`), completely removing heavy Cloud Run server dependencies while maintaining full endpoint compatibility for sync, image storage, and status verification.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-[#8B9DFF]">2. Native D1 Database Persistence</p>
                <p className="text-slate-400 leading-relaxed">
                  Cloud D1 sqlite binding handles background sync records and image metadata transactions seamlessly, providing edge persistence for multi-device field operations.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-[#8B9DFF]">3. Platform Support & Edge Delivery</p>
                <p className="text-slate-400 leading-relaxed">
                  Static React SPA assets are delivered via Cloudflare Workers Asset Binding (`env.ASSETS`), ensuring ultra-fast load times for cleanroom field service engineers worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Release Notes Summary */}
      <Card title="Release Notes — v1.0.2 Migration Finalization & Version Harmonization">
        <div className={`p-4 rounded-xl border space-y-3 text-xs ${
          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b border-[#2B323A]/60 pb-2">
            <span className="font-bold text-sm text-[#8B9DFF]">Release Summary (Sprint Cloudflare Migration)</span>
            <span className="font-mono text-slate-400">Target: v1.0.2</span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            Sprint v1.0.2 finalizes the Cloudflare Workers migration and synchronizes all in-app version badges, operational status indicators, and documentation across FSOS. Key deliverables include:
          </p>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-slate-300 font-mono text-[11px] bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
            <li>• Native Cloudflare Workers runtime (src/worker.ts)</li>
            <li>• Cloudflare D1 Database binding (env.DB)</li>
            <li>• Asset Edge Serving (env.ASSETS)</li>
            <li>• Wrangler deployment configuration (wrangler.toml)</li>
            <li>• Decoupled from Cloud Run server container</li>
            <li>• Updated in-app Operational Build Status</li>
            <li>• Updated in-app Product Evolution Log</li>
            <li>• Updated in-app Version & Changelog page</li>
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#111315] border-[#2B323A]/80' : 'bg-white border-slate-200'}`}>
              <p className="font-bold text-[#7FD4A6] mb-1">✓ What Changed</p>
              <p className="text-slate-400 text-[11px]">Migrated server runtime to Cloudflare Workers, integrated D1 database binding, updated all in-app version references to v1.0.2, and completed deployment instructions.</p>
            </div>
            <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#111315] border-[#2B323A]/80' : 'bg-white border-slate-200'}`}>
              <p className="font-bold text-[#8ECDF7] mb-1">✓ Why It Changed</p>
              <p className="text-slate-400 text-[11px]">Provides ultra-fast serverless edge performance, eliminates Cloud Run runtime dependencies, and maintains complete system version harmonization.</p>
            </div>
            <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#111315] border-[#2B323A]/80' : 'bg-white border-slate-200'}`}>
              <p className="font-bold text-[#EFCB7A] mb-1">✓ Remaining for Future</p>
              <p className="text-slate-400 text-[11px]">Ongoing background sync optimization and additional specialized operational modes.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Structured Changelog */}
      <Card title="Internal Architecture Milestone Changelog">
        <div className="space-y-4">
          {changelog.map((entry) => (
            <div key={entry.version} className={`p-4 rounded-xl border text-xs space-y-2 ${
              isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-[#2B323A]/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#8B9DFF]">{entry.version}</span>
                  <span className="font-semibold">{entry.type}</span>
                </div>
                <span className="font-mono text-slate-400">{entry.date}</span>
              </div>
              <ul className="space-y-1 pl-4 list-disc text-slate-400">
                {entry.highlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* System Data & Workspace Management */}
      <Card title="System Data & Workspace Management">
        <div className="space-y-4 text-xs">
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <p className="font-bold text-sm text-[#E98A8A]">Reset Local Workspace State</p>
              <p className="text-slate-400 mt-0.5">Restores default contracts, machines, schedule, tasks, and MHC audit records.</p>
            </div>
            <Button variant="danger" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onResetData}>
              Reset State
            </Button>
          </div>

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#141618] border-[#2B323A] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2 font-bold text-xs text-[#8B9DFF] mb-1">
              <User className="w-4 h-4" />
              <span>Engineer Profile Governance</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Personal identity details, avatar photo management, contact preferences, and certifications have been centralized under <strong>My Profile</strong> in accordance with FSOS Identity Standard v0.7.5.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
