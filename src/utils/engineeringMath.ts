import { Workstation, LineBalancingResult, SpeedLineResult, ManpowerRequestResult, IndirectLaborItem } from '../types/engineering';

/**
 * Top-Down Manpower Calculation (as shown in user's reference image):
 * Required MP = Daily Output / (Working Hours * UPPH)
 */
export function calculateTopDownManpower(
  dailyOutput: number,
  workingHours: number,
  upph: number
) {
  if (workingHours <= 0 || upph <= 0) {
    return {
      outputPerPersonPerShift: 0,
      requiredMPExact: 0,
      requiredMPRounded: 0,
      formulaSteps: [
        'Required MP = Daily Output / (Working Hours × UPPH)',
        'ข้อมูลไม่ครบถ้วน (Working Hours หรือ UPPH ต้องมากกว่า 0)'
      ]
    };
  }

  const outputPerPersonPerShift = workingHours * upph;
  const requiredMPExact = dailyOutput / outputPerPersonPerShift;
  const requiredMPRounded = Math.ceil(requiredMPExact);

  const formulaSteps = [
    'Required MP = Daily Output / (Working Hours × UPPH)',
    `Required MP = ${dailyOutput.toLocaleString('th-TH')} / (${workingHours.toFixed(1)} × ${upph.toFixed(2)})`,
    `= ${dailyOutput.toLocaleString('th-TH')} / ${outputPerPersonPerShift.toFixed(2)}`,
    `= ${requiredMPExact.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} คน (ปัดเศษขึ้นเป็น ${requiredMPRounded.toLocaleString('th-TH')} คน)`
  ];

  return {
    outputPerPersonPerShift,
    requiredMPExact,
    requiredMPRounded,
    formulaSteps
  };
}

/**
 * Top-Down UPPH Calculation:
 * UPPH = Daily Output / (Working Hours * Manpower)
 */
export function calculateTopDownUPPH(
  dailyOutput: number,
  workingHours: number,
  manpower: number
) {
  if (workingHours <= 0 || manpower <= 0) return 0;
  return dailyOutput / (workingHours * manpower);
}

/**
 * Top-Down Daily Output Calculation:
 * Daily Output = Manpower * Working Hours * UPPH
 */
export function calculateTopDownOutput(
  manpower: number,
  workingHours: number,
  upph: number
) {
  return manpower * workingHours * upph;
}

/**
 * Bottom-Up Workstation & Line Balancing Calculations
 */
export function calculateLineBalancing(
  stations: Workstation[],
  workingHoursPerShift: number,
  plannedShiftTarget: number
): LineBalancingResult {
  if (!stations || stations.length === 0) {
    return {
      totalWorkContentSec: 0,
      bottleneckStation: null,
      bottleneckCTSec: 0,
      taktTimeSec: 0,
      lineBalanceEfficiencyPct: 0,
      balanceLossPct: 0,
      smoothnessIndex: 0,
      theoreticalMinOperators: 0,
      actualDirectOperators: 0,
      lineCapacityUPH: 0,
      plannedOutputShift: 0,
      dailyOutputTheoretical: 0,
      actualUPPH: 0
    };
  }

  // Total work content (sum of single station CTs)
  const totalWorkContentSec = stations.reduce((sum, s) => sum + s.cycleTimeSec, 0);

  // Total actual operators
  const actualDirectOperators = stations.reduce((sum, s) => sum + Math.max(1, s.operatorsCount), 0);

  // Effective cycle time per station taking operators into account: CT / operators
  let bottleneckCTSec = 0;
  let bottleneckStation: Workstation | null = null;

  stations.forEach((s) => {
    const effectiveCT = s.cycleTimeSec / Math.max(1, s.operatorsCount);
    if (effectiveCT > bottleneckCTSec) {
      bottleneckCTSec = effectiveCT;
      bottleneckStation = s;
    }
  });

  // Takt Time (seconds per unit)
  const netWorkingSeconds = workingHoursPerShift * 3600;
  const taktTimeSec = plannedShiftTarget > 0 ? netWorkingSeconds / plannedShiftTarget : 0;

  // Theoretical Minimum Operators = Total Work Content / Takt Time
  const theoreticalMinOperators = taktTimeSec > 0 ? Math.ceil(totalWorkContentSec / taktTimeSec) : 0;

  // Line Balancing Efficiency (LBE / LBR):
  // Formula: Sum(CT) / (Number of Stations * Bottleneck CT) * 100%
  // Or normalized by operator count: Sum(CT) / (Actual Operators * Bottleneck CT) * 100%
  const lineBalanceEfficiencyPct =
    actualDirectOperators > 0 && bottleneckCTSec > 0
      ? (totalWorkContentSec / (actualDirectOperators * bottleneckCTSec)) * 100
      : 0;

  const balanceLossPct = Math.max(0, 100 - lineBalanceEfficiencyPct);

  // Smoothness Index (SI): sqrt( sum( (CT_bottleneck - CT_effective_i)^2 ) )
  let sumSquaredDiff = 0;
  stations.forEach((s) => {
    const effectiveCT = s.cycleTimeSec / Math.max(1, s.operatorsCount);
    sumSquaredDiff += Math.pow(bottleneckCTSec - effectiveCT, 2);
  });
  const smoothnessIndex = Math.sqrt(sumSquaredDiff);

  // Line Capacity (UPH) based on Bottleneck:
  // Pure 3600 / Bottleneck CT
  const lineCapacityUPH = bottleneckCTSec > 0 ? 3600 / bottleneckCTSec : 0;

  // Planned Shift Output based on Bottleneck and Net Working Hours
  const plannedOutputShift = Math.floor(lineCapacityUPH * workingHoursPerShift);

  // Daily theoretical output (assuming 1 shift reference)
  const dailyOutputTheoretical = plannedOutputShift;

  // Actual UPPH = UPH / Actual Direct Operators
  const actualUPPH = actualDirectOperators > 0 ? lineCapacityUPH / actualDirectOperators : 0;

  return {
    totalWorkContentSec,
    bottleneckStation,
    bottleneckCTSec,
    taktTimeSec,
    lineBalanceEfficiencyPct: Math.min(100, Math.max(0, lineBalanceEfficiencyPct)),
    balanceLossPct: Math.min(100, Math.max(0, balanceLossPct)),
    smoothnessIndex,
    theoreticalMinOperators,
    actualDirectOperators,
    lineCapacityUPH,
    plannedOutputShift,
    dailyOutputTheoretical,
    actualUPPH
  };
}

