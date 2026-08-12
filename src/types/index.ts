export type NavigationTab = 
  | 'start_page'
  | 'workflow_guide'
  | 'mission_control'
  | 'contracts'
  | 'planner'
  | 'customers'
  | 'machines'
  | 'mhc_autopilot'
  | 'mhc'
  | 'mhc_templates'
  | 'mhc_history'
  | 'mhc_01'
  | 'mhc_02'
  | 'mhc_03'
  | 'mhc_04'
  | 'mhc_05'
  | 'mhc_06'
  | 'mhc_07'
  | 'mhc_08'
  | 'laser_calibration'
  | 'baseline_check'
  | 'quality_investigation'
  | 'reports'
  | 'analytics'
  | 'knowledge_base'
  | 'users'
  | 'settings'
  | 'profile';

export type WorkspaceMode = 'MHC_MODE' | 'FOUNDER_MODE';

export type {
  CalibrationHistoryRecord,
  AccuracyLevel,
  AccuracyInfo,
  RecalibrationRecommendation,
  RemainingDaysInfo,
  RecommendedLimitInfo,
  LaserAge,
  LaserHeadDomain,
  MaintenanceRecord,
  MachineDomain,
  LaserStatus,
  LaserMetrics,
  MachineMetrics,
  RecalibrationAnalysis,
  RecalibrationResult
} from '../utils/laserEngine';

export interface UserSession {
  isAuthenticated: boolean;
  userId: string;
  engineerName: string;
  profilePhoto?: string;
  role: UserRole;
  company: string;
  department: string;
  operationalStatus: string;
  lastLogin: string;
  workspaceMode: WorkspaceMode;
}

export type UserRole =
  | 'Administrator'
  | 'Field Service Engineer'
  | 'Senior Engineer'
  | 'Supervisor'
  | 'Manager'
  | 'Viewer';

export type UserStatus =
  | 'Online'
  | 'Offline'
  | 'On Leave'
  | 'Busy'
  | 'Inactive';

export interface SystemUser {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  department: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  timezone: string;
  language: string;
  accountStatus: 'Active' | 'Suspended' | 'Pending Activation';
  avatarUrl?: string;
  bio?: string;
}

export type ProductionReleaseStatus = 'APPROVED' | 'CONDITIONAL' | 'HALTED' | 'UNDER_INSPECTION';

export interface Customer {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  plantsCount: number;
  activeContractsCount: number;
}

export interface Plant {
  id: string;
  customerId: string;
  customerName: string;
  name: string;
  location: string;
  timezone: string;
  linesCount: number;
  machinesCount: number;
}

export interface ProductionLine {
  id: string;
  plantId: string;
  plantName: string;
  name: string;
  code: string;
  description: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD';
}

export interface LaserHead {
  id: string;
  model: string;
  serialNumber: string;
  runningHours: number;
  maxRecommendedHours: number;
  remainingHours: number;
  estimatedReplacementDate: string;
  powerOutputWatts: number;
  ratedPowerWatts: number;
  wavelengthNm: number;
  beamQualityM2: number;
  healthScore: number; // 0 - 100
  // Multi-laser lifecycle engine extensions (v0.9.0 Phase 2.1)
  name?: string;
  serialNo?: string;
  ratedLife?: number;
  warningLife?: number;
  contingencyCeiling?: number;
  baseLaserHour?: number | null;
  baseTimestamp?: string | null;
  runtimeState?: string;
  lastRecalibrationDate?: string | null;
  calibrationHistory?: import('../utils/laserEngine').CalibrationHistoryRecord[];
}

export interface ConsumableItem {
  id: string;
  name: string;
  partNumber: string;
  currentLifePercent: number;
  lastReplacedDate: string;
  estimatedDaysRemaining: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL_REPLACE';
}

