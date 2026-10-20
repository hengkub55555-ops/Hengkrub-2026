import { useState, useMemo } from 'react';
import { TrendingUp, Users, Target, Sliders, ArrowUpRight, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';
import { calculateTopDownManpower, formatNum } from '../utils/engineeringMath';

interface Props {
  currentDailyOutput: number;
  workingHours: number;
  currentUPPH: number;
  hourlyWageThb?: number;
  onSelectOutput?: (output: number) => void;
}

export function ManpowerSimulationGraph({
  currentDailyOutput,
  workingHours,
  currentUPPH,
  hourlyWageThb = 60,
  onSelectOutput
}: Props) {
  // Configurable Range (default 4,000 - 7,000 as requested)
  const [minOutput, setMinOutput] = useState<number>(4000);
  const [maxOutput, setMaxOutput] = useState<number>(7000);
  const [stepOutput, setStepOutput] = useState<number>(500);
  const [hoveredPoint, setHoveredPoint] = useState<{ output: number; mp: number; uph: number } | null>(null);
  const [showScenarioCompare, setShowScenarioCompare] = useState<boolean>(true);

  // Generate discrete points for 4000 - 7000
  const simulationPoints = useMemo(() => {
    const points: Array<{
      output: number;
      mpBase: number;
      mpExact: number;
      uph: number;
      mpKaizen: number; // UPPH +10%
      mpChallenging: number; // UPPH -10%
      isCurrentTarget: boolean;
    }> = [];

    // Ensure currentDailyOutput is captured if inside range
    const outputsSet = new Set<number>();
    for (let o = minOutput; o <= maxOutput; o += stepOutput) {
      outputsSet.add(o);
    }
    if (currentDailyOutput >= minOutput && currentDailyOutput <= maxOutput) {
      outputsSet.add(currentDailyOutput);
    }

    const sortedOutputs = Array.from(outputsSet).sort((a, b) => a - b);

    const kaizenUPPH = currentUPPH * 1.15; // +15% improvement
    const challengingUPPH = currentUPPH * 0.85; // -15%

    sortedOutputs.forEach((output) => {
      const baseRes = calculateTopDownManpower(output, workingHours, currentUPPH);
      const kaizenRes = calculateTopDownManpower(output, workingHours, kaizenUPPH);
      const chalRes = calculateTopDownManpower(output, workingHours, challengingUPPH);
      const uph = workingHours > 0 ? output / workingHours : 0;

      points.push({
        output,
        mpBase: baseRes.requiredMPRounded,
        mpExact: baseRes.requiredMPExact,
        uph,
        mpKaizen: kaizenRes.requiredMPRounded,
        mpChallenging: chalRes.requiredMPRounded,
        isCurrentTarget: output === currentDailyOutput
      });
    });

    return points;
  }, [minOutput, maxOutput, stepOutput, currentDailyOutput, workingHours, currentUPPH]);

  // Marginal rate: MP per 500 units
  const outputPerPersonShift = workingHours * currentUPPH;
  const mpPer500Units = outputPerPersonShift > 0 ? Math.round(500 / outputPerPersonShift) : 0;

  // SVG Chart Dimensions & Scaling
  const width = 800;
  const height = 320;
  const paddingLeft = 70;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 50;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Max and Min values for Y scale
  const allMPs = simulationPoints.flatMap((p) => [p.mpBase, p.mpKaizen, p.mpChallenging]);
  const rawMinMP = Math.min(...allMPs, 1000);
  const rawMaxMP = Math.max(...allMPs, 3500);

  // Round scale nicely
  const minY = Math.floor(rawMinMP / 500) * 500;
  const maxY = Math.ceil(rawMaxMP / 500) * 500;
  const rangeY = maxY - minY || 1;

  const getX = (output: number) => {
    return paddingLeft + ((output - minOutput) / (maxOutput - minOutput)) * chartW;
  };

  const getY = (mp: number) => {
    return height - paddingBottom - ((mp - minY) / rangeY) * chartH;
  };

  // Build SVG Path strings
  const baseLinePath = simulationPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.output).toFixed(1)} ${getY(p.mpBase).toFixed(1)}`)
    .join(' ');

  const kaizenLinePath = simulationPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.output).toFixed(1)} ${getY(p.mpKaizen).toFixed(1)}`)
    .join(' ');

  const areaPath = `${baseLinePath} L ${getX(maxOutput).toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${getX(minOutput).toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`;

  // Grid tick marks for Y axis
  const yTicks: number[] = [];
  const yTickStep = rangeY > 2000 ? 500 : 250;
  for (let y = minY; y <= maxY; y += yTickStep) {
    yTicks.push(y);
  }

  // Primary X tick points: 4000, 4500, 5000, 5500, 6000, 6500, 7000
  const xTicks = [4000, 4500, 5000, 5500, 6000, 6500, 7000].filter((x) => x >= minOutput && x <= maxOutput);

  // Current Target Point
  const currentTargetRes = calculateTopDownManpower(currentDailyOutput, workingHours, currentUPPH);
  const currentTargetX = getX(currentDailyOutput);
  const currentTargetY = getY(currentTargetRes.requiredMPRounded);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                กราฟ Simulation แนวโน้มกำลังคน (Manpower Sensitivity Curve: 4,000 – 7,000 Unit/Day)
              </h3>
              <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                Formula Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              จำลองเป้าหมายการผลิต 4,000 - 7,000 ชิ้น/วัน เพื่อคาดการณ์อัตรากำลังคนที่ต้องใช้ตามสูตร Required MP = Output ÷ (Working Hours × UPPH)
            </p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScenarioCompare(!showScenarioCompare)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              showScenarioCompare
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{showScenarioCompare ? 'ซ่อนเปรียบเทียบ Kaizen' : 'แสดงเปรียบเทียบ Kaizen (+15%)'}</span>
          </button>
        </div>
      </div>

      {/* Key Insight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 font-sans block">กำลังคนที่ช่วงเป้าหมาย 4,000 ชิ้น:</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {calculateTopDownManpower(4000, workingHours, currentUPPH).requiredMPRounded.toLocaleString('th-TH')} คน
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Output/คน: {outputPerPersonShift.toFixed(2)} ชิ้น/กะ
          </span>
        </div>

        <div className="p-3 bg-blue-950/30 rounded-lg border border-blue-500/30">
          <span className="text-[11px] text-blue-300 font-sans block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            เป้าหมายปัจจุบัน ({currentDailyOutput.toLocaleString('th-TH')} ชิ้น):
          </span>
          <div className="text-xl font-bold font-mono text-white mt-0.5">
            {currentTargetRes.requiredMPRounded.toLocaleString('th-TH')} คน
          </div>
          <span className="text-[10px] text-blue-300 font-mono">
            จุดอ้างอิงตามสูตรในรูปภาพ
          </span>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 font-sans block">กำลังคนที่ช่วงเป้าหมาย 7,000 ชิ้น:</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
            {calculateTopDownManpower(7000, workingHours, currentUPPH).requiredMPRounded.toLocaleString('th-TH')} คน
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            อัตราเพิ่มเฉลี่ย: +{mpPer500Units} คน / ทุกๆ 500 ชิ้น
          </span>
        </div>
      </div>

      {/* Interactive SVG Chart Container */}
      <div className="relative bg-slate-950/90 rounded-xl border border-slate-800 p-4 overflow-hidden">
        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3 font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-blue-500 rounded-full"></span>
              <span className="text-slate-200">
                ปัจจุบัน (UPPH = {currentUPPH.toFixed(2)}, {workingHours.toFixed(1)} ชม.)
              </span>
            </div>

            {showScenarioCompare && (
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 bg-emerald-400 rounded-full border-t border-dashed border-emerald-400"></span>
                <span className="text-emerald-400">
                  Kaizen Target (UPPH = {(currentUPPH * 1.15).toFixed(2)} +15%)
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-2 ring-blue-500/50"></span>
              <span className="text-slate-300">
                จุดเป้าหมายปัจจุบัน ({currentDailyOutput.toLocaleString('th-TH')} Unit/Day)
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-sans">
            *คลิกหรือเลื่อนเมาส์บนจุดเพื่อดูค่าตัวเลข
          </div>
        </div>

        {/* SVG Viewport */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[380px] select-none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="mpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines & Y-axis labels */}
            {yTicks.map((tick) => {
              const yPos = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={width - paddingRight}
                    y2={yPos}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={yPos + 4}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {tick.toLocaleString('th-TH')} คน
                  </text>
                </g>
              );
            })}

            {/* Vertical Grid lines & X-axis labels */}
            {xTicks.map((tick) => {
              const xPos = getX(tick);
              return (
                <g key={tick}>
                  <line
                    x1={xPos}
                    y1={paddingTop}
                    x2={xPos}
                    y2={height - paddingBottom}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={xPos}
                    y={height - paddingBottom + 18}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight={tick === currentDailyOutput ? 'bold' : 'normal'}
                  >
                    {tick.toLocaleString('th-TH')}
                  </text>
                  <text
                    x={xPos}
                    y={height - paddingBottom + 30}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="sans-serif"
                  >
                    ชิ้น/วัน
                  </text>
                </g>
              );
            })}

            {/* Area Fill for Base curve */}
            <path d={areaPath} fill="url(#mpGradient)" />

            {/* Kaizen Line (+15% UPPH) */}
            {showScenarioCompare && (
              <path
                d={kaizenLinePath}
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}

            {/* Base Manpower Line */}
            <path
              d={baseLinePath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Vertical Marker Line at Current Daily Output */}
            {currentDailyOutput >= minOutput && currentDailyOutput <= maxOutput && (
              <line
                x1={currentTargetX}
                y1={paddingTop}
                x2={currentTargetX}
                y2={height - paddingBottom}
                stroke="#60a5fa"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )}

            {/* Data Points */}
            {simulationPoints.map((p) => {
              const cx = getX(p.output);
              const cy = getY(p.mpBase);
              const isCurrent = p.isCurrentTarget;

              return (
                <g
                  key={p.output}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint({ output: p.output, mp: p.mpBase, uph: p.uph })}
                  onClick={() => onSelectOutput && onSelectOutput(p.output)}
                >
                  {/* Invisible enlarged hit target for easy mouse hover */}
                  <circle cx={cx} cy={cy} r="14" fill="transparent" />

                  {/* Pulsing ring if current target */}
                  {isCurrent && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="9"
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="2"
                      opacity="0.8"
                      className="animate-ping"
                    />
                  )}

                  {/* Visible Dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isCurrent ? 6 : 4}
                    fill={isCurrent ? '#3b82f6' : '#60a5fa'}
                    stroke="#ffffff"
                    strokeWidth={isCurrent ? 2.5 : 1.5}
                  />

                  {/* Value label on top of point for key values */}
                  {(p.output % 1000 === 0 || isCurrent) && (
                    <text
                      x={cx}
                      y={cy - 10}
                      textAnchor="middle"
                      fill={isCurrent ? '#60a5fa' : '#cbd5e1'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {p.mpBase.toLocaleString('th-TH')}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover / Interactive Tooltip */}
        {hoveredPoint && (
          <div className="mt-2 p-3 bg-slate-900 border border-blue-500/40 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-slate-300">เป้าหมายผลิต:</span>
              <strong className="text-emerald-400 text-sm">
                {hoveredPoint.output.toLocaleString('th-TH')} Unit/Day
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-300">กำลังคนที่ต้องใช้ตามสูตร:</span>
              <strong className="text-blue-400 text-sm">
                {hoveredPoint.mp.toLocaleString('th-TH')} คน
              </strong>
              <span className="text-[11px] text-slate-500 font-sans">
                (ที่ {workingHours.toFixed(1)} ชม. × UPPH {currentUPPH.toFixed(2)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-300">UPH เป้าหมาย:</span>
              <strong className="text-amber-400">{hoveredPoint.uph.toFixed(1)} ชิ้น/ชม.</strong>
            </div>

            {onSelectOutput && hoveredPoint.output !== currentDailyOutput && (
              <button
                onClick={() => onSelectOutput(hoveredPoint.output)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-sans font-medium transition-colors"
              >
                นำค่านี้ไปคำนวณทั้งระบบ
              </button>
            )}
          </div>
        )}
      </div>

      {/* Discrete Simulation Table: 4,000 - 7,000 Unit/Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            ตารางตัวเลขจำลองละเอียดช่วง 4,000 – 7,000 Unit/Day (Step 500)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Working Hours: {workingHours.toFixed(1)} ชม. · UPPH: {currentUPPH.toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-sans">เป้าหมายยอดผลิต (Daily Output)</th>
                <th className="py-2.5 px-3 text-right">Target UPH (ชิ้น/ชม.)</th>
                <th className="py-2.5 px-3 text-right">กำลังคนตามสูตร (Required MP)</th>
                <th className="py-2.5 px-3 text-right">ผลต่างจากเป้าปัจจุบัน</th>
                {showScenarioCompare && (
                  <th className="py-2.5 px-3 text-right text-emerald-400 font-sans">
                    หาก Kaizen (+15% UPPH)
                  </th>
                )}
                <th className="py-2.5 px-3 text-right">ประมาณการค่าจ้างต่อวัน</th>
                <th className="py-2.5 px-3 text-center font-sans">การปรับใช้</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 text-slate-200">
              {simulationPoints.map((point) => {
                const diffFromCurrent = point.mpBase - currentTargetRes.requiredMPRounded;
                const dailyLaborCost = point.mpBase * workingHours * hourlyWageThb;

                return (
                  <tr
                    key={point.output}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      point.isCurrentTarget ? 'bg-blue-950/40 font-bold border-l-2 border-blue-400' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      {point.isCurrentTarget && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                      )}
                      <span className={point.isCurrentTarget ? 'text-white text-sm' : 'text-slate-200'}>
                        {point.output.toLocaleString('th-TH')} ชิ้น/วัน
                      </span>
                      {point.isCurrentTarget && (
                        <span className="text-[10px] text-blue-400 font-sans font-normal bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          เป้าหมายปัจจุบัน
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right text-amber-300">
                      {point.uph.toFixed(1)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-white font-bold text-sm">
                      {point.mpBase.toLocaleString('th-TH')} คน
                    </td>

                    <td className="py-2.5 px-3 text-right font-sans">
                      {diffFromCurrent > 0 ? (
                        <span className="text-red-400">+{diffFromCurrent.toLocaleString('th-TH')} คน</span>
                      ) : diffFromCurrent < 0 ? (
                        <span className="text-emerald-400">
                          {diffFromCurrent.toLocaleString('th-TH')} คน
                        </span>
                      ) : (
                        <span className="text-blue-400">0 (ฐานเทียบ)</span>
                      )}
                    </td>

                    {showScenarioCompare && (
                      <td className="py-2.5 px-3 text-right text-emerald-400">
                        {point.mpKaizen.toLocaleString('th-TH')} คน
                        <span className="text-[10px] text-emerald-500/80 ml-1 font-sans">
                          (ลดได้ {point.mpBase - point.mpKaizen} คน)
                        </span>
                      </td>
                    )}

                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {dailyLaborCost.toLocaleString('th-TH', { maximumFractionDigits: 0 })} ฿
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {point.isCurrentTarget ? (
                        <span className="text-[11px] text-blue-400 font-sans">ใช้งานอยู่</span>
                      ) : (
                        <button
                          onClick={() => onSelectOutput && onSelectOutput(point.output)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-sans transition-colors"
                        >
                          เลือกค่านี้
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engineering Insights & Sensitivity Interpretation */}
      <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>ข้อสรุปเชิงวิศวกรรมอุตสาหการ (Engineering Takeaways):</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-slate-400 leading-relaxed font-sans">
          <li>
            <strong className="text-slate-300">ความชันของกราฟ (Marginal Labor Rate):</strong> ทุกๆ 500 ชิ้น/วัน ที่เพิ่มขึ้น สายการผลิตต้องการกำลังคนเพิ่มประมาณ <strong className="text-amber-300 font-mono">+{mpPer500Units} คน</strong> (หรือประมาณ 0.476 คนต่อ 1 ชิ้นงานที่เวลาทำงาน {workingHours.toFixed(1)} ชม. และ UPPH {currentUPPH.toFixed(2)})
          </li>
          <li>
            <strong className="text-slate-300">ศักยภาพของการ Kaizen / ลดความสูญเปล่า:</strong> หากฝ่ายวิศวกรรมสามารถปรับปรุง Line Balancing และลดเวลา Cycle Time จน UPPH เพิ่มขึ้น 15% จาก {currentUPPH.toFixed(2)} เป็น {(currentUPPH * 1.15).toFixed(2)} ชิ้น/คน-ชม. จะสามารถลดกำลังคนที่ยอด 7,000 ชิ้น จาก <strong className="text-white font-mono">3,333 คน</strong> เหลือเพียง <strong className="text-emerald-400 font-mono">2,899 คน</strong> (ประหยัดอัตรากำลังได้ถึง 434 คน!)
          </li>
        </ul>
      </div>
    </div>
  );
}
