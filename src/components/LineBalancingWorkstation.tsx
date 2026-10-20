import { useState } from 'react';
import { Layers, Plus, Trash2, AlertTriangle, CheckCircle, BarChart3, Download, Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Workstation } from '../types/engineering';
import { calculateLineBalancing, formatNum } from '../utils/engineeringMath';

interface Props {
  stations: Workstation[];
  onChangeStations: (stations: Workstation[]) => void;
  workingHoursPerShift: number;
  plannedShiftTarget: number;
}

export function LineBalancingWorkstation({
  stations,
  onChangeStations,
  workingHoursPerShift,
  plannedShiftTarget
}: Props) {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const balancing = calculateLineBalancing(stations, workingHoursPerShift, plannedShiftTarget);

  const handleUpdateStation = (id: string, field: keyof Workstation, value: any) => {
    const updated = stations.map((s) => (s.id === id ? { ...s, [field]: value } : s));
    onChangeStations(updated);
  };

  const handleAddStation = () => {
    const nextNum = stations.length + 1;
    const newStation: Workstation = {
      id: `st-${Date.now()}`,
      name: `ST-${String(nextNum).padStart(2, '0')}`,
      processName: `กระบวนการขั้นตอนที่ ${nextNum}`,
      cycleTimeSec: balancing.taktTimeSec > 0 ? Math.round(balancing.taktTimeSec * 0.9) : 20,
      operatorsCount: 1,
      notes: ''
    };
    onChangeStations([...stations, newStation]);
  };

  const handleDeleteStation = (id: string) => {
    if (stations.length <= 1) return;
    onChangeStations(stations.filter((s) => s.id !== id));
  };

  // Suggest line balancing optimization: add operator to bottleneck station
  const handleOptimizeBottleneck = () => {
    if (!balancing.bottleneckStation) return;
    const updated = stations.map((s) => {
      if (s.id === balancing.bottleneckStation?.id) {
        return { ...s, operatorsCount: s.operatorsCount + 1 };
      }
      return s;
    });
    onChangeStations(updated);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Station ID,Station Name,Process Description,Cycle Time (sec),Operators,Effective CT (sec),Station Capacity (UPH),Notes\n';
    const rows = stations
      .map((s) => {
        const effCT = s.cycleTimeSec / Math.max(1, s.operatorsCount);
        const uph = effCT > 0 ? (3600 / effCT).toFixed(1) : '0';
        return `"${s.name}","${s.name}","${s.processName}",${s.cycleTimeSec},${s.operatorsCount},${effCT.toFixed(2)},${uph},"${s.notes || ''}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Line_Balancing_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Max scale for chart
  const maxCTForChart = Math.max(
    balancing.bottleneckCTSec * 1.25,
    balancing.taktTimeSec * 1.25,
    10
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* LBE */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] uppercase font-bold text-slate-400">Line Balance Efficiency (LBE)</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono ${
                balancing.lineBalanceEfficiencyPct >= 85
                  ? 'text-emerald-400'
                  : balancing.lineBalanceEfficiencyPct >= 70
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {formatNum(balancing.lineBalanceEfficiencyPct, 1)}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Loss: <span className="font-mono text-slate-400">{formatNum(balancing.balanceLossPct, 1)}%</span>
          </div>
        </div>

        {/* Bottleneck CT */}
        <div className="bg-slate-900 border border-red-900/40 rounded-xl p-3.5">
          <div className="text-[11px] uppercase font-bold text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Bottleneck CT
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white font-mono">{formatNum(balancing.bottleneckCTSec, 1)}</span>
            <span className="text-xs text-slate-400">วินาที</span>
          </div>
          <div className="text-[10px] text-red-300/80 truncate">
            {balancing.bottleneckStation ? balancing.bottleneckStation.name : '-'}
          </div>
        </div>

        {/* Takt Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] uppercase font-bold text-blue-400">Takt Time Target</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-blue-300 font-mono">{formatNum(balancing.taktTimeSec, 1)}</span>
            <span className="text-xs text-slate-400">วินาที</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {balancing.bottleneckCTSec <= balancing.taktTimeSec ? (
              <span className="text-emerald-400 font-medium">✓ ทันตามแผน</span>
            ) : (
              <span className="text-red-400 font-medium">✗ ช้ากว่า Takt Time</span>
            )}
          </div>
        </div>

        {/* Line UPH Capacity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] uppercase font-bold text-emerald-400">Line Capacity (UPH)</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-300 font-mono">{Math.floor(balancing.lineCapacityUPH)}</span>
            <span className="text-xs text-slate-400">ชิ้น/ชม.</span>
          </div>
          <div className="text-[10px] text-slate-500">
            3,600 ÷ Bottleneck CT
          </div>
        </div>

        {/* Total Direct Labor */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] uppercase font-bold text-purple-400">กำลังคนในสาย (Direct MP)</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-purple-300 font-mono">{balancing.actualDirectOperators}</span>
            <span className="text-xs text-slate-400">คน / กะ</span>
          </div>
          <div className="text-[10px] text-slate-500">
            ทฤษฎีขั้นต่ำ: <span className="font-mono text-slate-300">{balancing.theoreticalMinOperators} คน</span>
          </div>
        </div>

        {/* Line UPPH */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] uppercase font-bold text-cyan-400">Line UPPH</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-cyan-300 font-mono">{formatNum(balancing.actualUPPH, 2)}</span>
            <span className="text-xs text-slate-400">ชิ้น/คน-ชม.</span>
          </div>
          <div className="text-[10px] text-slate-500">
            UPH ÷ Actual MP
          </div>
        </div>
      </div>

      {/* Yamazumi Chart Section (Visual Balance Chart) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Yamazumi Chart (Cycle Time vs Takt Time Analysis)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              กราฟแสดงเวลา Cycle Time แต่ละสถานีเทียบกับเส้น Takt Time และตรวจจับสถานีคอขวด (Bottleneck)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {balancing.bottleneckStation && (
              <button
                onClick={handleOptimizeBottleneck}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-lg border border-blue-500/30 flex items-center gap-1.5 transition-colors"
                title="เพิ่มพนักงาน 1 คนที่สถานีคอขวดเพื่อแบ่งเบา Cycle Time"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                แนะนำ: เพิ่มคนแก้ Bottleneck ({balancing.bottleneckStation.name})
              </button>
            )}
          </div>
        </div>

        {/* SVG Bar Chart */}
        <div className="mt-6 relative">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-4 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-500"></span>
              <span>Bottleneck CT (สถานีช้าสุด)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
              <span>Balanced Station</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400"></span>
              <span>Takt Time ({formatNum(balancing.taktTimeSec, 1)}s)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-red-500"></span>
              <span>Bottleneck Line ({formatNum(balancing.bottleneckCTSec, 1)}s)</span>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-64 w-full bg-slate-950/60 rounded-lg border border-slate-800 p-4 relative flex items-end">
            {/* Takt Time Horizontal Guide Line */}
            {balancing.taktTimeSec > 0 && maxCTForChart > 0 && (
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-amber-400 z-10 pointer-events-none"
                style={{
                  bottom: `${Math.min(95, (balancing.taktTimeSec / maxCTForChart) * 100)}%`
                }}
              >
                <span className="absolute right-2 -top-5 text-[10px] font-mono font-bold text-amber-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Takt: {formatNum(balancing.taktTimeSec, 1)}s
                </span>
              </div>
            )}

            {/* Bottleneck Horizontal Guide Line */}
            {balancing.bottleneckCTSec > 0 && maxCTForChart > 0 && (
              <div
                className="absolute left-0 right-0 border-t border-red-500/60 z-10 pointer-events-none"
                style={{
                  bottom: `${Math.min(95, (balancing.bottleneckCTSec / maxCTForChart) * 100)}%`
                }}
              >
                <span className="absolute left-2 -top-5 text-[10px] font-mono font-bold text-red-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-red-500/30">
                  Bottleneck: {formatNum(balancing.bottleneckCTSec, 1)}s
                </span>
              </div>
            )}

            {/* Bars for each station */}
            <div className="w-full h-full flex items-end justify-around gap-2 pt-6">
              {stations.map((st) => {
                const effectiveCT = st.cycleTimeSec / Math.max(1, st.operatorsCount);
                const isBottleneck = st.id === balancing.bottleneckStation?.id;
                const heightPct = maxCTForChart > 0 ? (effectiveCT / maxCTForChart) * 100 : 0;
                const isOverTakt = balancing.taktTimeSec > 0 && effectiveCT > balancing.taktTimeSec;

                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStationId(st.id)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Tooltip value */}
                    <div className="text-[10px] font-mono text-slate-300 group-hover:text-white transition-colors mb-1 font-bold">
                      {formatNum(effectiveCT, 1)}s
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full max-w-[48px] rounded-t transition-all duration-300 relative ${
                        isBottleneck
                          ? 'bg-gradient-to-t from-red-600 to-red-400 shadow-lg shadow-red-500/20'
                          : isOverTakt
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                          : 'bg-gradient-to-t from-blue-700 to-blue-500'
                      }`}
                      style={{ height: `${Math.max(4, Math.min(96, heightPct))}%` }}
                    >
                      {/* Operator count pill */}
                      {st.operatorsCount > 1 && (
                        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-slate-900/80 text-white px-1 rounded">
                          {st.operatorsCount}P
                        </span>
                      )}
                    </div>

                    {/* Station Name Label */}
                    <div className="mt-2 text-center">
                      <div className="text-[11px] font-mono font-bold text-slate-300 truncate max-w-[60px]">
                        {st.name}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[60px]">
                        {st.operatorsCount} คน
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Station Details Table & Editor */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              ตารางกำหนดสถานีงานและเวลา Cycle Time (Station Engineering Table)
            </h3>
            <p className="text-xs text-slate-400">
              กำหนดเวลา Cycle Time รายสถานี, จำนวนพนักงานประจำสถานี, และตรวจสอบ Line Balancing
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddStation}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มสถานี (Add Station)
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-16">รหัสสถานี</th>
                <th className="py-2.5 px-3 min-w-[180px]">ชื่อกระบวนการ / รายละเอียดงาน</th>
                <th className="py-2.5 px-3 text-right w-28">CT รวม (วินาที)</th>
                <th className="py-2.5 px-3 text-center w-24">พนักงาน (คน)</th>
                <th className="py-2.5 px-3 text-right w-28">CT สุทธิ/คน (วินาที)</th>
                <th className="py-2.5 px-3 text-right w-28">กำลังผลิต (UPH)</th>
                <th className="py-2.5 px-3 text-center w-28">สถานะ Balancing</th>
                <th className="py-2.5 px-3 text-center w-12">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono-numbers">
              {stations.map((st) => {
                const effCT = st.cycleTimeSec / Math.max(1, st.operatorsCount);
                const uph = effCT > 0 ? 3600 / effCT : 0;
                const isBottleneck = st.id === balancing.bottleneckStation?.id;
                const isOverTakt = balancing.taktTimeSec > 0 && effCT > balancing.taktTimeSec;

                return (
                  <tr
                    key={st.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isBottleneck ? 'bg-red-950/20' : ''
                    }`}
                  >
                    {/* Station Name */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={st.name}
                        onChange={(e) => handleUpdateStation(st.id, 'name', e.target.value)}
                        className="w-16 px-1.5 py-1 bg-slate-950 border border-slate-700 rounded text-center text-slate-200 font-mono font-bold focus:border-blue-500 focus:outline-none"
                      />
                    </td>

                    {/* Process Name */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={st.processName}
                        onChange={(e) => handleUpdateStation(st.id, 'processName', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 font-sans focus:border-blue-500 focus:outline-none"
                        placeholder="ระบุชื่องานขั้นตอนการผลิต"
                      />
                    </td>

                    {/* Cycle Time */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={st.cycleTimeSec}
                        onChange={(e) =>
                          handleUpdateStation(st.id, 'cycleTimeSec', Math.max(0.1, parseFloat(e.target.value) || 0))
                        }
                        className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right text-emerald-400 font-mono font-bold focus:border-blue-500 focus:outline-none"
                      />
                    </td>

                    {/* Operators */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStation(st.id, 'operatorsCount', Math.max(1, st.operatorsCount - 1))
                          }
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-mono font-bold text-slate-200">
                          {st.operatorsCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateStation(st.id, 'operatorsCount', st.operatorsCount + 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Effective CT */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={isBottleneck ? 'text-red-400' : 'text-slate-200'}>
                        {formatNum(effCT, 1)}s
                      </span>
                    </td>

                    {/* Station Capacity UPH */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {Math.floor(uph)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center font-sans">
                      {isBottleneck ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          คอขวด (Bottleneck)
                        </span>
                      ) : isOverTakt ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          เกิน Takt
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ผ่านเกณฑ์
                        </span>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteStation(st.id)}
                        disabled={stations.length <= 1}
                        className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-30 disabled:hover:text-slate-500 p-1"
                        title="ลบสถานีนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-950 text-slate-300 font-semibold border-t border-slate-800">
              <tr>
                <td colSpan={2} className="py-3 px-3 text-slate-400 font-sans">
                  ผลรวมทั้งสายการผลิต ({stations.length} สถานี)
                </td>
                <td className="py-3 px-3 text-right text-emerald-400 font-mono">
                  {formatNum(balancing.totalWorkContentSec, 1)}s
                </td>
                <td className="py-3 px-3 text-center text-purple-400 font-mono">
                  {balancing.actualDirectOperators} คน
                </td>
                <td className="py-3 px-3 text-right text-red-400 font-mono font-bold">
                  {formatNum(balancing.bottleneckCTSec, 1)}s (Max)
                </td>
                <td className="py-3 px-3 text-right text-emerald-400 font-mono font-bold">
                  {Math.floor(balancing.lineCapacityUPH)} UPH
                </td>
                <td colSpan={2} className="py-3 px-3 text-center font-sans text-xs">
                  Efficiency: {formatNum(balancing.lineBalanceEfficiencyPct, 1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