export interface Machine {
  id: string;
  customerId: string;
  customerName: string;
  plantId: string;
  plantName: string;
  productionLineId: string;
  productionLineName: string;
  model: string;
  machineNumber: string;
  serialNumber: string;
  installationDate: string;
  baselineDate: string;
  healthScore: number; // 0 - 100
  laserHeads: LaserHead[];
  consumables: ConsumableItem[];
  status: 'OPERATIONAL' | 'NEEDS_CALIBRATION' | 'MAINTENANCE_DUE' | 'OUT_OF_SERVICE';
  photos: string[];
  lastMhcDate: string;
  nextMhcDate: string;
  // Multi-laser lifecycle engine extensions (v0.9.0 Phase 2.1)
  machineNo?: string;
  machineName?: string;
  manufacturer?: string;
  department?: string;
  lasers?: import('../utils/laserEngine').LaserHeadDomain[];
  maintenanceHistory?: import('../utils/laserEngine').MaintenanceRecord[];
  lastUpdated?: string;
  baseLaserHour?: number | null;
  baseTimestamp?: string | null;
  ratedLife?: number;
  warningLife?: number;
  contingencyCeiling?: number;
  temperatureRecords?: import('./temperature').SavedTemperatureRecord[];
  manualTemperatureReadings?: import('./temperature').ManualTemperatureReading[];
  laserPowerRecords?: import('./laserPower').LaserPowerCheckRecord[];
  beamProfileRecords?: import('./beamProfile').BeamProfileCheckRecord[];
  productProcessRecords?: import('./productProcess').ProductProcessRecord[];
}

export interface SubsystemHealth {
  laserHead1: number;
  laserHead2: number;
  cooling: number;
  optics: number;
  stage: number;
  agc: number;
  powerStability: number;
  beamQuality: number;
  overallScore: number;
}

export interface MHCInspectionData {
  laserInspection: { status: 'PASS' | 'WARNING' | 'FAIL'; note: string };
  opticsInspection: { status: 'PASS' | 'WARNING' | 'FAIL'; cleanlinessPercent: number; note: string };
  coolingInspection: { status: 'PASS' | 'WARNING' | 'FAIL'; flowRateLpm: number; tempCelsius: number; note: string };
  powerCheck: { measuredWatts: number; targetWatts: number; stabilityPercent: number };
  beamProfile: { beamSizeMm: number; focusOffsetMm: number; symmetryRatio: number };
  stageCalibration: { xAccuracymm: number; yAccuracymm: number; zAccuracymm: number };
  agcCalibration: { responseTimeMs: number; errorMarginPercent: number };
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
}

export interface MHCRecord {
  id: string;
  machineId: string;
  machineName: string;
  machineSerialNumber: string;
  customerName: string;
  plantName: string;
  engineerName: string;
  date: string;
  healthScores: SubsystemHealth;
  inspectionData: MHCInspectionData;
  engineerRemarks: string;
  recommendations: string[];
  productionReleaseStatus: ProductionReleaseStatus;
  isReportGenerated: boolean;
}

export interface Contract {
  id: string;
  contractNumber: string;
  customerName: string;
  plantName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationMonths: number;
  totalWorkingDays: number;
  remainingWorkingDays: number;
  machinesCoveredIds: string[];
  engineerAssigned: string;
  deliverables: string[];
  quarterlyScheduleCount: number;
  terms: string;
  customNotes: string;
  status: 'ACTIVE' | 'PENDING' | 'RENEWAL_DUE' | 'COMPLETED';
  progressPercent: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  milestones: {
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }[];
}

export interface ExecutionScheduleItem {
  id: string;
  contractId: string;
  customerName: string;
  plantName: string;
  machineId: string;
  machineName: string;
  engineerName: string;
  title: string;
  scheduledDate: string; // YYYY-MM-DD (M-F strictly)
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6' | 'Q7' | 'Q8';
  type: 'QUARTERLY_MHC' | 'BASELINE_CHECK' | 'LASER_CALIBRATION' | 'EMERGENCY_SUPPORT';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'RESCHEDULED';
  estimatedHours: number;
}

