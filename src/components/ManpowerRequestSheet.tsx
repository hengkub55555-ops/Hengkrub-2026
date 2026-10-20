import { useState } from 'react';
import { FileSpreadsheet, Plus, Trash2, Users, DollarSign, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { IndirectLaborItem, Workstation } from '../types/engineering';
import { calculateManpowerRequest, formatNum } from '../utils/engineeringMath';

interface Props {
  directLaborBase: number;
  indirectRoles: IndirectLaborItem[];
  onChangeIndirectRoles: (roles: IndirectLaborItem[]) => void;
  allowancePFDPct: number;
  onChangeAllowancePFD: (pct: number) => void;
  absenteeismPct: number;
  onChangeAbsenteeism: (pct: number) => void;
  shiftsCount: number;
  onChangeShiftsCount: (shifts: number) => void;
  hourlyWageThb: number;
  onChangeHourlyWage: (wage: number) => void;
  hoursPerShift: number;
  workingDaysPerMonth?: number;
}

export function ManpowerRequestSheet({
  directLaborBase,
  indirectRoles,
  onChangeIndirectRoles,
  allowancePFDPct,
  onChangeAllowancePFD,
  absenteeismPct,
  onChangeAbsenteeism,
  shiftsCount,
  onChangeShiftsCount,
  hourlyWageThb,
  onChangeHourlyWage,
  hoursPerShift,
  workingDaysPerMonth = 26
}: Props) {
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleCount, setNewRoleCount] = useState(1);
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const request = calculateManpowerRequest(
    directLaborBase,
    allowancePFDPct,
    absenteeismPct,
    indirectRoles,
    shiftsCount,
    hourlyWageThb,
    hoursPerShift
  );

  const monthlyLaborCost = (request.estimatedLaborCostPerDay || 0) * workingDaysPerMonth;

  const handleAddIndirectRole = () => {
    if (!newRoleTitle.trim()) return;
    const newRole: IndirectLaborItem = {
      id: `ir-${Date.now()}`,
      role: newRoleTitle.trim(),
      ratioType: 'fixed_per_line',
      countPerLine: Math.max(1, newRoleCount),
      description: newRoleDesc.trim() || 'ฝ่ายสนับสนุนสายการผลิต'
    };
    onChangeIndirectRoles([...indirectRoles, newRole]);
    setNewRoleTitle('');
    setNewRoleCount(1);
    setNewRoleDesc('');
  };

  const handleDeleteIndirectRole = (id: string) => {
    onChangeIndirectRoles(indirectRoles.filter((r) => r.id !== id));
  };

  const handleUpdateIndirectRoleCount = (id: string, count: number) => {
    onChangeIndirectRoles(
      indirectRoles.map((r) => (r.id === id ? { ...r, countPerLine: Math.max(1, count) } : r))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              แบบฟอร์มขออัตรากำลังคนวิศวกรรม (IE Manpower Request & Headcount Plan)
            </h2>
            <p className="text-xs text-slate-400">
              การคำนวณขออัตรากำลังคนทั้ง Direct Labor (แรงงานทางตรง), ค่าเผื่อ Allowance, และ Indirect Labor (แรงงานทางอ้อม)
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-purple-300 bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-800/40">
          Total Plant: {request.totalPlantHeadcount.toLocaleString('th-TH')} อัตรา
        </div>
      </div>

      {/* Main Form Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Allowances & Configuration */}
        <div className="lg:col-span-5 space-y-4">
          {/* Allowances Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              การกำหนดค่าเผื่อทางสรีรวิทยา & การลา (Allowances)
            </h3>

            {/* PF&D Allowance */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  ค่าเผื่อเหนื่อยล้า & ธุระส่วนตัว (PF&D Allowance)
                </label>
                <span className="text-xs font-mono text-amber-400 font-bold">{allowancePFDPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={allowancePFDPct}
                onChange={(e) => onChangeAllowancePFD(parseFloat(e.target.value) || 0)}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0%</span>
                <span>มาตรฐานโรงงาน: 5% - 10%</span>
                <span>20%</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                + เพิ่มพนักงานบรรเทาความเมื่อยล้า: <span className="font-mono text-amber-300">{request.pfdOperatorsAdded.toFixed(1)}</span> คน
              </div>
            </div>

            {/* Absenteeism Buffer */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  ค่าเผื่อการขาด ลา มาสาย (Absenteeism & Turnover Buffer)
                </label>
                <span className="text-xs font-mono text-purple-400 font-bold">{absenteeismPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={absenteeismPct}
                onChange={(e) => onChangeAbsenteeism(parseFloat(e.target.value) || 0)}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0%</span>
                <span>มาตรฐาน: 3% - 6%</span>
                <span>15%</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                + เพิ่มพนักงานสำรองการลา: <span className="font-mono text-purple-300">{request.absenteeismOperatorsAdded.toFixed(1)}</span> คน
              </div>
            </div>

            {/* Shifts & Wages */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">จำนวนกะการทำงาน (Shifts)</label>
                <select
                  value={shiftsCount}
                  onChange={(e) => onChangeShiftsCount(parseInt(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs font-mono focus:border-blue-500"
                >
                  <option value={1}>1 กะ (Day Shift)</option>
                  <option value={2}>2 กะ (Day + Night)</option>
                  <option value={3}>3 กะ (24 Hours Cont.)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">อัตราค่าจ้างเฉลี่ย (บาท/ชม.)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={hourlyWageThb}
                  onChange={(e) => onChangeHourlyWage(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-amber-300 text-xs font-mono focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Add Indirect Labor Role */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              เพิ่มตำแหน่งแรงงานทางอ้อม (Add Indirect Role)
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="ชื่อตำแหน่ง เช่น หัวหน้ากะ, เจ้าหน้าที่ QC"
                value={newRoleTitle}
                onChange={(e) => setNewRoleTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <input
                    type="number"
                    min="1"
                    placeholder="จำนวนคน"
                    value={newRoleCount}
                    onChange={(e) => setNewRoleCount(parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="หน้าที่รับผิดชอบ"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddIndirectRole}
                disabled={!newRoleTitle.trim()}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded text-xs font-semibold transition-colors"
              >
                เพิ่มในรายการขออัตรากำลัง
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Headcount Summary Table & Cost Estimation */}
        <div className="lg:col-span-7 space-y-4">
          {/* Executive Headcount Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                ตารางสรุปขออัตรากำลังคน (Headcount Request Matrix)
              </span>
              <span className="text-xs text-slate-400 font-mono">หน่วย: คน (Persons)</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">หมวดหมู่อัตรากำลัง (Category)</th>
                    <th className="py-2.5 px-3 text-right">จำนวนต่อกะ</th>
                    <th className="py-2.5 px-3 text-right">รวม {shiftsCount} กะ</th>
                    <th className="py-2.5 px-3">หมายเหตุ / เกณฑ์คำนวณ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono-numbers">
                  {/* Direct Labor Base */}
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      1. พนักงานประจำสถานีงาน (Direct Labor Base)
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-300 font-bold">
                      {directLaborBase.toLocaleString('th-TH')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {(directLaborBase * shiftsCount).toLocaleString('th-TH')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                      ตาม Line Balancing / แผนผลิต
                    </td>
                  </tr>

                  {/* Allowances */}
                  <tr>
                    <td className="py-2.5 px-3 font-sans text-slate-300 pl-6">
                      + ค่าเผื่อเหนื่อยล้า PF&D ({allowancePFDPct}%)
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-300">
                      +{request.pfdOperatorsAdded.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      +{(request.pfdOperatorsAdded * shiftsCount).toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                      Allowance ตามมาตรฐาน IE
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-sans text-slate-300 pl-6">
                      + ค่าเผื่อการลา & สำรอง ({absenteeismPct}%)
                    </td>
                    <td className="py-2.5 px-3 text-right text-purple-300">
                      +{request.absenteeismOperatorsAdded.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      +{(request.absenteeismOperatorsAdded * shiftsCount).toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                      Buffer รองรับ Turn over
                    </td>
                  </tr>

                  {/* Total DL Subtotal */}
                  <tr className="bg-slate-950/60 font-bold">
                    <td className="py-2.5 px-3 font-sans text-emerald-400">
                      รวมแรงงานทางตรงสุทธิ (Total Direct Labor)
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      {request.directLaborTotalPerShift.toLocaleString('th-TH')} คน
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">
                      {(request.directLaborTotalPerShift * shiftsCount).toLocaleString('th-TH')} คน
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400/80 font-sans text-[11px]">
                      ปัดเศษเต็มคนเพื่อปฏิบัติงานจริง
                    </td>
                  </tr>

                  {/* Indirect Labor Section */}
                  <tr className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                    <td colSpan={4} className="py-1.5 px-3">
                      2. แรงงานทางอ้อมและสายสนับสนุน (Indirect Labor)
                    </td>
                  </tr>

                  {indirectRoles.map((role) => (
                    <tr key={role.id}>
                      <td className="py-2.5 px-3 font-sans text-slate-300 pl-6 flex items-center justify-between">
                        <span>{role.role}</span>
                        <button
                          onClick={() => handleDeleteIndirectRole(role.id)}
                          className="text-slate-500 hover:text-red-400 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="1"
                          value={role.countPerLine}
                          onChange={(e) =>
                            handleUpdateIndirectRoleCount(role.id, parseInt(e.target.value) || 1)
                          }
                          className="w-12 px-1 py-0.5 bg-slate-950 border border-slate-700 rounded text-right text-slate-200 font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {(role.countPerLine * shiftsCount).toLocaleString('th-TH')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                        {role.description}
                      </td>
                    </tr>
                  ))}

                  {/* Grand Total */}
                  <tr className="bg-purple-950/40 font-bold text-sm border-t-2 border-purple-500/40">
                    <td className="py-3 px-3 font-sans text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      ยอดรวมขออนุมัติอัตรากำลังคน (Grand Total Headcount)
                    </td>
                    <td className="py-3 px-3 text-right text-white font-mono">
                      {request.totalLaborPerShift.toLocaleString('th-TH')} คน/กะ
                    </td>
                    <td className="py-3 px-3 text-right text-purple-300 font-mono text-base">
                      {request.totalPlantHeadcount.toLocaleString('th-TH')} คน
                    </td>
                    <td className="py-3 px-3 text-purple-200 font-sans text-xs">
                      รวมทุกกะทั้งโรงงาน
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Budget Impact Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                ประมาณการงบประมาณค่าจ้าง (Labor Budget Projection)
              </span>
              <span className="text-xs font-mono text-emerald-400">
                ฐาน {hourlyWageThb} ฿/ชม. ({hoursPerShift} ชม./กะ)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">งบประมาณค่าจ้างต่อวัน (Daily Labor Cost):</span>
                <div className="text-xl font-bold text-white font-mono mt-1">
                  {(request.estimatedLaborCostPerDay || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท/วัน
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">งบประมาณต่อเดือน (Monthly @ {workingDaysPerMonth} วัน):</span>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                  {monthlyLaborCost.toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท/เดือน
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
