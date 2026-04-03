"use client";

import { useState } from "react";
import {
  Users, Mail, BadgeCheck, BookOpen, GraduationCap,
  ChevronLeft, CalendarDays, School,
} from "lucide-react";
import { useTeacherSections, useTeacherStudents } from "../../../../hooks/useTeacher";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { formatEthiopianYear } from "../../../../utils/ethiopianYear";
import type { TeacherSection } from "../../../../services/teacher.service";

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  sec,
  onClick,
}: {
  sec: TeacherSection;
  onClick: () => void;
}) {
  const streamLabel = sec.stream
    ? ` – ${sec.stream.charAt(0).toUpperCase() + sec.stream.slice(1)}`
    : "";

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 rounded-2xl bg-slate-900/50 border border-slate-800/70 hover:bg-slate-800/40 hover:border-indigo-500/40 transition-all group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-indigo-400" />
        </div>
        <span className="ml-auto px-2.5 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-400 text-xs font-semibold">
          {sec.studentCount} student{sec.studentCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Course name */}
      <p className="text-white font-bold text-base mb-1 group-hover:text-indigo-300 transition-colors">
        {sec.courseName}
      </p>

      {/* Class / section */}
      <p className="text-slate-400 text-sm mb-3">
        Grade {sec.grade}{streamLabel}
        {sec.section && (
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <GraduationCap className="w-3 h-3" />
            Section {sec.section}
          </span>
        )}
      </p>

      {/* Footer row */}
      <div className="flex items-center gap-3 text-xs text-slate-500 border-t border-slate-800/50 pt-3">
        <span className="flex items-center gap-1.5">
          <School className="w-3.5 h-3.5" />
          {sec.className}
        </span>
        <span className="flex items-center gap-1.5 ml-auto">
          <CalendarDays className="w-3.5 h-3.5" />
          {formatEthiopianYear(sec.academicYear)}
        </span>
      </div>
    </button>
  );
}

// ─── Student list panel ───────────────────────────────────────────────────────

function StudentList({
  section,
  onBack,
}: {
  section: TeacherSection;
  onBack: () => void;
}) {
  const { data: students = [], isLoading, isError, error } = useTeacherStudents(
    section.courseId,
    section.classId
  );

  const streamLabel = section.stream
    ? ` – ${section.stream.charAt(0).toUpperCase() + section.stream.slice(1)}`
    : "";

  return (
    <div className="space-y-4">
      {/* Back + heading */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to sections
        </button>
        <h3 className="text-xl font-bold text-white">
          {section.courseName}
        </h3>
        <p className="text-slate-400 text-sm mt-0.5">
          Grade {section.grade}{streamLabel}
          {section.section && ` · Section ${section.section}`}
          {" · "}
          {formatEthiopianYear(section.academicYear)}
        </p>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-900/50 border border-slate-800/60 rounded-xl text-sm flex-wrap">
        <span className="flex items-center gap-2 text-slate-300">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          {section.courseName}
        </span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-2 text-slate-300">
          <School className="w-4 h-4 text-blue-400" />
          {section.className}
        </span>
        {!isLoading && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-semibold">{students.length} students</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm">
          {getApiErrorMessage(error, "Unable to fetch students")}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && students.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800/70 border-dashed">
          <Users className="w-10 h-10 text-slate-700 mb-3" />
          <p className="text-white font-medium">No students in this section</p>
          <p className="text-slate-500 text-sm mt-1 max-w-xs text-center">
            Students are enrolled when the registrar registers them and the department head assigns them to this section.
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && students.length > 0 && (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-950/60 border-b border-slate-800/70">
                <tr>
                  {["#", "Student", "Student ID", "Email", "Section"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.id} className="border-b border-slate-800/40 last:border-none hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3 text-slate-600 text-sm">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                          <span className="text-indigo-300 text-xs font-bold">
                            {s.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-slate-800/60 px-2.5 py-1 rounded-lg text-slate-300">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {s.studentId}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-300 text-sm">
                        <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                        {s.email || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                        <GraduationCap className="w-3 h-3" />
                        {s.section ? `Section ${s.section}` : s.className}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function TeacherStudentsView() {
  const { data: sections = [], isLoading, isError, error } = useTeacherSections();
  const [selected, setSelected] = useState<TeacherSection | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm">
        {getApiErrorMessage(error, "Unable to load your sections.")}
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800/70">
        <BookOpen className="w-12 h-12 text-slate-500 mb-4" />
        <p className="text-white font-medium">No sections assigned yet</p>
        <p className="text-slate-400 text-sm mt-1 text-center max-w-xs">
          The department head needs to create a timetable that assigns you to a class section first.
        </p>
      </div>
    );
  }

  // If a section is selected, show its student list
  if (selected) {
    return <StudentList section={selected} onBack={() => setSelected(null)} />;
  }

  // Otherwise show section cards
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">My Students</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Select a section to see students enrolled in that class.
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/50 border border-slate-800/60 rounded-xl text-sm">
        <GraduationCap className="w-4 h-4 text-indigo-400" />
        <span className="text-slate-300">
          You teach <span className="text-white font-semibold">{sections.length}</span> section{sections.length !== 1 ? "s" : ""}
          {" · "}
          <span className="text-white font-semibold">
            {sections.reduce((n, s) => n + s.studentCount, 0)}
          </span> total students
        </span>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => (
          <SectionCard
            key={`${sec.classId}-${sec.courseId}`}
            sec={sec}
            onClick={() => setSelected(sec)}
          />
        ))}
      </div>
    </div>
  );
}