export interface ExecutiveReport {
  id: string;
  reportNumber: string;
  mhcId: string;
  customerName: string;
  plantName: string;
  machineModel: string;
  serialNumber: string;
  date: string;
  engineerName: string;
  executiveSummary: string;
  overallHealthScore: number;
  productionReleaseStatus: ProductionReleaseStatus;
  subsystemHealth: SubsystemHealth;
  laserRuntimeSummary: {
    runningHours: number;
    maxHours: number;
    head1Health: number;
    head2Health?: number;
  };
  coolingStatus: string;
  powerStability: string;
  beamProfileSummary: string;
  powerComparison: {
    baselinePowerWatts: number;
    currentPowerWatts: number;
    deltaPercent: number;
  };
  engineerRemarks: string;
  recommendations: string[];
  signatureName: string;
  signatureTitle: string;
  signedDate: string;
}

export interface QualityInvestigation {
  id: string;
  ticketNumber: string;
  machineId: string;
  machineName: string;
  customerName: string;
  reportedDate: string;
  issueDescription: string;
  rootCauseAnalysis: string;
  correctiveActionsTaken: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  engineerAssigned: string;
}

export interface BaselineCheck {
  id: string;
  machineId: string;
  machineName: string;
  date: string;
  engineerName: string;
  laserPowerBaselineWatts: number;
  beamDiameterMm: number;
  coolingFlowRateLpm: number;
  stageRepeatabilityMm: number;
  notes: string;
  passed: boolean;
}

export interface FieldEngineerTask {
  id: string;
  title: string;
  machineName: string;
  customerName: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  dueDate: string;
  type: 'MHC' | 'CALIBRATION' | 'REPORT_PENDING' | 'CONSUMABLE_REPLACE';
  completed: boolean;
}

export interface AlertItem {
  id: string;
  type: 'LASER_RUNTIME' | 'CONSUMABLE' | 'HEALTH_CRITICAL';
  severity: 'CRITICAL' | 'WARNING';
  machineId: string;
  machineName: string;
  customerName: string;
  message: string;
  timestamp: string;
}

export interface EngineerProfile {
  name: string;
  company: string;
  role: string;
  department: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export type NotificationCategory =
  | 'MISSION_ASSIGNED'
  | 'MHC_DUE'
  | 'CONTRACT_REMINDER'
  | 'PLANNER_REMINDER'
  | 'PENDING_REPORT'
  | 'COMPLETED_REPORT'
  | 'CUSTOMER_ADDED'
  | 'MACHINE_ADDED'
  | 'SYSTEM_UPDATE';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  category: NotificationCategory;
  read: boolean;
  targetTab?: NavigationTab;
}

// Report Studio Foundation Types (v0.5.0)
export interface ReportSectionConfig {
  id: string;
  sectionType: string; // e.g. 'machine_info', 'customer_info', 'visit_summary'
  title: string;
  description?: string;
  category?: 'CORE' | 'INSPECTION' | 'TIMELINE' | 'SIGNATURES' | 'OTHER';
  visible: boolean;
  pageBreakBefore: boolean;
  collapsible: boolean;
  showSectionNumber: boolean;
  notes?: string;
  customSettings?: Record<string, boolean | string | number>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  code: string; // e.g. 'STM_PM', 'STM_CM', 'INSTALLATION', 'ACCEPTANCE_TEST'
  description: string;
  category: 'Preventive Maintenance' | 'Corrective Maintenance' | 'Commissioning' | 'Emergency' | 'Internal' | 'Quick Visit';
  sections: ReportSectionConfig[];
  updatedAt: string;
  isDefault?: boolean;
}

export interface FounderBrandingConfig {
  companyName: string;
  companyLogoUrl: string;
  customerLogoUrl: string;
  headerText: string;
  footerText: string;
  showPageNumbers: boolean;
  primaryColor: string;
  engineerSignatureBlock: boolean;
  customerSignatureBlock: boolean;
  confidentialityBanner: boolean;
}

export interface ReportDraft {
  id: string;
  reportTitle: string;
  templateId?: string;
  templateName?: string;
  customerId?: string;
  customerName?: string;
  machineId?: string;
  machineName?: string;
  sections: ReportSectionConfig[];
  branding: FounderBrandingConfig;
  status: 'DRAFT' | 'READY_FOR_REVIEW' | 'SAVED';
  updatedAt: string;
}

// FSOS v0.8.1 MHC Workspace Types & Custom Engineering Field Extensions
export interface MHCCustomField {
  id: string;
  label: string;
  value: string;
  unit?: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'select' | 'boolean';
}

