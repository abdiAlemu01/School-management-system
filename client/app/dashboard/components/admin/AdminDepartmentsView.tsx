"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { AlertCircle, Building2, Loader2, Plus, Trash2 } from "lucide-react";
import { useAdminDepartments, useCreateAdminDepartment, useDeleteAdminDepartment } from "../../../../hooks/useAdmin";
import { getApiErrorMessage } from "../../../../utils/apiError";

const inputClass =
  "w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-5 py-4 text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition";

export default function AdminDepartmentsView() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminDepartments();
  const createDepartment = useCreateAdminDepartment();
  const deleteDepartment = useDeleteAdminDepartment();
  const [name, setName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const cleanName = name.trim();
  const hasDuplicateName = useMemo(
    () =>
      (data ?? []).some((department) => department.name.trim().toLowerCase() === cleanName.toLowerCase()),
    [cleanName, data],
  );
  const canSubmit = Boolean(cleanName) && !hasDuplicateName && !createDepartment.isPending;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!cleanName) {
      toast.error("Department name is required.");
      return;
    }

    if (hasDuplicateName) {
      toast.error("This department already exists.");
      return;
    }

    try {
      await createDepartment.mutateAsync({ name: cleanName });
      toast.success("Department created successfully.");
      setName("");
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, "Failed to create department"));
    }
  };

  const handleDelete = async (departmentId: string, departmentName: string) => {
    const confirmed = window.confirm(`Delete "${departmentName}" department?`);
    if (!confirmed) return;

    try {
      setDeletingId(departmentId);
      await deleteDepartment.mutateAsync(departmentId);
      toast.success("Department deleted.");
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "Failed to delete department"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto min-h-[78vh] max-w-5xl space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white text-center">Departments</h3>
        <p className="mt-0.5  text-slate-400 text-center">Create and manage department records for your institution.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/50 p-7">
        <p className="border-b border-slate-800/50 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Add New Department
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="w-full">
            <input
              className={inputClass}
              placeholder="e.g. Mathematics Department"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              aria-label="Department name"
            />
            {hasDuplicateName && (
              <p className="mt-1.5 text-xs text-amber-400">A department with this name already exists.</p>
            )}
          </div>

          <button
            className="inline-flex h-[56px] min-w-[190px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-800/50 disabled:text-indigo-300"
            type="submit"
            disabled={!canSubmit}
          >
            {createDepartment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Department
              </>
            )}
          </button>
        </div>
      </form>

      <section className="min-h-[44vh] rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Department List ({data?.length ?? 0})
          </h4>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading departments...
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Could not load departments.</p>
                <p className="mt-0.5 text-rose-300/90">{getApiErrorMessage(error, "Please try again.")}</p>
              </div>
            </div>
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/30 p-6 text-center">
            <Building2 className="mx-auto h-6 w-6 text-slate-500" />
            <p className="mt-2 text-sm font-medium text-slate-300">No departments yet</p>
            <p className="mt-1 text-xs text-slate-500">Create your first department using the form above.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {(data ?? []).map((department) => {
              const isDeleting = deletingId === department._id;

              return (
                <li
                  key={department._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-100">{department.name}</p>
                    <p className="text-xs text-slate-500">ID: {department._id}</p>
                  </div>

                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600/20 px-3 py-1.5 text-sm font-medium text-rose-300 transition hover:bg-rose-600/30 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleDelete(department._id, department.name)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
