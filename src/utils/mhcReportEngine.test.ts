import { describe, it, expect } from 'vitest';
import { buildMhcReportDocument } from './mhcReportEngine';
import { MHCSession } from '../types';

describe('mhcReportEngine', () => {
  const createDummySession = (id: string): MHCSession => ({
    id,
    machineId: 'ESI-5330',
    machineModel: 'ESI 5330 Flex',
    machineSerialNumber: 'SN-98765',
    machineName: 'Flex Drill 1',
    customerId: 'CUST-001',
    customerName: 'Acme PCB Corp',
    plantName: 'Plant 2 - Penang',
    engineerName: 'Jane Doe',
    startDate: '2026-08-10',
    startTime: '09:00',
    lastUpdated: '2026-08-10T12:00:00Z',
    completionStatus: 'COMPLETED',
    currentSection: 1,
    sectionStatuses: {},
    stage01_laserHours: [
      {
        laserId: 'lh1',
        laserIdentifier: 'Laser Head 1',
        recordedLaserHour: 12500,
        readingDate: '2026-08-10',
        readingTime: '09:15',
        calculatedCurrentHour: 12500,
        warningThreshold: 18000,
        criticalThreshold: 20000,
        runtimeStatus: 'NORMAL',
        isVerified: true,
        verifiedHour: 12500
      },
      {
        laserId: 'lh2',
        laserIdentifier: 'Laser Head 2',
        recordedLaserHour: 11200,
        readingDate: '2026-08-10',
        readingTime: '09:15',
        calculatedCurrentHour: 11200,
        warningThreshold: 18000,
        criticalThreshold: 20000,
        runtimeStatus: 'NORMAL',
        isVerified: true,
        verifiedHour: 11200
      }
    ],
    stage02_laserProfile: {
      laserId: 'lh1',
      productName: 'Flex Rigid Standard',
      recipeProgram: 'REC-01',
      profileInfo: 'Standard TopHat profile',
      measurementInfo: 'Station 1',
      supportingEvidence: 'Profile OK',
      images: [],
      beamProfileRecord: {
        id: 'BPR-1',
        date: '2026-08-10',
        overallResult: 'PASS',
        readings: {
          '6A': { checkpointId: '6A', measuredDiameterMm: 3.52, pass: true },
          '7A': { checkpointId: '7A', measuredDiameterMm: 3.48, pass: true }
        } as any
      }
    },
    stage03_laserPower: [
      {
        laserId: 'lh1',
        laserIdentifier: 'Laser Head 1',
        ratedPowerWatts: 15.0,
        referenceValueWatts: 15.0,
        beforeValueWatts: 14.8,
        afterValueWatts: 15.1,
        stabilityPercent: 0.8,
        result: 'PASS',
        notes: 'Head 1 Power stable',
        evidenceImages: ['data:image/png;base64,sample1']
      },
      {
        laserId: 'lh2',
        laserIdentifier: 'Laser Head 2',
        ratedPowerWatts: 15.0,
        referenceValueWatts: 15.0,
        beforeValueWatts: 14.6,
        afterValueWatts: 14.9,
        stabilityPercent: 0.9,
        result: 'PASS',
        notes: 'Head 2 Power stable',
        evidenceImages: ['data:image/png;base64,sample2']
      }
    ],
    stage04_opticsBeam: {
      cleanlinessScore: 95,
      beamWaistMm: 2.0,
      focusOffsetMm: 0,
      symmetryRatio: 0.98,
      m2Value: 1.1,
      beforeCondition: 'Clean',
      afterCondition: 'Clean',
      inspectionResult: 'PASS',
      images: [],
      notes: 'Optics pristine'
    },
    stage05_cooling: {
      chillerTempCelsius: 20.1,
      chillerFlowLpm: 4.2,
      diConductivityUs: 0.8,
      coolingCondition: 'Normal',
      thermalCondition: 'Stable',
      beforeCondition: 'OK',
      afterCondition: 'OK',
      result: 'PASS',
      notes: 'Cooling optimal'
    },
    stage06_productQuality: {
      sampleId: 'SMP-100',
      viaDiameterUm: 50,
      viaShape: 'Circular',
      viaOffsetUm: 0.5,
      padQuality: 'Clean',
      visualVerification: 'Verified',
      beforeInspectionNotes: '',
      afterInspectionNotes: '',
      beforeImages: [],
      afterImages: [],
      result: 'PASS',
      notes: 'Quality pass'
    },
    stage07_spareParts: [
      {
        id: 'SP-1',
        partName: 'Air Filter Element',
        partNumber: 'ESI-FLT-01',
        category: 'Filters',
        quantity: 1,
        reason: 'Routine annual replacement',
        action: 'REPLACED',
        costIndicator: 'CUSTOMER_COST',
        notes: 'Replaced during PM'
      }
    ],
    stage08_engineerRemarks: {
      generalFindings: 'System in excellent operating condition.',
      observedIssues: 'None',
      correctiveActions: 'Replaced air filter',
      recommendations: 'Continue quarterly PM schedule',
      followUpRequired: false,
      productionReleaseVerdict: 'APPROVED'
    },
    stageCalibrationData: {
      stage1: {
        stageId: 'stage1',
        stageName: 'Stage 1',
        xMinUm: -0.8,
        xMaxUm: 0.9,
        yMinUm: -1.0,
        yMaxUm: 1.1,
        maxAbsXUm: 0.9,
        maxAbsYUm: 1.1,
        overallMaxDevUm: 1.1,
        specToleranceUm: 2.0,
        verdict: 'PASS',
        status: 'COMPLETED'
      },
      stage2: {
        stageId: 'stage2',
        stageName: 'Stage 2',
        xMinUm: -0.5,
        xMaxUm: 0.6,
        yMinUm: -0.7,
        yMaxUm: 0.8,
        maxAbsXUm: 0.6,
        maxAbsYUm: 0.8,
        overallMaxDevUm: 0.8,
        specToleranceUm: 2.0,
        verdict: 'PASS',
        status: 'COMPLETED'
      }
    },
    agcData: {
      agc1: {
        agcId: 'agc1',
        agcName: 'AGC 1',
        indices: [],
        overallMaxDevUm: 1.2,
        specToleranceUm: 3.0,
        verdict: 'PASS',
        status: 'COMPLETED'
      },
      agc2: {
        agcId: 'agc2',
        agcName: 'AGC 2',
        indices: [],
        overallMaxDevUm: 1.4,
        specToleranceUm: 3.0,
        verdict: 'PASS',
        status: 'COMPLETED'
      }
    },
    temperatureEvidenceData: {
      hasValidTemperatureAnalysis: true,
      temperatureRecordTitle: 'Thermal Run 1',
      stats: { min: 19.8, max: 20.4, avg: 20.1, range: 0.6, points: 60 },
      evidences: [
        {
          id: 'EV-1',
          category: 'temperature_result',
          title: 'Thermal Chart',
          imageDataUrl: 'data:image/png;base64,chart',
          createdAt: '2026-08-10T10:00:00Z'
        }
      ]
    }
  });

  it('should transform an MHCSession into a normalized MhcReportDocument without mutation', () => {
    const session = createDummySession('SESS-1001');
    const sessionCopy = JSON.parse(JSON.stringify(session));

    const doc = buildMhcReportDocument(session);

    // Verify immutability
    expect(session).toEqual(sessionCopy);

    // Verify basic structure
    expect(doc.schemaVersion).toBe('1.0.0');
    expect(doc.sessionId).toBe('SESS-1001');
    expect(doc.machineId).toBe('ESI-5330');
    expect(doc.orderedSections.length).toBe(19);
    expect(doc.indexEntries.length).toBe(18); // Index excludes cover or includes entries

    // Verify cover
    expect(doc.sections['01'].data.customerName).toBe('Acme PCB Corp');
    expect(doc.sections['01'].data.machineSerialNumber).toBe('SN-98765');

    // Verify Laser Power without baseline
    const powerSec = doc.sections['06'].data;
    expect(powerSec.hasPreviousBaseline).toBe(false);
    expect(powerSec.heads[0].comparison.statusText).toBe('No previous baseline');
    expect(powerSec.heads[0].current.afterValueWatts).toBe(15.1);

    // Verify Laser Hours
    const hoursSec = doc.sections['05'].data;
    expect(hoursSec.laserHours.length).toBe(2);
    expect(hoursSec.laserHours[0].verifiedHour).toBe(12500);

    // Verify optional sections are represented safely
    expect(doc.sections['08'].status).toBe('NOT_COLLECTED');
    expect(doc.sections['09'].status).toBe('NOT_COLLECTED');
    expect(doc.sections['13'].status).toBe('NOT_COLLECTED');
    expect(doc.sections['14'].status).toBe('NOT_COLLECTED');
  });

  it('should calculate previous/current comparison correctly when previousSession exists', () => {
    const currentSession = createDummySession('SESS-CURR');
    const previousSession = createDummySession('SESS-PREV');

    // Modify previous power and beam
    previousSession.stage03_laserPower[0].afterValueWatts = 15.5; // Head 1 previously 15.5 W, now 15.1 W -> -0.4W (-2.6%)
    previousSession.stage03_laserPower[1].afterValueWatts = 15.0; // Head 2 previously 15.0 W, now 14.9 W -> -0.1W (-0.7%)

    previousSession.stage02_laserProfile.beamProfileRecord!.readings['6A'].measuredDiameterMm = 3.60; // Head 1 previously 3.60mm, now 3.52mm -> -0.080mm (-2.2%)

    const doc = buildMhcReportDocument(currentSession, previousSession);

    // Check power comparison
    const powerHead1 = doc.sections['06'].data.heads[0];
    expect(powerHead1.hasPreviousBaseline).toBe(true);
    expect(powerHead1.comparison.deltaWatts).toBeCloseTo(-0.4, 2);
    expect(powerHead1.comparison.statusText).toContain('-0.40 W');

    // Check beam comparison
    const beamHead1 = doc.sections['07'].data.heads[0];
    expect(beamHead1.hasPreviousBaseline).toBe(true);
    expect(beamHead1.comparison.deltaBeamSizeMm).toBeCloseTo(-0.08, 3);
    expect(beamHead1.comparison.statusText).toContain('-0.080 mm');
  });
});
