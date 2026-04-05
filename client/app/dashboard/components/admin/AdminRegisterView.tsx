"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCreateAdminUser } from "../../../../hooks/useAdmin";
import type { StaffRole } from "../../../../services/admin.service";
import { getApiErrorMessage } from "../../../../utils/apiError";

const roles: StaffRole[] = ["teacher", "registrar", "departmentHead", "finance"];

const inputClass =
  "w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3.5 text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition";

const selectClass =
  "w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3.5 text-base text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition [&>option]:bg-slate-900";

const defaultForm = {
  name: "",
  email: "",
  password: "",
  role: "teacher" as StaffRole,
};

type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
};

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

export default function AdminRegisterView() {
  const createUser = useCreateAdminUser();
  const [form, setForm] = useState(defaultForm);
  const [successName, setSuccessName] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => Boolean(form.name.trim() && form.email.trim() && form.password.trim()),
    [form.email, form.name, form.password],
  );

  const resetForm = () => {
    setForm(defaultForm);
    setSuccessName(null);
    createUser.reset();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password.trim(),
    };

    if (!payload.name || !payload.email || !payload.password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await createUser.mutateAsync(payload);
      toast.success("Staff account created successfully.");
      setSuccessName(payload.name);
      setForm(defaultForm);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create staff account"));
      setForm((current) => ({ ...current, password: "" }));
    }
  };

  return (
    <div className="mx-auto min-h-[75vh] max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Create Account for Staff Members</h2>
      </div>

      {successName && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Account created</p>
            <p className="mt-0.5 text-sm text-emerald-400/80">
              <span className="font-medium">{successName}</span> was added successfully.
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        autoComplete="off"
        className="flex min-h-[58vh] flex-col justify-between space-y-5 rounded-2xl border border-slate-800/70 bg-slate-900/50 p-6"
      >
        <p className="border-b border-slate-800/50 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Staff Account Information
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name " required>
            <input
              className={inputClass}
              placeholder="Enter full name"
              type="text"
              autoComplete="off"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </Field>

          <Field label="Email" required>
            <input
              className={inputClass}
              placeholder="Enter email"
              type="email"
              autoComplete="off"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            />
          </Field>

          <Field label="Click Role " required>
            <select
              className={selectClass}
              value={form.role}
              onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as StaffRole }))}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Password"
            required
            hint=""
          >
            <input
              className={inputClass}
              placeholder="Enter password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-800/50 disabled:text-indigo-300"
            type="submit"
            disabled={createUser.isPending || !canSubmit}
          >
            {createUser.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create Staff Account
              </>
            )}
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={resetForm}
            disabled={createUser.isPending}
          >
            <RotateCcw className="h-4 w-4" />
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}
