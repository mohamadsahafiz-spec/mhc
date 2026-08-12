import { 
  MHCSession, 
  MHCAutopilotSessionProgress, 
  MHCActivityStatus 
} from '../types';

export interface WorkflowActivity {
  code: string;
  title: string;
  day: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4';
  parentCode?: string;
  subItems?: { code: string; title: string }[];
}

// Master Workflow Schedule for MHC Autopilot
export const MHC_WORKFLOW_SCHEDULE: WorkflowActivity[] = [
  {
    day: 'DAY 1',
    code: '01',
    title: 'Laser Hours',
    subItems: []
  },
  {
    day: 'DAY 1',
    code: '02',
    title: 'Laser Head 1',
    subItems: [
      { code: '02_power', title: 'Power' },
      { code: '02_beam', title: 'Beam Profile / Mode' },
      { code: '02_findings', title: 'Inspection / Findings' }
    ]
  },
  {
    day: 'DAY 1',
    code: '03',
    title: 'Laser Head 2',
    subItems: [
      { code: '03_power', title: 'Power' },
      { code: '03_beam', title: 'Beam Profile / Mode' },
      { code: '03_findings', title: 'Inspection / Findings' }
    ]
  },
  {
    day: 'DAY 2',
    code: '04',
    title: 'Stage Calibration',
    subItems: [
      { code: '04_stage1', title: 'Stage 1' },
      { code: '04_stage2', title: 'Stage 2' }
    ]
  },
  {
    day: 'DAY 3',
    code: '05',
    title: 'AGC',
    subItems: [
      { code: '05_agc1', title: 'AGC 1' },
      { code: '05_agc2', title: 'AGC 2' }
    ]
  },
  {
    day: 'DAY 3',
    code: '06',
    title: 'Temperature & Evidence',
    subItems: []
  },
  {
    day: 'DAY 4',
    code: '07',
    title: 'MHC Readiness Review',
    subItems: []
  },
  {
    day: 'DAY 4',
    code: '08',
    title: 'Report Generation',
    subItems: []
  },
  {
    day: 'DAY 4',
    code: '09',
    title: 'Buyoff / Complete',
    subItems: []
  }
];

// Flat list of all atomic actionable activity codes in sequential order
export const ACTIONABLE_ACTIVITIES: { code: string; title: string; day: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4'; parentCode?: string }[] = [
  { code: '01', title: 'Laser Hours', day: 'DAY 1' },
  { code: '02_power', title: 'Laser Head 1 — Power', day: 'DAY 1', parentCode: '02' },
  { code: '02_beam', title: 'Laser Head 1 — Beam Profile / Mode', day: 'DAY 1', parentCode: '02' },
  { code: '02_findings', title: 'Laser Head 1 — Inspection / Findings', day: 'DAY 1', parentCode: '02' },
  { code: '03_power', title: 'Laser Head 2 — Power', day: 'DAY 1', parentCode: '03' },
  { code: '03_beam', title: 'Laser Head 2 — Beam Profile / Mode', day: 'DAY 1', parentCode: '03' },
  { code: '03_findings', title: 'Laser Head 2 — Inspection / Findings', day: 'DAY 1', parentCode: '03' },
  { code: '04_stage1', title: 'Stage Calibration — Stage 1', day: 'DAY 2', parentCode: '04' },
  { code: '04_stage2', title: 'Stage Calibration — Stage 2', day: 'DAY 2', parentCode: '04' },
  { code: '05_agc1', title: 'AGC — AGC 1', day: 'DAY 3', parentCode: '05' },
  { code: '05_agc2', title: 'AGC — AGC 2', day: 'DAY 3', parentCode: '05' },
  { code: '06', title: 'Temperature & Evidence', day: 'DAY 3' },
  { code: '07', title: 'MHC Readiness Review', day: 'DAY 4' },
  { code: '08', title: 'Report Generation', day: 'DAY 4' },
  { code: '09', title: 'Buyoff / Complete', day: 'DAY 4' }
];

