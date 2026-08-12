import {
  MHCSession,
  MHCLaserHourItem,
  MHCLaserPowerItem,
  MHCLaserProfileData,
  MHCOpticsBeamData,
  MHCCoolingData,
  MHCProductQualityData,
  MHCSparePartItem,
  MHCEngineerRemarksData,
  MHCHeadInspectionState,
  MHCStageCalibrationResult,
  MHCAgcResult,
  MHCTemperatureEvidenceData,
  MHCEvidenceItem
} from './index';

export type MhcReportSectionCode =
  | '01' // Cover
  | '02' // Index
  | '03' // Machine Information
  | '04' // Executive Summary
  | '05' // Laser Hours
  | '06' // Laser Power
  | '07' // Beam Profile
  | '08' // Focus Optimization
  | '09' // Power Offset
  | '10' // Stage Calibration
  | '11' // AGC / Scanner Calibration
  | '12' // Temperature Monitoring
  | '13' // Laser / Product Profile
  | '14' // Product Via Quality
  | '15' // Findings
  | '16' // Corrective Actions
  | '17' // Spare Parts / Recommendations
  | '18' // Evidence
  | '19'; // Buyoff

export type MhcReportSectionStatus =
  | 'COMPLETE'
  | 'INCOMPLETE'
  | 'NEEDS_REVIEW'
  | 'UNAVAILABLE'
  | 'NOT_COLLECTED'
  | 'NOT_APPLICABLE';

export interface MhcReportEvidenceRef {
  id: string;
  category: string;
  title: string;
  url?: string;
  notes?: string;
}

export interface MhcReportSection<T = any> {
  code: MhcReportSectionCode;
  title: string;
  displayOrder: number;
  isVisible: boolean;
  status: MhcReportSectionStatus;
  summaryNote?: string;
  data: T;
  findings?: string[];
  evidenceReferences?: MhcReportEvidenceRef[];
}

// 01 Cover Data
export interface MhcReportCoverData {
  title: string;
  subtitle: string;
  reportNumber: string;
  date: string;
  customerName: string;
  plantName: string;
  machineModel: string;
  machineSerialNumber: string;
  machineName: string;
  engineerName: string;
  engineerTitle: string;
  founderBranding?: {
    companyName?: string;
    tagline?: string;
    logoUrl?: string;
  };
}

// 02 Index Entry
export interface MhcReportIndexEntry {
  code: MhcReportSectionCode;
  title: string;
  displayOrder: number;
  category: string;
  pageNumber: number | null; // Null until assigned by future renderer
  isVisible: boolean;
  status: MhcReportSectionStatus;
}

export interface MhcReportIndexData {
  entries: MhcReportIndexEntry[];
}

// 03 Machine Information
export interface MhcReportMachineInfoData {
  machineId: string;
  machineName: string;
  machineModel: string;
  serialNumber: string;
  customerName: string;
  plantName: string;
  installationDate?: string;
  baselineDate?: string;
  lastMhcDate?: string;
  engineerName: string;
  laserHeads: Array<{
    laserId: string;
    identifier: string;
    ratedPowerWatts?: number;
    recordedLaserHour?: number;
    runtimeStatus?: string;
  }>;
}

// 04 Executive Summary
export interface MhcReportExecutiveSummaryData {
  overallStatus: 'PASS' | 'CONDITIONAL_PASS' | 'ACTION_REQUIRED' | 'FAIL';
  readinessScore: number; // 0 - 100
  summaryText: string;
  keyFindings: string[];
  majorPassFailResults: Array<{
    component: string;
    verdict: 'PASS' | 'WARNING' | 'FAIL' | 'UNANSWERED' | 'NOT_COLLECTED';
    note: string;
  }>;
  replacementRecommendations: string[];
  importantObservations: string[];
}

// 05 Laser Hours
export interface MhcReportLaserHoursData {
  laserHours: Array<{
    laserId: string;
    laserIdentifier: string;
    recordedLaserHour: number;
    verifiedHour?: number;
    calculatedCurrentHour: number;
    warningThreshold: number;
    criticalThreshold: number;
    runtimeStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
    readingDate: string;
    isVerified: boolean;
    notes?: string;
  }>;
  summaryText: string;
}

// Comparison Structure for Power
export interface MhcPowerComparisonItem {
  headId: string;
  headName: string;
  specification: string;
  hasPreviousBaseline: boolean;
  current: {
    ratedPowerWatts: number;
    referenceValueWatts: number;
    beforeValueWatts: number;
    afterValueWatts: number;
    stabilityPercent: number;
    verdict: 'PASS' | 'WARNING' | 'FAIL';
    notes?: string;
  };
  previous: {
    recordedDate: string;
    afterValueWatts: number;
    stabilityPercent: number;
    verdict?: string;
  } | null;
  comparison: {
    deltaWatts: number | null;
    deltaPercent: number | null;
    statusText: string; // e.g., "-1.2 W (-1.8%)" or "No previous baseline"
  };
  evidenceImages: string[];
}

