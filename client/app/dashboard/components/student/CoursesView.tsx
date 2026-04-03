"use client";

import { useStudentCourses } from "../../../../hooks/useStudent";
import type { StudentCourse } from "../../../../services/student.service";
import { BookOpen, User as UserIcon, Mail } from "lucide-react";
import { getApiErrorMessage } from "../../../../utils/apiError";

export default function CoursesView() {
  const { data: courses, isLoading, isError, error } = useStudentCourses();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl">
        Failed to load courses: {getApiErrorMessage(error, "Unable to fetch courses")}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800/70">
        <BookOpen className="w-12 h-12 text-slate-500 mb-4" />
        <p className="text-white font-medium">No courses found</p>
        <p className="text-slate-400 text-sm mt-1">You are not enrolled in any courses yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">My Courses</h2>
        <p className="text-slate-400 text-sm">View details about your current enrolled subjects and assessments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map((course: StudentCourse) => (
          <div key={course.id} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/70 shadow-lg backdrop-blur-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{course.courseName}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <UserIcon className="w-3.5 h-3.5" /> {course.teacherName}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Mail className="w-3.5 h-3.5" /> {course.teacherEmail}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Assessments</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Quiz</span>
                  <span className="text-white font-medium text-sm">{course.assessments.quiz}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Assignment</span>
                  <span className="text-white font-medium text-sm">{course.assessments.assignment}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Mid Exam</span>
                  <span className="text-white font-medium text-sm">{course.assessments.midExam}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs mb-1">Final Exam</span>
                  <span className="text-white font-medium text-sm">{course.assessments.finalExam}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Total Grade</span>
                <span className="text-lg font-bold text-indigo-400">{course.assessments.total}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
