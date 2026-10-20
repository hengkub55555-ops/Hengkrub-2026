import { useState } from 'react';
import { ArrowLeftRight, Clock, Gauge, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatNum } from '../utils/engineeringMath';

export function ConverterTools() {
  // Converter 1: CT <-> UPH
  const [ctInput, setCtInput] = useState<number>(20);
  const [uphInput, setUphInput] = useState<number>(180);

  const handleCtChange = (val: number) => {
    setCtInput(val);
    if (val > 0) setUphInput(parseFloat((3600 / val).toFixed(1)));
  };

  const handleUphChange = (val: number) => {
    setUphInput(val);
    if (val > 0) setCtInput(parseFloat((3600 / val).toFixed(2)));
  };

  // Converter 2: Speed Line Units (m/min <-> cm/s <-> mm/s)
  const [speedMMin, setSpeedMMin] = useState<number>(4.5);
  const speedCmS = (speedMMin * 100) / 60;
  const speedMmS = (speedMMin * 1000) / 60;

  // Converter 3: Takt Time Quick Solver
  const [shiftOperatingMinutes, setShiftOperatingMinutes] = useState<number>(480); // 8 hours
  const [shiftBreaksMinutes, setShiftBreaksMinutes] = useState<number>(45); // 45 mins break
  const [shiftDemandUnits, setShiftDemandUnits] = useState<number>(1200);

  const netOperatingSeconds = Math.max(0, shiftOperatingMinutes - shiftBreaksMinutes) * 60;
  const calculatedTaktTime = shiftDemandUnits > 0 ? netOperatingSeconds / shiftDemandUnits : 0;
  const calculatedTaktUPH = calculatedTaktTime > 0 ? 3600 / calculatedTaktTime : 0;

  // Converter 4: Labor Efficiency Index
  const [standardMinutesPerUnit, setStandardMinutesPerUnit] = useState<number>(2.5);
  const [actualUnitsProduced, setActualUnitsProduced] = useState<number>(180);
  const [actualHoursWorked, setActualHoursWorked] = useState<number>(8.0);
  const [operatorsCount, setOperatorsCount] = useState<number>(1);

  const standardHoursEarned = (standardMinutesPerUnit * actualUnitsProduced) / 60;
  const actualManHoursSpent = actualHoursWorked * operatorsCount;
  const laborEfficiencyPct = actualManHoursSpent > 0 ? (standardHoursEarned / actualManHoursSpent) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            เครื่องมือช่วยแปลงหน่วยวิศวกรรมอุตสาหการ (IE Quick Calculators & Converters)
          </h2>
          <p className="text-xs text-slate-400">
            แปลงค่า Cycle Time, Takt Time, UPH, Speed Line, และ Labor Efficiency รวดเร็วและแม่นยำ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: CT <-> UPH Direct Converter */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              แปลงค่า Cycle Time (วินาที) ↔ UPH (ชิ้น/ชม.)
            </h3>
            <span className="text-xs font-mono text-emerald-400">UPH = 3600 ÷ CT</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Cycle Time (CT วินาที)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={ctInput}
                onChange={(e) => handleCtChange(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono text-lg font-bold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Units Per Hour (UPH ชิ้น/ชม.)
              </label>
              <input
                type="number"
                min="1"
                step="5"
                value={uphInput}
                onChange={(e) => handleUphChange(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-blue-400 font-mono text-lg font-bold focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs font-mono text-slate-300 space-y-1">
            <div>• ที่ CT {ctInput} วินาที → ผลิตได้ <strong className="text-white">{uphInput} ชิ้น/ชม.</strong></div>
            <div>• ใน 8 ชั่วโมงทำงาน ผลิตได้: <strong className="text-emerald-400">{Math.floor(uphInput * 8).toLocaleString('th-TH')} ชิ้น</strong></div>
          </div>
        </div>

        {/* Card 2: Speed Line Unit Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              แปลงหน่วยความเร็วสายพาน (Speed Line Multi-Unit)
            </h3>
            <span className="text-xs font-mono text-blue-400">Kinematics</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              ความเร็วสายพานในหน่วย เมตรต่อนาที (m/min):
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={speedMMin}
              onChange={(e) => setSpeedMMin(Math.max(0.01, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-lg font-bold focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-sans">เซนติเมตรต่อวินาที (cm/s)</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {formatNum(speedCmS, 2)}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-sans">มิลลิเมตรต่อวินาที (mm/s)</span>
              <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                {formatNum(speedMmS, 1)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Takt Time Formula Solver */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              คำนวณ Takt Time จากเวลาทำงานและ Demand
            </h3>
            <span className="text-xs font-mono text-amber-400">Tt = Net Time ÷ Demand</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">เวลาในกะ (นาที)</label>
              <input
                type="number"
                value={shiftOperatingMinutes}
                onChange={(e) => setShiftOperatingMinutes(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">เวลาพักเบรค (นาที)</label>
              <input
                type="number"
                value={shiftBreaksMinutes}
                onChange={(e) => setShiftBreaksMinutes(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">เป้าหมาย (ชิ้น/กะ)</label>
              <input
                type="number"
                value={shiftDemandUnits}
                onChange={(e) => setShiftDemandUnits(parseFloat(e.target.value) || 1)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 font-sans">Takt Time ที่ต้องรักษา:</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                {formatNum(calculatedTaktTime, 2)} วินาที / ชิ้น
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-sans">Pace อัตราผลิต:</span>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {Math.round(calculatedTaktUPH)} UPH
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Labor Efficiency Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              ดัชนีประสิทธิภาพแรงงาน (Labor Efficiency %)
            </h3>
            <span className="text-xs font-mono text-purple-400">Earned ÷ Spent</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">เวลามาตรฐาน (ST นาที/ชิ้น)</label>
              <input
                type="number"
                step="0.1"
                value={standardMinutesPerUnit}
                onChange={(e) => setStandardMinutesPerUnit(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">ยอดผลิตจริงที่ได้ (ชิ้น)</label>
              <input
                type="number"
                value={actualUnitsProduced}
                onChange={(e) => setActualUnitsProduced(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 font-sans">ประสิทธิภาพแรงงานจริง:</span>
              <div
                className={`text-2xl font-bold font-mono mt-0.5 ${
                  laborEfficiencyPct >= 95
                    ? 'text-emerald-400'
                    : laborEfficiencyPct >= 80
                    ? 'text-blue-400'
                    : 'text-amber-400'
                }`}
              >
                {formatNum(laborEfficiencyPct, 1)}%
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <div>Earned: {formatNum(standardHoursEarned, 2)} ชม.</div>
              <div>Spent: {actualManHoursSpent.toFixed(1)} ชม.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
