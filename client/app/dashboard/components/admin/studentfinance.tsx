"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { DollarSign, Wallet, School, Users, Save, Loader2 } from "lucide-react";
import {
  useAdminFinanceStudents,
  useAdminFinanceSummary,
  useAdminFinanceFees,
  useUpdateAdminFinanceFees,
} from "../../../../hooks/useFinance";
import { getApiErrorMessage } from "../../../../utils/apiError";

const GRADES = [9, 10, 11, 12] as const;

const toFeeInputState = (feeMap: Map<number, number>): Record<number, string> => ({
  9: String(feeMap.get(9) ?? ""),
  10: String(feeMap.get(10) ?? ""),
  11: String(feeMap.get(11) ?? ""),
  12: String(feeMap.get(12) ?? ""),
});

export default function StudentFinanceView() {
  const [gradeFilter, setGradeFilter] = useState<number | "all">("all");
  const [feeInputs, setFeeInputs] = useState<Record<number, string>>({ 9: "", 10: "", 11: "", 12: "" });

  const gradeParam = gradeFilter === "all" ? undefined : gradeFilter;

  const { data: students = [], isLoading: loadingStudents } = useAdminFinanceStudents(gradeParam);
  const { data: summary, isLoading: loadingSummary } = useAdminFinanceSummary();
  const { data: fees = [], isLoading: loadingFees } = useAdminFinanceFees();
  const updateFees = useUpdateAdminFinanceFees();

  const feeMap = useMemo(() => {
    const map = new Map<number, number>();
    fees.forEach((f) => map.set(f.grade, f.amount));
    return map;
  }, [fees]);

  const groupedStudents = useMemo(() => {
    const groups = new Map<
      string,
      { grade: number; academicYear: string; students: typeof students }
    >();

    students.forEach((student) => {
      const key = `${student.grade}-${student.academicYear}`;
      const existing = groups.get(key);
      if (existing) {
        existing.students.push(student);
      } else {
        groups.set(key, {
          grade: student.grade,
          academicYear: student.academicYear,
          students: [student],
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      return a.academicYear.localeCompare(b.academicYear);
    });
  }, [students]);

  useEffect(() => {
    if (!fees.length) return;
    setFeeInputs((prev) => {
      const hasLocalValue = GRADES.some((grade) => prev[grade] !== "");
      if (hasLocalValue) return prev;
      return toFeeInputState(feeMap);
    });
  }, [fees, feeMap]);

  const onSaveFees = async () => {
    try {
      const payload = GRADES.map((grade) => ({
        grade,
        amount: Number(feeInputs[grade]) || 0,
      }));
      await updateFees.mutateAsync(payload);
      setFeeInputs({ 9: "", 10: "", 11: "", 12: "" });
      toast.success("Fee structure updated.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update fee structure"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white"> Finance from Students</h2>
        
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Wallet className="w-4 h-4 text-emerald-400" />
          Set how much students pay based on their grade.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {GRADES.map((grade) => (
            <label key={grade} className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3 space-y-2">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Grade{grade}</p>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={feeInputs[grade]}
                onChange={(e) => setFeeInputs((p) => ({ ...p, [grade]: e.target.value }))}
                className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-slate-100 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={onSaveFees}
          disabled={updateFees.isPending || loadingFees}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-300 text-white text-sm font-semibold transition"
        >
          {updateFees.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Fee Structure
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { label: "Total School Income", value: summary?.totalIncome ?? 0, icon: DollarSign, color: "text-emerald-400" },
          { label: "Grade 9 Income", value: summary?.incomeByGrade?.[9] ?? 0, icon: School, color: "text-indigo-400" },
          { label: "Grade 10 Income", value: summary?.incomeByGrade?.[10] ?? 0, icon: School, color: "text-blue-400" },
          { label: "Grade 11 Income", value: summary?.incomeByGrade?.[11] ?? 0, icon: School, color: "text-amber-400" },
          { label: "Grade 12 Income", value: summary?.incomeByGrade?.[12] ?? 0, icon: School, color: "text-violet-400" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">{card.label}</p>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-white text-xl font-bold">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h3 className="text-white font-semibold">Student Finance Records</h3>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-200 text-sm"
            >
              <option value="all">All Grades</option>
              {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
        </div>

        {(loadingStudents || loadingSummary) ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : groupedStudents.length === 0 ? (
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-6 text-center text-slate-400">
            No students found for this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {groupedStudents.map((group) => (
              <div key={`${group.grade}-${group.academicYear}`} className="rounded-xl border border-slate-800/70 bg-slate-950/40 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800/60 bg-slate-900/50">
                  <p className="text-white font-semibold">
                    Grade {group.grade} · Academic Year {group.academicYear}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {group.students.length} student{group.students.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-950/60 border-b border-slate-800/70">
                      <tr>
                        {["Student Name", "Student ID", "Total Fee", "Paid Amount", "Remaining", "Status"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.students.map((s) => (
                        <tr key={s.studentId} className="border-b border-slate-800/40 last:border-none">
                          <td className="px-4 py-3 text-slate-100">{s.studentName}</td>
                          <td className="px-4 py-3 text-slate-300 font-mono text-xs">{s.studentCode}</td>
                          <td className="px-4 py-3 text-slate-300">{s.totalFee.toLocaleString()}</td>
                          <td className="px-4 py-3 text-emerald-300 font-semibold">{s.paidAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-300">{s.remainingBalance}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
