"use client";

import { useAdminUsers, useDeleteAdminUser } from "../../../../hooks/useAdmin";

export default function AdminUsersView() {
  const { data, isLoading } = useAdminUsers();
  const deleteUser = useDeleteAdminUser();

  return (
    <div className="mx-auto min-h-[78vh] max-w-5xl space-y-6">
      <p className="text-sm text-slate-400">Use the Register tab to create new staff accounts.</p>

      {isLoading ? <p className="text-slate-400">Loading users...</p> : (
        <div className="min-h-[50vh] overflow-x-auto rounded-2xl border border-slate-800/70 bg-slate-900/40 p-2 sm:p-3">
          <table className="min-w-full text-base">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr><th className="px-5 py-4 text-left">Name</th><th className="px-5 py-4 text-left">Email</th><th className="px-5 py-4 text-left">Role</th><th className="px-5 py-4 text-right">Action</th></tr>
            </thead>
            <tbody>
              {(data ?? []).map((user) => (
                <tr key={user._id} className="border-t border-slate-800 text-slate-200">
                  <td className="px-5 py-4">{user.name}</td>
                  <td className="px-5 py-4">{user.email}</td>
                  <td className="px-5 py-4 capitalize">{user.role}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="inline-flex h-[42px] items-center rounded-lg bg-rose-600/20 px-4 text-sm font-medium text-rose-300 transition hover:bg-rose-600/30" onClick={() => deleteUser.mutate(user._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
