"use client";

import { useMemo, useState } from "react";
import { Loader2, Wallet, Users, School } from "lucide-react";
import { useFinanceStudents, useFinanceSummary } from "../../../../hooks/useFinance";

const GRADES = [9, 10, 11, 12] as const;

export default function FinanceStudentView() {
  const [gradeFilter, setGradeFilter] = useState<number | "all">("all");
  const gradeParam = gradeFilter === "all" ? undefined : gradeFilter;

  const { data: students = [], isLoading: loadingStudents } = useFinanceStudents(gradeParam);
  const { data: summary, isLoading: loadingSummary } = useFinanceSummary();

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">All finance from students</h2>
        <p className="text-slate-400 text-sm mt-1">All registered students are auto-marked as fully paid by grade fee structure.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Total Income</p>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-white text-xl font-bold">{(summary?.totalIncome ?? 0).toLocaleString()}</p>
        </div>
        {GRADES.map((grade) => (
          <div key={grade} className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Grade {grade} Income</p>
              <School className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-white text-xl font-bold">{(summary?.incomeByGrade?.[grade] ?? 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-white font-semibold">Finance Records</h3>
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
                        {["Student", "Student ID", "Total Fee", "Paid", "Remaining", "Status"].map((h) => (
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
