"use client";

import { useAdminClasses, useAdminCourses, useAdminDepartments, useAdminSemesters, useAdminUsers } from "../../../../hooks/useAdmin";

const StatCard = ({ title, value }: { title: string; value: number | string }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
    <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
  </div>
);

export default function AdminOverviewView() {
  const users = useAdminUsers();
  const departments = useAdminDepartments();
  const classes = useAdminClasses();
  const semesters = useAdminSemesters();
  const courses = useAdminCourses();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">System Admin Overview</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Users" value={users.data?.length ?? 0} />
        <StatCard title="Departments" value={departments.data?.length ?? 0} />
        <StatCard title="Classes" value={classes.data?.length ?? 0} />
        <StatCard title="Semesters" value={semesters.data?.length ?? 0} />
        <StatCard title="Courses" value={courses.data?.length ?? 0} />
      </div>
      <p className="text-sm text-slate-400">
        Admin configures structure and user access. Teaching assignments, timetables, and student sectioning remain in
        Registrar and Department Head workflows.
      </p>
    </div>
  );
}
