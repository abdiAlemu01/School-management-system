"use client";

import { FormEvent, useState } from "react";
import { useAdminClasses, useCreateAdminClass, useDeleteAdminClass } from "../../../../hooks/useAdmin";
import type { StreamType } from "../../../../services/admin.service";

export default function AdminClassesView() {
  const { data, isLoading } = useAdminClasses();
  const createClass = useCreateAdminClass();
  const deleteClass = useDeleteAdminClass();
  const [form, setForm] = useState({
    grade: 9,
    stream: "" as "" | StreamType,
    section: "A",
    academicYear: new Date().getFullYear().toString(),
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createClass.mutateAsync({
      grade: Number(form.grade),
      stream: form.stream || null,
      section: form.section,
      academicYear: form.academicYear,
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-5">
        <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Grade (9-12)" type="number" min={9} max={12} value={form.grade} onChange={(e) => setForm((s) => ({ ...s, grade: Number(e.target.value) }))} />
        <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={form.stream ?? ""} onChange={(e) => setForm((s) => ({ ...s, stream: (e.target.value || "") as "" | StreamType }))}>
          <option value="">No stream (grade 9-10)</option>
          <option value="natural">Natural</option>
          <option value="social">Social</option>
        </select>
        <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Section (A, B...)" value={form.section} onChange={(e) => setForm((s) => ({ ...s, section: e.target.value }))} />
        <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Academic year" value={form.academicYear} onChange={(e) => setForm((s) => ({ ...s, academicYear: e.target.value }))} />
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500" type="submit">
          Create Class
        </button>
      </form>

      {isLoading ? <p className="text-slate-400">Loading classes...</p> : (
        <ul className="space-y-2">
          {(data ?? []).map((cls) => (
            <li key={cls._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-200">
              <span>{cls.name}</span>
              <button className="rounded bg-rose-600/20 px-3 py-1 text-rose-300 hover:bg-rose-600/30" onClick={() => deleteClass.mutate(cls._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
