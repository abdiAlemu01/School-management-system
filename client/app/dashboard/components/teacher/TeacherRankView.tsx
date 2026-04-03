"use client";

import { useMemo, useState } from "react";
import {
  Trophy,
  Medal,
  Users,
  BookOpen,
  ChevronDown,
  AlertCircle,
  Loader2,
  BarChart3,
} from "lucide-react";
import { useTeacherSections, useClassRanks } from "../../../../hooks/useTeacher";
import { formatEthiopianYear } from "../../../../utils/ethiopianYear";
import type { ClassRankEntry, SemesterInfo } from "../../../../services/teacher.api";

// ─── helpers ──────────────────────────────────────────────────────────────────

const rankIcon = (rank: number | null) => {
  if (rank === 1) return <Trophy  className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal   className="w-4 h-4 text-slate-300"  />;
  if (rank === 3) return <Medal   className="w-4 h-4 text-amber-600"  />;
  return null;
};

const rankBadge = (rank: number | null) => {
  if (rank === null) return <span className="text-slate-600">—</span>;
  const base = "inline-flex items-center justify-center gap-1 font-bold";
  if (rank === 1) return <span className={`${base} text-yellow-400`}>{rankIcon(1)} 1st</span>;
  if (rank === 2) return <span className={`${base} text-slate-300`}>{rankIcon(2)} 2nd</span>;
  if (rank === 3) return <span className={`${base} text-amber-500`}>{rankIcon(3)} 3rd</span>;
  return <span className="text-slate-300 font-semibold">#{rank}</span>;
};

const scoreBadge = (score: number, outOf: number) => {
  const pct = outOf > 0 ? (score / outOf) * 100 : 0;
  if (pct >= 80) return "text-emerald-400";
  if (pct >= 60) return "text-blue-400";
  if (pct >= 50) return "text-amber-400";
  return "text-rose-400";
};

// ─── sub-components ──────────────────────────────────────────────────────────

interface RankTableProps {
  students: ClassRankEntry[];
  semesters: SemesterInfo[];
  semesterId: string;
}