export function createDefaultAutopilotProgress(): MHCAutopilotSessionProgress {
  const activityStatuses: Record<string, MHCActivityStatus> = {};

  // Day 1 initial activity
  activityStatuses['01'] = 'IN_PROGRESS';
  activityStatuses['02_power'] = 'UPCOMING';
  activityStatuses['02_beam'] = 'UPCOMING';
  activityStatuses['02_findings'] = 'UPCOMING';
  activityStatuses['03_power'] = 'UPCOMING';
  activityStatuses['03_beam'] = 'UPCOMING';
  activityStatuses['03_findings'] = 'UPCOMING';

  // Day 2-4 initially locked
  activityStatuses['04_stage1'] = 'LOCKED';
  activityStatuses['04_stage2'] = 'LOCKED';
  activityStatuses['05_agc1'] = 'LOCKED';
  activityStatuses['05_agc2'] = 'LOCKED';
  activityStatuses['06'] = 'LOCKED';
  activityStatuses['07'] = 'LOCKED';
  activityStatuses['08'] = 'LOCKED';
  activityStatuses['09'] = 'LOCKED';

  return {
    currentDay: 'DAY 1',
    currentActivityCode: '01',
    activityStatuses,
    activityNotes: {},
    readinessScore: 0,
    isReadOnly: false,
    lastActiveTimestamp: new Date().toISOString()
  };
}

// Compute aggregate status for parent codes (e.g. '02', '03', '04', '05')
export function getParentActivityStatus(
  parentCode: string, 
  activityStatuses: Record<string, MHCActivityStatus>
): MHCActivityStatus {
  const children = ACTIONABLE_ACTIVITIES.filter(a => a.parentCode === parentCode);
  if (children.length === 0) return activityStatuses[parentCode] || 'LOCKED';

  const childStatuses = children.map(c => activityStatuses[c.code] || 'LOCKED');
  
  if (childStatuses.every(s => s === 'COMPLETED')) return 'COMPLETED';
  if (childStatuses.some(s => s === 'NEEDS_REVIEW')) return 'NEEDS_REVIEW';
  if (childStatuses.some(s => s === 'IN_PROGRESS')) return 'IN_PROGRESS';
  if (childStatuses.some(s => s === 'COMPLETED')) return 'IN_PROGRESS';
  if (childStatuses.every(s => s === 'LOCKED')) return 'LOCKED';
  return 'UPCOMING';
}

export interface AutopilotReadinessReport {
  completedCount: number;
  totalCount: number;
  readinessScore: number;
  completedList: { code: string; title: string; day: string }[];
  incompleteList: { code: string; title: string; day: string }[];
  needsReviewList: { code: string; title: string; day: string }[];
  nextActionableActivity: { code: string; title: string; day: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4' } | null;
  isReadyForReport: boolean;
}

export interface MhcAuditItem {
  code: string;
  title: string;
  day: 'DAY 1' | 'DAY 2' | 'DAY 3';
  status: 'COMPLETE' | 'NEEDS_REVIEW' | 'INCOMPLETE' | 'LOCKED' | 'OPTIONAL';
  statusSymbol: '✓' | '⚠' | '○' | '🔒' | '—';
  detail: string;
  isBlocker: boolean;
  blockerReason: string | null;
}

export interface MhcReadinessAuditResult {
  isReadyForReport: boolean;
  statusCategory: 'READY_FOR_REPORT' | 'ATTENTION_REQUIRED';
  statusText: string;
  auditItems: MhcAuditItem[];
  blockers: { id: string; code: string; title: string; reason: string }[];
  nextAction: { text: string; targetCode: string };
  completedRequiredCount: number;
  totalRequiredCount: number;
  readinessScore: number;
}

export function auditMhcSession(session?: MHCSession | null): MhcReadinessAuditResult {
  if (!session) {
    return {
      isReadyForReport: false,
      statusCategory: 'ATTENTION_REQUIRED',
      statusText: '🟠 ATTENTION REQUIRED',
      auditItems: [],
      blockers: [{ id: 'B-1', code: '01', title: 'Session', reason: 'No active session loaded.' }],
      nextAction: { text: 'Start Session', targetCode: '01' },
      completedRequiredCount: 0,
      totalRequiredCount: 12,
      readinessScore: 0
    };
  }

  const statuses = session.autopilotProgress?.activityStatuses || {};
  const auditItems: MhcAuditItem[] = [];

  const addItem = (
    code: string,
    title: string,
    day: 'DAY 1' | 'DAY 2' | 'DAY 3',
    evaluate: () => {
      status: 'COMPLETE' | 'NEEDS_REVIEW' | 'INCOMPLETE' | 'LOCKED' | 'OPTIONAL';
      statusSymbol: '✓' | '⚠' | '○' | '🔒' | '—';
      detail: string;
      isBlocker: boolean;
      blockerReason: string | null;
    }
  ) => {
    const res = evaluate();
    auditItems.push({
      code,
      title,
      day,
      ...res
    });
  };

  // 1. Laser Hours (01)
  addItem('01', 'Laser Hours', 'DAY 1', () => {
    const st = statuses['01'];
    const hrsItem = session.stage01_laserHours?.[0];
    if (st === 'COMPLETED' || (session.stage01_laserHours && session.stage01_laserHours.length > 0)) {
      const displayHrs = hrsItem ? (hrsItem.verifiedHour || hrsItem.calculatedCurrentHour || hrsItem.recordedLaserHour) : null;
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: displayHrs ? `${displayHrs.toLocaleString()} laser hrs` : 'Laser hours recorded',
        isBlocker: false,
        blockerReason: null
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Laser hours missing',
      isBlocker: true,
      blockerReason: 'Laser Hours record is incomplete.'
    };
  });

  // 2. Head 1 Power (02_power)
  addItem('02_power', 'Head 1 Power', 'DAY 1', () => {
    const st = statuses['02_power'];
    const powerData = session.stage03_laserPower?.find(p => p.laserId === 'lh1' || p.laserId === 'head1' || p.laserIdentifier?.includes('1'));
    if (powerData && powerData.result === 'FAIL') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: powerData.afterValueWatts ? `${powerData.afterValueWatts} W (Out of Spec)` : 'Out of specification',
        isBlocker: true,
        blockerReason: 'Head 1 Power result is out of specification.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: powerData?.afterValueWatts ? `${powerData.afterValueWatts} W (Pass)` : 'Power measured (Pass)',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Flagged for review',
        isBlocker: true,
        blockerReason: 'Head 1 Power measurement requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Head 1 Power measurement is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Power measurement missing',
      isBlocker: true,
      blockerReason: 'Head 1 Power measurement is incomplete.'
    };
  });