export interface MHCCustomInfoBlock {
  id: string;
  title: string;
  content: string;
}

export interface MHCCustomImageItem {
  id: string;
  url: string;
  label?: string;
}

export interface MHCCustomMeasurementItem {
  id: string;
  name: string;
  beforeVal: number | string;
  afterVal: number | string;
  unit?: string;
  result?: 'PASS' | 'WARNING' | 'FAIL' | 'ATTENTION';
}

export interface MHCCustomInspectionItem {
  id: string;
  name: string;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'ATTENTION';
  notes: string;
}

export interface MHCImageComparisonSet {
  id: string;
  title: string;
  beforeUrl?: string;
  beforeCaption?: string;
  afterUrl?: string;
  afterCaption?: string;
  notes?: string;
}

export interface MHCTemperatureSeries {
  id: string;
  key: string;
  name: string;
  color: string;
}

export interface MHCTemperatureDataPoint {
  id: string;
  timestamp: string; // e.g., "0m", "10m", "20m", "30m"
  values: Record<string, number>; // series.key -> temperature °C
}

export interface MHCTemperatureGraphConfig {
  id: string;
  title: string;
  series: MHCTemperatureSeries[];
  dataPoints: MHCTemperatureDataPoint[];
}

export interface MHCLaserHourItem {
  laserId: string;
  laserIdentifier: string;
  recordedLaserHour: number;
  readingDate: string;
  readingTime: string;
  calculatedCurrentHour: number;
  warningThreshold: number;
  criticalThreshold: number;
  runtimeStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  customFields?: MHCCustomField[];
  // Phase 3A Autopilot Verification extensions
  isVerified?: boolean;
  verifiedHour?: number;
  originalSourceHour?: number;
  verificationNotes?: string;
  verifiedAt?: string;
}

export interface MHCLaserProfileData {
  laserId: string;
  productName: string;
  recipeProgram: string;
  profileInfo: string;
  measurementInfo: string;
  supportingEvidence: string;
  images: string[];
  customFields?: MHCCustomField[];
  customBlocks?: MHCCustomInfoBlock[];
  customImages?: MHCCustomImageItem[];
  beamProfileRecord?: import('./beamProfile').BeamProfileCheckRecord;
}

export interface MHCLaserPowerItem {
  laserId: string;
  laserIdentifier: string;
  ratedPowerWatts: number;
  referenceValueWatts: number;
  beforeValueWatts: number;
  afterValueWatts: number;
  stabilityPercent: number;
  result: 'PASS' | 'WARNING' | 'FAIL';
  notes: string;
  evidenceImages: string[];
  customFields?: MHCCustomField[];
  customMeasurements?: MHCCustomMeasurementItem[];
  powerRecord?: import('./laserPower').LaserPowerCheckRecord;
}

export interface MHCOpticsBeamData {
  cleanlinessScore: number;
  beamWaistMm: number;
  focusOffsetMm: number;
  symmetryRatio: number;
  m2Value: number;
  beforeCondition: string;
  afterCondition: string;
  inspectionResult: 'PASS' | 'WARNING' | 'FAIL';
  images: string[];
  notes: string;
  customFields?: MHCCustomField[];
  customInspections?: MHCCustomInspectionItem[];
  imageComparisons?: MHCImageComparisonSet[];
}

export interface MHCCoolingData {
  chillerTempCelsius: number;
  chillerFlowLpm: number;
  diConductivityUs: number;
  coolingCondition: string;
  thermalCondition: string;
  beforeCondition: string;
  afterCondition: string;
  result: 'PASS' | 'ATTENTION' | 'FAIL';
  notes: string;
  customFields?: MHCCustomField[];
  customMeasurements?: MHCCustomMeasurementItem[];
  temperatureGraph?: MHCTemperatureGraphConfig;
}

