"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import { useAdminClasses, useCreateAdminClass, useDeleteAdminClass } from "../../../../hooks/useAdmin";
import type { StreamType } from "../../../../services/admin.service";

export default function AdminClassesView() {
  const { data, isLoading } = useAdminClasses();
  const createClass = useCreateAdminClass();
  const deleteClass = useDeleteAdminClass();
  const [form, setForm] = useState({
    grade: 9 as number | "",
    stream: "" as "" | StreamType,
    section: "A",
    academicYear: new Date().getFullYear().toString(),
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

    await createClass.mutateAsync({
      grade: gradeValue,
      stream: needsStream ? (form.stream as StreamType) : null,
      section: form.section,
      academicYear: form.academicYear,
    });
  };

  return (
    <div className="mx-auto min-h-[78vh] max-w-5xl space-y-6">
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 md:grid-cols-5">
        <input className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" placeholder="Grade (9-12)" type="number" min={9} max={12} value={form.grade} onChange={(e) => setForm((s) => {
          const nextGrade = e.target.value === "" ? "" : Number(e.target.value);
          const streamAllowed = nextGrade === 11 || nextGrade === 12;
          return {
            ...s,
            grade: nextGrade,
            stream: streamAllowed ? s.stream : "",
          };
        })} />
        <select className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.stream ?? ""} onChange={(e) => setForm((s) => ({ ...s, stream: (e.target.value || "") as "" | StreamType }))} disabled={!needsStream}>
          <option value="">{needsStream ? "Select stream" : "No stream (grade 9-10)"}</option>
          <option value="natural">Natural</option>
          <option value="social">Social</option>
        </select>
        <input className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white" placeholder="Section (A, B...)" value={form.section} onChange={(e) => setForm((s) => ({ ...s, section: e.target.value }))} />
        <input className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white" placeholder="Academic year" value={form.academicYear} onChange={(e) => setForm((s) => ({ ...s, academicYear: e.target.value }))} />
        <button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500" type="submit">
          Create Class
        </button>
      </form>

      {isLoading ? <p className="text-slate-400">Loading classes...</p> : (
        <ul className="min-h-[46vh] space-y-2 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 sm:p-5">
          {(data ?? []).map((cls) => (
            <li key={cls._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 text-slate-200">
              <span>{cls.name}</span>
              <button className="rounded-lg bg-rose-600/20 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-600/30" onClick={() => deleteClass.mutate(cls._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
