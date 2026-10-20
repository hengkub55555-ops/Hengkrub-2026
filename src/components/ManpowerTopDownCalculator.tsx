import { useState } from 'react';
import { Users, Clock, Target, TrendingUp, HelpCircle, Layers, Sliders, CheckCircle2 } from 'lucide-react';
import { TopDownCalculationInput } from '../types/engineering';
import { calculateTopDownManpower, calculateTopDownUPPH, calculateTopDownOutput, formatNum } from '../utils/engineeringMath';

interface Props {
  input: TopDownCalculationInput;
  onChange: (updated: TopDownCalculationInput) => void;
  hourlyWageThb?: number;
}

export function ManpowerTopDownCalculator({ input, onChange, hourlyWageThb = 60 }: Props) {
  const [activeTab, setActiveTab] = useState<'calculator' | 'matrix' | 'oee_adjust'>('calculator');

  // Working hours breakdown
  const totalHoursCalculated = input.regularHoursPerShift + input.overtimeHoursPerShift;

  const handleUpdate = (field: keyof TopDownCalculationInput, value: any) => {
    const updated = { ...input, [field]: value };
    if (field === 'regularHoursPerShift' || field === 'overtimeHoursPerShift') {
      updated.workingHoursDaily = (updated.regularHoursPerShift + updated.overtimeHoursPerShift);
    }
    onChange(updated);
  };

  // Calculations
  const scrapAdjustedDailyOutput = input.targetOutputDaily / (1 - (input.scrapRatePct / 100));
  const effectiveHoursWithOEE = input.workingHoursDaily * (input.oeePct / 100);

  // Standard Top-Down
  const topDownResult = calculateTopDownManpower(
    input.targetOutputDaily,
    input.workingHoursDaily,
    input.targetUPPH
  );

  // Scrap & OEE adjusted manpower
  const adjustedTopDownResult = calculateTopDownManpower(
    scrapAdjustedDailyOutput,
    effectiveHoursWithOEE,
    input.targetUPPH
  );

  // Target UPH required
  const targetUPH = input.workingHoursDaily > 0 ? input.targetOutputDaily / input.workingHoursDaily : 0;
  const taktTimeEquivalentSec = targetUPH > 0 ? 3600 / targetUPH : 0;

  // What-if alternative solutions
  const calculatedUPPHIfMPFixed = calculateTopDownUPPH(
    input.targetOutputDaily,
    input.workingHoursDaily,
    topDownResult.requiredMPRounded
  );

  const estimatedShiftLaborCost = topDownResult.requiredMPRounded * input.workingHoursDaily * hourlyWageThb;

  return (
    <div className="space-y-6">
      {/* Top Controls & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Top-Down Productivity & Manpower Planning
            </h2>
            <p className="text-xs text-slate-400">
              การคำนวณกำลังคนและ UPPH ในระดับโรงงาน/ฝ่ายผลิต เชื่อมโยงเป้าหมาย Output และเวลาทำงานจริง
            </p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'calculator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            เครื่องคำนวณหลัก
          </button>
          <button
            onClick={() => setActiveTab('oee_adjust')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'oee_adjust'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ปรับชดเชย OEE & Scrap
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ตารางเปรียบเทียบความไว (Sensitivity)
          </button>
        </div>
      </div>

      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Parameter Inputs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  พารามิเตอร์การผลิต (Input Parameters)
                </span>
                <span className="text-xs text-blue-400 font-mono">Live Sync</span>
              </div>

              {/* Target Daily Output */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  เป้าหมายยอดผลิตต่อวัน (Daily Output Target)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={input.targetOutputDaily}
                    onChange={(e) => handleUpdate('targetOutputDaily', Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono text-base focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">ชิ้น/วัน (Units/Day)</span>
                </div>
                <div className="flex justify-between mt-1 text-[11px] text-slate-500">
                  <span>ตัวอย่างทั่วไป: 1,000 - 10,000 ชิ้น</span>
                  <button
                    onClick={() => handleUpdate('targetOutputDaily', 5600)}
                    className="text-blue-400 hover:underline"
                  >
                    ตั้งค่า 5,600 ตามรูป
                  </button>
                </div>
              </div>

              {/* Working Hours Breakdown */}
              <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    เวลาทำงานต่อวัน (Working Hours per Day)
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    รวม: {input.workingHoursDaily.toFixed(1)} ชม./วัน
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="block text-[11px] text-slate-400 mb-1">เวลากะปกติ (Regular)</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        step="0.5"
                        value={input.regularHoursPerShift}
                        onChange={(e) => handleUpdate('regularHoursPerShift', Math.max(1, parseFloat(e.target.value) || 0))}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-500">ชม.</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-400 mb-1">เวลาล่วงเวลา (OT)</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="6"
                        step="0.5"
                        value={input.overtimeHoursPerShift}
                        onChange={(e) => handleUpdate('overtimeHoursPerShift', Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono text-sm focus:outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-500">ชม.</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>ตามภาพแนบ: ปกติ 8.0 ชม. + OT 2.5 ชม. = 10.5 ชม.</span>
                  <button
                    onClick={() => {
                      handleUpdate('regularHoursPerShift', 8.0);
                      handleUpdate('overtimeHoursPerShift', 2.5);
                    }}
                    className="text-blue-400 hover:underline"
                  >
                    ตั้งเป็น 10.5 ชม.
                  </button>
                </div>
              </div>

              {/* Target UPPH */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                    เป้าหมาย UPPH (Units Per Person-Hour)
                  </label>
                  <span className="text-[11px] text-slate-400">ผลิตได้กี่ชิ้นต่อคนต่อชม.</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={input.targetUPPH}
                    onChange={(e) => handleUpdate('targetUPPH', Math.max(0.001, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-blue-400 font-mono text-base focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">ชิ้น / คน-ชม.</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleUpdate('targetUPPH', 0.20)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700"
                  >
                    0.20 (ตามภาพแนบ)
                  </button>
                  <button
                    onClick={() => handleUpdate('targetUPPH', 2.5)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700"
                  >
                    2.50 (งานเครื่องจักร)
                  </button>
                  <button
                    onClick={() => handleUpdate('targetUPPH', 25.0)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700"
                  >
                    25.0 (อิเล็กทรอนิกส์)
                  </button>
                </div>
              </div>

              {/* Shifts count */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  จำนวนกะการทำงาน (Number of Shifts per Day)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleUpdate('shiftsCount', num)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors border ${
                        input.shiftsCount === num
                          ? 'bg-blue-600 border-blue-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {num} กะ ({num} Shift{num > 1 ? 's' : ''})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Visual KPI Cards & Formulas */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Required Manpower */}
              <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="text-xs uppercase font-bold tracking-wider text-blue-400 flex items-center justify-between">
                  <span>กำลังคนที่ต้องใช้ตามสูตร (Required MP)</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">สูตรตรงรูป</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                    {topDownResult.requiredMPRounded.toLocaleString('th-TH')}
                  </span>
                  <span className="text-sm text-slate-400 font-sans">คน / กะ</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  ค่าแม่นยำทศนิยม: <span className="font-mono text-slate-300">{topDownResult.requiredMPExact.toFixed(2)}</span> คน
                </div>
                {input.shiftsCount > 1 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-amber-400 font-mono">
                    รวมทั้งโรงงาน ({input.shiftsCount} กะ): {(topDownResult.requiredMPRounded * input.shiftsCount).toLocaleString('th-TH')} คน
                  </div>
                )}
              </div>

              {/* Card 2: Output per Person per Shift */}
              <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="text-xs uppercase font-bold tracking-wider text-purple-400 flex items-center justify-between">
                  <span>Output ต่อคนต่อกะ</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Working Hrs × UPPH</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                    {topDownResult.outputPerPersonPerShift.toFixed(2)}
                  </span>
                  <span className="text-sm text-slate-400 font-sans">Unit / Person / Shift</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  เวลาทำงาน: <span className="font-mono text-slate-300">{input.workingHoursDaily.toFixed(1)} ชม.</span> × UPPH <span className="font-mono text-slate-300">{input.targetUPPH.toFixed(2)}</span>
                </div>
              </div>

              {/* Card 3: Line Speed / UPH Target */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center justify-between">
                  <span>อัตราผลิตเป้าหมาย (Target UPH)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Daily Output ÷ Hours</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                    {formatNum(targetUPH, 1)}
                  </span>
                  <span className="text-sm text-slate-400 font-sans">ชิ้น / ชม. (Units/Hr)</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  เทียบเท่า Takt Time: <span className="font-mono text-slate-300">{formatNum(taktTimeEquivalentSec, 2)} วินาที/ชิ้น</span>
                </div>
              </div>

              {/* Card 4: Estimated Labor Cost */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center justify-between">
                  <span>ประมาณการค่าจ้างแรงงาน (Labor Cost)</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">@{hourlyWageThb} ฿/ชม.</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-white font-mono tracking-tight">
                    {estimatedShiftLaborCost.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-sm text-slate-400 font-sans">บาท / กะ</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  ต้นทุนค่าแรงต่อชิ้น: <span className="font-mono text-slate-300">{(estimatedShiftLaborCost / Math.max(1, input.targetOutputDaily)).toFixed(2)} บาท/ชิ้น</span>
                </div>
              </div>
            </div>

            {/* Formula Step-by-Step Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
              <div className="text-slate-400 font-sans font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ขั้นตอนการพิสูจน์สูตรตัวเลข (Step-by-step Calculation Trace):</span>
              </div>
              {topDownResult.formulaSteps.map((step, idx) => (
                <div key={idx} className="pl-6 text-slate-300 border-l border-slate-800 py-0.5">
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: OEE and Scrap Adjustment */}
      {activeTab === 'oee_adjust' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white">
              การชดเชยค่า OEE (Overall Equipment Effectiveness) และของเสีย (Scrap Rate)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              ในสถานการณ์จริง เครื่องจักรมี Downtime และมีของเสียระหว่างผลิต เพื่อให้ได้ยอดสุทธิ (Good Units) ตามเป้าหมาย วิศวกรต้องคำนวณ Gross Output และเวลาการทำงานสุทธิ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  อัตราของเสียสะสม (Scrap / Defect Rate): {input.scrapRatePct}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.1"
                  value={input.scrapRatePct}
                  onChange={(e) => handleUpdate('scrapRatePct', parseFloat(e.target.value) || 0)}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                  <span>0% (Zero Defect)</span>
                  <span className="text-red-400 font-bold">{input.scrapRatePct}%</span>
                  <span>15%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ค่าประสิทธิผลโดยรวมของเครื่องจักร (Line OEE %): {input.oeePct}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="0.5"
                  value={input.oeePct}
                  onChange={(e) => handleUpdate('oeePct', parseFloat(e.target.value) || 0)}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                  <span>50%</span>
                  <span className="text-blue-400 font-bold">{input.oeePct}%</span>
                  <span>100% (World Class)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="text-sm font-sans font-bold text-slate-200">
                ผลกระทบต่อเป้าหมายและกำลังคนที่ต้องเตรียม:
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>ยอดสุทธิที่ต้องการ (Net Good Output):</span>
                <span className="text-emerald-400 font-bold">{input.targetOutputDaily.toLocaleString('th-TH')} ชิ้น</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>ยอดผลิตรวมที่ต้องป้อนสาย (Gross Required):</span>
                <span className="text-amber-400 font-bold">{Math.ceil(scrapAdjustedDailyOutput).toLocaleString('th-TH')} ชิ้น</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>เวลาทำงานสุทธิหลังหัก OEE:</span>
                <span className="text-blue-400 font-bold">{effectiveHoursWithOEE.toFixed(2)} ชม./วัน</span>
              </div>
              <div className="flex justify-between py-2 bg-blue-950/40 p-2 rounded text-slate-100 font-bold text-sm">
                <span>กำลังคนที่ต้องเตรียมจริงหลังชดเชย:</span>
                <span className="text-blue-300 text-base">{adjustedTopDownResult.requiredMPRounded.toLocaleString('th-TH')} คน</span>
              </div>
              <p className="text-[11px] font-sans text-slate-400">
                * ต้องเพิ่มกำลังคนอีก {Math.max(0, adjustedTopDownResult.requiredMPRounded - topDownResult.requiredMPRounded).toLocaleString('th-TH')} คน เพื่อชดเชยของเสีย {input.scrapRatePct}% และ Line OEE {input.oeePct}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sensitivity Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                ตารางวิเคราะห์ความไว: กำลังคนที่ต้องการ (Required MP) ณ ระดับ UPPH ต่างๆ
              </h3>
              <p className="text-xs text-slate-400">
                สำหรับยอดผลิต {input.targetOutputDaily.toLocaleString('th-TH')} ชิ้น ที่เวลาทำงาน {input.workingHoursDaily.toFixed(1)} ชั่วโมง
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-sans">ระดับ UPPH Target</th>
                  <th className="py-2.5 px-4 text-right">Output ต่อคนต่อกะ</th>
                  <th className="py-2.5 px-4 text-right">กำลังคนที่ต้องใช้ (Required MP)</th>
                  <th className="py-2.5 px-4 text-right font-sans">ความประหยัดเมื่อปรับปรุง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 text-slate-200">
                {[
                  input.targetUPPH * 0.8,
                  input.targetUPPH * 0.9,
                  input.targetUPPH,
                  input.targetUPPH * 1.1,
                  input.targetUPPH * 1.25,
                  input.targetUPPH * 1.5
                ].map((testUPPH, idx) => {
                  const isCurrent = Math.abs(testUPPH - input.targetUPPH) < 0.001;
                  const res = calculateTopDownManpower(input.targetOutputDaily, input.workingHoursDaily, testUPPH);
                  const diffPeople = topDownResult.requiredMPRounded - res.requiredMPRounded;

                  return (
                    <tr
                      key={idx}
                      className={isCurrent ? 'bg-blue-950/40 font-bold border-l-2 border-blue-400' : 'hover:bg-slate-800/40'}
                    >
                      <td className="py-2.5 px-4 flex items-center gap-2">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                        <span>{testUPPH.toFixed(2)} ชิ้น/คน-ชม.</span>
                        {isCurrent && <span className="text-[10px] text-blue-400 font-sans font-normal">(ค่าปัจจุบัน)</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-300">
                        {res.outputPerPersonPerShift.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-white">
                        {res.requiredMPRounded.toLocaleString('th-TH')} คน
                      </td>
                      <td className="py-2.5 px-4 text-right font-sans">
                        {diffPeople > 0 ? (
                          <span className="text-emerald-400">ลดได้ {diffPeople.toLocaleString('th-TH')} คน</span>
                        ) : diffPeople < 0 ? (
                          <span className="text-red-400">ต้องเพิ่ม {Math.abs(diffPeople).toLocaleString('th-TH')} คน</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
