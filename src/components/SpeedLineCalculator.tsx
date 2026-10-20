import { useState, useEffect } from 'react';
import { Gauge, ArrowRight, Play, Pause, RefreshCw, Sliders, Box, Clock, Layers } from 'lucide-react';
import { SpeedLineInput } from '../types/engineering';
import { calculateSpeedLine, formatNum } from '../utils/engineeringMath';

interface Props {
  input: SpeedLineInput;
  onChange: (input: SpeedLineInput) => void;
  bottleneckCTSec?: number;
}

export function SpeedLineCalculator({ input, onChange, bottleneckCTSec }: Props) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [pulleyDiameterMm, setPulleyDiameterMm] = useState<number>(200); // 200 mm drive pulley
  const [gearboxRatio, setGearboxRatio] = useState<number>(30); // 30:1 reduction

  // Calculate speed kinematics
  const result = calculateSpeedLine({
    pitchDistanceM: input.pitchDistanceM,
    cycleTimeSec: input.cycleTimeSec,
    conveyorLengthM: input.conveyorLengthM
  });

  // Calculate motor RPM:
  // Belt Speed (m/min) = (PI * PulleyDiameter(m) * Pulley RPM)
  // Pulley RPM = Speed(m/min) / (PI * D(m))
  // Motor RPM = Pulley RPM * GearboxRatio
  const pulleyCircumferenceM = (Math.PI * pulleyDiameterMm) / 1000;
  const drivePulleyRpm = pulleyCircumferenceM > 0 ? result.lineSpeedMPerMin / pulleyCircumferenceM : 0;
  const motorRpm = drivePulleyRpm * gearboxRatio;

  const handleUpdate = (field: keyof SpeedLineInput, val: number) => {
    onChange({ ...input, [field]: val });
  };

  // Sync with line balancing bottleneck CT if available
  const handleSyncWithBottleneck = () => {
    if (bottleneckCTSec && bottleneckCTSec > 0) {
      handleUpdate('cycleTimeSec', bottleneckCTSec);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Speed Line & Conveyor Kinematics Calculator
            </h2>
            <p className="text-xs text-slate-400">
              การคำนวณความเร็วสายพานลำเลียง (Speed Line), ระยะ Pitch ชิ้นงาน, เวลาเดินทาง (Transit Time) และ WIP ในสาย
            </p>
          </div>
        </div>

        {bottleneckCTSec && bottleneckCTSec > 0 && Math.abs(input.cycleTimeSec - bottleneckCTSec) > 0.01 && (
          <button
            onClick={handleSyncWithBottleneck}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-lg border border-blue-500/30 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ซิงค์ CT กับ Bottleneck ({formatNum(bottleneckCTSec, 1)}s)
          </button>
        )}
      </div>

      {/* Main Grid: Inputs & High-Performance Output Displays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                พารามิเตอร์สายพานลำเลียง (Conveyor Inputs)
              </span>
              <span className="text-xs text-emerald-400 font-mono">IE Precision</span>
            </div>

            {/* Pitch Distance */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  ระยะพิตช์ระหว่างชิ้นงาน / จิ๊ก (Pitch Distance - P)
                </label>
                <span className="text-[11px] text-slate-400">ระยะกึ่งกลางถึงกึ่งกลาง</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={input.pitchDistanceM}
                  onChange={(e) => handleUpdate('pitchDistanceM', Math.max(0.01, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono text-base focus:outline-none focus:border-blue-500 font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">เมตร (Meters)</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleUpdate('pitchDistanceM', 0.6)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700"
                >
                  0.6 ม. (อิเล็กทรอนิกส์)
                </button>
                <button
                  onClick={() => handleUpdate('pitchDistanceM', 1.2)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700"
                >
                  1.2 ม. (เครื่องใช้ไฟฟ้า)
                </button>
                <button
                  onClick={() => handleUpdate('pitchDistanceM', 5.5)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700"
                >
                  5.5 ม. (ยานยนต์)
                </button>
              </div>
            </div>

            {/* Cycle Time / Bottleneck CT */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  เวลา Cycle Time หรือ Takt Time (CT)
                </label>
                <span className="text-[11px] text-slate-400">เวลาต่อ 1 ชิ้น</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={input.cycleTimeSec}
                  onChange={(e) => handleUpdate('cycleTimeSec', Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-blue-400 font-mono text-base focus:outline-none focus:border-blue-500 font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">วินาที (Seconds)</span>
              </div>
            </div>

            {/* Total Conveyor Length */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  ความยาวรวมของสายพาน (Conveyor Length - L)
                </label>
                <span className="text-[11px] text-slate-400">ตั้งแต่จุด Load ถึง Unload</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={input.conveyorLengthM}
                  onChange={(e) => handleUpdate('conveyorLengthM', Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-base focus:outline-none focus:border-blue-500 font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">เมตร (Meters)</span>
              </div>
            </div>

            {/* Motor / Gear Assistant (Optional toggle) */}
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-2.5 text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                คำนวณรอบมอเตอร์ขับเคลื่อน (Motor & Gear Drive Helper)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">เส้นผ่านศูนย์กลาง Pulley (มม.)</span>
                  <input
                    type="number"
                    value={pulleyDiameterMm}
                    onChange={(e) => setPulleyDiameterMm(parseFloat(e.target.value) || 1)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">อัตราทดเกียร์ (Gear Ratio i)</span>
                  <input
                    type="number"
                    value={gearboxRatio}
                    onChange={(e) => setGearboxRatio(parseFloat(e.target.value) || 1)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                  />
                </div>
              </div>
              <div className="pt-1 flex justify-between text-[11px] font-mono text-slate-300 border-t border-slate-800">
                <span>ความเร็วมอเตอร์ที่ต้องตั้ง:</span>
                <span className="text-amber-400 font-bold">{formatNum(motorRpm, 1)} RPM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Dashboard Cards */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Speed Value Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                ความเร็วสายพานคำนวณ (Calculated Line Speed - V)
              </span>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                V = Pitch ÷ CT
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-4 pt-2">
              <div>
                <span className="text-xs text-slate-400">เมตรต่อนาที (m/min)</span>
                <div className="text-3xl font-extrabold text-white font-mono mt-0.5">
                  {formatNum(result.lineSpeedMPerMin, 2)}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400">เซนติเมตร/วินาที (cm/s)</span>
                <div className="text-2xl font-bold text-emerald-300 font-mono mt-1">
                  {formatNum(result.lineSpeedCmPerSec, 2)}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400">มิลลิเมตร/วินาที (mm/s)</span>
                <div className="text-2xl font-bold text-slate-300 font-mono mt-1">
                  {formatNum(result.lineSpeedMmPerSec, 1)}
                </div>
              </div>
            </div>

            {/* Formula substitution details */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 font-mono text-xs text-slate-300">
              <span className="text-slate-400">วิธีคำนวณ:</span> V = {input.pitchDistanceM} ม. ÷ {input.cycleTimeSec} วินาที = {(input.pitchDistanceM / input.cycleTimeSec).toFixed(4)} m/s × 60 = <span className="text-emerald-400 font-bold">{formatNum(result.lineSpeedMPerMin, 2)} m/min</span>
            </div>
          </div>

          {/* Secondary Kinematic Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Transit Time */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs uppercase font-bold text-blue-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                เวลาเดินทางตลอดสาย (Transit Time)
              </div>
              <div className="mt-2 text-xl font-bold text-white font-mono">
                {result.transitTimeFormatted}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                {formatNum(result.transitTimeMin, 2)} นาที (Lead Time)
              </div>
            </div>

            {/* WIP on Line */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs uppercase font-bold text-purple-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                ชิ้นงานบนสายพาน (In-Line WIP)
              </div>
              <div className="mt-2 text-xl font-bold text-purple-300 font-mono">
                {result.wipOnConveyorUnits.toLocaleString('th-TH')}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                ชิ้นงาน (ความยาว {input.conveyorLengthM}ม. ÷ พิตช์ {input.pitchDistanceM}ม.)
              </div>
            </div>

            {/* Output Rate */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs uppercase font-bold text-amber-400 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5" />
                อัตราผลผลิต (Conveyor Rate)
              </div>
              <div className="mt-2 text-xl font-bold text-amber-300 font-mono">
                {Math.floor(result.outputPerHour).toLocaleString('th-TH')}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                ชิ้น / ชั่วโมง (3600 ÷ CT)
              </div>
            </div>
          </div>

          {/* Interactive Conveyor Line Visual Simulator */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                  แบบจำลองภาพสายพานลำเลียง (Live Conveyor Simulation)
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Speed: {formatNum(result.lineSpeedMPerMin, 2)} m/min
                </span>
              </div>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {isPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                <span>{isPlaying ? 'หยุดชั่วคราว' : 'จำลองการเคลื่อนที่'}</span>
              </button>
            </div>

            {/* Visual Belt Conveyor */}
            <div className="relative h-28 bg-slate-900 rounded-lg border border-slate-800 p-3 overflow-hidden flex flex-col justify-center">
              {/* Conveyor Bed & Guides */}
              <div className="w-full h-8 bg-slate-950 rounded border-y border-slate-700/80 relative overflow-hidden flex items-center">
                {/* Rollers / Belt texture stripes */}
                <div
                  className={`absolute inset-0 flex items-center justify-around ${
                    isPlaying ? 'animate-pulse' : ''
                  }`}
                >
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="w-1 h-full bg-slate-800/80"></div>
                  ))}
                </div>

                {/* Simulated Moving Workpieces / Jigs */}
                <div className="absolute inset-0 flex items-center justify-around px-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-7 h-5 rounded bg-gradient-to-r from-blue-500 to-indigo-600 border border-blue-300 shadow-md flex items-center justify-center text-[9px] font-mono text-white font-bold"
                    >
                      #{i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Station Indicators along the line */}
              <div className="flex justify-between items-center px-6 mt-2 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ArrowRight className="w-3 h-3" />
                  จุดป้อนชิ้นงาน (Load Station)
                </span>
                <span className="text-slate-500">
                  Pitch = {input.pitchDistanceM} m | ระยะห่างเท่ากัน
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  จุดสิ้นสุด (Unload Station)
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
