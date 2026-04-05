"use client";

import { useState, useMemo } from "react";
import {
  Users, Search, GraduationCap, ChevronDown, ChevronRight,
  BadgeCheck, Mail, UserCircle2, Layers,
} from "lucide-react";
import { useRegistrarStudents } from "../../../../hooks/useRegistrar";
import { getApiErrorMessage } from "../../../../utils/apiError";
import type { RegistrarStudent, StudentGroup, YearGroup } from "../../../../services/registrar.service";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SelectedKey = { academicYear: string; grade: number; stream: string | null };

const makeKey = (year: string, grade: number, stream: string | null) =>
  `${year}||${grade}||${stream ?? "none"}`;

const streamBadge = (stream: string | null) => {
  if (!stream) return null;
  const cfg =
    stream === "natural"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm border font-medium ${cfg}`}>
      {stream.charAt(0).toUpperCase() + stream.slice(1)}
    </span>
  );
};

// ─── Sidebar tree ─────────────────────────────────────────────────────────────

function YearNode({
  yearGroup,
  selectedKey,
  onSelect,
}: {
  yearGroup: YearGroup;
  selectedKey: string | null;
  onSelect: (sel: SelectedKey) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      {/* Year header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors group"
      >
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {open
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
        <span className="text-sm font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
          {yearGroup.academicYear}
        </span>
      </button>

      {/* Grade/stream leaves */}
      {open && (
        <div className="ml-3 border-l border-slate-800/70 pl-2 space-y-0.5 mb-1">
          {yearGroup.groups.map((g) => {
            const key = makeKey(yearGroup.academicYear, g.grade, g.stream);
            const active = selectedKey === key;
            return (
              <button
                key={key}
                onClick={() =>
                  onSelect({ academicYear: yearGroup.academicYear, grade: g.grade, stream: g.stream })
                }
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-base font-medium transition-all ${
                  active
                    ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GraduationCap className={`w-4 h-4 shrink-0 ${active ? "text-indigo-400" : "text-slate-600"}`} />
                  <span className="truncate">{g.label}</span>
                </div>
                <span
                  className={`shrink-0 text-sm px-1.5 py-0.5 rounded-full font-semibold ${
                    active ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {g.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Student table ────────────────────────────────────────────────────────────

function StudentTable({ students }: { students: RegistrarStudent[] }) {
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <UserCircle2 className="w-10 h-10 text-slate-700 mb-3" />
        <p className="text-slate-400 font-medium text-base">No students match your search</p>
        <p className="text-slate-600 text-sm mt-1">Try a different name or Student ID</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-base">
        <thead className="bg-slate-950/40 border-b border-slate-800/60">
          <tr>
            <th className="text-left px-5 py-3 text-slate-400 font-semibold text-sm">Student</th>
            <th className="text-left px-5 py-3 text-slate-400 font-semibold text-sm">Student ID</th>
            <th className="text-left px-5 py-3 text-slate-400 font-semibold text-sm">Grade</th>
            <th className="text-left px-5 py-3 text-slate-400 font-semibold text-sm">Stream</th>
            <th className="text-left px-5 py-3 text-slate-400 font-semibold text-sm">Academic Year</th>
            <th className="text-left px-5 py-3 text-slate-400 font-semibold text-sm">Email</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr
              key={s.id}
              className="border-b border-slate-800/40 last:border-none hover:bg-slate-800/20 transition-colors"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-base">{s.name}</p>
                    <p className="text-slate-500 text-sm capitalize">{s.gender}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3">
                <span className="inline-flex items-center gap-1.5 text-slate-300 text-base">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  {s.studentId}
                </span>
              </td>
              <td className="px-5 py-3 text-slate-300 font-medium text-base">Grade {s.grade}</td>
              <td className="px-5 py-3">{streamBadge(s.stream) ?? <span className="text-slate-600 text-sm">—</span>}</td>
              <td className="px-5 py-3 text-slate-400 text-base">{s.academicYear}</td>
              <td className="px-5 py-3">
                <span className="inline-flex items-center gap-1.5 text-slate-400 text-base">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  {s.email}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function RegistrarStudentsView() {
  const { data: yearGroups, isLoading, isError, error } = useRegistrarStudents();

  const [selected, setSelected] = useState<SelectedKey | null>(null);
  const [search, setSearch] = useState("");

  // Auto-select the first available group once data loads
  const effectiveSelected = useMemo(() => {
    if (selected) return selected;
    const first = yearGroups?.[0]?.groups?.[0];
    const year  = yearGroups?.[0]?.academicYear;
    if (!first || !year) return null;
    return { academicYear: year, grade: first.grade, stream: first.stream };
  }, [selected, yearGroups]);

  const selectedKey = effectiveSelected
    ? makeKey(effectiveSelected.academicYear, effectiveSelected.grade, effectiveSelected.stream)
    : null;

  // Find the group object for the selected key
  const activeGroup: StudentGroup | undefined = useMemo(() => {
    if (!effectiveSelected || !yearGroups) return undefined;
    return yearGroups
      .find((y) => y.academicYear === effectiveSelected.academicYear)
      ?.groups.find(
        (g) => g.grade === effectiveSelected.grade && g.stream === effectiveSelected.stream
      );
  }, [effectiveSelected, yearGroups]);

  // Search filter — scoped strictly to the selected group
  const visibleStudents = useMemo(() => {
    const all = activeGroup?.students ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
    );
  }, [activeGroup, search]);

  const totalStudents = useMemo(
    () => yearGroups?.reduce((a, y) => a + y.groups.reduce((b, g) => b + g.count, 0), 0) ?? 0,
    [yearGroups]
  );

  // ── Loading / error ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-base">
        Failed to load students: {getApiErrorMessage(error, "Unable to fetch students")}
      </div>
    );
  }

  if (!yearGroups || yearGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-slate-900/50 rounded-2xl border border-slate-800/70">
        <Users className="w-12 h-12 text-slate-700 mb-4" />
        <h1 className="text-white font-medium text-2xl">No students registered yet</h1>
        <h2 className="text-slate-400 text-base mt-1">
          Use the &quot;Register Student&quot; tab to add the registered student.
        </h2>
      </div>
    );
  }

  // ── Two-panel layout ─────────────────────────────────────────────────────
  return (
    <div className="flex gap-0 h-full min-h-[calc(100vh-10rem)] rounded-2xl border border-slate-800/70 overflow-hidden bg-slate-900/40">

      {/* ── Left inner sidebar ── */}
      <aside className="w-56 xl:w-64 shrink-0 border-r border-slate-800/70 bg-slate-950/40 flex flex-col">
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-white font-semibold text-base">Students</span>
          </div>
          <p className="text-slate-600 text-sm mt-0.5">{totalStudents} total enrolled</p>
        </div>

        {/* Tree */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-1">
          {yearGroups.map((yg) => (
            <YearNode
              key={yg.academicYear}
              yearGroup={yg}
              selectedKey={selectedKey}
              onSelect={(sel) => {
                setSelected(sel);
                setSearch("");
              }}
            />
          ))}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Content header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-800/60">
          <div>
            {activeGroup ? (
              <>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {activeGroup.label}
                  {activeGroup.stream && streamBadge(activeGroup.stream)}
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  {effectiveSelected?.academicYear} · {activeGroup.count} student{activeGroup.count !== 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <p className="text-slate-400 text-base">Select a group from the sidebar</p>
            )}
          </div>

          {/* Search */}
          {activeGroup && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID…"
                className="w-56 xl:w-72 bg-slate-950/60 border border-slate-800/70 text-white rounded-xl pl-9 pr-4 py-2 text-base placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition"
              />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {!activeGroup ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <GraduationCap className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-500 text-base">Pick a grade from the left panel</p>
            </div>
          ) : (
            <StudentTable students={visibleStudents} />
          )}
        </div>
      </div>
    </div>
  );
}