/**
 * Speed Line (Conveyor Line Kinematics):
 * Line Speed V = Pitch Distance / Cycle Time (or Takt Time)
 */
export function calculateSpeedLine(input: {
  pitchDistanceM: number;
  cycleTimeSec: number;
  conveyorLengthM: number;
}): SpeedLineResult {
  const { pitchDistanceM, cycleTimeSec, conveyorLengthM } = input;

  if (cycleTimeSec <= 0 || pitchDistanceM <= 0) {
    return {
      lineSpeedMPerMin: 0,
      lineSpeedCmPerSec: 0,
      lineSpeedMmPerSec: 0,
      pitchDistanceM,
      effectiveCycleTimeSec: cycleTimeSec,
      totalConveyorLengthM: conveyorLengthM,
      transitTimeMin: 0,
      transitTimeFormatted: '00:00',
      wipOnConveyorUnits: 0,
      outputPerHour: 0
    };
  }

  // Line Speed in m/s = pitch / CT
  const speedMPerSec = pitchDistanceM / cycleTimeSec;
  const lineSpeedMPerMin = speedMPerSec * 60;
  const lineSpeedCmPerSec = speedMPerSec * 100;
  const lineSpeedMmPerSec = speedMPerSec * 1000;

  // Transit time along entire conveyor = Length / Speed
  const transitTimeSec = speedMPerSec > 0 ? conveyorLengthM / speedMPerSec : 0;
  const transitTimeMin = transitTimeSec / 60;
  const mins = Math.floor(transitTimeMin);
  const secs = Math.round(transitTimeSec % 60);
  const transitTimeFormatted = `${mins} นาที ${secs} วินาที`;

  // Pieces on conveyor line = Length / Pitch
  const wipOnConveyorUnits = pitchDistanceM > 0 ? Math.floor(conveyorLengthM / pitchDistanceM) : 0;

  // Output rate per hour
  const outputPerHour = 3600 / cycleTimeSec;

  return {
    lineSpeedMPerMin,
    lineSpeedCmPerSec,
    lineSpeedMmPerSec,
    pitchDistanceM,
    effectiveCycleTimeSec: cycleTimeSec,
    totalConveyorLengthM: conveyorLengthM,
    transitTimeMin,
    transitTimeFormatted,
    wipOnConveyorUnits,
    outputPerHour
  };
}

/**
 * Complete Manpower Request Calculation with Allowances & Indirect Roles
 */
export function calculateManpowerRequest(
  directLaborBase: number,
  pfdAllowancePct: number, // e.g. 10%
  absenteeismPct: number, // e.g. 5%
  indirectRoles: IndirectLaborItem[],
  shiftsCount: number = 1,
  hourlyWageThb: number = 0,
  hoursPerShift: number = 8
): ManpowerRequestResult {
  // Allowance operator additions:
  // PF&D (Personal, Fatigue & Delay) allowance: DL * (pfd% / 100)
  const pfdOperatorsAdded = (directLaborBase * pfdAllowancePct) / 100;
  const dlWithPFD = directLaborBase + pfdOperatorsAdded;

  // Absenteeism / Relief buffer: dlWithPFD * (absenteeism% / 100)
  const absenteeismOperatorsAdded = (dlWithPFD * absenteeismPct) / 100;

  // Total Direct Labor per shift (rounded up for physical heads)
  const directLaborTotalPerShift = Math.ceil(dlWithPFD + absenteeismOperatorsAdded);

  // Indirect labor calculation
  let indirectLaborPerShift = 0;
  indirectRoles.forEach((role) => {
    if (role.ratioType === 'fixed_per_line') {
      indirectLaborPerShift += role.countPerLine;
    } else {
      // ratio to DL
      indirectLaborPerShift += Math.ceil((directLaborBase * role.countPerLine) / 100);
    }
  });

  const totalLaborPerShift = directLaborTotalPerShift + indirectLaborPerShift;
  const totalPlantHeadcount = totalLaborPerShift * shiftsCount;

  const estimatedLaborCostPerDay =
    hourlyWageThb > 0 ? totalPlantHeadcount * hoursPerShift * hourlyWageThb : undefined;

  return {
    directLaborBase,
    pfdAllowancePct,
    pfdOperatorsAdded,
    absenteeismPct,
    absenteeismOperatorsAdded,
    directLaborTotalPerShift,
    indirectLaborPerShift,
    totalLaborPerShift,
    shiftsCount,
    totalPlantHeadcount,
    estimatedLaborCostPerDay
  };
}

/**
 * Format helper for numbers
 */
export function formatNum(val: number, decimals: number = 2): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return val.toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
