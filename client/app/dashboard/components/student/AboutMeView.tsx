"use client";

import { useStudentPerformance } from "../../../../hooks/useStudent";
import { getApiErrorMessage } from "../../../../utils/apiError";
import {
  Activity, GraduationCap, Target, Trophy,
  BookOpen, BarChart2, Layers,
} from "lucide-react";
import type { SemesterStat } from "../../../../services/student.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

const rankLabel = (rank: number | null): string => {
  if (rank === null || rank === undefined) return "—";
  if (rank === 1) return "1st 🥇";
  if (rank === 2) return "2nd 🥈";
  if (rank === 3) return "3rd 🥉";
  return `${rank}th`;
};

const avgColor = (avg: number) => {
  if (avg >= 80) return "text-emerald-400";
  if (avg >= 60) return "text-blue-400";
  if (avg >= 50) return "text-amber-400";
  return "text-rose-400";
};

// ─── single stat tile ────────────────────────────────────────────────────────

function Tile({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/60 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <p className={`text-2xl font-bold ${iconColor}`}>{value}</p>
        {sub && <p className="text-slate-600 text-xs mt-0.5">{sub}</p>}
        <p className="text-slate-400 text-sm mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── one semester block ───────────────────────────────────────────────────────

function SemBlock({
  label,
  icon: Icon,
  accent,
  totalMarks,
  average,
  rank,
  courseCount,
  empty,
}: {
  label: string;
  icon: React.ElementType;
  accent: string;         // tailwind border colour
  totalMarks: number;
  average: number;
  rank: number | null;
  courseCount: number;
  empty?: boolean;
}) {
  return (
    <div className={`rounded-2xl bg-slate-900/50 border ${accent} overflow-hidden`}>
      {/* header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-800/60 bg-slate-950/30">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-white font-bold text-sm">{label}</span>
        {!empty && (
          <span className="ml-auto text-slate-600 text-xs">
            {courseCount} subject{courseCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {empty ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-700">
          <BookOpen className="w-8 h-8 opacity-40" />
          <h1 className="text-xl">No marks released yet</h1>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 p-4">
          <Tile
            label="Total Marks"
            value={totalMarks}
            sub={`/ ${courseCount * 100}`}
            icon={Target}
            iconColor="text-indigo-400"
            iconBg="bg-indigo-500/10 border-indigo-500/20"
          />
          <Tile
            label="Average"
            value={`${average.toFixed(1)}`}
            sub="out of 100"
            icon={Activity}
            iconColor={avgColor(average)}
            iconBg="bg-emerald-500/10 border-emerald-500/20"
          />
          <Tile
            label="Class Rank"
            value={rankLabel(rank)}
            icon={Trophy}
            iconColor="text-yellow-400"
            iconBg="bg-yellow-500/10 border-yellow-500/20"
          />
        </div>
      )}
    </div>
  );
}

// ─── known semester slots (always show 2 even if DB only has 1) ──────────────

const SEM_SLOTS = ["Semester 1", "Semester 2"];

// ─── main view ────────────────────────────────────────────────────────────────

export default function AboutMeView() {
  const { data, isLoading, isError, error } = useStudentPerformance();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl">
        Failed to load performance data: {getApiErrorMessage(error, "Unable to fetch performance")}
      </div>
    );
  }

  const semesters = data?.semesters ?? [];
  const combined  = data?.combined  ?? { totalMarks: 0, average: 0, rank: null, courseCount: 0 };

  // Map semester name → data so we can fill known slots
  const semMap = new Map<string, SemesterStat>();
  semesters.forEach((s) => semMap.set(s.name, s));

  const hasAnyData = combined.courseCount > 0;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* title */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-indigo-400" />
          Performance Overview
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Your academic results for each semester and overall.
        </p>
      </div>

      {/* ── Semester 1 & Semester 2 side-by-side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SEM_SLOTS.map((name, i) => {
          const d = semMap.get(name);
          return (
            <SemBlock
              key={name}
              label={name}
              icon={BookOpen}
              accent={i === 0 ? "border-indigo-500/30" : "border-violet-500/30"}
              totalMarks={d?.totalMarks ?? 0}
              average={d?.average ?? 0}
              rank={d?.rank ?? null}
              courseCount={d?.courseCount ?? 0}
              empty={!d || d.courseCount === 0}
            />
          );
        })}
      </div>

      {/* ── Combined ── */}
      <SemBlock
        label="Combined — Both Semesters"
        icon={Layers}
        accent="border-emerald-500/30"
        totalMarks={combined.totalMarks}
        average={combined.average}
        rank={combined.rank}
        courseCount={combined.courseCount}
        empty={!hasAnyData}
      />

      {/* ── Quick comparison strip ── */}
      {hasAnyData && (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/50 bg-slate-950/30">
            <GraduationCap className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Quick Comparison
            </span>
          </div>

          <div className="divide-y divide-slate-800/50">
            {/* header row */}
            <div className="grid grid-cols-4 px-4 py-2 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <span>Semester</span>
              <span className="text-center">Subjects</span>
              <span className="text-center">Total</span>
              <span className="text-center">Avg / Rank</span>
            </div>

            {SEM_SLOTS.map((name) => {
              const d = semMap.get(name);
              const hasSem = d && d.courseCount > 0;
              return (
                <div key={name} className="grid grid-cols-4 px-4 py-3 items-center text-sm">
                  <span className="text-slate-300 font-medium">{name}</span>
                  <span className="text-center text-slate-500">{hasSem ? d!.courseCount : "—"}</span>
                  <span className="text-center">
                    {hasSem ? (
                      <>
                        <span className="text-slate-200 font-semibold">{d!.totalMarks}</span>
                        <span className="text-slate-600 text-xs">/{d!.courseCount * 100}</span>
                      </>
                    ) : <span className="text-slate-700">—</span>}
                  </span>
                  <span className="text-center">
                    {hasSem ? (
                      <span className={`font-semibold ${avgColor(d!.average)}`}>
                        {d!.average.toFixed(1)}
                        <span className="text-slate-600 font-normal text-xs"> · </span>
                        <span className="text-yellow-400">{rankLabel(d!.rank)}</span>
                      </span>
                    ) : <span className="text-slate-700">—</span>}
                  </span>
                </div>
              );
            })}

            {/* combined row */}
            <div className="grid grid-cols-4 px-4 py-3 items-center text-sm bg-slate-900/40">
              <span className="text-emerald-300 font-bold">Combined</span>
              <span className="text-center text-slate-400">{combined.courseCount}</span>
              <span className="text-center">
                <span className="text-slate-200 font-bold">{combined.totalMarks}</span>
                <span className="text-slate-600 text-xs">/{combined.courseCount * 100}</span>
              </span>
              <span className="text-center">
                <span className={`font-bold ${avgColor(combined.average)}`}>
                  {combined.average.toFixed(1)}
                </span>
                <span className="text-slate-600 font-normal text-xs"> · </span>
                <span className="text-yellow-400 font-bold">{rankLabel(combined.rank)}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