  // 3. Head 1 Beam Profile / Mode (02_beam)
  addItem('02_beam', 'Head 1 Beam Profile / Mode', 'DAY 1', () => {
    const st = statuses['02_beam'];
    const beamRecord = session.stage02_laserProfile?.beamProfileRecord;
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: beamRecord?.overallResult ? `Beam profile captured (${beamRecord.overallResult})` : 'Beam profile captured',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Flagged for review',
        isBlocker: true,
        blockerReason: 'Head 1 Beam Profile requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Head 1 Beam Profile is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Beam profile missing',
      isBlocker: true,
      blockerReason: 'Head 1 Beam Profile is incomplete.'
    };
  });

  // 4. Head 1 Inspection / Findings (02_findings)
  addItem('02_findings', 'Head 1 Inspection / Findings', 'DAY 1', () => {
    const st = statuses['02_findings'];
    const inspData = session.inspectionFindings?.['lh1'] || session.inspectionFindings?.['head1'];
    if (inspData?.status === 'NEEDS_REVIEW' || st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Inspection finding requires review',
        isBlocker: true,
        blockerReason: 'Head 1 inspection finding requires review.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'Optics & head inspection passed',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Head 1 Inspection is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Inspection missing',
      isBlocker: true,
      blockerReason: 'Head 1 Inspection is incomplete.'
    };
  });

  // 5. Head 2 Power (03_power)
  addItem('03_power', 'Head 2 Power', 'DAY 1', () => {
    const st = statuses['03_power'];
    const powerData = session.stage03_laserPower?.find(p => p.laserId === 'lh2' || p.laserId === 'head2' || p.laserIdentifier?.includes('2'));
    if (powerData && powerData.result === 'FAIL') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: powerData.afterValueWatts ? `${powerData.afterValueWatts} W (Out of Spec)` : 'Out of specification',
        isBlocker: true,
        blockerReason: 'Head 2 Power result is out of specification.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: powerData?.afterValueWatts ? `${powerData.afterValueWatts} W (Pass)` : 'Power measured (Pass)',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Flagged for review',
        isBlocker: true,
        blockerReason: 'Head 2 Power measurement requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Head 2 Power measurement is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Power measurement missing',
      isBlocker: true,
      blockerReason: 'Head 2 Power measurement is incomplete.'
    };
  });

  // 6. Head 2 Beam Profile / Mode (03_beam)
  addItem('03_beam', 'Head 2 Beam Profile / Mode', 'DAY 1', () => {
    const st = statuses['03_beam'];
    const beamRecord = session.stage02_laserProfile?.beamProfileRecord;
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: beamRecord?.overallResult ? `Beam profile captured (${beamRecord.overallResult})` : 'Beam profile captured',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Flagged for review',
        isBlocker: true,
        blockerReason: 'Head 2 Beam Profile requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Head 2 Beam Profile is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Beam profile missing',
      isBlocker: true,
      blockerReason: 'Head 2 Beam Profile is incomplete.'
    };
  });

  // 7. Head 2 Inspection / Findings (03_findings)
  addItem('03_findings', 'Head 2 Inspection / Findings', 'DAY 1', () => {
    const st = statuses['03_findings'];
    const inspData = session.inspectionFindings?.['lh2'] || session.inspectionFindings?.['head2'];
    if (inspData?.status === 'NEEDS_REVIEW' || st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Inspection finding requires review',
        isBlocker: true,
        blockerReason: 'Head 2 inspection finding requires review.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'Optics & head inspection passed',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Head 2 Inspection is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Inspection missing',
      isBlocker: true,
      blockerReason: 'Head 2 Inspection is incomplete.'
    };
  });

  // 8. Stage 1 Calibration (04_stage1)
  addItem('04_stage1', 'Stage 1 Calibration', 'DAY 2', () => {
    const st = statuses['04_stage1'];
    const stageData = session.stageCalibrationData?.['stage1'];
    if (stageData && stageData.verdict === 'OUT_OF_SPEC') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Out of specification',
        isBlocker: true,
        blockerReason: 'Stage 1 calibration result is out of specification.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'Stage 1 calibration passed',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Flagged for review',
        isBlocker: true,
        blockerReason: 'Stage 1 calibration requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Stage 1 calibration is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Calibration missing',
      isBlocker: true,
      blockerReason: 'Stage 1 calibration is incomplete.'
    };
  });

  // 9. Stage 2 Calibration (04_stage2)
  addItem('04_stage2', 'Stage 2 Calibration', 'DAY 2', () => {
    const st = statuses['04_stage2'];
    const stageData = session.stageCalibrationData?.['stage2'];
    if (stageData && stageData.verdict === 'OUT_OF_SPEC') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Out of specification',
        isBlocker: true,
        blockerReason: 'Stage 2 calibration result is out of specification.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'Stage 2 calibration passed',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Flagged for review',
        isBlocker: true,
        blockerReason: 'Stage 2 calibration requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Stage 2 calibration is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Calibration missing',
      isBlocker: true,
      blockerReason: 'Stage 2 calibration is incomplete.'
    };
  });

  // 10. AGC 1 (05_agc1)
  addItem('05_agc1', 'AGC 1', 'DAY 3', () => {
    const st = statuses['05_agc1'];
    const agcData = session.agcData?.['agc1'];
    if (agcData && agcData.verdict === 'OUT_OF_SPEC') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Out of specification',
        isBlocker: true,
        blockerReason: 'AGC 1 measurement is out of specification.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'AGC 1 verified (Pass)',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Flagged for review',
        isBlocker: true,
        blockerReason: 'AGC 1 requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'AGC 1 is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Measurement missing',
      isBlocker: true,
      blockerReason: 'AGC 1 measurement is incomplete.'
    };
  });

  // 11. AGC 2 (05_agc2)
  addItem('05_agc2', 'AGC 2', 'DAY 3', () => {
    const st = statuses['05_agc2'];
    const agcData = session.agcData?.['agc2'];
    if (agcData && agcData.verdict === 'OUT_OF_SPEC') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Out of specification',
        isBlocker: true,
        blockerReason: 'AGC 2 measurement is out of specification.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'AGC 2 verified (Pass)',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Flagged for review',
        isBlocker: true,
        blockerReason: 'AGC 2 requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'AGC 2 is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Measurement missing',
      isBlocker: true,
      blockerReason: 'AGC 2 measurement is incomplete.'
    };
  });

  // 12. Temperature & Evidence (06)
  addItem('06', 'Temperature & Evidence', 'DAY 3', () => {
    const st = statuses['06'];
    const tempData = session.temperatureEvidenceData;
    const hasValidTemp = Boolean(tempData?.hasValidTemperatureAnalysis && tempData?.stats);
    if (hasValidTemp && st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: tempData?.stats ? `Log parsed (${tempData.stats.avg.toFixed(1)}°C avg)` : 'Temperature log verified',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: 'Flagged for review',
        isBlocker: true,
        blockerReason: 'Temperature log requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Temperature log analysis is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Temperature analysis missing',
      isBlocker: true,
      blockerReason: 'Machine temperature telemetry log analysis is missing.'
    };
  });

  const blockers = auditItems
    .filter(i => i.isBlocker)
    .map((i, idx) => ({
      id: `B-${idx + 1}`,
      code: i.code,
      title: i.title,
      reason: i.blockerReason || `${i.title} is incomplete or requires review.`
    }));

  const isReadyForReport = blockers.length === 0;
  const statusCategory = isReadyForReport ? 'READY_FOR_REPORT' : 'ATTENTION_REQUIRED';
  const statusText = isReadyForReport ? '🟢 READY FOR REPORT' : '🟠 ATTENTION REQUIRED';

  const completedRequiredCount = auditItems.filter(i => i.status === 'COMPLETE').length;
  const totalRequiredCount = auditItems.length;
  const readinessScore = Math.round((completedRequiredCount / totalRequiredCount) * 100);

  let nextAction = { text: 'Generate Report', targetCode: '08' };
  if (!isReadyForReport && blockers.length > 0) {
    const firstBlocker = blockers[0];
    nextAction = {
      text: `Review ${firstBlocker.title}`,
      targetCode: firstBlocker.code
    };
  }

  return {
    isReadyForReport,
    statusCategory,
    statusText,
    auditItems,
    blockers,
    nextAction,
    completedRequiredCount,
    totalRequiredCount,
    readinessScore
  };
}

