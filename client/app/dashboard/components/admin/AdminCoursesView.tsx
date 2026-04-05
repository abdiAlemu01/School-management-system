"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import { useAdminCourses, useCreateAdminCourse, useDeleteAdminCourse } from "../../../../hooks/useAdmin";
import type { StreamType } from "../../../../services/admin.service";

export default function AdminCoursesView() {
  const { data, isLoading } = useAdminCourses();
  const createCourse = useCreateAdminCourse();
  const deleteCourse = useDeleteAdminCourse();
  const [form, setForm] = useState({
    courseName: "",
    grade: 9 as number | "",
    stream: "" as "" | StreamType,
  });
  const selectedGrade = Number(form.grade);
  const needsStream = selectedGrade === 11 || selectedGrade === 12;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const gradeValue = Number(form.grade);
    if (!Number.isInteger(gradeValue) || gradeValue < 9 || gradeValue > 12) {
      toast.error("Grade must be between 9 and 12.");
      return;
    }

    if (needsStream && !form.stream) {
      toast.error("Please select stream for Grade 11 or 12.");
      return;
    }

    await createCourse.mutateAsync({
      courseName: form.courseName.trim(),
      grade: gradeValue,
      stream: needsStream ? (form.stream as StreamType) : null,
    });
    setForm((s) => ({ ...s, courseName: "", stream: needsStream ? s.stream : "" }));
  };

  return (
    <div className="space-y-6">
      <h1>Create New Course</h1>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
        <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Course name" value={form.courseName} onChange={(e) => setForm((s) => ({ ...s, courseName: e.target.value }))} required />
        <div className="space-y-1">
          <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="number" min={9} max={12} placeholder="Enter grade" value={form.grade} onChange={(e) => setForm((s) => {
            const nextGrade = e.target.value === "" ? "" : Number(e.target.value);
            const streamAllowed = nextGrade === 11 || nextGrade === 12;
            return {
              ...s,
              grade: nextGrade,
              stream: streamAllowed ? s.stream : "",
            };
          })} />
        </div>
        <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.stream ?? ""} onChange={(e) => setForm((s) => ({ ...s, stream: (e.target.value || "") as "" | StreamType }))} disabled={!needsStream}>
          <option value="">{needsStream ? "Select stream" : "No stream (grade 9-10)"}</option>
          <option value="natural">Natural</option>
          <option value="social">Social</option>
        </select>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500" type="submit">
          Create Course
        </button>
      </form>

      {isLoading ? <p className="text-slate-400">Loading courses...</p> : (
        <ul className="space-y-2">
          {(data ?? []).map((course) => (
            <li key={course._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-200">
              <span>
                {course.courseName} - Grade {course.grade}
                {course.stream ? ` (${course.stream})` : ""}
              </span>
              <button className="rounded bg-rose-600/20 px-3 py-1 text-rose-300 hover:bg-rose-600/30" onClick={() => deleteCourse.mutate(course._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
