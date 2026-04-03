"use client";

import { FormEvent, useState } from "react";
import { useAdminSemesters, useCreateAdminSemester, useDeleteAdminSemester } from "../../../../hooks/useAdmin";

export default function AdminSemestersView() {
  const { data, isLoading } = useAdminSemesters();
  const createSemester = useCreateAdminSemester();
  const deleteSemester = useDeleteAdminSemester();
  const [form, setForm] = useState({
    name: "Semester 1",
    year: new Date().getFullYear(),
    startDate: "",
    endDate: "",
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createSemester.mutateAsync({
      name: form.name,
      year: Number(form.year),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-5">
        <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Semester name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
        <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Year" type="number" value={form.year} onChange={(e) => setForm((s) => ({ ...s, year: Number(e.target.value) }))} required />
        <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} />
        <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" type="date" value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} />
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500" type="submit">
          Create Semester
        </button>
      </form>

      {isLoading ? <p className="text-slate-400">Loading semesters...</p> : (
        <ul className="space-y-2">
          {(data ?? []).map((semester) => (
            <li key={semester._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-200">
              <span>{semester.name} - {semester.year}</span>
              <button className="rounded bg-rose-600/20 px-3 py-1 text-rose-300 hover:bg-rose-600/30" onClick={() => deleteSemester.mutate(semester._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