export interface MHCProductQualityData {
  sampleId: string;
  viaDiameterUm: number;
  viaShape: string;
  viaOffsetUm: number;
  padQuality: string;
  visualVerification: string;
  beforeInspectionNotes: string;
  afterInspectionNotes: string;
  beforeImages: string[];
  afterImages: string[];
  result: 'PASS' | 'ATTENTION' | 'FAIL';
  notes: string;
  customFields?: MHCCustomField[];
  customInspections?: MHCCustomInspectionItem[];
  imageComparisons?: MHCImageComparisonSet[];
}

export interface MHCSparePartItem {
  id: string;
  partName: string;
  partNumber: string;
  category: string;
  quantity: number;
  reason: string;
  action: 'REPLACED' | 'USED' | 'RECOMMENDED';
  costIndicator: 'CUSTOMER_COST' | 'EO_SUPPORT' | 'WARRANTY';
  notes: string;
}

export interface MHCEngineerRemarksData {
  generalFindings: string;
  observedIssues: string;
  correctiveActions: string;
  recommendations: string;
  followUpRequired: boolean;
  productionReleaseVerdict: 'APPROVED' | 'CONDITIONAL_RELEASE' | 'HALTED';
}

export type MHCActivityStatus = 'LOCKED' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REVIEW';

export interface MHCAutopilotSessionProgress {
  currentDay: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4';
  currentActivityCode: string;
  activityStatuses: Record<string, MHCActivityStatus>;
  activityNotes?: Record<string, string>;
  readinessScore?: number;
  isReadOnly?: boolean;
  lastActiveTimestamp?: string;
}

export interface MHCInspectionFindingItem {
  id: string;
  headId: string; // 'lh1' | 'lh2' or custom head ID
  headName: string; // 'Laser Head 1' | 'Laser Head 2'
  component: string;
  isCustomComponent?: boolean;
  conditions: string[];
  customConditionDetail?: string;
  actionRecommendation: 'Clean' | 'Monitor' | 'Recommended replacement' | 'Replacement required' | 'Other' | string;
  engineerNote?: string;
  evidenceImage?: string;
  aiGeneratedWording?: string;
  createdAt: string;
}

export interface MHCHeadInspectionState {
  headId: string;
  headName: string;
  decision: 'UNANSWERED' | 'NO_ISSUE' | 'ISSUE_FOUND';
  findings: MHCInspectionFindingItem[];
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REVIEW';
  updatedAt?: string;
}

export interface MHCStageCalibrationResult {
  stageId: string; // 'stage1' | 'stage2'
  stageName: string; // 'Stage 1' | 'Stage 2'
  xMinUm: number | null;
  xMaxUm: number | null;
  yMinUm: number | null;
  yMaxUm: number | null;
  maxAbsXUm?: number;
  maxAbsYUm?: number;
  overallMaxDevUm?: number;
  specToleranceUm: number; // 2.0
  verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REVIEW';
  evidenceImage?: string;
  engineerNote?: string;
  updatedAt?: string;
}

export interface MHCAgcIndexItem {
  indexNum: number; // 0, 1, 2, 3, 4, 5
  xUm: number | null;
  yUm: number | null;
  specToleranceUm: number; // 3.0
  verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
  engineerNote?: string;
}

export interface MHCAgcResult {
  agcId: string; // 'agc1' | 'agc2'
  agcName: string; // 'AGC 1' | 'AGC 2'
  indices: MHCAgcIndexItem[];
  maxAbsXUm?: number;
  maxAbsYUm?: number;
  overallMaxDevUm?: number;
  specToleranceUm: number; // 3.0
  verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REVIEW';
  scannerConditionFlag?: boolean;
  evidenceImage?: string;
  engineerNote?: string;
  updatedAt?: string;
}

