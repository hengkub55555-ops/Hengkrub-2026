import { Calculator, ArrowDown, Sparkles, BookOpen } from 'lucide-react';
import { calculateTopDownManpower } from '../utils/engineeringMath';

interface FormulaProofCardProps {
  dailyOutput: number;
  workingHours: number;
  upph: number;
  onUpdateDailyOutput?: (val: number) => void;
  onUpdateWorkingHours?: (val: number) => void;
  onUpdateUPPH?: (val: number) => void;
}

export function FormulaProofCard({
  dailyOutput,
  workingHours,
  upph,
  onUpdateDailyOutput,
  onUpdateWorkingHours,
  onUpdateUPPH
}: FormulaProofCardProps) {
  const result = calculateTopDownManpower(dailyOutput, workingHours, upph);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              สูตรคำนวณกำลังคนตามมาตรฐานอุตสาหกรรม (Required Manpower Formula)
            </h3>
            <p className="text-xs text-slate-400">
              เมื่อใช้ UPPH (Units Per Person-Hour) เป็นตัวชี้วัดประสิทธิภาพกำลังคนทั้งโรงงาน
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60">
          IE Standard Formula
        </div>
      </div>

      {/* Mathematical Derivation Box - Replicating & Refining the Image */}
      <div className="mt-5 p-6 rounded-lg bg-slate-950/80 border border-slate-800/80 font-serif text-slate-100 flex flex-col items-center justify-center space-y-4">
        {/* Main Formula */}
        <div className="flex items-center gap-3 text-lg md:text-xl font-medium tracking-wide">
          <span className="font-mono text-blue-300 font-semibold">Required MP</span>
          <span>=</span>
          <div className="flex flex-col items-center">
            <span className="border-b border-slate-400 pb-0.5 px-3 font-mono text-emerald-300">
              Daily Output
            </span>
            <span className="pt-0.5 px-3 font-mono text-amber-300 text-base">
              Working Hours × UPPH
            </span>
          </div>
        </div>

        <div className="text-xs font-sans text-slate-400 flex items-center gap-1.5">
          <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
          <span>แทนค่าตามแผนการผลิตจริง (Live Substitution)</span>
        </div>

        {/* Step 1: Substitution */}
        <div className="flex items-center gap-3 text-base md:text-lg">
          <span className="font-mono text-slate-300">Required MP</span>
          <span>=</span>
          <div className="flex flex-col items-center">
            <span className="border-b border-slate-400 pb-0.5 px-3 font-mono text-emerald-400 font-semibold">
              {dailyOutput.toLocaleString('th-TH')}
            </span>
            <span className="pt-0.5 px-3 font-mono text-amber-300 text-sm md:text-base">
              {workingHours.toFixed(1)} × {upph.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Step 2: Intermediate denominator */}
        <div className="flex items-center gap-3 text-base md:text-lg">
          <span className="font-mono text-slate-400">=</span>
          <div className="flex flex-col items-center">
            <span className="border-b border-slate-400 pb-0.5 px-3 font-mono text-emerald-400">
              {dailyOutput.toLocaleString('th-TH')}
            </span>
            <span className="pt-0.5 px-3 font-mono text-amber-300 font-semibold text-sm md:text-base">
              {result.outputPerPersonPerShift.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Step 3: Final Answer Box with border box like in screenshot */}
        <div className="flex items-center gap-3 pt-2">
          <span className="text-lg font-mono text-slate-400">=</span>
          <div className="px-5 py-2 border-2 border-blue-400 rounded-md bg-blue-950/40 text-blue-200 font-mono text-xl md:text-2xl font-bold tracking-wider shadow-sm">
            {result.requiredMPRounded.toLocaleString('th-TH')} คน
          </div>
          {result.requiredMPExact !== result.requiredMPRounded && (
            <span className="text-xs font-sans text-slate-400">
              (คำนวณจริง {result.requiredMPExact.toFixed(2)} คน ปัดเศษเป็นจำนวนเต็มคน)
            </span>
          )}
        </div>
      </div>

      {/* Results Table - Exactly as in the user screenshot */}
      <div className="mt-6">
        <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
          ผลการคำนวณ (Calculation Results Table)
        </h4>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-slate-800/60 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-400">KPI / Parameter</th>
                <th className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-400 text-right">ค่าที่กำหนด (Input)</th>
                <th className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-400 text-right">ผลลัพธ์ (Output)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 text-slate-200 font-mono-numbers">
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-4 font-sans text-slate-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  เป้าหมายการผลิต (Daily Output Target)
                </td>
                <td className="py-2.5 px-4 text-right text-slate-400 text-xs font-sans">
                  {onUpdateDailyOutput ? (
                    <input
                      type="number"
                      value={dailyOutput}
                      onChange={(e) => onUpdateDailyOutput(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right text-emerald-300 font-mono focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    `${dailyOutput.toLocaleString('th-TH')}`
                  )}
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-400 font-bold font-mono">
                  {dailyOutput.toLocaleString('th-TH')} Unit/Day
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-4 font-sans text-slate-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  เวลาทำงานต่อวัน (Working Hours)
                </td>
                <td className="py-2.5 px-4 text-right text-slate-400 text-xs font-sans">
                  {onUpdateWorkingHours ? (
                    <input
                      type="number"
                      step="0.5"
                      value={workingHours}
                      onChange={(e) => onUpdateWorkingHours(Math.max(0.1, parseFloat(e.target.value) || 0))}
                      className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right text-amber-300 font-mono focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    `${workingHours} Hr`
                  )}
                </td>
                <td className="py-2.5 px-4 text-right text-amber-300 font-mono">
                  {workingHours.toFixed(1)} Hr/Day
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-4 font-sans text-slate-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  UPPH Target (Units Per Person-Hour)
                </td>
                <td className="py-2.5 px-4 text-right text-slate-400 text-xs font-sans">
                  {onUpdateUPPH ? (
                    <input
                      type="number"
                      step="0.01"
                      value={upph}
                      onChange={(e) => onUpdateUPPH(Math.max(0.001, parseFloat(e.target.value) || 0))}
                      className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right text-blue-300 font-mono focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    `${upph}`
                  )}
                </td>
                <td className="py-2.5 px-4 text-right text-blue-300 font-mono">
                  {upph.toFixed(2)}
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition-colors bg-slate-800/20">
                <td className="py-2.5 px-4 font-sans text-slate-300 font-medium">
                  Output ต่อพนักงานต่อกะ (Output per Person/Shift)
                </td>
                <td className="py-2.5 px-4 text-right text-slate-400 text-xs font-mono">
                  {workingHours.toFixed(1)} × {upph.toFixed(2)}
                </td>
                <td className="py-2.5 px-4 text-right text-purple-300 font-bold font-mono">
                  {result.outputPerPersonPerShift.toFixed(2)} Unit/Person/Shift
                </td>
              </tr>

              <tr className="bg-blue-950/30 hover:bg-blue-950/40 transition-colors">
                <td className="py-3 px-4 font-sans text-white font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  กำลังคนที่ต้องใช้ตามสูตร (Required MP)
                </td>
                <td className="py-3 px-4 text-right text-slate-400 text-xs font-mono">
                  {dailyOutput.toLocaleString('th-TH')} / {result.outputPerPersonPerShift.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-white font-bold text-base font-mono">
                  <span className="text-blue-400">{result.requiredMPRounded.toLocaleString('th-TH')}</span> คน
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
        <BookOpen className="w-4 h-4 text-slate-300 shrink-0" />
        <span>
          <strong className="text-slate-200">คำอธิบายเชิงวิศวกรรม:</strong> หาก UPPH มีค่าน้อย เช่น 0.20 หมายถึงงานประกอบที่มีความซับซ้อนสูง 1 คนต้องใช้เวลา 5 ชั่วโมงเพื่อประกอบได้ 1 ชิ้นงาน (Output ต่อคน = 2.10 ชิ้นต่อกะ 10.5 ชม.) ทำให้ต้องใช้แรงงานรวมสูงถึง 2,667 คนในทั้งโรงงาน
        </span>
      </div>
    </div>
  );
}
