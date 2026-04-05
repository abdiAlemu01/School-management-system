"use client";

import { useAdminClasses, useAdminCourses, useAdminDepartments, useAdminUsers } from "../../../../hooks/useAdmin";

const StatCard = ({ title, value }: { title: string; value: number | string }) => (
  <div className="min-h-[150px] rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6">
    <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
    <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
  </div>
);

export default function AdminOverviewView() {
  const users = useAdminUsers();
  const departments = useAdminDepartments();
  const classes = useAdminClasses();
  const courses = useAdminCourses();

  return (
    <div className="mx-auto min-h-[78vh] max-w-5xl space-y-6">
      <h2 className="text-2xl font-semibold text-white">System Overview</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Users" value={users.data?.length ?? 0} />
        <StatCard title="Departments" value={departments.data?.length ?? 0} />
        <StatCard title="Classes" value={classes.data?.length ?? 0} />
        <StatCard title="Courses" value={courses.data?.length ?? 0} />
      </div>
      
    </div>
  );
}
