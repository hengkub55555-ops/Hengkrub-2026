/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { FormulaProofCard } from './components/FormulaProofCard';
import { ManpowerSimulationGraph } from './components/ManpowerSimulationGraph';
import { ManpowerTopDownCalculator } from './components/ManpowerTopDownCalculator';
import { LineBalancingWorkstation } from './components/LineBalancingWorkstation';
import { SpeedLineCalculator } from './components/SpeedLineCalculator';
import { ManpowerRequestSheet } from './components/ManpowerRequestSheet';
import { ConverterTools } from './components/ConverterTools';
import { ExportReportModal } from './components/ExportReportModal';
import { DEFAULT_PRESETS } from './data/defaultPresets';
import { ProjectPreset, Workstation, IndirectLaborItem, TopDownCalculationInput, SpeedLineInput } from './types/engineering';
import { calculateLineBalancing, calculateSpeedLine, calculateTopDownManpower, formatNum } from './utils/engineeringMath';
import { Gauge, Users, Clock, Target, Layers, ArrowUpRight, CheckCircle2, ChevronRight, FileSpreadsheet, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Active Preset & State
  const [currentPreset, setCurrentPreset] = useState<ProjectPreset>(DEFAULT_PRESETS[0]);
  const [topDownInput, setTopDownInput] = useState<TopDownCalculationInput>(DEFAULT_PRESETS[0].topDown);
  const [stations, setStations] = useState<Workstation[]>(DEFAULT_PRESETS[0].stations);
  const [speedLineInput, setSpeedLineInput] = useState<SpeedLineInput>(DEFAULT_PRESETS[0].speedLine);
  const [indirectRoles, setIndirectRoles] = useState<IndirectLaborItem[]>(DEFAULT_PRESETS[0].indirectRoles);
  const [allowancePFDPct, setAllowancePFDPct] = useState<number>(DEFAULT_PRESETS[0].allowancePFDPct);
  const [absenteeismPct, setAbsenteeismPct] = useState<number>(DEFAULT_PRESETS[0].absenteeismPct);
  const [hourlyWageThb, setHourlyWageThb] = useState<number>(DEFAULT_PRESETS[0].hourlyWageThb);

  const handleSelectPreset = (preset: ProjectPreset) => {
    setCurrentPreset(preset);
    setTopDownInput(preset.topDown);
    setStations(preset.stations);
    setSpeedLineInput(preset.speedLine);
    setIndirectRoles(preset.indirectRoles);
    setAllowancePFDPct(preset.allowancePFDPct);
    setAbsenteeismPct(preset.absenteeismPct);
    setHourlyWageThb(preset.hourlyWageThb);
  };

  // Cross-dimensional calculations
  const topDownResult = calculateTopDownManpower(
    topDownInput.targetOutputDaily,
    topDownInput.workingHoursDaily,
    topDownInput.targetUPPH
  );

  const balancingResult = calculateLineBalancing(
    stations,
    topDownInput.regularHoursPerShift + topDownInput.overtimeHoursPerShift,
    topDownInput.targetOutputDaily / topDownInput.shiftsCount
  );

  const speedLineResult = calculateSpeedLine({
    pitchDistanceM: speedLineInput.pitchDistanceM,
    cycleTimeSec: speedLineInput.cycleTimeSec,
    conveyorLengthM: speedLineInput.conveyorLengthM
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPresetId={currentPreset.id}
        onSelectPreset={handleSelectPreset}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Preset Selector & Case Context Bar */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                {currentPreset.category}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-medium">{currentPreset.name}</span>
            </div>
            <p className="text-xs text-slate-400">
              {currentPreset.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">เลือกโมเดลตัวอย่าง:</span>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                    currentPreset.id === p.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {p.id === 'automotive_assembly_user_case'
                    ? '★ ตัวอย่างตามรูป (5,600 ชิ้น)'
                    : p.id === 'electronics_box_build'
                    ? 'อิเล็กทรอนิกส์ (SMT)'
                    : 'เครื่องใช้ไฟฟ้า'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab 1: Overview & Formula Proof (Exact match to user's uploaded request) */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 4 Multi-Dimensional Quick Stat Pillars */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Pillar 1: UPH & Bottleneck CT */}
              <div
                onClick={() => setActiveTab('balancing')}
                className="bg-slate-900/90 hover:bg-slate-850 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    UPH & Cycle Time
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="mt-3 text-2xl font-bold font-mono text-white">
                  {Math.floor(balancingResult.lineCapacityUPH)} <span className="text-xs text-slate-400 font-sans font-normal">ชิ้น/ชม.</span>
                </div>
                <div className="mt-1 text-xs text-slate-400 font-mono">
                  Bottleneck CT: <span className="text-emerald-400 font-bold">{formatNum(balancingResult.bottleneckCTSec, 1)}s</span>
                </div>
              </div>

              {/* Pillar 2: UPPH Target & Actual */}
              <div
                onClick={() => setActiveTab('topdown')}
                className="bg-slate-900/90 hover:bg-slate-850 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    UPPH Productivity
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="mt-3 text-2xl font-bold font-mono text-white">
                  {topDownInput.targetUPPH.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">ชิ้น/คน-ชม.</span>
                </div>
                <div className="mt-1 text-xs text-slate-400 font-mono">
                  Output/คน/กะ: <span className="text-blue-400 font-bold">{topDownResult.outputPerPersonPerShift.toFixed(2)} ชิ้น</span>
                </div>
              </div>

              {/* Pillar 3: Speed Line (m/min) */}
              <div
                onClick={() => setActiveTab('speedline')}
                className="bg-slate-900/90 hover:bg-slate-850 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" />
                    Speed Line & Pitch
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <div className="mt-3 text-2xl font-bold font-mono text-white">
                  {formatNum(speedLineResult.lineSpeedMPerMin, 2)} <span className="text-xs text-slate-400 font-sans font-normal">m/min</span>
                </div>
                <div className="mt-1 text-xs text-slate-400 font-mono">
                  Pitch: <span className="text-amber-400 font-bold">{speedLineInput.pitchDistanceM}m</span> · WIP: {speedLineResult.wipOnConveyorUnits} ชิ้น
                </div>
              </div>

              {/* Pillar 4: Total Manpower Request */}
              <div
                onClick={() => setActiveTab('manpower')}
                className="bg-slate-900/90 hover:bg-slate-850 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Manpower Request
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="mt-3 text-2xl font-bold font-mono text-white">
                  {topDownResult.requiredMPRounded.toLocaleString('th-TH')} <span className="text-xs text-slate-400 font-sans font-normal">คน</span>
                </div>
                <div className="mt-1 text-xs text-slate-400 font-mono">
                  สูตร: <span className="text-purple-400 font-bold">5,600 ÷ (10.5 × 0.20)</span>
                </div>
              </div>
            </div>

            {/* Formula Proof Card: Direct replica & interactive version of user screenshot */}
            <FormulaProofCard
              dailyOutput={topDownInput.targetOutputDaily}
              workingHours={topDownInput.workingHoursDaily}
              upph={topDownInput.targetUPPH}
              onUpdateDailyOutput={(val) => setTopDownInput({ ...topDownInput, targetOutputDaily: val })}
              onUpdateWorkingHours={(val) => setTopDownInput({ ...topDownInput, workingHoursDaily: val })}
              onUpdateUPPH={(val) => setTopDownInput({ ...topDownInput, targetUPPH: val })}
            />

            {/* Manpower Simulation Graph: 4,000 - 7,000 Unit/Day Trending Curve */}
            <ManpowerSimulationGraph
              currentDailyOutput={topDownInput.targetOutputDaily}
              workingHours={topDownInput.workingHoursDaily}
              currentUPPH={topDownInput.targetUPPH}
              hourlyWageThb={hourlyWageThb}
              onSelectOutput={(val) => setTopDownInput({ ...topDownInput, targetOutputDaily: val })}
            />

            {/* Engineering Dimension Interconnections Banner */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  สถาปัตยกรรมความสัมพันธ์ 5 มิติของวิศวกรรมอุตสาหการ (IE 5-Dimensional Integrity)
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                โปรแกรมนี้เชื่อมโยงสมการอุตสาหการทั้งระบบเข้าด้วยกัน: เมื่อฝ่ายวางแผนกำหนดเป้าหมายยอดผลิต (Daily Output) และเวลาทำงาน (Working Hours) สามารถคำนวณกำลังคนระดับโรงงานผ่าน <strong className="text-blue-300">UPPH</strong> และเมื่อวิศวกรลงไปวัดหน้างาน Station Cycle Time จะได้สถานีคอขวด (Bottleneck CT) ที่เป็นตัวกำหนด <strong className="text-emerald-300">UPH</strong> สูงสุดของสาย และความเร็วสายพาน <strong className="text-amber-300">Speed Line</strong> จากระยะพิตช์ชิ้นงาน
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    1. มิติอัตรากำลังคน (UPPH & Manpower)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Required MP = Daily Output ÷ (Working Hours × UPPH) เพื่อคำนวณจำนวนพนักงานทั้งหมดที่ต้องรับเข้าโรงงาน
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    2. มิติขีดความสามารถ (CT, Takt & UPH)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    UPH = 3600 ÷ Bottleneck CT พร้อมวิเคราะห์ Line Balance Efficiency (LBE) และ Yamazumi Chart
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" />
                    3. มิติความเร็วสายพาน (Speed Line Kinematics)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Line Speed V = Pitch ÷ CT คำนวณความเร็วสายพานลำเลียง (m/min), In-line WIP, และรอบมอเตอร์
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Dedicated Simulation Tab (4,000 - 7,000 Unit/Day) */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <ManpowerSimulationGraph
              currentDailyOutput={topDownInput.targetOutputDaily}
              workingHours={topDownInput.workingHoursDaily}
              currentUPPH={topDownInput.targetUPPH}
              hourlyWageThb={hourlyWageThb}
              onSelectOutput={(val) => setTopDownInput({ ...topDownInput, targetOutputDaily: val })}
            />

            <FormulaProofCard
              dailyOutput={topDownInput.targetOutputDaily}
              workingHours={topDownInput.workingHoursDaily}
              upph={topDownInput.targetUPPH}
              onUpdateDailyOutput={(val) => setTopDownInput({ ...topDownInput, targetOutputDaily: val })}
              onUpdateWorkingHours={(val) => setTopDownInput({ ...topDownInput, workingHoursDaily: val })}
              onUpdateUPPH={(val) => setTopDownInput({ ...topDownInput, targetUPPH: val })}
            />
          </div>
        )}

        {/* Tab 2: Top-Down & UPPH Planning */}
        {activeTab === 'topdown' && (
          <ManpowerTopDownCalculator
            input={topDownInput}
            onChange={setTopDownInput}
            hourlyWageThb={hourlyWageThb}
          />
        )}

        {/* Tab 3: Line Balancing & Station Cycle Time */}
        {activeTab === 'balancing' && (
          <LineBalancingWorkstation
            stations={stations}
            onChangeStations={setStations}
            workingHoursPerShift={topDownInput.regularHoursPerShift + topDownInput.overtimeHoursPerShift}
            plannedShiftTarget={topDownInput.targetOutputDaily / topDownInput.shiftsCount}
          />
        )}

        {/* Tab 4: Speed Line & Conveyor Kinematics */}
        {activeTab === 'speedline' && (
          <SpeedLineCalculator
            input={speedLineInput}
            onChange={setSpeedLineInput}
            bottleneckCTSec={balancingResult.bottleneckCTSec}
          />
        )}

        {/* Tab 5: Manpower Request Form */}
        {activeTab === 'manpower' && (
          <ManpowerRequestSheet
            directLaborBase={stations.length > 0 ? balancingResult.actualDirectOperators : topDownResult.requiredMPRounded}
            indirectRoles={indirectRoles}
            onChangeIndirectRoles={setIndirectRoles}
            allowancePFDPct={allowancePFDPct}
            onChangeAllowancePFD={setAllowancePFDPct}
            absenteeismPct={absenteeismPct}
            onChangeAbsenteeism={setAbsenteeismPct}
            shiftsCount={topDownInput.shiftsCount}
            onChangeShiftsCount={(s) => setTopDownInput({ ...topDownInput, shiftsCount: s })}
            hourlyWageThb={hourlyWageThb}
            onChangeHourlyWage={setHourlyWageThb}
            hoursPerShift={topDownInput.regularHoursPerShift + topDownInput.overtimeHoursPerShift}
          />
        )}

        {/* Tab 6: Engineering Converters */}
        {activeTab === 'converters' && <ConverterTools />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>IE Productivity Master · Industrial Engineering Standard Calculation Engine</span>
          <span>UPH · Cycle Time · UPPH · Line Balancing · Speed Line · Manpower Request</span>
        </div>
      </footer>

      {/* Formal Printable Engineering Report Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        preset={currentPreset}
        topDown={topDownInput}
        stations={stations}
        speedLine={speedLineInput}
        indirectRoles={indirectRoles}
        allowancePFDPct={allowancePFDPct}
        absenteeismPct={absenteeismPct}
        hourlyWageThb={hourlyWageThb}
      />
    </div>
  );
}