// 06 Laser Power Data
export interface MhcReportLaserPowerData {
  hasPreviousBaseline: boolean;
  comparisonNote: string;
  heads: MhcPowerComparisonItem[];
}

// 07 Beam Profile Comparison Item
export interface MhcBeamProfileComparisonItem {
  headId: string;
  headName: string;
  specification: string;
  hasPreviousBaseline: boolean;
  measurementStation: string;
  current: {
    beamSizeMm?: number;
    focusOffsetMm?: number;
    symmetryRatio?: number;
    m2Value?: number;
    modeQuality?: string;
    overallResult?: string;
    notes?: string;
  };
  previous: {
    recordedDate: string;
    beamSizeMm?: number;
    symmetryRatio?: number;
    overallResult?: string;
  } | null;
  comparison: {
    deltaBeamSizeMm: number | null;
    deltaPercent: number | null;
    statusText: string; // e.g., "+0.02 mm (+1.5%)" or "No previous baseline"
  };
  beamImages: string[];
}

// 07 Beam Profile Data
export interface MhcReportBeamProfileData {
  hasPreviousBaseline: boolean;
  comparisonNote: string;
  measurementStation: string;
  heads: MhcBeamProfileComparisonItem[];
}

// 08 Focus Optimization [Optional / Placeholder]
export interface MhcReportFocusOptimizationData {
  status: 'NOT_COLLECTED' | 'AVAILABLE';
  head1FocusOffsetMm?: number | null;
  head2FocusOffsetMm?: number | null;
  optimalFocusPointMm?: number | null;
  notes?: string;
}

// 09 Power Offset [Optional / Placeholder]
export interface MhcReportPowerOffsetData {
  status: 'NOT_COLLECTED' | 'AVAILABLE';
  head1PowerOffsetWatts?: number | null;
  head2PowerOffsetWatts?: number | null;
  offsetCorrectionApplied?: boolean;
  notes?: string;
}

// 10 Stage Calibration Data
export interface MhcReportStageCalibrationData {
  specToleranceUm: number; // 2.0
  overallVerdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED' | 'NOT_COLLECTED';
  stages: Array<{
    stageId: string;
    stageName: string;
    xMinUm: number | null;
    xMaxUm: number | null;
    yMinUm: number | null;
    yMaxUm: number | null;
    maxAbsXUm?: number;
    maxAbsYUm?: number;
    overallMaxDevUm?: number;
    verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
    evidenceImage?: string;
    engineerNote?: string;
  }>;
}

// 11 AGC / Scanner Calibration Data
export interface MhcReportAgcData {
  specToleranceUm: number; // 3.0
  overallVerdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED' | 'NOT_COLLECTED';
  scannerAttentionRequired: boolean;
  agcs: Array<{
    agcId: string;
    agcName: string;
    indices: Array<{
      indexNum: number;
      xUm: number | null;
      yUm: number | null;
      verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
    }>;
    maxAbsXUm?: number;
    maxAbsYUm?: number;
    overallMaxDevUm?: number;
    verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
    scannerConditionFlag?: boolean;
    evidenceImage?: string;
    engineerNote?: string;
  }>;
}

// 12 Temperature Monitoring Data
export interface MhcReportTemperatureData {
  hasValidTemperatureAnalysis: boolean;
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
  chillerTempCelsius?: number;
  chillerFlowLpm?: number;
  diConductivityUs?: number;
  coolingResult?: 'PASS' | 'ATTENTION' | 'FAIL' | 'NOT_COLLECTED';
  engineerNote?: string;
}

// 13 Laser / Product Profile Data [Optional / Placeholder]
export interface MhcReportLaserProductProfileData {
  status: 'NOT_COLLECTED' | 'AVAILABLE';
  laserId?: string;
  productName?: string;
  recipeProgram?: string;
  profileInfo?: string;
  measurementInfo?: string;
  supportingEvidence?: string;
  images?: string[];
}

// 14 Product Via Quality Data [Optional / Placeholder]
export interface MhcReportProductViaQualityData {
  status: 'NOT_COLLECTED' | 'AVAILABLE';
  sampleId?: string;
  viaDiameterUm?: number;
  viaShape?: string;
  viaOffsetUm?: number;
  padQuality?: string;
  visualVerification?: string;
  result?: 'PASS' | 'ATTENTION' | 'FAIL' | 'NOT_COLLECTED';
  beforeImages?: string[];
  afterImages?: string[];
  notes?: string;
}

