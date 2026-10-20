import { ProjectPreset } from '../types/engineering';

export const DEFAULT_PRESETS: ProjectPreset[] = [
  {
    id: 'automotive_assembly_user_case',
    name: 'ตัวอย่างจากรูป: สายการประกอบรถยนต์ / ชิ้นส่วนยานยนต์ (Automotive Heavy Assembly)',
    category: 'Automotive & Heavy Industry',
    description: 'จำลองกรณีศึกษาตามภาพแนบของผู้ใช้งาน: เป้าหมาย 5,600 ชิ้น/วัน, เวลาทำงาน 10.5 ชม./วัน, UPPH 0.20 (Complex Sub-assembly)',
    topDown: {
      targetOutputDaily: 5600,
      workingHoursDaily: 10.5,
      targetUPPH: 0.20,
      solveFor: 'manpower',
      shiftsCount: 1,
      regularHoursPerShift: 8.0,
      overtimeHoursPerShift: 2.5,
      scrapRatePct: 0.8,
      oeePct: 88.0
    },
    stations: [
      { id: 'st-1', name: 'ST-01', processName: 'Frame Loading & Base Welding', cycleTimeSec: 180, operatorsCount: 2, notes: 'Loading sub-chassis' },
      { id: 'st-2', name: 'ST-02', processName: 'Suspension & Axle Assembly', cycleTimeSec: 210, operatorsCount: 2, notes: 'Hydraulic torque' },
      { id: 'st-3', name: 'ST-03', processName: 'Engine / Powerpack Dropping', cycleTimeSec: 240, operatorsCount: 3, notes: 'Crane assist mounting' },
      { id: 'st-4', name: 'ST-04', processName: 'Wiring Harness & ECU Looming', cycleTimeSec: 220, operatorsCount: 2, notes: 'Multi-connector route' },
      { id: 'st-5', name: 'ST-05', processName: 'Brake Line & Fluid Fill', cycleTimeSec: 195, operatorsCount: 2, notes: 'Vacuum leak check' },
      { id: 'st-6', name: 'ST-06', processName: 'Body Panel Fitment & Torquing', cycleTimeSec: 235, operatorsCount: 3, notes: 'Gap & flush inspection' },
      { id: 'st-7', name: 'ST-07', processName: 'Interior Trim & Dash Module', cycleTimeSec: 215, operatorsCount: 2, notes: 'Cockpit module lift' },
      { id: 'st-8', name: 'ST-08', processName: 'Final End-of-Line Dynamic Test', cycleTimeSec: 200, operatorsCount: 2, notes: 'Dyno roll & brake test' }
    ],
    speedLine: {
      pitchDistanceM: 5.5,
      cycleTimeSec: 80,
      conveyorLengthM: 180
    },
    indirectRoles: [
      { id: 'ir-1', role: 'Line Leader / Group Supervisor', ratioType: 'fixed_per_line', countPerLine: 4, description: 'ควบคุมหน้างานและแก้ปัญหาขัดข้อง' },
      { id: 'ir-2', role: 'QC / Quality Gate Inspector', ratioType: 'fixed_per_line', countPerLine: 6, description: 'ตรวจสอบชิ้นงานตาม Quality Standards' },
      { id: 'ir-3', role: 'Material Handler (Water Spider)', ratioType: 'fixed_per_line', countPerLine: 8, description: 'ป้อนชิ้นงานและ Jig อุปกรณ์' },
      { id: 'ir-4', role: 'Line Maintenance & Tooling Tech', ratioType: 'fixed_per_line', countPerLine: 3, description: 'ดูแลเครื่องมือ Torque และแท่นยึด' }
    ],
    allowancePFDPct: 8.0,
    absenteeismPct: 5.0,
    hourlyWageThb: 65.0
  },
  {
    id: 'electronics_box_build',
    name: 'สายการผลิตอิเล็กทรอนิกส์ (Electronics Box Build & SMT)',
    category: 'High-Tech Electronics',
    description: 'สายการผลิตอุปกรณ์ไฟฟ้าความเร็วสูง ชิ้นงานเล็ก Output สูง UPPH 18 - 45 ชิ้น/คน-ชม.',
    topDown: {
      targetOutputDaily: 3600,
      workingHoursDaily: 8.0,
      targetUPPH: 25.0,
      solveFor: 'manpower',
      shiftsCount: 2,
      regularHoursPerShift: 8.0,
      overtimeHoursPerShift: 0.0,
      scrapRatePct: 0.5,
      oeePct: 92.0
    },
    stations: [
      { id: 'e-1', name: 'ST-01', processName: 'PCB Depaneling & Scanner Barcode', cycleTimeSec: 12.5, operatorsCount: 1, notes: 'Laser scan' },
      { id: 'e-2', name: 'ST-02', processName: 'Housing Insertion & Base Screwing', cycleTimeSec: 14.0, operatorsCount: 1, notes: 'Electric screw torque' },
      { id: 'e-3', name: 'ST-03', processName: 'Ribbon Cable & Connector Assembly', cycleTimeSec: 15.2, operatorsCount: 1, notes: 'Bottleneck risk' },
      { id: 'e-4', name: 'ST-04', processName: 'Thermal Pad & Heat Sink Fixation', cycleTimeSec: 13.8, operatorsCount: 1, notes: 'Dispensing jig' },
      { id: 'e-5', name: 'ST-05', processName: 'Top Cover Snap-Fit & Ultrasonic', cycleTimeSec: 11.5, operatorsCount: 1, notes: 'Pneumatic press' },
      { id: 'e-6', name: 'ST-06', processName: 'In-Circuit Test & Flashing (ICT)', cycleTimeSec: 14.5, operatorsCount: 1, notes: 'Automated test bed' },
      { id: 'e-7', name: 'ST-07', processName: 'Hi-Pot / Electrical Safety Check', cycleTimeSec: 12.0, operatorsCount: 1, notes: 'Dielectric withstand' },
      { id: 'e-8', name: 'ST-08', processName: 'Packaging, Label & Carton Box', cycleTimeSec: 10.5, operatorsCount: 1, notes: 'Weight scale' }
    ],
    speedLine: {
      pitchDistanceM: 0.8,
      cycleTimeSec: 15.2,
      conveyorLengthM: 24
    },
    indirectRoles: [
      { id: 'ir-e1', role: 'Line Leader', ratioType: 'fixed_per_line', countPerLine: 1, description: 'หัวหน้ากะคุมสายการผลิต' },
      { id: 'ir-e2', role: 'QA Inspector', ratioType: 'fixed_per_line', countPerLine: 1, description: 'สุ่มตรวจ AQL 0.65' },
      { id: 'ir-e3', role: 'Water Spider (Kitting)', ratioType: 'fixed_per_line', countPerLine: 1, description: 'เดินส่ง Bin ชิ้นส่วน SMD/กล่อง' }
    ],
    allowancePFDPct: 5.0,
    absenteeismPct: 3.5,
    hourlyWageThb: 55.0
  },
  {
    id: 'appliance_assembly_line',
    name: 'สายการประกอบเครื่องใช้ไฟฟ้า (Home Appliance & Motors)',
    category: 'Consumer Appliances',
    description: 'สายพานลำเลียงต่อเนื่อง (Continuous Moving Conveyor) ผลิตพัดลม/เครื่องปรับอากาศ',
    topDown: {
      targetOutputDaily: 1440,
      workingHoursDaily: 8.0,
      targetUPPH: 12.0,
      solveFor: 'manpower',
      shiftsCount: 1,
      regularHoursPerShift: 8.0,
      overtimeHoursPerShift: 1.0,
      scrapRatePct: 1.2,
      oeePct: 85.0
    },
    stations: [
      { id: 'ap-1', name: 'ST-01', processName: 'Stator & Rotor Core Insertion', cycleTimeSec: 28.0, operatorsCount: 1, notes: 'Coil feed' },
      { id: 'ap-2', name: 'ST-02', processName: 'Bearing Press & Seal Assembly', cycleTimeSec: 25.5, operatorsCount: 1, notes: 'Hydraulic arbor' },
      { id: 'ap-3', name: 'ST-03', processName: 'Motor Bracket & Casing Fastening', cycleTimeSec: 29.2, operatorsCount: 1, notes: '4x M5 bolts' },
      { id: 'ap-4', name: 'ST-04', processName: 'PCB Controller & Switch Harness', cycleTimeSec: 27.0, operatorsCount: 1, notes: 'Terminal crimping' },
      { id: 'ap-5', name: 'ST-05', processName: 'Impeller & Fan Blade Balance', cycleTimeSec: 30.0, operatorsCount: 1, notes: 'Dynamic balance' },
      { id: 'ap-6', name: 'ST-06', processName: 'Front Safety Guard & Grille', cycleTimeSec: 24.0, operatorsCount: 1, notes: 'Clip fastener' },
      { id: 'ap-7', name: 'ST-07', processName: 'Vibration & Sound Power Test', cycleTimeSec: 26.5, operatorsCount: 1, notes: 'Anechoic booth' }
    ],
    speedLine: {
      pitchDistanceM: 1.2,
      cycleTimeSec: 30.0,
      conveyorLengthM: 35
    },
    indirectRoles: [
      { id: 'ir-ap1', role: 'Supervisor / Line Leader', ratioType: 'fixed_per_line', countPerLine: 1, description: 'ดูแล Line Pace' },
      { id: 'ir-ap2', role: 'Quality Patrol', ratioType: 'fixed_per_line', countPerLine: 1, description: 'สุ่มตรวจฟังก์ชัน' },
      { id: 'ir-ap3', role: 'Parts Handler', ratioType: 'fixed_per_line', countPerLine: 2, description: 'เข็นรถ Pallet' }
    ],
    allowancePFDPct: 6.0,
    absenteeismPct: 4.0,
    hourlyWageThb: 60.0
  }
];