export interface MHCEvidenceItem {
  id: string;
  category: 'temperature_result' | 'inspection_image' | 'calibration_evidence' | 'other_evidence';
  title: string;
  imageDataUrl?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface MHCTemperatureEvidenceData {
  temperatureRecordId?: string;
  temperatureRecordTitle?: string;
  temperatureLogFileName?: string;
  rawRecordsCount?: number;
  stats?: {
    min: number;
    max: number;
    avg: number;
    range: number;
    points: number;
  };
  channelStats?: Record<number, { min: number; max: number; avg: number; range: number; points: number }>;
  hasValidTemperatureAnalysis: boolean;
  evidences?: MHCEvidenceItem[];
  engineerNote?: string;
  updatedAt?: string;
}

export interface MHCSession {
  id: string;
  machineId: string;
  machineModel: string;
  machineSerialNumber: string;
  machineName: string;
  customerId: string;
  customerName: string;
  plantName: string;
  engineerName: string;
  startDate: string;
  startTime: string;
  lastUpdated: string;
  completionStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completedDate?: string;
  currentSection: number;
  sectionStatuses: Record<string, 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>;
  autopilotProgress?: MHCAutopilotSessionProgress;
  stage01_laserHours: MHCLaserHourItem[];
  stage02_laserProfile: MHCLaserProfileData;
  stage03_laserPower: MHCLaserPowerItem[];
  stage04_opticsBeam: MHCOpticsBeamData;
  stage05_cooling: MHCCoolingData;
  stage06_productQuality: MHCProductQualityData;
  stage07_spareParts: MHCSparePartItem[];
  stage08_engineerRemarks: MHCEngineerRemarksData;
  inspectionFindings?: Record<string, MHCHeadInspectionState>;
  stageCalibrationData?: Record<string, MHCStageCalibrationResult>;
  agcData?: Record<string, MHCAgcResult>;
  temperatureEvidenceData?: MHCTemperatureEvidenceData;
  fieldLabelOverrides?: Record<string, string>;
  deletedFieldKeys?: string[];
}

export interface MHCReportDraftConfig {
  id: string;
  mhcSessionId: string;
  reportTitle: string;
  reportNumber: string;
  date: string;
  customerName: string;
  plantName: string;
  machineModel: string;
  machineSerialNumber: string;
  machineName: string;
  engineerName: string;
  engineerTitle: string;
  sectionsVisibility: Record<string, boolean>;
  sectionsOrder: string[];
  customComments: string;
  selectedImages: Array<{ id: string; url: string; caption: string; sectionKey: string }>;
  engineerConclusion: string;
  engineerSignatureName: string;
  engineerSignatureDate: string;
  customerSignatureName: string;
  customerSignatureDate: string;
  lastSaved: string;
}

export interface SmartMhcDataTrayItem {
  id: string;
  category: 'Machine' | 'Product & Process' | 'Laser' | 'Optical / Quality' | 'Maintenance' | 'Engineer';
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  status: 'AVAILABLE' | 'MISSING' | 'NA';
  fieldType?: 'text' | 'number' | 'date' | 'time' | 'status' | 'note' | 'image' | 'measurement';
  isCustom?: boolean;
}

export interface SmartMhcWidget {
  id: string;
  type: 
    | 'Machine Identity'
    | 'Laser Life'
    | 'Laser Temperature'
    | 'Laser Power / Trend'
    | 'Beam Comparison'
    | 'Optics Condition'
    | 'Product Quality Before/After'
    | 'Product Info'
    | 'Process Parameters'
    | 'Spare Parts'
    | 'Recommendations'
    | 'Text / Note'
    | 'Image'
    | 'Table'
    | 'Divider'
    | 'Custom Widget';
  title: string;
  subtitle?: string;
  width: '1/1' | '1/2' | '1/3';
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'NA';
  comparisonSource: 'Baseline vs Current' | 'Before vs After Maintenance' | 'Spec Sheet vs Real-time' | 'Previous MHC vs Current' | 'None';
  displayFields: Record<string, boolean>;
  boundFieldKeys?: string[];
  customDisplayType?: 'card' | 'table' | 'callout' | 'image' | 'stat_grid';
  customNotes?: string;
  imageUrl?: string;
  tableData?: Array<{ label: string; before: string; after: string; result: string }>;
}

export interface MhcWorkspaceTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  revision: string;
  updatedAt: string;
  isDefault?: boolean;
  widgets: SmartMhcWidget[];
}

export interface MhcWorkspaceDraft {
  id: string;
  sessionId: string;
  machineId: string;
  machineName: string;
  draftTitle: string;
  lastSaved: string;
  widgets: SmartMhcWidget[];
  sessionSnapshot?: MHCSession;
}

export * from './mhcReportDocument';

