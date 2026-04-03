"use client";

import { useAdminUsers, useDeleteAdminUser } from "../../../../hooks/useAdmin";

export default function AdminUsersView() {
  const { data, isLoading } = useAdminUsers();
  const deleteUser = useDeleteAdminUser();

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">Use the Register tab to create new staff accounts.</p>

      {isLoading ? <p className="text-slate-400">Loading users...</p> : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-right">Action</th></tr>
            </thead>
            <tbody>
              {(data ?? []).map((user) => (
                <tr key={user._id} className="border-t border-slate-800 text-slate-200">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded bg-rose-600/20 px-3 py-1 text-rose-300 hover:bg-rose-600/30" onClick={() => deleteUser.mutate(user._id)}>
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
