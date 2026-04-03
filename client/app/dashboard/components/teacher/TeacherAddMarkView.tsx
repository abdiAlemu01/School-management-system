"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  BookOpen, Save, School, CalendarDays, Users,
  PenLine, Loader2, GraduationCap, Calendar,
  ChevronRight, CheckCircle2,
} from "lucide-react";
import {
  useTeacherSections,
  useTeacherStudents,
  useSaveTeacherMarksBulk,
  useUpdateTeacherSingleMark,
  useAvailableSemesters,
} from "../../../../hooks/useTeacher";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { formatEthiopianYear } from "../../../../utils/ethiopianYear";
import type { TeacherSection, SemesterInfo } from "../../../../services/teacher.service";

// ─── Types ───────────────────────────────────────────────────────────────────

type AssessmentKey = "quiz" | "assignment" | "midExam" | "finalExam";

type RowMarkState = {
  quiz: string;
  assignment: string;
  midExam: string;
  finalExam: string;
  markId: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const ASSESSMENTS: {
  key: AssessmentKey; label: string; max: number; color: string; dot: string;
}[] = [
  { key: "quiz",       label: "Quiz",       max: 10, color: "text-violet-400", dot: "bg-violet-500" },
  { key: "assignment", label: "Assignment", max: 10, color: "text-blue-400",   dot: "bg-blue-500"   },
  { key: "midExam",    label: "Mid Exam",   max: 30, color: "text-amber-400",  dot: "bg-amber-500"  },
  { key: "finalExam",  label: "Final Exam", max: 50, color: "text-rose-400",   dot: "bg-rose-500"   },
];

const calcTotal = (row: RowMarkState) =>
  ASSESSMENTS.reduce((s, a) => s + (parseFloat(row[a.key]) || 0), 0);

const scoreColor = (n: number) => {
  if (n >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (n >= 60) return "text-blue-400   bg-blue-500/10   border-blue-500/30";
  if (n >= 50) return "text-amber-400  bg-amber-500/10  border-amber-500/30";
  return              "text-rose-400   bg-rose-500/10   border-rose-500/30";
};

const inputCls =
  "w-20 px-2 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700/60 text-slate-100 " +
  "text-sm text-center focus:outline-none focus:border-indigo-500/60 focus:ring-1 " +
  "focus:ring-indigo-500/30 transition [appearance:textfield] " +
  "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

// ─── Step header ─────────────────────────────────────────────────────────────

function StepHeader({
  number, title, subtitle, done,
}: {
  number: number; title: string; subtitle: string; done?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        done
          ? "bg-emerald-500 text-white"
          : "bg-indigo-600 text-white"
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : number}
      </div>
      <div>
        <p className="text-white font-semibold text-sm leading-tight">{title}</p>
        <p className="text-slate-500 text-xs">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Grading table ────────────────────────────────────────────────────────────

function GradingTable({
  section,
  semesterId,
  semesterName,
}: {
  section: TeacherSection;
  semesterId: string;
  semesterName: string;
}) {
  const queryClient = useQueryClient();
  const [rowMarks, setRowMarks] = useState<Record<string, RowMarkState>>({});
  const [savingRow, setSavingRow] = useState<string | null>(null);

  const { data: students = [], isLoading } = useTeacherStudents(
    section.courseId,
    section.classId,
    semesterId,
  );

  const bulkMutation   = useSaveTeacherMarksBulk();
  const singleMutation = useUpdateTeacherSingleMark();

  const getRow = (id: string): RowMarkState => {
    const mark = students.find((s) => s.id === id)?.selectedCourseMark;
    const ov   = rowMarks[id];
    return {
      quiz:       ov?.quiz       ?? mark?.quiz?.toString()       ?? "",
      assignment: ov?.assignment ?? mark?.assignment?.toString() ?? "",
      midExam:    ov?.midExam    ?? mark?.midExam?.toString()    ?? "",
      finalExam:  ov?.finalExam  ?? mark?.finalExam?.toString()  ?? "",
      markId:     ov?.markId     ?? mark?.markId                 ?? null,
    };
  };

  const handleChange = (id: string, field: AssessmentKey, val: string) =>
    setRowMarks((p) => ({ ...p, [id]: { ...getRow(id), [field]: val } }));

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["teacherStudents", section.courseId, section.classId, semesterId],
    });

  const handleBulkSave = async () => {
    try {
      const payload = students.map((s) => {
        const r = getRow(s.id);
        return {
          studentId:  s.id,
          quiz:       r.quiz       || 0,
          assignment: r.assignment || 0,
          midExam:    r.midExam    || 0,
          finalExam:  r.finalExam  || 0,
        };
      });
      await bulkMutation.mutateAsync({ courseId: section.courseId, marks: payload, semesterId });
      toast.success(`All marks saved for ${semesterName}.`);
      await refresh();
      setRowMarks({});
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save marks."));
    }
  };

  const handleSingleSave = async (studentId: string) => {
    const row = getRow(studentId);
    if (!row.markId) { toast.error("Use Save All first to create records."); return; }
    setSavingRow(studentId);
    try {
      await singleMutation.mutateAsync({
        markId: row.markId,
        payload: {
          quiz:       row.quiz       || 0,
          assignment: row.assignment || 0,
          midExam:    row.midExam    || 0,
          finalExam:  row.finalExam  || 0,
        },
      });
      toast.success("Mark updated.");
      await queryClient.invalidateQueries({
        queryKey: ["teacherStudents", section.courseId, section.classId, semesterId],
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update."));
    } finally {
      setSavingRow(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800/70">
        <Users className="w-10 h-10 text-slate-700 mb-3" />
        <p className="text-white font-medium">No students in this section yet</p>
        <p className="text-slate-500 text-sm mt-1 text-center max-w-xs">
          Students appear here once the registrar enrolls them and the department head assigns them to this section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Assessment weight legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ASSESSMENTS.map((a) => (
          <div key={a.key} className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-900/50 border border-slate-800/60 rounded-xl">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${a.dot}`} />
            <div>
              <p className={`text-xs font-bold ${a.color}`}>{a.label}</p>
              <p className="text-slate-500 text-xs">out of {a.max}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950/60 border-b border-slate-800/70">
              <tr>
                <th className="text-left px-5 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider min-w-[190px]">
                  Student
                </th>
                {ASSESSMENTS.map((a) => (
                  <th key={a.key} className="text-center px-3 py-3 text-xs uppercase tracking-wider">
                    <span className={`${a.color} font-semibold`}>{a.label}</span>
                    <span className="text-slate-600 block font-normal">/ {a.max}</span>
                  </th>
                ))}
                <th className="text-center px-3 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  Total <span className="text-slate-600 block font-normal">/ 100</span>
                </th>
                <th className="text-center px-3 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const row      = getRow(student.id);
                const total    = calcTotal(row);
                const isSaving = savingRow === student.id;
                return (
                  <tr key={student.id} className="border-b border-slate-800/40 last:border-none hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-slate-600 text-xs text-right shrink-0">{idx + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                          <span className="text-indigo-300 text-xs font-bold">{student.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm leading-tight">{student.name}</p>
                          <p className="text-slate-500 text-xs font-mono">{student.studentId}</p>
                        </div>
                      </div>
                    </td>
                    {ASSESSMENTS.map((a) => (
                      <td key={a.key} className="px-3 py-3 text-center">
                        <input
                          type="number" min="0" max={a.max}
                          value={row[a.key]}
                          onChange={(e) => handleChange(student.id, a.key, e.target.value)}
                          className={inputCls}
                          placeholder="—"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-sm font-bold ${scoreColor(total)}`}>
                        {total}
                        <span className="text-xs font-normal opacity-50 ml-1">/ 100</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        disabled={!row.markId || isSaving}
                        onClick={() => handleSingleSave(student.id)}
                        title={!row.markId ? "Save All first to create the record" : "Update this student only"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenLine className="w-3 h-3" />}
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <p className="text-slate-500 text-xs leading-relaxed">
          <span className="text-slate-300 font-semibold">Save All Marks</span> — creates or overwrites every student's record at once.<br />
          <span className="text-slate-300 font-semibold">Update</span> — edits a single row after records are already created.
        </p>
        <button
          type="button"
          onClick={handleBulkSave}
          disabled={bulkMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-400 text-white font-semibold text-sm transition shrink-0 shadow-lg shadow-indigo-900/40"
        >
          {bulkMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : <><Save className="w-4 h-4" /> Save All Marks</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function TeacherAddMarkView() {
  const { data: sections  = [], isLoading: sectionsLoading  } = useTeacherSections();
  const { data: semesters = [], isLoading: semestersLoading } = useAvailableSemesters();

  const [selectedSection,   setSelectedSection]   = useState<TeacherSection | null>(null);
  const [selectedSemId,     setSelectedSemId]     = useState<string>("");

  // Auto-select first semester once they load
  useEffect(() => {
    if (!selectedSemId && semesters.length > 0) {
      setSelectedSemId(semesters[0]._id);
    }
  }, [semesters, selectedSemId]);

  const isLoading = sectionsLoading || semestersLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-slate-500 text-sm">Loading your sections…</p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800/70">
        <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-white font-semibold">No sections assigned yet</p>
        <p className="text-slate-400 text-sm mt-1 text-center max-w-xs">
          The department head must add you to a timetable before you can enter marks.
        </p>
      </div>
    );
  }

  const activeSection  = selectedSection ?? sections[0];
  const activeSemester = semesters.find((s) => s._id === selectedSemId);
  const readyToGrade   = !!selectedSemId && !!activeSection;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-white">Grade Students</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Follow the steps below to record assessment marks for your students.
        </p>
      </div>

      {/* ── Step 1 : Semester ─────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/70">
        <StepHeader
          number={1}
          title="Select Semester"
          subtitle="Which semester are you entering marks for?"
          done={!!selectedSemId}
        />

        <div className="flex flex-wrap gap-3 mt-1">
          {semesters.map((sem) => {
            const active = selectedSemId === sem._id;
            return (
              <button
                key={sem._id}
                onClick={() => setSelectedSemId(sem._id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 text-left transition-all ${
                  active
                    ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                    : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  active ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-400"
                }`}>
                  {sem.name.match(/\d+/)?.[0] ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-sm">{sem.name}</p>
                  <p className={`text-xs ${active ? "text-indigo-300" : "text-slate-600"}`}>
                    {sem.year} Academic Year
                  </p>
                </div>
                {active && <CheckCircle2 className="w-4 h-4 text-indigo-400 ml-2 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 2 : Section ─────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/70">
        <StepHeader
          number={2}
          title="Select Section"
          subtitle="Choose the class section and subject you want to grade."
          done={!!activeSection}
        />

        <div className="flex flex-wrap gap-2 mt-1">
          {sections.map((s) => {
            const active =
              activeSection?.classId  === s.classId &&
              activeSection?.courseId === s.courseId;
            return (
              <button
                key={`${s.classId}-${s.courseId}`}
                onClick={() => setSelectedSection(s)}
                className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${
                  active
                    ? "bg-indigo-600/20 border-indigo-500/60 text-white shadow-sm"
                    : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600"
                }`}
              >
                <span className="font-semibold text-sm">{s.courseName}</span>
                <span className={`text-xs mt-0.5 ${active ? "text-indigo-300" : "text-slate-600"}`}>
                  Grade {s.grade}
                  {s.section && ` · Section ${s.section}`}
                  {s.stream && ` · ${s.stream}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 3 : Enter Marks ─────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/70">
        <StepHeader
          number={3}
          title="Enter Marks"
          subtitle="Fill in each student's assessment scores below."
          done={false}
        />

        {/* Context bar */}
        {readyToGrade && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 mb-5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-sm">
            <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <Calendar className="w-4 h-4" />
              {activeSemester?.name}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            <span className="flex items-center gap-1.5 text-slate-300">
              <BookOpen className="w-4 h-4 text-blue-400" />
              {activeSection.courseName}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            <span className="flex items-center gap-1.5 text-slate-300">
              <School className="w-4 h-4 text-emerald-400" />
              Grade {activeSection.grade}
              {activeSection.section && ` · Section ${activeSection.section}`}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            <span className="flex items-center gap-1.5 text-slate-300">
              <CalendarDays className="w-4 h-4 text-violet-400" />
              {formatEthiopianYear(activeSection.academicYear)}
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-slate-500 text-xs">
              <Users className="w-3.5 h-3.5" />
              {activeSection.studentCount} students
            </span>
          </div>
        )}

        {!readyToGrade ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 gap-2">
            <GraduationCap className="w-10 h-10 opacity-40" />
            <p className="text-sm">Complete steps 1 and 2 above to load the grading table.</p>
          </div>
        ) : (
          <GradingTable
            key={`${activeSection.classId}-${activeSection.courseId}-${selectedSemId}`}
            section={activeSection}
            semesterId={selectedSemId}
            semesterName={activeSemester?.name ?? ""}
          />
        )}
      </div>

    </div>
  );
}