const RankTable = ({ students, semesters, semesterId }: RankTableProps) => {
  const isCombined = semesterId === "all";

  if (!students.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <BarChart3 className="w-10 h-10 text-slate-600" />
        <p className="text-slate-500 text-sm">No marks recorded yet for this selection.</p>
      </div>
    );
  }

  const maxTotal = isCombined
    ? students[0]?.totalScore ?? 0
    : students[0]?.totalScore ?? 0;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/60">
            <th className="px-4 py-3 text-left text-slate-500 font-semibold w-16">Rank</th>
            <th className="px-4 py-3 text-left text-slate-500 font-semibold">Student</th>
            <th className="px-4 py-3 text-center text-slate-500 font-semibold w-24">ID</th>
            {isCombined &&
              semesters.map((sem) => (
                <th
                  key={sem._id}
                  className="px-4 py-3 text-center text-slate-500 font-semibold w-28"
                >
                  {sem.name}
                </th>
              ))}
            <th className="px-4 py-3 text-center text-slate-500 font-semibold w-28">Total</th>
            <th className="px-4 py-3 text-center text-slate-500 font-semibold w-24">Average</th>
            <th className="px-4 py-3 text-center text-slate-500 font-semibold w-24">Subjects</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => {
            const rowBg =
              s.rank === 1
                ? "bg-yellow-500/5"
                : s.rank === 2
                ? "bg-slate-400/5"
                : s.rank === 3
                ? "bg-amber-600/5"
                : i % 2 === 0
                ? "bg-transparent"
                : "bg-slate-900/20";

            return (
              <tr
                key={s.id}
                className={`${rowBg} border-b border-slate-800/50 hover:bg-indigo-500/5 transition-colors`}
              >
                {/* Rank */}
                <td className="px-4 py-3 text-center">{rankBadge(s.rank)}</td>

                {/* Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-slate-200 font-medium truncate max-w-[160px]">
                      {s.name}
                    </span>
                  </div>
                </td>

                {/* Student ID */}
                <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">
                  {s.studentId}
                </td>

                {/* Per-semester totals (combined view only) */}
                {isCombined &&
                  semesters.map((sem) => {
                    const bd = s.semesterBreakdown?.[sem._id];
                    const t = bd?.total ?? 0;
                    return (
                      <td key={sem._id} className="px-4 py-3 text-center">
                        <span className={`font-semibold ${scoreBadge(t, (bd?.count ?? 0) * 100)}`}>
                          {t}
                        </span>
                        {bd?.count ? (
                          <span className="text-slate-600 text-xs ml-1">
                            /{(bd.count * 100)}
                          </span>
                        ) : (
                          <span className="text-slate-700 text-xs ml-1">—</span>
                        )}
                      </td>
                    );
                  })}

                {/* Total */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`font-bold text-base ${
                      s.rank === 1
                        ? "text-yellow-400"
                        : s.rank === 2
                        ? "text-slate-300"
                        : s.rank === 3
                        ? "text-amber-500"
                        : scoreBadge(s.totalScore, s.courseCount * 100)
                    }`}
                  >
                    {s.totalScore}
                  </span>
                  <span className="text-slate-600 text-xs ml-1">/{s.courseCount * 100}</span>
                </td>

                {/* Average */}
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${scoreBadge(s.average, 100)}`}>
                    {s.average.toFixed(1)}
                  </span>
                  <span className="text-slate-600 text-xs">/100</span>
                </td>

                {/* Subjects count */}
                <td className="px-4 py-3 text-center text-slate-400">
                  {s.courseCount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

export default function TeacherRankView() {
  const { data: sections = [], isLoading: sectionsLoading } = useTeacherSections();

  // Deduplicate sections by classId → one entry per class
  const classes = useMemo(() => {
    const seen = new Set<string>();
    return sections.filter((s) => {
      if (seen.has(s.classId)) return false;
      seen.add(s.classId);
      return true;
    });
  }, [sections]);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [semesterId,      setSemesterId]      = useState<string>("all");

  const selectedClass = classes.find((c) => c.classId === selectedClassId);

  const {
    data: rankData,
    isLoading: rankLoading,
    error: rankError,
  } = useClassRanks(selectedClassId || undefined, semesterId);

  const { students = [], semesters = [] } = rankData ?? {};

  // Tabs: one per semester + "Combined"
  const tabs: Array<{ id: string; label: string }> = [
    { id: "all", label: "Combined" },
    ...semesters.map((s) => ({ id: s._id, label: s.name })),
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Class Rank
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            View student rankings by semester or combined score
          </p>
        </div>
      </div>

      {/* Class selector */}
      {sectionsLoading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading classes…
        </div>
      ) : classes.length === 0 ? (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          No classes assigned yet. Contact the Department Head to set up your timetable.
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSemesterId("all");
              }}
              className="appearance-none bg-slate-800/60 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-w-[220px]"
            >
              <option value="">— Select a Class —</option>
              {classes.map((c) => (
                <option key={c.classId} value={c.classId}>
                  Grade {c.grade}
                  {c.section ? ` – Section ${c.section}` : ""}
                  {c.stream ? ` (${c.stream})` : ""}
                  {c.academicYear ? `  •  ${formatEthiopianYear(c.academicYear)}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {selectedClass && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
              <Users className="w-4 h-4" />
              <span>
                Grade {selectedClass.grade}
                {selectedClass.section ? ` – Section ${selectedClass.section}` : ""}
              </span>
              <span className="text-indigo-500">•</span>
              <BookOpen className="w-3.5 h-3.5" />
              <span>{sections.filter((s) => s.classId === selectedClassId).length} subjects</span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {!selectedClassId ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-600">
          <Trophy className="w-12 h-12 opacity-40" />
          <p className="text-sm">Select a class above to see the student ranking.</p>
        </div>
      ) : rankLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading ranks…</p>
        </div>
      ) : rankError ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {(rankError as Error).message ?? "Failed to load ranks."}
        </div>
      ) : (
        <div className="space-y-4">

          {/* Semester tabs */}
          {tabs.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSemesterId(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    semesterId === tab.id
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                      : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Summary cards */}
          {students.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Students Ranked",
                  value: students.filter((s) => s.rank !== null).length,
                  color: "text-indigo-400",
                  bg:    "bg-indigo-500/10 border-indigo-500/20",
                },
                {
                  label: "Top Score",
                  value: students[0]?.totalScore ?? 0,
                  color: "text-yellow-400",
                  bg:    "bg-yellow-500/10 border-yellow-500/20",
                },
                {
                  label: "Class Average",
                  value:
                    students.filter((s) => s.courseCount > 0).length > 0
                      ? (
                          students
                            .filter((s) => s.courseCount > 0)
                            .reduce((sum, s) => sum + s.average, 0) /
                          students.filter((s) => s.courseCount > 0).length
                        ).toFixed(1)
                      : "—",
                  color: "text-emerald-400",
                  bg:    "bg-emerald-500/10 border-emerald-500/20",
                },
                {
                  label: "Total Students",
                  value: students.length,
                  color: "text-slate-300",
                  bg:    "bg-slate-800/60 border-slate-700",
                },
              ].map(({ label, value, color, bg }) => (
                <div
                  key={label}
                  className={`rounded-xl p-3 border ${bg} flex flex-col gap-1`}
                >
                  <p className="text-slate-500 text-xs">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Rank table */}
          <RankTable
            students={students}
            semesters={semesters}
            semesterId={semesterId}
          />
        </div>
      )}
    </div>
  );
}
