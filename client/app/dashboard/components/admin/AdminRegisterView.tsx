"use client";

import { FormEvent, useState } from "react";
import { useCreateAdminUser } from "../../../../hooks/useAdmin";
import type { StaffRole } from "../../../../services/admin.service";

const roles: StaffRole[] = ["teacher", "registrar", "departmentHead"];

export default function AdminRegisterView() {
  const createUser = useCreateAdminUser();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher" as StaffRole,
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createUser.mutateAsync(form);
    setForm({ name: "", email: "", password: "", role: "teacher" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Register Staff Account</h2>
        <p className="mt-1 text-sm text-slate-400">
          Admin can create Teacher, Registrar, and Department Head accounts from this section.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-2"
      >
        <input
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
          required
        />
        <select
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={form.role}
          onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as StaffRole }))}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-70 md:col-span-2"
          type="submit"
          disabled={createUser.isPending}
        >
          {createUser.isPending ? "Creating..." : "Create Staff Account"}
        </button>
      </form>
    </div>
  );
}
