import { Printer, X, Download, FileText, CheckCircle2 } from 'lucide-react';
import { ProjectPreset, Workstation, IndirectLaborItem, TopDownCalculationInput, SpeedLineInput } from '../types/engineering';
import { calculateTopDownManpower, calculateLineBalancing, calculateSpeedLine, calculateManpowerRequest, formatNum } from '../utils/engineeringMath';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preset: ProjectPreset;
  topDown: TopDownCalculationInput;
  stations: Workstation[];
  speedLine: SpeedLineInput;
  indirectRoles: IndirectLaborItem[];
  allowancePFDPct: number;
  absenteeismPct: number;
  hourlyWageThb: number;
}

export function ExportReportModal({
  isOpen,
  onClose,
  preset,
  topDown,
  stations,
  speedLine,
  indirectRoles,
  allowancePFDPct,
  absenteeismPct,
  hourlyWageThb
}: Props) {
  if (!isOpen) return null;

  const topDownResult = calculateTopDownManpower(
    topDown.targetOutputDaily,
    topDown.workingHoursDaily,
    topDown.targetUPPH
  );

  const balancing = calculateLineBalancing(
    stations,
    topDown.regularHoursPerShift + topDown.overtimeHoursPerShift,
    topDown.targetOutputDaily / topDown.shiftsCount
  );

  const speedLineResult = calculateSpeedLine({
    pitchDistanceM: speedLine.pitchDistanceM,
    cycleTimeSec: speedLine.cycleTimeSec,
    conveyorLengthM: speedLine.conveyorLengthM
  });

  const manpowerRequest = calculateManpowerRequest(
    stations.length > 0 ? balancing.actualDirectOperators : topDownResult.requiredMPRounded,
    allowancePFDPct,
    absenteeismPct,
    indirectRoles,
    topDown.shiftsCount,
    hourlyWageThb,
    topDown.regularHoursPerShift + topDown.overtimeHoursPerShift
  );

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4 sm:p-6 no-print-backdrop">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto text-slate-100">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm text-white">
              รายงานวิศวกรรมอุตสาหการ (IE Engineering Specification Document)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
            >
              <Printer className="w-4 h-4" />
              พิมพ์รายงาน / บันทึกเป็น PDF (Print)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 text-slate-900 bg-white print-card" id="printable-area">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                INDUSTRIAL ENGINEERING PRODUCTIVITY & LINE BALANCING REPORT
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                รายงานการคำนวณ UPH, CT, UPPH, Speed Line และแผนขออัตรากำลังคนประจำสายการผลิต
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-600 space-y-0.5">
              <div><strong>DOC NO:</strong> IE-PRD-{new Date().getFullYear()}-001</div>
              <div><strong>DATE:</strong> {currentDate}</div>
              <div><strong>STATUS:</strong> APPROVED FOR REVIEW</div>
            </div>
          </div>

          {/* Project Overview Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
            <div>
              <span className="text-slate-500 block">สายการผลิต / โครงการ:</span>
              <strong className="text-slate-900">{preset.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">เป้าหมายยอดผลิต:</span>
              <strong className="text-slate-900">{topDown.targetOutputDaily.toLocaleString('th-TH')} ชิ้น/วัน</strong>
            </div>
            <div>
              <span className="text-slate-500 block">เวลาทำงานต่อวัน:</span>
              <strong className="text-slate-900">{topDown.workingHoursDaily.toFixed(1)} ชั่วโมง</strong>
            </div>
            <div>
              <span className="text-slate-500 block">จำนวนกะทำงาน:</span>
              <strong className="text-slate-900">{topDown.shiftsCount} กะ ({topDown.shiftsCount * 8} ชม.)</strong>
            </div>
          </div>

          {/* Section 1: Top-Down Manpower & UPPH (Screenshot formula style) */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              1. สูตรการคำนวณกำลังคน (Required Manpower Formula)
            </h2>
            <div className="p-4 bg-slate-50 border border-slate-300 rounded font-serif text-center space-y-2">
              <div className="text-sm font-medium">
                Required MP = <span className="font-mono underline">Daily Output</span> ÷ (<span className="font-mono">Working Hours × UPPH</span>)
              </div>
              <div className="text-xs font-mono text-slate-700">
                = {topDown.targetOutputDaily.toLocaleString('th-TH')} ÷ ({topDown.workingHoursDaily.toFixed(1)} × {topDown.targetUPPH.toFixed(2)})
                = {topDown.targetOutputDaily.toLocaleString('th-TH')} ÷ {topDownResult.outputPerPersonPerShift.toFixed(2)}
                = <strong>{topDownResult.requiredMPExact.toFixed(2)} คน</strong> (ปัดขึ้นเป็น <strong>{topDownResult.requiredMPRounded.toLocaleString('th-TH')} คน</strong>)
              </div>
            </div>

            <table className="w-full text-xs text-left border border-slate-300 mt-2">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="p-2">ดัชนีชี้วัด (KPI)</th>
                  <th className="p-2 text-right">ค่าที่กำหนด (Input)</th>
                  <th className="p-2 text-right">ผลการคำนวณ (Result)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                <tr>
                  <td className="p-2 font-sans">เป้าหมายการผลิต (Daily Output)</td>
                  <td className="p-2 text-right">{topDown.targetOutputDaily.toLocaleString('th-TH')}</td>
                  <td className="p-2 text-right font-bold">{topDown.targetOutputDaily.toLocaleString('th-TH')} Unit/Day</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">เวลาทำงานรวม (Working Hours)</td>
                  <td className="p-2 text-right">{topDown.workingHoursDaily.toFixed(1)} ชม.</td>
                  <td className="p-2 text-right">{topDown.workingHoursDaily.toFixed(1)} Hr/Day</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">UPPH Target (Units Per Person-Hour)</td>
                  <td className="p-2 text-right">{topDown.targetUPPH.toFixed(2)}</td>
                  <td className="p-2 text-right font-bold">{topDown.targetUPPH.toFixed(2)} Unit/Person-Hr</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="p-2 font-sans">Output ต่อพนักงานต่อกะ</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">{topDownResult.outputPerPersonPerShift.toFixed(2)} Unit/Person/Shift</td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td className="p-2 font-sans">กำลังคนที่ต้องใช้ตามสูตร (Required MP)</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right text-blue-800 text-sm">{topDownResult.requiredMPRounded.toLocaleString('th-TH')} คน</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Workstation Balancing Table */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              2. ตารางวิเคราะห์ Line Balancing & Cycle Time ({stations.length} สถานี)
            </h2>
            <div className="flex gap-4 text-xs font-mono mb-1 text-slate-700">
              <span>LBE: <strong>{formatNum(balancing.lineBalanceEfficiencyPct, 1)}%</strong></span>
              <span>Bottleneck CT: <strong>{formatNum(balancing.bottleneckCTSec, 1)}s</strong> ({balancing.bottleneckStation?.name})</span>
              <span>Line Capacity: <strong>{Math.floor(balancing.lineCapacityUPH)} UPH</strong></span>
              <span>Takt Time: <strong>{formatNum(balancing.taktTimeSec, 1)}s</strong></span>
            </div>
            <table className="w-full text-xs text-left border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 font-mono">
                <tr>
                  <th className="p-1.5">Station</th>
                  <th className="p-1.5">Process Name</th>
                  <th className="p-1.5 text-right">CT (s)</th>
                  <th className="p-1.5 text-center">MP (คน)</th>
                  <th className="p-1.5 text-right">Eff. CT</th>
                  <th className="p-1.5 text-right">Station UPH</th>
                  <th className="p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {stations.map((st) => {
                  const effCT = st.cycleTimeSec / Math.max(1, st.operatorsCount);
                  const isBottleneck = st.id === balancing.bottleneckStation?.id;
                  return (
                    <tr key={st.id} className={isBottleneck ? 'bg-red-50 font-bold' : ''}>
                      <td className="p-1.5">{st.name}</td>
                      <td className="p-1.5 font-sans">{st.processName}</td>
                      <td className="p-1.5 text-right">{st.cycleTimeSec}s</td>
                      <td className="p-1.5 text-center">{st.operatorsCount}</td>
                      <td className="p-1.5 text-right">{effCT.toFixed(1)}s</td>
                      <td className="p-1.5 text-right">{Math.floor(3600 / effCT)}</td>
                      <td className="p-1.5 text-center font-sans">
                        {isBottleneck ? 'Bottleneck' : 'OK'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section 3: Speed Line & Conveyor Kinematics */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              3. พารามิเตอร์สายพานลำเลียง (Speed Line & Conveyor Kinematics)
            </h2>
            <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono">
              <div>
                <span className="text-slate-500 block font-sans">ความเร็วสายพาน:</span>
                <strong>{formatNum(speedLineResult.lineSpeedMPerMin, 2)} m/min</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">ระยะพิตช์ (Pitch):</span>
                <strong>{speedLine.pitchDistanceM} เมตร</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">เวลาเดินทาง (Transit):</span>
                <strong>{speedLineResult.transitTimeFormatted}</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">WIP บนสายพาน:</span>
                <strong>{speedLineResult.wipOnConveyorUnits} ชิ้น</strong>
              </div>
            </div>
          </div>

          {/* Section 4: Manpower Request Summary */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              4. สรุปขออนุมัติอัตรากำลังคน (Final Headcount Request)
            </h2>
            <table className="w-full text-xs text-left border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 font-mono">
                <tr>
                  <th className="p-2">ประเภทแรงงาน</th>
                  <th className="p-2 text-right">จำนวนต่อกะ</th>
                  <th className="p-2 text-right">รวมทั้งโรงงาน ({topDown.shiftsCount} กะ)</th>
                  <th className="p-2">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                <tr>
                  <td className="p-2 font-sans">แรงงานทางตรงสุทธิ (Direct Labor Total)</td>
                  <td className="p-2 text-right font-bold">{manpowerRequest.directLaborTotalPerShift} คน</td>
                  <td className="p-2 text-right font-bold">{manpowerRequest.directLaborTotalPerShift * topDown.shiftsCount} คน</td>
                  <td className="p-2 font-sans text-slate-600">รวมเผื่อ PF&D {allowancePFDPct}% + ลา {absenteeismPct}%</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">แรงงานทางอ้อม (Indirect Labor Total)</td>
                  <td className="p-2 text-right font-bold">{manpowerRequest.indirectLaborPerShift} คน</td>
                  <td className="p-2 text-right font-bold">{manpowerRequest.indirectLaborPerShift * topDown.shiftsCount} คน</td>
                  <td className="p-2 font-sans text-slate-600">หัวหน้ากะ, QC, ช่าง, Water Spider</td>
                </tr>
                <tr className="bg-slate-100 font-bold text-sm">
                  <td className="p-2 font-sans text-slate-900">ยอดรวมขออนุมัติทั้งหมด (Total Plant Request)</td>
                  <td className="p-2 text-right text-slate-900">{manpowerRequest.totalLaborPerShift} คน/กะ</td>
                  <td className="p-2 text-right text-blue-900">{manpowerRequest.totalPlantHeadcount} อัตรา</td>
                  <td className="p-2 font-sans text-slate-600">งบประมาณ ~{(manpowerRequest.estimatedLaborCostPerDay || 0).toLocaleString()} ฿/วัน</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: Engineering Approval Signatures */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <div className="font-bold">จัดทำโดย (Prepared By)</div>
              <div className="text-slate-600">วิศวกรอุตสาหการ (IE Engineer)</div>
              <div className="text-slate-400">วันที่: ..... / ..... / .........</div>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <div className="font-bold">ตรวจสอบโดย (Checked By)</div>
              <div className="text-slate-600">ผู้จัดการฝ่ายผลิต (Production Manager)</div>
              <div className="text-slate-400">วันที่: ..... / ..... / .........</div>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <div className="font-bold">อนุมัติโดย (Approved By)</div>
              <div className="text-slate-600">ผู้อำนวยการโรงงาน (Plant Director)</div>
              <div className="text-slate-400">วันที่: ..... / ..... / .........</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
