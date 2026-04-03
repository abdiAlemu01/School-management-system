"use client";

import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  Users, GraduationCap, AlertCircle, Loader2, CheckCircle2,
} from "lucide-react";
import {
  useDHStudents,
  useDHAssignStudentSection,
  useDHClasses,
} from "../../../../hooks/useDepartmentHead";
import { getApiErrorMessage } from "../../../../utils/apiError";
import type { DHStudent, ClassRecord } from "../../../../services/departmentHead.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADES = [9, 10, 11, 12] as const;
type Grade  = typeof GRADES[number];
type Stream = "natural" | "social";
const needsStream = (g: number) => g === 11 || g === 12;

const SECTION_COLORS: Record<string, string> = {
  A: "bg-indigo-600/25 text-indigo-300 border-indigo-500/30",
  B: "bg-violet-600/25 text-violet-300 border-violet-500/30",
  C: "bg-emerald-600/25 text-emerald-300 border-emerald-500/30",
  D: "bg-amber-600/25 text-amber-300 border-amber-500/30",
  E: "bg-rose-600/25 text-rose-300 border-rose-500/30",
  F: "bg-sky-600/25 text-sky-300 border-sky-500/30",
};

// ─── Section select cell ──────────────────────────────────────────────────────

function SectionSelect({
  student,
  sections,
}: {
  student: DHStudent;
  sections: ClassRecord[];
}) {
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const { mutateAsync: assign } = useDHAssignStudentSection();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sectionClassId = e.target.value;
    if (!sectionClassId) return;

    setAssigningId(student.id);
    try {
      await assign({ studentId: student.id, sectionClassId });
      toast.success(`${student.name} assigned to Section ${sections.find(s => s._id === sectionClassId)?.section}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to assign section"));
    } finally {
      setAssigningId(null);
    }
  };

  const isLoading = assigningId === student.id;

  // Find the section class that the student currently belongs to
  const currentSectionClass = sections.find((s) => s._id === student.classId);

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={currentSectionClass?._id ?? ""}
        disabled={isLoading || sections.length === 0}
        onChange={handleChange}
        className="bg-slate-950/60 border border-slate-800/70 text-slate-300 rounded-xl px-3 py-2 text-sm
                   focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30
                   transition disabled:opacity-50 [&>option]:bg-slate-900 w-44"
      >
        <option value="">— Select Section —</option>
        {sections.map((sec) => (
          <option key={sec._id} value={sec._id}>
            Section {sec.section}  ({sec.academicYear})
          </option>
        ))}
      </select>
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function DHAssignSectionStudent() {
  const [selectedGrade,  setSelectedGrade]  = useState<Grade>(9);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);

  const handleGradeChange = (g: Grade) => {
    setSelectedGrade(g);
    setSelectedStream(needsStream(g) ? "natural" : null);
  };

  const handleStreamChange = (s: Stream) => setSelectedStream(s);

  // Fetch students for the selected grade/stream
  const streamParam = needsStream(selectedGrade)
    ? (selectedStream ?? "natural")
    : "null";

  const { data: students = [], isLoading, isError, error } = useDHStudents({
    grade:  selectedGrade,
    stream: streamParam,
  });

  // All classes (to derive sections for the current grade/stream)
  const { data: allClasses = [] } = useDHClasses();

  // Named sections matching the current grade/stream
  const gradeSections = useMemo(() => {
    return allClasses
      .filter((c) => {
        if (c.grade !== selectedGrade) return false;
        if (needsStream(selectedGrade)) return c.stream === (selectedStream ?? "natural");
        return c.stream === null || c.stream === undefined;
      })
      .filter((c) => !!c.section)
      .sort((a, b) => (a.section ?? "").localeCompare(b.section ?? ""));
  }, [allClasses, selectedGrade, selectedStream]);

  // Split students into assigned and unassigned
  const { assigned, unassigned } = useMemo(() => {
    const sectionIds = new Set(gradeSections.map((s) => s._id));
    return {
      assigned:   students.filter((s) => sectionIds.has(s.classId)),
      unassigned: students.filter((s) => !sectionIds.has(s.classId)),
    };
  }, [students, gradeSections]);

  const viewLabel = needsStream(selectedGrade) && selectedStream
    ? `Grade ${selectedGrade} – ${selectedStream.charAt(0).toUpperCase() + selectedStream.slice(1)}`
    : `Grade ${selectedGrade}`;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-white">Assign Sections</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Assign registered students to a class section for {viewLabel}
        </p>
      </div>

      {/* ── Grade tabs ── */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800/70 rounded-2xl p-1.5 w-fit">
        {GRADES.map((g) => (
          <button
            key={g}
            onClick={() => handleGradeChange(g)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              selectedGrade === g
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Grade {g}
          </button>
        ))}
      </div>

      {/* ── Stream sub-tabs (Grade 11 & 12) ── */}
      {needsStream(selectedGrade) && (
        <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-800/50 rounded-xl p-1 w-fit">
          {(["natural", "social"] as Stream[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStreamChange(s)}
              className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition ${
                selectedStream === s
                  ? s === "natural" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-4 flex-wrap text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800/50 rounded-xl">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300">
            <span className="text-white font-semibold">{students.length}</span> students in {viewLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-300">
            <span className="text-white font-semibold">{assigned.length}</span> assigned
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-600/10 border border-amber-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300">
            <span className="text-white font-semibold">{unassigned.length}</span> unassigned
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <span className="text-indigo-300">
            <span className="text-white font-semibold">{gradeSections.length}</span> sections available
          </span>
        </div>
      </div>

      {/* ── No sections warning ── */}
      {gradeSections.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">No sections for {viewLabel} yet</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Go to the <span className="font-medium text-amber-300">Timetable</span> tab and click
              &quot;Add Section&quot; to create Section A, B, C… for this grade first.
            </p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-9 h-9 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm">
          {getApiErrorMessage(error, "Failed to load students")}
        </div>
      )}

      {/* ── No students ── */}
      {!isLoading && !isError && students.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800/70 border-dashed">
          <Users className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-white font-medium">No students in {viewLabel}</p>
          <p className="text-slate-500 text-sm mt-1 text-center max-w-xs">
            Register students via the <span className="text-indigo-400">Registrar</span> module first.
          </p>
        </div>
      )}

      {/* ── Students table ── */}
      {!isLoading && !isError && students.length > 0 && (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-950/50 border-b border-slate-800/60">
                <tr>
                  {["Student", "Student ID", "Academic Year", "Current Section", "Assign to Section"].map((h, i) => (
                    <th key={i} className="text-left px-5 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Unassigned first */}
                {unassigned.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    sections={gradeSections}
                  />
                ))}
                {/* Then assigned */}
                {assigned.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    sections={gradeSections}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function StudentRow({
  student,
  sections,
}: {
  student: DHStudent;
  sections: ClassRecord[];
}) {
  const sectionIds  = new Set(sections.map((s) => s._id));
  const isAssigned  = sectionIds.has(student.classId);
  const sectionLetter = isAssigned ? student.section : null;
  const badgeCls = sectionLetter
    ? (SECTION_COLORS[sectionLetter] ?? "bg-slate-700/40 text-slate-400 border-slate-600/30")
    : "bg-slate-800/60 text-slate-500 border-slate-700/40";

  return (
    <tr className="border-b border-slate-800/40 last:border-none hover:bg-slate-800/20 transition-colors">
      {/* Name */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="text-indigo-300 text-xs font-bold">
              {student.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-medium text-sm">{student.name}</p>
            <p className="text-slate-500 text-xs">{student.email}</p>
          </div>
        </div>
      </td>

      {/* Student ID */}
      <td className="px-5 py-3">
        <span className="font-mono text-slate-300 text-xs bg-slate-800/60 px-2 py-1 rounded-lg">
          {student.studentId}
        </span>
      </td>

      {/* Academic year */}
      <td className="px-5 py-3 text-slate-400 text-sm">{student.academicYear}</td>

      {/* Current section badge */}
      <td className="px-5 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeCls}`}>
          {isAssigned ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Section {sectionLetter}
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" />
              Unassigned
            </>
          )}
        </span>
      </td>

      {/* Assign dropdown */}
      <td className="px-5 py-3">
        {sections.length === 0 ? (
          <span className="text-slate-600 text-xs italic">No sections yet</span>
        ) : (
          <SectionSelect student={student} sections={sections} />
        )}
      </td>
    </tr>
  );
}
