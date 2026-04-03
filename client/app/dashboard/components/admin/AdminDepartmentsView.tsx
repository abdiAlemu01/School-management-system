"use client";

import { FormEvent, useState } from "react";
import { useAdminDepartments, useCreateAdminDepartment, useDeleteAdminDepartment } from "../../../../hooks/useAdmin";

export default function AdminDepartmentsView() {
  const { data, isLoading } = useAdminDepartments();
  const createDepartment = useCreateAdminDepartment();
  const deleteDepartment = useDeleteAdminDepartment();
  const [name, setName] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createDepartment.mutateAsync({ name });
    setName("");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Department name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500" type="submit">
          Add
        </button>
      </form>

      {isLoading ? <p className="text-slate-400">Loading departments...</p> : (
        <ul className="space-y-2">
          {(data ?? []).map((department) => (
            <li key={department._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-200">
              <span>{department.name}</span>
              <button className="rounded bg-rose-600/20 px-3 py-1 text-rose-300 hover:bg-rose-600/30" onClick={() => deleteDepartment.mutate(department._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
