export interface Workstation {
  id: string;
  name: string;
  processName: string;
  cycleTimeSec: number; // Cycle time per operator or station in seconds
  operatorsCount: number; // Number of operators stationed
  machineTimeSec?: number; // Machine processing portion
  manualTimeSec?: number; // Manual labor portion
  notes?: string;
}

export interface IndirectLaborItem {
  id: string;
  role: string;
  ratioType: 'fixed_per_line' | 'ratio_to_dl';
  countPerLine: number; // or ratio value
  description: string;
}

export interface LineBalancingResult {
  totalWorkContentSec: number;
  bottleneckStation: Workstation | null;
  bottleneckCTSec: number;
  taktTimeSec: number;
  lineBalanceEfficiencyPct: number;
  balanceLossPct: number;
  smoothnessIndex: number;
  theoreticalMinOperators: number;
  actualDirectOperators: number;
  lineCapacityUPH: number;
  plannedOutputShift: number;
  dailyOutputTheoretical: number;
  actualUPPH: number;
}

export interface SpeedLineResult {
  lineSpeedMPerMin: number;
  lineSpeedCmPerSec: number;
  lineSpeedMmPerSec: number;
  pitchDistanceM: number;
  effectiveCycleTimeSec: number;
  totalConveyorLengthM: number;
  transitTimeMin: number;
  transitTimeFormatted: string;
  wipOnConveyorUnits: number;
  outputPerHour: number;
}

export interface ManpowerRequestResult {
  directLaborBase: number;
  pfdAllowancePct: number;
  pfdOperatorsAdded: number;
  absenteeismPct: number;
  absenteeismOperatorsAdded: number;
  directLaborTotalPerShift: number;
  indirectLaborPerShift: number;
  totalLaborPerShift: number;
  shiftsCount: number;
  totalPlantHeadcount: number;
  estimatedLaborCostPerDay?: number;
}

export interface TopDownCalculationInput {
  targetOutputDaily: number;
  workingHoursDaily: number; // e.g. 10.5 hr
  targetUPPH: number; // e.g. 0.20 or 25.0
  solveFor: 'manpower' | 'upph' | 'output' | 'hours';
  shiftsCount: number;
  regularHoursPerShift: number;
  overtimeHoursPerShift: number;
  scrapRatePct: number; // e.g. 2%
  oeePct: number; // e.g. 85%
}

export interface SpeedLineInput {
  pitchDistanceM: number; // Distance between product centers / jigs (meters)
  cycleTimeSec: number; // Cycle time or Takt time in seconds
  conveyorLengthM: number; // Total conveyor active length
  targetUPH?: number;
}

export interface ProjectPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  topDown: TopDownCalculationInput;
  stations: Workstation[];
  speedLine: SpeedLineInput;
  indirectRoles: IndirectLaborItem[];
  allowancePFDPct: number;
  absenteeismPct: number;
  hourlyWageThb: number;
}
