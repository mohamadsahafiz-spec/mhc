import {
  MHCSession,
  MhcReportDocument,
  MhcReportSection,
  MhcReportSectionCode,
  MhcReportSectionMap,
  MhcReportIndexEntry,
  MhcReportOptions,
  MhcReportCoverData,
  MhcReportIndexData,
  MhcReportMachineInfoData,
  MhcReportExecutiveSummaryData,
  MhcReportLaserHoursData,
  MhcReportLaserPowerData,
  MhcPowerComparisonItem,
  MhcReportBeamProfileData,
  MhcBeamProfileComparisonItem,
  MhcReportFocusOptimizationData,
  MhcReportPowerOffsetData,
  MhcReportStageCalibrationData,
  MhcReportAgcData,
  MhcReportTemperatureData,
  MhcReportLaserProductProfileData,
  MhcReportProductViaQualityData,
  MhcReportFindingsData,
  MhcReportCorrectiveActionsData,
  MhcReportSparePartsData,
  MhcReportEvidenceData,
  MhcReportBuyoffData
} from '../types';
import { auditMhcSession } from './mhcAutopilotBrain';

/**
 * Builds a normalized, single MhcReportDocument from an authoritative MHCSession.
 *
 * Design Principles:
 * 1. The MHCSession remains the authoritative engineering source.
 * 2. MhcReportDocument is a pure DERIVED presentation model.
 * 3. Does NOT mutate MHCSession or duplicate records in persistent DBs.
 * 4. Comparison is supported for Laser Power and Beam Profile using previousSession if available.
 * 5. Future renderers (PDF, Compact PDF, PPTX) can consume this single model independently.
 */