// 15 Findings Data
export interface MhcReportFindingsData {
  totalFindingsCount: number;
  heads: Array<{
    headId: string;
    headName: string;
    decision: 'UNANSWERED' | 'NO_ISSUE' | 'ISSUE_FOUND';
    findingsList: Array<{
      id: string;
      component: string;
      conditions: string[];
      actionRecommendation: string;
      engineerNote?: string;
      evidenceImage?: string;
      aiGeneratedWording?: string;
    }>;
  }>;
}

// 16 Corrective Actions Data
export interface MhcReportCorrectiveActionsData {
  actionsList: Array<{
    id: string;
    source: string;
    findingComponent?: string;
    actionText: string;
    recommendationLevel?: string;
    status: 'COMPLETED' | 'RECOMMENDED' | 'PENDING';
  }>;
  generalCorrectiveActionsText?: string;
}

// 17 Spare Parts / Recommendations Data
export interface MhcReportSparePartsData {
  spareParts: Array<{
    id: string;
    partName: string;
    partNumber: string;
    category: string;
    quantity: number;
    reason: string;
    action: 'REPLACED' | 'USED' | 'RECOMMENDED';
    costIndicator: 'CUSTOMER_COST' | 'EO_SUPPORT' | 'WARRANTY';
    notes: string;
  }>;
  recommendations: string[];
  generalFindingsNote?: string;
}

// 18 Evidence Data
export interface MhcReportEvidenceData {
  totalEvidenceItems: number;
  items: Array<{
    id: string;
    category: string;
    title: string;
    sourceSection: string;
    imageDataUrl?: string;
    referenceId?: string;
    notes?: string;
    createdAt?: string;
  }>;
}

// 19 Buyoff Data
export interface MhcReportBuyoffData {
  productionReleaseVerdict: 'APPROVED' | 'CONDITIONAL_RELEASE' | 'HALTED' | 'PENDING';
  engineerSignoff: {
    name: string;
    title: string;
    date: string;
    signatureDataUrl?: string;
  };
  customerSignoff: {
    name: string;
    title?: string;
    date: string;
    signatureDataUrl?: string;
  };
  founderBranding?: {
    companyName?: string;
    tagline?: string;
    logoUrl?: string;
  };
}

// Map of all sections by section code
export interface MhcReportSectionMap {
  '01': MhcReportSection<MhcReportCoverData>;
  '02': MhcReportSection<MhcReportIndexData>;
  '03': MhcReportSection<MhcReportMachineInfoData>;
  '04': MhcReportSection<MhcReportExecutiveSummaryData>;
  '05': MhcReportSection<MhcReportLaserHoursData>;
  '06': MhcReportSection<MhcReportLaserPowerData>;
  '07': MhcReportSection<MhcReportBeamProfileData>;
  '08': MhcReportSection<MhcReportFocusOptimizationData>;
  '09': MhcReportSection<MhcReportPowerOffsetData>;
  '10': MhcReportSection<MhcReportStageCalibrationData>;
  '11': MhcReportSection<MhcReportAgcData>;
  '12': MhcReportSection<MhcReportTemperatureData>;
  '13': MhcReportSection<MhcReportLaserProductProfileData>;
  '14': MhcReportSection<MhcReportProductViaQualityData>;
  '15': MhcReportSection<MhcReportFindingsData>;
  '16': MhcReportSection<MhcReportCorrectiveActionsData>;
  '17': MhcReportSection<MhcReportSparePartsData>;
  '18': MhcReportSection<MhcReportEvidenceData>;
  '19': MhcReportSection<MhcReportBuyoffData>;
}

export interface MhcReportMetadata {
  reportNumber: string;
  title: string;
  generatedAt: string;
  sessionId: string;
  machineId: string;
  machineModel: string;
  machineSerialNumber: string;
  customerName: string;
  plantName: string;
  engineerName: string;
  hasPreviousBaseline: boolean;
  previousSessionId?: string;
  previousSessionDate?: string;
  totalSectionsCount: number;
}

export interface MhcReportDocument {
  reportId: string;
  generatedAt: string;
  schemaVersion: '1.0.0';
  sessionId: string;
  machineId: string;
  metadata: MhcReportMetadata;
  indexEntries: MhcReportIndexEntry[];
  sections: MhcReportSectionMap;
  orderedSections: MhcReportSection[];
}

export interface MhcReportOptions {
  reportNumber?: string;
  title?: string;
  engineerTitle?: string;
  founderBranding?: {
    companyName?: string;
    tagline?: string;
    logoUrl?: string;
  };
  sectionVisibilityOverrides?: Record<MhcReportSectionCode, boolean>;
}
