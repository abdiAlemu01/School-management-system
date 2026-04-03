"use client";

import { useStudentRegistration } from "../../../../hooks/useStudent";
import type { StudentRegistration } from "../../../../services/student.service";
import { CheckCircle2, AlertCircle, BookOpen } from "lucide-react";
import { getApiErrorMessage } from "../../../../utils/apiError";

export default function RegistrationView() {
  const { data, isLoading, isError, error } = useStudentRegistration();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        Failed to load registration data: {getApiErrorMessage(error, "Unable to fetch registration data")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Registration Status</h2>
        <p className="text-slate-400 text-sm">Review your enrollment status for the current academic session.</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/70 shadow-lg backdrop-blur-sm max-w-2xl">
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <h3 className="text-emerald-400 font-bold">Status: {data?.message || "Registered successfully"}</h3>
            <p className="text-emerald-500/70 text-sm">You are officially enrolled for these courses.</p>
          </div>
        </div>

        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" /> Enrolled Courses
        </h4>

        {data?.data && data.data.length > 0 ? (
          <ul className="space-y-3">
            {data.data.map((course: StudentRegistration, index: number) => (
              <li key={course.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/50">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <span className="text-slate-300 font-medium">{course.courseName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm italic">No courses found in your registration record.</p>
        )}
      </div>
    </div>
  );
}