export function buildMhcReportDocument(
  session: MHCSession,
  previousSession?: MHCSession,
  options?: MhcReportOptions
): MhcReportDocument {
  const generatedAt = new Date().toISOString();
  const reportId = `RPT-${session.id || 'SESSION'}-${Date.now()}`;
  const reportNumber = options?.reportNumber || `MHC-${session.machineSerialNumber || 'SN'}-${new Date().getFullYear()}`;

  // Run authoritative session audit derived view
  const sessionAudit = auditMhcSession(session);

  // 01 COVER
  const coverData: MhcReportCoverData = {
    title: options?.title || 'Maintenance & Health Check (MHC) Report',
    subtitle: 'System Health, Calibration & Optical Performance Audit',
    reportNumber,
    date: session.completedDate || session.startDate || generatedAt.split('T')[0],
    customerName: session.customerName || 'Customer',
    plantName: session.plantName || 'Facility',
    machineModel: session.machineModel || 'ESI Laser System',
    machineSerialNumber: session.machineSerialNumber || 'N/A',
    machineName: session.machineName || session.machineModel || 'MHC System',
    engineerName: session.engineerName || 'Field Service Engineer',
    engineerTitle: options?.engineerTitle || 'Senior Field Service Engineer',
    founderBranding: options?.founderBranding
  };

  const coverSection: MhcReportSection<MhcReportCoverData> = {
    code: '01',
    title: 'Cover Page',
    displayOrder: 1,
    isVisible: options?.sectionVisibilityOverrides?.['01'] ?? true,
    status: 'COMPLETE',
    data: coverData
  };

  // 03 MACHINE INFO
  const laserHeads = [
    {
      laserId: 'lh1',
      identifier: 'Laser Head 1',
      ratedPowerWatts: 15.0,
      recordedLaserHour: session.stage01_laserHours?.[0]?.verifiedHour || session.stage01_laserHours?.[0]?.calculatedCurrentHour || 0,
      runtimeStatus: session.stage01_laserHours?.[0]?.runtimeStatus || 'NORMAL'
    },
    {
      laserId: 'lh2',
      identifier: 'Laser Head 2',
      ratedPowerWatts: 15.0,
      recordedLaserHour: session.stage01_laserHours?.[1]?.verifiedHour || session.stage01_laserHours?.[1]?.calculatedCurrentHour || 0,
      runtimeStatus: session.stage01_laserHours?.[1]?.runtimeStatus || 'NORMAL'
    }
  ];

  const machineInfoData: MhcReportMachineInfoData = {
    machineId: session.machineId || session.machineSerialNumber || 'MCH-01',
    machineName: session.machineName || session.machineModel || 'ESI Machine',
    machineModel: session.machineModel || 'ESI System',
    serialNumber: session.machineSerialNumber || 'N/A',
    customerName: session.customerName || 'Customer',
    plantName: session.plantName || 'Facility',
    installationDate: undefined,
    baselineDate: previousSession?.completedDate || previousSession?.startDate,
    lastMhcDate: session.completedDate || session.startDate,
    engineerName: session.engineerName || 'Engineer',
    laserHeads
  };

  const machineInfoSection: MhcReportSection<MhcReportMachineInfoData> = {
    code: '03',
    title: 'Machine Information',
    displayOrder: 3,
    isVisible: options?.sectionVisibilityOverrides?.['03'] ?? true,
    status: session.machineSerialNumber ? 'COMPLETE' : 'NEEDS_REVIEW',
    data: machineInfoData
  };

  // 05 LASER HOURS
  const hrsItems = session.stage01_laserHours || [];
  const laserHoursData: MhcReportLaserHoursData = {
    laserHours: hrsItems.map(item => ({
      laserId: item.laserId,
      laserIdentifier: item.laserIdentifier,
      recordedLaserHour: item.recordedLaserHour,
      verifiedHour: item.verifiedHour,
      calculatedCurrentHour: item.calculatedCurrentHour,
      warningThreshold: item.warningThreshold || 18000,
      criticalThreshold: item.criticalThreshold || 20000,
      runtimeStatus: item.runtimeStatus || 'NORMAL',
      readingDate: item.readingDate || coverData.date,
      isVerified: item.isVerified || false,
      notes: item.verificationNotes
    })),
    summaryText: hrsItems.length > 0
      ? `Laser hours recorded for ${hrsItems.length} head(s). Active sources analyzed against lifetime limits.`
      : 'Laser hour telemetry pending verification.'
  };

  const laserHoursSection: MhcReportSection<MhcReportLaserHoursData> = {
    code: '05',
    title: 'Laser Hours',
    displayOrder: 5,
    isVisible: options?.sectionVisibilityOverrides?.['05'] ?? true,
    status: hrsItems.length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: laserHoursData,
    summaryNote: laserHoursData.summaryText
  };

  // 06 LASER POWER (WITH PREVIOUS/CURRENT COMPARISON)
  const hasPreviousPower = Boolean(previousSession?.stage03_laserPower && previousSession.stage03_laserPower.length > 0);
  const powerItems = session.stage03_laserPower || [];

  const headsPowerComparison: MhcPowerComparisonItem[] = [
    { headId: 'lh1', headName: 'Laser Head 1' },
    { headId: 'lh2', headName: 'Laser Head 2' }
  ].map(({ headId, headName }) => {
    const curr = powerItems.find(p => p.laserId === headId || p.laserId === (headId === 'lh1' ? 'head1' : 'head2'));
    const prevItem = previousSession?.stage03_laserPower?.find(p => p.laserId === headId || p.laserId === (headId === 'lh1' ? 'head1' : 'head2'));
    const hasBaseline = Boolean(prevItem && prevItem.afterValueWatts > 0);

    let deltaWatts: number | null = null;
    let deltaPercent: number | null = null;
    let statusText = 'No previous baseline';

    const currWatts = curr?.afterValueWatts || 0;

    if (hasBaseline && prevItem && currWatts > 0) {
      deltaWatts = currWatts - prevItem.afterValueWatts;
      deltaPercent = prevItem.afterValueWatts > 0 ? (deltaWatts / prevItem.afterValueWatts) * 100 : 0;
      const sign = deltaWatts >= 0 ? '+' : '';
      statusText = `${sign}${deltaWatts.toFixed(2)} W (${sign}${deltaPercent.toFixed(1)}%)`;
    }

    return {
      headId,
      headName,
      specification: '15.0 W ± 10% (13.5–16.5 W)',
      hasPreviousBaseline: hasBaseline,
      current: {
        ratedPowerWatts: curr?.ratedPowerWatts || 15.0,
        referenceValueWatts: curr?.referenceValueWatts || 15.0,
        beforeValueWatts: curr?.beforeValueWatts || 0,
        afterValueWatts: currWatts,
        stabilityPercent: curr?.stabilityPercent || 0,
        verdict: curr?.result === 'PASS' ? 'PASS' : curr?.result === 'FAIL' ? 'FAIL' : 'WARNING',
        notes: curr?.notes
      },
      previous: hasBaseline && prevItem ? {
        recordedDate: previousSession?.completedDate || previousSession?.startDate || 'Previous MHC',
        afterValueWatts: prevItem.afterValueWatts,
        stabilityPercent: prevItem.stabilityPercent || 0,
        verdict: prevItem.result
      } : null,
      comparison: {
        deltaWatts,
        deltaPercent,
        statusText
      },
      evidenceImages: curr?.evidenceImages || []
    };
  });

  const laserPowerData: MhcReportLaserPowerData = {
    hasPreviousBaseline: hasPreviousPower,
    comparisonNote: hasPreviousPower ? 'Compared against previous maintenance baseline session.' : 'No previous baseline recorded in session history.',
    heads: headsPowerComparison
  };

  const laserPowerSection: MhcReportSection<MhcReportLaserPowerData> = {
    code: '06',
    title: 'Laser Power',
    displayOrder: 6,
    isVisible: options?.sectionVisibilityOverrides?.['06'] ?? true,
    status: powerItems.length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: laserPowerData,
    summaryNote: laserPowerData.comparisonNote
  };

  // 07 BEAM PROFILE (WITH PREVIOUS/CURRENT COMPARISON)
  const beamRecord = session.stage02_laserProfile?.beamProfileRecord;
  const prevBeamRecord = previousSession?.stage02_laserProfile?.beamProfileRecord;
  const hasPreviousBeam = Boolean(prevBeamRecord);

  const beamHeadsComparison: MhcBeamProfileComparisonItem[] = [
    { headId: 'lh1', headName: 'Laser Head 1' },
    { headId: 'lh2', headName: 'Laser Head 2' }
  ].map(({ headId, headName }) => {
    const isHead1 = headId === 'lh1';
    // Helper to get 6A reading for Laser 1 or 7A for Laser 2
    const checkpointKey = isHead1 ? '6A' : '7A';
    const currReading = beamRecord?.readings?.[checkpointKey];
    const prevReading = prevBeamRecord?.readings?.[checkpointKey];

    const currDiameter = currReading?.measuredDiameterMm || null;
    const prevDiameter = prevReading?.measuredDiameterMm || null;
    const hasBaseline = Boolean(prevDiameter && prevDiameter > 0);

    let deltaBeamSizeMm: number | null = null;
    let deltaPercent: number | null = null;
    let statusText = 'No previous baseline';

    if (hasBaseline && currDiameter && prevDiameter) {
      deltaBeamSizeMm = currDiameter - prevDiameter;
      deltaPercent = (deltaBeamSizeMm / prevDiameter) * 100;
      const sign = deltaBeamSizeMm >= 0 ? '+' : '';
      statusText = `${sign}${deltaBeamSizeMm.toFixed(3)} mm (${sign}${deltaPercent.toFixed(1)}%)`;
    }

    const images: string[] = [];
    if (currReading?.imageDataUrl) {
      images.push(currReading.imageDataUrl);
    }

    return {
      headId,
      headName,
      specification: 'TEM00 Mode, Source Spot Size Spec',
      hasPreviousBaseline: hasBaseline,
      measurementStation: 'Standard Beam Profiler',
      current: {
        beamSizeMm: currDiameter || undefined,
        overallResult: beamRecord?.overallResult,
        notes: beamRecord?.engineerRemarks
      },
      previous: hasBaseline && prevDiameter ? {
        recordedDate: previousSession?.completedDate || previousSession?.startDate || 'Previous MHC',
        beamSizeMm: prevDiameter,
        overallResult: prevBeamRecord?.overallResult
      } : null,
      comparison: {
        deltaBeamSizeMm,
        deltaPercent,
        statusText
      },
      beamImages: images
    };
  });

  const beamProfileData: MhcReportBeamProfileData = {
    hasPreviousBaseline: hasPreviousBeam,
    comparisonNote: hasPreviousBeam ? 'Beam profile spatial distribution evaluated against previous baseline.' : 'No previous baseline available for beam profile comparison.',
    measurementStation: 'Integrated Profiler',
    heads: beamHeadsComparison
  };

  const beamProfileSection: MhcReportSection<MhcReportBeamProfileData> = {
    code: '07',
    title: 'Beam Profile',
    displayOrder: 7,
    isVisible: options?.sectionVisibilityOverrides?.['07'] ?? true,
    status: beamRecord ? 'COMPLETE' : 'NOT_COLLECTED',
    data: beamProfileData
  };

  // 08 FOCUS OPTIMIZATION [Optional Placeholder]
  const focusOptimizationData: MhcReportFocusOptimizationData = {
    status: 'NOT_COLLECTED',
    head1FocusOffsetMm: null,
    head2FocusOffsetMm: null,
    optimalFocusPointMm: null,
    notes: 'Focus optimization module skipped or optional for current service scope.'
  };

  const focusOptimizationSection: MhcReportSection<MhcReportFocusOptimizationData> = {
    code: '08',
    title: 'Focus Optimization',
    displayOrder: 8,
    isVisible: options?.sectionVisibilityOverrides?.['08'] ?? false,
    status: 'NOT_COLLECTED',
    data: focusOptimizationData
  };

  // 09 POWER OFFSET [Optional Placeholder]
  const powerOffsetData: MhcReportPowerOffsetData = {
    status: 'NOT_COLLECTED',
    head1PowerOffsetWatts: null,
    head2PowerOffsetWatts: null,
    offsetCorrectionApplied: false,
    notes: 'Power offset adjustment not required during routine check.'
  };

  const powerOffsetSection: MhcReportSection<MhcReportPowerOffsetData> = {
    code: '09',
    title: 'Power Offset',
    displayOrder: 9,
    isVisible: options?.sectionVisibilityOverrides?.['09'] ?? false,
    status: 'NOT_COLLECTED',
    data: powerOffsetData
  };

  // 10 STAGE CALIBRATION
  const stageDataMap = session.stageCalibrationData || {};
  const stage1Data = stageDataMap['stage1'];
  const stage2Data = stageDataMap['stage2'];

  const stagesList = [
    { id: 'stage1', name: 'Stage 1 Calibration', data: stage1Data },
    { id: 'stage2', name: 'Stage 2 Calibration', data: stage2Data }
  ].map(({ id, name, data }) => ({
    stageId: id,
    stageName: name,
    xMinUm: data?.xMinUm ?? null,
    xMaxUm: data?.xMaxUm ?? null,
    yMinUm: data?.yMinUm ?? null,
    yMaxUm: data?.yMaxUm ?? null,
    maxAbsXUm: data?.maxAbsXUm,
    maxAbsYUm: data?.maxAbsYUm,
    overallMaxDevUm: data?.overallMaxDevUm,
    verdict: data?.verdict === 'PASS' ? ('PASS' as const) : data?.verdict === 'OUT_OF_SPEC' ? ('OUT_OF_SPEC' as const) : ('UNANSWERED' as const),
    evidenceImage: data?.evidenceImage,
    engineerNote: data?.engineerNote
  }));

  const hasAnyStage = Boolean(stage1Data || stage2Data);
  const stageOverallVerdict = stagesList.some(s => s.verdict === 'OUT_OF_SPEC')
    ? 'OUT_OF_SPEC'
    : stagesList.every(s => s.verdict === 'PASS') && hasAnyStage
      ? 'PASS'
      : 'NOT_COLLECTED';

  const stageCalibrationData: MhcReportStageCalibrationData = {
    specToleranceUm: 2.0,
    overallVerdict: stageOverallVerdict,
    stages: stagesList
  };

  const stageCalibrationSection: MhcReportSection<MhcReportStageCalibrationData> = {
    code: '10',
    title: 'Stage Calibration',
    displayOrder: 10,
    isVisible: options?.sectionVisibilityOverrides?.['10'] ?? true,
    status: hasAnyStage ? (stageOverallVerdict === 'PASS' ? 'COMPLETE' : 'NEEDS_REVIEW') : 'NOT_COLLECTED',
    data: stageCalibrationData
  };

  // 11 AGC / SCANNER CALIBRATION
  const agcDataMap = session.agcData || {};
  const agc1Data = agcDataMap['agc1'];
  const agc2Data = agcDataMap['agc2'];

  const agcsList = [
    { id: 'agc1', name: 'AGC 1', data: agc1Data },
    { id: 'agc2', name: 'AGC 2', data: agc2Data }
  ].map(({ id, name, data }) => {
    const indices = (data?.indices || []).map(idx => ({
      indexNum: idx.indexNum,
      xUm: idx.xUm,
      yUm: idx.yUm,
      verdict: idx.verdict === 'PASS' ? ('PASS' as const) : idx.verdict === 'OUT_OF_SPEC' ? ('OUT_OF_SPEC' as const) : ('UNANSWERED' as const)
    }));

    return {
      agcId: id,
      agcName: name,
      indices,
      maxAbsXUm: data?.maxAbsXUm,
      maxAbsYUm: data?.maxAbsYUm,
      overallMaxDevUm: data?.overallMaxDevUm,
      verdict: data?.verdict === 'PASS' ? ('PASS' as const) : data?.verdict === 'OUT_OF_SPEC' ? ('OUT_OF_SPEC' as const) : ('UNANSWERED' as const),
      scannerConditionFlag: data?.scannerConditionFlag || false,
      evidenceImage: data?.evidenceImage,
      engineerNote: data?.engineerNote
    };
  });

  const hasAnyAgc = Boolean(agc1Data || agc2Data);
  const agcScannerAttention = agcsList.some(a => a.scannerConditionFlag || a.verdict === 'OUT_OF_SPEC');
  const agcOverallVerdict = agcsList.some(a => a.verdict === 'OUT_OF_SPEC')
    ? 'OUT_OF_SPEC'
    : agcsList.every(a => a.verdict === 'PASS') && hasAnyAgc
      ? 'PASS'
      : 'NOT_COLLECTED';

  const agcData: MhcReportAgcData = {
    specToleranceUm: 3.0,
    overallVerdict: agcOverallVerdict,
    scannerAttentionRequired: agcScannerAttention,
    agcs: agcsList
  };

  const agcSection: MhcReportSection<MhcReportAgcData> = {
    code: '11',
    title: 'AGC / Scanner Calibration',
    displayOrder: 11,
    isVisible: options?.sectionVisibilityOverrides?.['11'] ?? true,
    status: hasAnyAgc ? (agcOverallVerdict === 'PASS' ? 'COMPLETE' : 'NEEDS_REVIEW') : 'NOT_COLLECTED',
    data: agcData
  };

  // 12 TEMPERATURE MONITORING (CONSUMES EXISTING TEMPERATURE ENGINE RESULT)
  const tempEvData = session.temperatureEvidenceData;
  const coolingData = session.stage05_cooling;
  const hasTemp = Boolean(tempEvData && tempEvData.hasValidTemperatureAnalysis);

  const temperatureData: MhcReportTemperatureData = {
    hasValidTemperatureAnalysis: hasTemp,
    temperatureRecordTitle: tempEvData?.temperatureRecordTitle,
    temperatureLogFileName: tempEvData?.temperatureLogFileName,
    rawRecordsCount: tempEvData?.rawRecordsCount,
    stats: tempEvData?.stats,
    channelStats: tempEvData?.channelStats,
    chillerTempCelsius: coolingData?.chillerTempCelsius,
    chillerFlowLpm: coolingData?.chillerFlowLpm,
    diConductivityUs: coolingData?.diConductivityUs,
    coolingResult: coolingData?.result === 'PASS' ? 'PASS' : coolingData?.result === 'FAIL' ? 'FAIL' : 'NOT_COLLECTED',
    engineerNote: tempEvData?.engineerNote || coolingData?.notes
  };

  const temperatureSection: MhcReportSection<MhcReportTemperatureData> = {
    code: '12',
    title: 'Temperature Monitoring',
    displayOrder: 12,
    isVisible: options?.sectionVisibilityOverrides?.['12'] ?? true,
    status: hasTemp ? 'COMPLETE' : 'NOT_COLLECTED',
    data: temperatureData
  };

  // 13 LASER / PRODUCT PROFILE [Optional Placeholder]
  const laserProductProfileData: MhcReportLaserProductProfileData = {
    status: 'NOT_COLLECTED',
    profileInfo: session.stage02_laserProfile?.profileInfo || 'No custom product laser profile assigned.'
  };

  const laserProductProfileSection: MhcReportSection<MhcReportLaserProductProfileData> = {
    code: '13',
    title: 'Laser / Product Profile',
    displayOrder: 13,
    isVisible: options?.sectionVisibilityOverrides?.['13'] ?? false,
    status: 'NOT_COLLECTED',
    data: laserProductProfileData
  };

  // 14 PRODUCT VIA QUALITY [Optional Placeholder]
  const productViaQualityData: MhcReportProductViaQualityData = {
    status: 'NOT_COLLECTED',
    notes: session.stage06_productQuality?.notes || 'Product via quality analysis optional.'
  };

  const productViaQualitySection: MhcReportSection<MhcReportProductViaQualityData> = {
    code: '14',
    title: 'Product Via Quality',
    displayOrder: 14,
    isVisible: options?.sectionVisibilityOverrides?.['14'] ?? false,
    status: 'NOT_COLLECTED',
    data: productViaQualityData
  };

  // 15 FINDINGS
  const inspFindingsMap = session.inspectionFindings || {};
  const head1Insp = inspFindingsMap['lh1'] || inspFindingsMap['head1'];
  const head2Insp = inspFindingsMap['lh2'] || inspFindingsMap['head2'];

  const formattedHeadsFindings = [
    { id: 'lh1', name: 'Laser Head 1', insp: head1Insp },
    { id: 'lh2', name: 'Laser Head 2', insp: head2Insp }
  ].map(({ id, name, insp }) => ({
    headId: id,
    headName: name,
    decision: insp?.decision || ('UNANSWERED' as const),
    findingsList: (insp?.findings || []).map(f => ({
      id: f.id,
      component: f.component,
      conditions: f.conditions || [],
      actionRecommendation: f.actionRecommendation,
      engineerNote: f.engineerNote,
      evidenceImage: f.evidenceImage,
      aiGeneratedWording: f.aiGeneratedWording
    }))
  }));

  const totalFindingsCount = formattedHeadsFindings.reduce((acc, h) => acc + h.findingsList.length, 0);

  const findingsData: MhcReportFindingsData = {
    totalFindingsCount,
    heads: formattedHeadsFindings
  };

  const findingsSection: MhcReportSection<MhcReportFindingsData> = {
    code: '15',
    title: 'Findings',
    displayOrder: 15,
    isVisible: options?.sectionVisibilityOverrides?.['15'] ?? true,
    status: Object.keys(inspFindingsMap).length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: findingsData
  };

  // 16 CORRECTIVE ACTIONS
  const derivedActions: MhcReportCorrectiveActionsData['actionsList'] = [];

  formattedHeadsFindings.forEach(h => {
    h.findingsList.forEach(f => {
      derivedActions.push({
        id: `ACT-${f.id}`,
        source: h.headName,
        findingComponent: f.component,
        actionText: f.actionRecommendation,
        status: 'RECOMMENDED'
      });
    });
  });

  const correctiveActionsData: MhcReportCorrectiveActionsData = {
    actionsList: derivedActions,
    generalCorrectiveActionsText: session.stage08_engineerRemarks?.correctiveActions || 'Standard preventive maintenance procedures performed.'
  };

  const correctiveActionsSection: MhcReportSection<MhcReportCorrectiveActionsData> = {
    code: '16',
    title: 'Corrective Actions',
    displayOrder: 16,
    isVisible: options?.sectionVisibilityOverrides?.['16'] ?? true,
    status: derivedActions.length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: correctiveActionsData
  };

  // 17 SPARE PARTS / RECOMMENDATIONS
  const sparePartsList = (session.stage07_spareParts || []).map(sp => ({
    id: sp.id,
    partName: sp.partName,
    partNumber: sp.partNumber,
    category: sp.category,
    quantity: sp.quantity,
    reason: sp.reason,
    action: sp.action,
    costIndicator: sp.costIndicator,
    notes: sp.notes
  }));

  const sparePartsData: MhcReportSparePartsData = {
    spareParts: sparePartsList,
    recommendations: derivedActions.map(a => a.actionText),
    generalFindingsNote: session.stage08_engineerRemarks?.generalFindings
  };

  const sparePartsSection: MhcReportSection<MhcReportSparePartsData> = {
    code: '17',
    title: 'Spare Parts / Recommendations',
    displayOrder: 17,
    isVisible: options?.sectionVisibilityOverrides?.['17'] ?? true,
    status: sparePartsList.length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: sparePartsData
  };

  // 18 EVIDENCE (REFERENCES EXISTING EVIDENCE/IMAGE RECORDS)
  const evidenceList = (tempEvData?.evidences || []).map(ev => ({
    id: ev.id,
    category: ev.category || 'General',
    title: ev.title || 'Evidence Image',
    sourceSection: ev.category || 'Maintenance Audit',
    imageDataUrl: ev.imageDataUrl,
    notes: ev.notes,
    createdAt: ev.createdAt || generatedAt
  }));

  const evidenceData: MhcReportEvidenceData = {
    totalEvidenceItems: evidenceList.length,
    items: evidenceList
  };

  const evidenceSection: MhcReportSection<MhcReportEvidenceData> = {
    code: '18',
    title: 'Evidence',
    displayOrder: 18,
    isVisible: options?.sectionVisibilityOverrides?.['18'] ?? true,
    status: evidenceList.length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: evidenceData,
    evidenceReferences: evidenceList.map(e => ({
      id: e.id,
      category: e.category,
      title: e.title,
      url: e.imageDataUrl,
      notes: e.notes
    }))
  };

  // 19 BUYOFF
  const remarksData = session.stage08_engineerRemarks;

  const buyoffData: MhcReportBuyoffData = {
    productionReleaseVerdict: remarksData?.productionReleaseVerdict || (sessionAudit.isReadyForReport ? 'APPROVED' : 'PENDING'),
    engineerSignoff: {
      name: coverData.engineerName,
      title: coverData.engineerTitle,
      date: coverData.date
    },
    customerSignoff: {
      name: 'Customer Representative',
      title: 'Plant Manager / Engineer',
      date: coverData.date
    },
    founderBranding: coverData.founderBranding
  };

  const buyoffSection: MhcReportSection<MhcReportBuyoffData> = {
    code: '19',
    title: 'Buyoff & Approvals',
    displayOrder: 19,
    isVisible: options?.sectionVisibilityOverrides?.['19'] ?? true,
    status: remarksData?.productionReleaseVerdict ? 'COMPLETE' : 'NEEDS_REVIEW',
    data: buyoffData
  };

  // 04 EXECUTIVE SUMMARY (DERIVED FROM AUDIT & ALL SECTIONS)
  const keyFindingsList: string[] = [];
  if (totalFindingsCount > 0) {
    keyFindingsList.push(`${totalFindingsCount} inspection finding(s) recorded during optical audit.`);
  }
  if (stageOverallVerdict === 'OUT_OF_SPEC') {
    keyFindingsList.push('Stage Calibration detected displacement exceeding ±2.0 µm specification limit.');
  }
  if (agcScannerAttention) {
    keyFindingsList.push('AGC / Scanner Calibration flagged items requiring scanner attention (exceeding ±3.0 µm limit).');
  }
  if (keyFindingsList.length === 0) {
    keyFindingsList.push('All core laser power, optical beam profile, stage alignment, and scanner parameters meet specification standards.');
  }

  const executiveSummaryData: MhcReportExecutiveSummaryData = {
    overallStatus: sessionAudit.isReadyForReport
      ? (keyFindingsList.length === 1 && totalFindingsCount === 0 ? 'PASS' : 'CONDITIONAL_PASS')
      : (sessionAudit.blockers.length > 0 ? 'ACTION_REQUIRED' : 'FAIL'),
    readinessScore: sessionAudit.readinessScore,
    summaryText: `Routine Maintenance & Health Check (MHC) completed for ${coverData.machineName} (${coverData.machineSerialNumber}) at ${coverData.customerName} - ${coverData.plantName}. Service score is ${sessionAudit.readinessScore}% with ${sessionAudit.blockers.length} active blocker(s).`,
    keyFindings: keyFindingsList,
    majorPassFailResults: [
      { component: 'Laser Power (Head 1 & 2)', verdict: laserPowerData.heads.every(h => h.current.verdict === 'PASS') ? 'PASS' : 'WARNING', note: '15.0W ±10%' },
      { component: 'Beam Profile / Mode', verdict: beamProfileSection.status === 'COMPLETE' ? 'PASS' : 'WARNING', note: 'TEM00 Gaussian Mode' },
      { component: 'Stage Calibration', verdict: stageOverallVerdict === 'PASS' ? 'PASS' : stageOverallVerdict === 'OUT_OF_SPEC' ? 'FAIL' : 'NOT_COLLECTED', note: '±2.0 µm Tolerance' },
      { component: 'AGC / Scanner Calibration', verdict: agcOverallVerdict === 'PASS' ? 'PASS' : agcOverallVerdict === 'OUT_OF_SPEC' ? 'FAIL' : 'NOT_COLLECTED', note: '±3.0 µm Tolerance' },
      { component: 'Temperature & Cooling', verdict: temperatureData.coolingResult === 'PASS' ? 'PASS' : 'WARNING', note: 'Thermal stability telemetry' }
    ],
    replacementRecommendations: sparePartsList.map(s => `${s.partName} (${s.partNumber}) - ${s.action}`),
    importantObservations: sessionAudit.blockers.map(b => b.reason)
  };

  const executiveSummarySection: MhcReportSection<MhcReportExecutiveSummaryData> = {
    code: '04',
    title: 'Executive Summary',
    displayOrder: 4,
    isVisible: options?.sectionVisibilityOverrides?.['04'] ?? true,
    status: 'COMPLETE',
    data: executiveSummaryData,
    findings: keyFindingsList
  };

  // BUILD SECTION MAP
  const sectionsMap: MhcReportSectionMap = {
    '01': coverSection,
    '02': null as any, // assigned below
    '03': machineInfoSection,
    '04': executiveSummarySection,
    '05': laserHoursSection,
    '06': laserPowerSection,
    '07': beamProfileSection,
    '08': focusOptimizationSection,
    '09': powerOffsetSection,
    '10': stageCalibrationSection,
    '11': agcSection,
    '12': temperatureSection,
    '13': laserProductProfileSection,
    '14': productViaQualitySection,
    '15': findingsSection,
    '16': correctiveActionsSection,
    '17': sparePartsSection,
    '18': evidenceSection,
    '19': buyoffSection
  };

  // GENERATE INDEX (02)
  const orderedSectionsList: MhcReportSection[] = [
    coverSection,
    machineInfoSection,
    executiveSummarySection,
    laserHoursSection,
    laserPowerSection,
    beamProfileSection,
    focusOptimizationSection,
    powerOffsetSection,
    stageCalibrationSection,
    agcSection,
    temperatureSection,
    laserProductProfileSection,
    productViaQualitySection,
    findingsSection,
    correctiveActionsSection,
    sparePartsSection,
    evidenceSection,
    buyoffSection
  ];

  const indexEntries: MhcReportIndexEntry[] = orderedSectionsList.map(sec => ({
    code: sec.code,
    title: sec.title,
    displayOrder: sec.displayOrder,
    category: getSectionCategory(sec.code),
    pageNumber: null, // Assigned later by renderer
    isVisible: sec.isVisible,
    status: sec.status
  }));

  const indexData: MhcReportIndexData = { entries: indexEntries };

  const indexSection: MhcReportSection<MhcReportIndexData> = {
    code: '02',
    title: 'Table of Contents / Index',
    displayOrder: 2,
    isVisible: options?.sectionVisibilityOverrides?.['02'] ?? true,
    status: 'COMPLETE',
    data: indexData
  };

  sectionsMap['02'] = indexSection;

  const allOrderedSections: MhcReportSection[] = [
    coverSection,
    indexSection,
    machineInfoSection,
    executiveSummarySection,
    laserHoursSection,
    laserPowerSection,
    beamProfileSection,
    focusOptimizationSection,
    powerOffsetSection,
    stageCalibrationSection,
    agcSection,
    temperatureSection,
    laserProductProfileSection,
    productViaQualitySection,
    findingsSection,
    correctiveActionsSection,
    sparePartsSection,
    evidenceSection,
    buyoffSection
  ];

  return {
    reportId,
    generatedAt,
    schemaVersion: '1.0.0',
    sessionId: session.id || 'UNSAVED',
    machineId: machineInfoData.machineId,
    metadata: {
      reportNumber,
      title: coverData.title,
      generatedAt,
      sessionId: session.id || 'UNSAVED',
      machineId: machineInfoData.machineId,
      machineModel: coverData.machineModel,
      machineSerialNumber: coverData.machineSerialNumber,
      customerName: coverData.customerName,
      plantName: coverData.plantName,
      engineerName: coverData.engineerName,
      hasPreviousBaseline: hasPreviousPower || hasPreviousBeam,
      previousSessionId: previousSession?.id,
      previousSessionDate: previousSession?.completedDate || previousSession?.startDate,
      totalSectionsCount: allOrderedSections.length
    },
    indexEntries,
    sections: sectionsMap,
    orderedSections: allOrderedSections
  };
}

function getSectionCategory(code: MhcReportSectionCode): string {
  switch (code) {
    case '01':
    case '02':
    case '03':
    case '04':
      return 'Overview';
    case '05':
    case '06':
    case '07':
    case '08':
    case '09':
      return 'Laser Diagnostics';
    case '10':
    case '11':
      return 'Motion & Scanners';
    case '12':
      return 'Environment & Cooling';
    case '13':
    case '14':
      return 'Product Process';
    case '15':
    case '16':
    case '17':
      return 'Inspection & Findings';
    case '18':
      return 'Evidence';
    case '19':
      return 'Signoff';
    default:
      return 'General';
  }
}