export function computeAutopilotReadiness(
  progress?: MHCAutopilotSessionProgress,
  session?: MHCSession | null
): AutopilotReadinessReport {
  if (session) {
    const audit = auditMhcSession(session);
    const completedList = audit.auditItems
      .filter(i => i.status === 'COMPLETE')
      .map(i => ({ code: i.code, title: i.title, day: i.day }));
    const incompleteList = audit.auditItems
      .filter(i => i.status !== 'COMPLETE')
      .map(i => ({ code: i.code, title: i.title, day: i.day }));
    const needsReviewList = audit.auditItems
      .filter(i => i.status === 'NEEDS_REVIEW')
      .map(i => ({ code: i.code, title: i.title, day: i.day }));

    let nextActionableActivity: { code: string; title: string; day: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4' } | null = null;
    const nextItem = ACTIONABLE_ACTIVITIES.find(a => a.code === audit.nextAction.targetCode);
    if (nextItem) {
      nextActionableActivity = nextItem;
    }

    return {
      completedCount: audit.completedRequiredCount,
      totalCount: audit.totalRequiredCount,
      readinessScore: audit.readinessScore,
      completedList,
      incompleteList,
      needsReviewList,
      nextActionableActivity,
      isReadyForReport: audit.isReadyForReport
    };
  }

  const currentProgress = progress || createDefaultAutopilotProgress();
  const statuses = currentProgress.activityStatuses || {};

  const completedList: { code: string; title: string; day: string }[] = [];
  const incompleteList: { code: string; title: string; day: string }[] = [];
  const needsReviewList: { code: string; title: string; day: string }[] = [];

  let nextActionableActivity: { code: string; title: string; day: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4' } | null = null;

  for (const item of ACTIONABLE_ACTIVITIES) {
    const st = statuses[item.code] || 'LOCKED';
    if (st === 'COMPLETED') {
      completedList.push({ code: item.code, title: item.title, day: item.day });
    } else if (st === 'NEEDS_REVIEW') {
      needsReviewList.push({ code: item.code, title: item.title, day: item.day });
      incompleteList.push({ code: item.code, title: item.title, day: item.day });
      if (!nextActionableActivity) nextActionableActivity = item;
    } else {
      incompleteList.push({ code: item.code, title: item.title, day: item.day });
      if (!nextActionableActivity && st !== 'LOCKED') {
        nextActionableActivity = item;
      }
    }
  }

  const completedCount = completedList.length;
  const totalCount = ACTIONABLE_ACTIVITIES.length;
  const readinessScore = Math.round((completedCount / totalCount) * 100);

  const coreEngineeringItems = ACTIONABLE_ACTIVITIES.filter(a => ['DAY 1', 'DAY 2', 'DAY 3'].includes(a.day));
  const coreCompleted = coreEngineeringItems.every(a => (statuses[a.code] === 'COMPLETED'));
  const isReadyForReport = coreCompleted && needsReviewList.length === 0;

  return {
    completedCount,
    totalCount,
    readinessScore,
    completedList,
    incompleteList,
    needsReviewList,
    nextActionableActivity,
    isReadyForReport
  };
}

export function advanceAutopilotActivity(
  session: MHCSession,
  targetCode: string,
  newStatus: 'COMPLETED' | 'NEEDS_REVIEW' | 'IN_PROGRESS',
  note?: string
): MHCSession {
  const currentProgress = session.autopilotProgress || createDefaultAutopilotProgress();
  const activityStatuses = { ...currentProgress.activityStatuses };
  const activityNotes = { ...(currentProgress.activityNotes || {}) };

  activityStatuses[targetCode] = newStatus;
  if (note !== undefined) {
    activityNotes[targetCode] = note;
  }

  let nextCode = targetCode;
  let nextDay = currentProgress.currentDay;

  if (newStatus === 'COMPLETED') {
    // Find next actionable activity index that is not already completed
    const currIndex = ACTIONABLE_ACTIVITIES.findIndex(a => a.code === targetCode);
    if (currIndex >= 0 && currIndex < ACTIONABLE_ACTIVITIES.length - 1) {
      let nextIndex = currIndex + 1;
      while (
        nextIndex < ACTIONABLE_ACTIVITIES.length &&
        activityStatuses[ACTIONABLE_ACTIVITIES[nextIndex].code] === 'COMPLETED'
      ) {
        nextIndex++;
      }

      if (nextIndex < ACTIONABLE_ACTIVITIES.length) {
        const candidate = ACTIONABLE_ACTIVITIES[nextIndex];
        nextCode = candidate.code;
        nextDay = candidate.day;

        // Unlock candidate if it was locked or upcoming
        if (activityStatuses[candidate.code] === 'LOCKED' || activityStatuses[candidate.code] === 'UPCOMING' || !activityStatuses[candidate.code]) {
          activityStatuses[candidate.code] = 'IN_PROGRESS';
        }

        // Unlock same-day activities as upcoming
        ACTIONABLE_ACTIVITIES.forEach((act, idx) => {
          if (idx > nextIndex && act.day === candidate.day && activityStatuses[act.code] === 'LOCKED') {
            activityStatuses[act.code] = 'UPCOMING';
          }
        });
      }
    }
  }

  // Recalculate readiness
  const updatedProgress: MHCAutopilotSessionProgress = {
    ...currentProgress,
    currentDay: nextDay,
    currentActivityCode: nextCode,
    activityStatuses,
    activityNotes,
    lastActiveTimestamp: new Date().toISOString()
  };

  const readiness = computeAutopilotReadiness(updatedProgress);
  updatedProgress.readinessScore = readiness.readinessScore;

  const isAllComplete = readiness.completedCount === readiness.totalCount;

  return {
    ...session,
    lastUpdated: new Date().toISOString(),
    completionStatus: isAllComplete ? 'COMPLETED' : 'IN_PROGRESS',
    autopilotProgress: updatedProgress
  };
}

export function flagDownstreamNeedsReview(
  session: MHCSession,
  editedCode: string
): MHCSession {
  const currentProgress = session.autopilotProgress || createDefaultAutopilotProgress();
  const activityStatuses = { ...currentProgress.activityStatuses };

  const editIndex = ACTIONABLE_ACTIVITIES.findIndex(a => a.code === editedCode);
  if (editIndex >= 0) {
    // Flag completed downstream activities in the same phase/day as NEEDS_REVIEW
    ACTIONABLE_ACTIVITIES.forEach((act, idx) => {
      if (idx > editIndex && activityStatuses[act.code] === 'COMPLETED' && act.day === currentProgress.currentDay) {
        activityStatuses[act.code] = 'NEEDS_REVIEW';
      }
    });
  }

  const updatedProgress: MHCAutopilotSessionProgress = {
    ...currentProgress,
    activityStatuses,
    lastActiveTimestamp: new Date().toISOString()
  };

  const readiness = computeAutopilotReadiness(updatedProgress);
  updatedProgress.readinessScore = readiness.readinessScore;

  return {
    ...session,
    lastUpdated: new Date().toISOString(),
    autopilotProgress: updatedProgress
  };
}
