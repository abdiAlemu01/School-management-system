"use client";

import { FormEvent, useState } from "react";
import { useAdminCourses, useCreateAdminCourse, useDeleteAdminCourse } from "../../../../hooks/useAdmin";
import type { StreamType } from "../../../../services/admin.service";

export default function AdminCoursesView() {
  const { data, isLoading } = useAdminCourses();
  const createCourse = useCreateAdminCourse();
  const deleteCourse = useDeleteAdminCourse();
  const [form, setForm] = useState({
    courseName: "",
    grade: 9,
    stream: "" as "" | StreamType,
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createCourse.mutateAsync({
      courseName: form.courseName,
      grade: Number(form.grade),
      stream: form.stream || null,
    });
    setForm((s) => ({ ...s, courseName: "" }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
        <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Course name" value={form.courseName} onChange={(e) => setForm((s) => ({ ...s, courseName: e.target.value }))} required />
        <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" type="number" min={9} max={12} value={form.grade} onChange={(e) => setForm((s) => ({ ...s, grade: Number(e.target.value) }))} />
        <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={form.stream ?? ""} onChange={(e) => setForm((s) => ({ ...s, stream: (e.target.value || "") as "" | StreamType }))}>
          <option value="">No stream (grade 9-10)</option>
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
