"use client";

import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  CalendarDays, Plus, Trash2, Loader2, X,
  Clock, BookOpen, GraduationCap, LayoutGrid,
} from "lucide-react";
import {
  useDHTimetable,
  useDHCreateTimetable,
  useDHDeleteTimetable,
  useDHTeachers,
  useDHClasses,
  useDHCourses,
  useDHCreateSection,
} from "../../../../hooks/useDepartmentHead";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { generateEthiopianAcademicYears, formatEthiopianYear } from "../../../../utils/ethiopianYear";
import type { TimetableEntry } from "../../../../services/departmentHead.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
type Day = typeof DAYS[number];
type Stream = "natural" | "social";

const DAY_COLORS: Record<Day, string> = {
  Monday:    "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  Tuesday:   "bg-violet-500/10 text-violet-300 border-violet-500/20",
  Wednesday: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Thursday:  "bg-amber-500/10 text-amber-300 border-amber-500/20",
  Friday:    "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

const GRADES = [9, 10, 11, 12] as const;

// Grades 11 & 12 require a stream selection
const needsStream = (grade: number) => grade === 11 || grade === 12;
const formatStreamName = (stream: Stream) =>
  stream === "natural" ? "Natural Science" : "Social Science";

// ─── Add Entry Modal ──────────────────────────────────────────────────────────

const defaultForm = {
  classId: "", courseId: "", teacherId: "",
  day: "Monday" as Day, startTime: "08:00", endTime: "09:00",
};

function AddEntryModal({
  selectedGrade,
  selectedStream,
  preselectedClassId,
  onClose,
}: {
  selectedGrade: number;
  selectedStream: Stream | null;
  preselectedClassId?: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    ...defaultForm,
    classId: preselectedClassId ?? "",
  });

  const { data: classes      = [], isLoading: loadingClasses  } = useDHClasses();
  const { data: teachers     = [], isLoading: loadingTeachers } = useDHTeachers();
  const { data: courseGroups = [], isLoading: loadingCourses  } = useDHCourses();
  const { mutateAsync: create, isPending } = useDHCreateTimetable();

  // Classes matching the current grade + stream selection
  const gradeClasses = useMemo(
    () => classes.filter((c) => {
      if (c.grade !== selectedGrade) return false;
      if (needsStream(selectedGrade)) return c.stream === selectedStream;
      return true; // grade 9/10 — no stream filter needed
    }),
    [classes, selectedGrade, selectedStream]
  );

  // The class the user has picked in the form
  const pickedClass = useMemo(
    () => gradeClasses.find((c) => c._id === form.classId) ?? null,
    [gradeClasses, form.classId]
  );

  // Courses — only show courses that match the picked class's grade + stream
  // FIX: allCourses is derived inside the memo so it always reflects latest data
  const filteredCourses = useMemo(() => {
    const allCourses = courseGroups.flatMap((g) => g.streams.flatMap((s) => s.courses));
    if (!pickedClass) {
      // No class chosen yet — show all courses for this grade/stream
      return allCourses.filter((c) => {
        if (c.grade !== selectedGrade) return false;
        if (needsStream(selectedGrade)) return (c.stream ?? null) === selectedStream;
        return true;
      });
    }
    // Class chosen — exact match on grade + stream (null-safe)
    const wantStream = pickedClass.stream ?? null;
    return allCourses.filter(
      (c) => c.grade === pickedClass.grade && (c.stream ?? null) === wantStream
    );
  }, [courseGroups, pickedClass, selectedGrade, selectedStream]);

  const set = (k: keyof typeof defaultForm) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
      setForm((p) => ({
        ...p,
        [k]: e.target.value,
        // Reset course when class changes (different stream may apply)
        ...(k === "classId" ? { courseId: "" } : {}),
      }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classId || !form.courseId || !form.teacherId || !form.startTime || !form.endTime) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await create({
        classId: form.classId, courseId: form.courseId,
        teacherId: form.teacherId, day: form.day,
        startTime: form.startTime, endTime: form.endTime,
      });
      toast.success("Entry added");
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to add entry"));
    }
  };

  const streamLabel = selectedStream ? ` – ${formatStreamName(selectedStream)}` : "";

  const inputCls =
    "w-full bg-slate-950/60 border border-slate-800/70 text-white rounded-xl px-4 py-2.5 text-base " +
    "focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition " +
    "[&>option]:bg-slate-900 disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800/70 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-semibold text-base">
              Create Program — Grade {selectedGrade}{streamLabel}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Class */}
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-slate-400 uppercase tracking-wider">
              Class <span className="text-rose-400">*</span>
            </label>
            <select className={inputCls} value={form.classId} onChange={set("classId")} disabled={loadingClasses}>
              <option value="">
                {loadingClasses ? "Loading…" : gradeClasses.length === 0 ? "No classes found for this grade" : "Select class"}
              </option>
              {gradeClasses.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({formatEthiopianYear(c.academicYear)})</option>
              ))}
            </select>
          </div>

          {/* Course — auto-filtered to grade + stream */}
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-slate-400 uppercase tracking-wider">
              Course <span className="text-rose-400">*</span>
            </label>
            <select
              className={inputCls}
              value={form.courseId}
              onChange={set("courseId")}
              disabled={loadingCourses || !form.classId}
            >
              <option value="">
                {loadingCourses ? "Loading courses…"
                  : !form.classId ? "Select a class first"
                  : filteredCourses.length === 0 ? "No courses — seed via Registrar"
                  : "Select course"}
              </option>
              {filteredCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.courseName}</option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-slate-400 uppercase tracking-wider">
              Teacher <span className="text-rose-400">*</span>
              {loadingTeachers && <Loader2 className="inline w-3 h-3 animate-spin ml-1.5 text-slate-500" />}
            </label>
            <select className={inputCls} value={form.teacherId} onChange={set("teacherId")} disabled={loadingTeachers}>
              <option value="">
                {loadingTeachers ? "Loading teachers…" : teachers.length === 0 ? "No teachers found" : "Select teacher"}
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Day */}
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-slate-400 uppercase tracking-wider">
              Day <span className="text-rose-400">*</span>
            </label>
            <select className={inputCls} value={form.day} onChange={set("day")}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-base font-semibold text-slate-400 uppercase tracking-wider">
                Start <span className="text-rose-400">*</span>
              </label>
              <input type="time" className={inputCls} value={form.startTime} onChange={set("startTime")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-base font-semibold text-slate-400 uppercase tracking-wider">
                End <span className="text-rose-400">*</span>
              </label>
              <input type="time" className={inputCls} value={form.endTime} onChange={set("endTime")} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-base font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={isPending || loadingTeachers || loadingClasses}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-base font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white transition">
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</>
                : <><Plus className="w-4 h-4" /> Create Program</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Section Timetable Block ──────────────────────────────────────────────────

const SECTION_COLORS = ["bg-indigo-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600", "bg-sky-600"];

function SectionBlock({
  label, year, letter, entries, deletingId, onAddEntry, onDelete,
}: {
  label: string;
  year: string;
  letter: string | null;
  entries: TimetableEntry[];
  deletingId: string | null;
  onAddEntry: () => void;
  onDelete: (id: string) => void;
}) {
  const colorIdx = letter ? letter.charCodeAt(0) - 65 : 6;
  const bgColor  = SECTION_COLORS[colorIdx % SECTION_COLORS.length] ?? "bg-slate-600";

  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 overflow-hidden">

      {/* Section header row */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/50 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          {letter && (
            <div className={`w-8 h-8 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
              <span className="text-white text-base font-bold">{letter}</span>
            </div>
          )}
          {!letter && <GraduationCap className="w-5 h-5 text-slate-400" />}
          <div>
              <span className="text-white font-semibold text-base">{label}</span>
              {year && <span className="text-slate-500 text-base ml-2">{year}</span>}
          </div>
            <span className="text-slate-600 text-base font-medium">
            {entries.length} {entries.length === 1 ? "period" : "periods"}
          </span>
        </div>
        <button
          onClick={onAddEntry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-base font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Period
        </button>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center py-10 text-center">
          <CalendarDays className="w-8 h-8 text-slate-700 mb-2 " />
          <p className="text-slate-500 text-base">No schedule yet</p>
          <p className="text-slate-600 text-base mt-0.5">
            Click <span className="text-indigo-400">Add Period</span> to create the timetable for this section.
          </p>
        </div>
      )}

      {/* Timetable rows */}
      {entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-base">
            <thead className="bg-slate-950/30 border-b border-slate-800/40">
              <tr>
                {["Day", "Time", "Course", "Teacher", ""].map((h, i) => (
                  <th key={i} className="text-left px-5 py-2.5 text-slate-500 font-semibold text-base uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-800/30 last:border-none hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full
                       text-base font-semibold border ${DAY_COLORS[entry.day as Day] ?? "bg-slate-800 text-slate-400border-slate-700"}`}>
                      {entry.day}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-slate-300 text-base font-mono">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      {entry.startTime} – {entry.endTime}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-white font-medium text-base">{entry.courseName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-base">{entry.teacherName}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => onDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-40"
                    >
                      {deletingId === entry.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Add Section Modal ────────────────────────────────────────────────────────

const SECTION_LETTERS = ["A", "B", "C", "D", "E", "F"];
const ACADEMIC_YEARS = generateEthiopianAcademicYears(4);

function AddSectionModal({
  selectedGrade,
  selectedStream,
  onClose,
}: {
  selectedGrade: number;
  selectedStream: Stream | null;
  onClose: () => void;
}) {
  const [section, setSection]         = useState("A");
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0]);
  const { mutateAsync: create, isPending } = useDHCreateSection();

  const streamLabel = selectedStream ? ` (${formatStreamName(selectedStream)})` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({
        grade:       selectedGrade,
        stream:      selectedStream,
        academicYear,
        section,
      });
      toast.success(`Section ${section} created for Grade ${selectedGrade}${streamLabel}`);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create section"));
    }
  };

  const inputCls =
    "w-full bg-slate-950/60 border border-slate-800/70 text-white rounded-xl px-4 py-2.5 text-base " +
    "focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition " +
    "[&>option]:bg-slate-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800/70 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold text-base">
              Add Section — Grade {selectedGrade}{streamLabel}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Section letter */}
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-slate-400 uppercase tracking-wider">
              Section Label <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {SECTION_LETTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSection(s)}
                  className={`w-10 h-10 rounded-xl text-base font-bold border transition ${
                    section === s
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-950/60 text-slate-400 border-slate-800/70 hover:text-white hover:border-slate-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-slate-600 text-base">
              Will create: <span className="text-slate-400 font-medium">Grade {selectedGrade}{streamLabel} – Section {section}</span>
            </p>
          </div>

          {/* Academic year */}
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-slate-400 uppercase tracking-wider">
              Academic Year <span className="text-rose-400">*</span>
            </label>
            <select className={inputCls} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-base font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-base font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 text-white transition">
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                : <><Plus className="w-4 h-4" /> Add Section</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function DHTimetableView() {
  const [selectedGrade,    setSelectedGrade]    = useState<number>(9);
  const [selectedStream,   setSelectedStream]   = useState<Stream | null>(null);
  const [dayFilter,        setDayFilter]        = useState<Day | "">("");
  const [showModal,          setShowModal]          = useState(false);
  const [showSectionModal,   setShowSectionModal]   = useState(false);
  const [preselectedClassId, setPreselectedClassId] = useState<string | undefined>(undefined);
  const [deletingId,         setDeletingId]         = useState<string | null>(null);

  const { data: allClasses = [] } = useDHClasses();

  const openAddEntry = (classId?: string) => {
    setPreselectedClassId(classId);
    setShowModal(true);
  };

  // Switch grade — auto-set stream for 11/12
  const handleGradeChange = (g: number) => {
    setSelectedGrade(g);
    setSelectedStream(needsStream(g) ? "natural" : null);
    setDayFilter("");
  };

  // Switch stream — keep grade, reset day
  const handleStreamChange = (s: Stream) => {
    setSelectedStream(s);
    setDayFilter("");
  };

  // Fetch ONLY entries for the selected grade + stream (strictly isolated)
  const { data: rawEntries = [], isLoading, isError, error } = useDHTimetable({
    grade:  selectedGrade,
    stream: needsStream(selectedGrade) ? (selectedStream ?? "natural") : undefined,
    day:    dayFilter || undefined,
  });

  const entries: TimetableEntry[] = rawEntries;

  const { mutateAsync: remove } = useDHDeleteTimetable();

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this entry?")) return;
    setDeletingId(id);
    try {
      await remove(id);
      toast.success("Entry removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete entry"));
    } finally {
      setDeletingId(null);
    }
  };

  // Human-readable label for the current view
  const viewLabel = needsStream(selectedGrade) && selectedStream
    ? `Grade ${selectedGrade} – ${formatStreamName(selectedStream)}`
    : `Grade ${selectedGrade}`;

  // Named sections (section !== null) for the current grade + stream
  const currentSections = useMemo(() => {
    return allClasses
      .filter((c) => {
        if (c.grade !== selectedGrade) return false;
        if (needsStream(selectedGrade)) return c.stream === (selectedStream ?? "natural");
        return true;
      })
      .filter((c) => c.section)
      .sort((a, b) => (a.section ?? "").localeCompare(b.section ?? ""));
  }, [allClasses, selectedGrade, selectedStream]);

  // Map classId → entries for fast lookup
  const entriesByClassId = useMemo(() => {
    const map = new Map<string, TimetableEntry[]>();
    entries.forEach((e) => {
      if (!map.has(e.classId)) map.set(e.classId, []);
      map.get(e.classId)!.push(e);
    });
    return map;
  }, [entries]);

  // Entries that don't belong to any named section (e.g. Registrar-created classes)
  const sectionIds = useMemo(
    () => new Set(currentSections.map((c) => c._id)),
    [currentSections]
  );
  const orphanEntries = useMemo(
    () => entries.filter((e) => !sectionIds.has(e.classId)),
    [entries, sectionIds]
  );

  return (
    <>
      {showModal && (
        <AddEntryModal
          selectedGrade={selectedGrade}
          selectedStream={selectedStream}
          preselectedClassId={preselectedClassId}
          onClose={() => { setShowModal(false); setPreselectedClassId(undefined); }}
        />
      )}
      {showSectionModal && (
        <AddSectionModal
          selectedGrade={selectedGrade}
          selectedStream={needsStream(selectedGrade) ? (selectedStream ?? "natural") : null}
          onClose={() => setShowSectionModal(false)}
        />
      )}

      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold text-white">Timetable</h2>
            <p className="text-slate-400 text-base mt-0.5">
              {viewLabel}
              {dayFilter ? ` on ${dayFilter}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowSectionModal(true)}
              className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-semibold rounded-xl px-4 py-2.5 text-base transition"
            >
              <LayoutGrid className="w-4 h-4" />
              Add Section
            </button>
            <button
              onClick={() => openAddEntry()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-4 py-2.5 text-base transition"
            >
              <Plus className="w-4 h-4" />
              Create Program
            </button>
          </div>
        </div>

        {/* ── Grade tabs ── */}
        <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800/70 rounded-2xl p-1.5 w-fit">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => handleGradeChange(g)}
                className={`px-4 py-2 rounded-xl text-base font-semibold transition ${
                selectedGrade === g
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Grade {g}
            </button>
          ))}
        </div>

        {/* ── Stream sub-tabs (Grade 11 & 12 only) ── */}
        {needsStream(selectedGrade) && (
          <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-800/50 rounded-xl p-1 w-fit">
            {(["natural", "social"] as Stream[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStreamChange(s)}
                className={`px-5 py-1.5 rounded-lg text-base font-semibold transition ${
                  selectedStream === s
                    ? s === "natural"
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {formatStreamName(s)}
              </button>
            ))}
          </div>
        )}

        {/* ── Day filter ── */}
        <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-800/50 rounded-xl p-1 w-fit">
          <button
            onClick={() => setDayFilter("")}
            className={`px-3 py-1.5 rounded-lg text-base font-medium transition ${
              dayFilter === "" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"
            }`}
          >
            All Days
          </button>
          {DAYS.map((d) => {
            const activeColor = {
              Monday: "bg-indigo-600", Tuesday: "bg-violet-600",
              Wednesday: "bg-emerald-600", Thursday: "bg-amber-600", Friday: "bg-rose-600",
            }[d];
            return (
              <button
                key={d}
                onClick={() => setDayFilter(d === dayFilter ? "" : d)}
                className={`px-3 py-1.5 rounded-lg text-base font-medium transition ${
                  dayFilter === d ? `${activeColor} text-white` : "text-slate-500 hover:text-white"
                }`}
              >
                {d.slice(0, 3)}
              </button>
            );
          })}
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-9 h-9 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-base">
            {getApiErrorMessage(error, "Failed to load timetable")}
          </div>
        )}

        {/* ── Vertical section blocks ── */}
        {!isLoading && !isError && (
          <div className="space-y-5">

            {/* Prompt when nothing exists at all */}
            {currentSections.length === 0 && entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 bg-slate-900/50 rounded-2xl border border-slate-800/70 border-dashed">
                <GraduationCap className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-white font-semibold">No sections for {viewLabel}</p>
                <p className="text-slate-500 text-base mt-1 text-center max-w-xs">
                  Start by clicking <span className="text-emerald-400 font-medium">Add Section</span> to create Section A, B, C… for this grade.
                </p>
              </div>
            )}

            {/* Entries that belong to non-sectioned classes (e.g. from Registrar) */}
            {orphanEntries.length > 0 && (
              <SectionBlock
                label="General"
                year=""
                letter={null}
                entries={orphanEntries}
                deletingId={deletingId}
                onAddEntry={() => openAddEntry()}
                onDelete={handleDelete}
              />
            )}

            {/* One block per named section */}
            {currentSections.map((cls) => (
              <SectionBlock
                key={cls._id}
                label={`Section ${cls.section}`}
                year={formatEthiopianYear(cls.academicYear)}
                letter={cls.section}
                entries={entriesByClassId.get(cls._id) ?? []}
                deletingId={deletingId}
                onAddEntry={() => openAddEntry(cls._id)}
                onDelete={handleDelete}
              />
            ))}

            {/* Prompt to add first section when sections exist but grade has no entries */}
            {currentSections.length === 0 && entries.length > 0 && orphanEntries.length === 0 && (
              <div className="text-slate-600 text-base text-center py-6">
                No entries match the current filter.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
