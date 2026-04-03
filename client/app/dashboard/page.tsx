"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "next/navigation";
import {
  LogOut, Settings, Bell,
  GraduationCap, ChevronRight,
  User as UserIcon, BookOpen, FileCheck, Info, ClipboardPenLine, Users, UserPlus,
  CalendarDays, Trophy,
  LayoutDashboard, Building2, School, Layers,
} from "lucide-react";

// Student views
import AboutMeView from "./components/student/AboutMeView";
import CoursesView from "./components/student/CoursesView";
import RegistrationView from "./components/student/RegistrationView";
import ApplicationView from "./components/student/ApplicationView";
// Teacher views
import TeacherAddMarkView  from "./components/teacher/TeacherAddMarkView";
import TeacherStudentsView from "./components/teacher/TeacherStudentsView";
import TeacherRankView     from "./components/teacher/TeacherRankView";
// Registrar views
import RegistrarStudentsView from "./components/registrar/RegistrarStudentsView";
import RegistrarRegisterView from "./components/registrar/RegistrarRegisterView";
// Department Head views
import DHTimetableView from "./components/departmentHead/DHTimetableView";
import DHAssignSectionStudent from "./components/departmentHead/DHAssignSectionStudent";
import AdminOverviewView from "./components/admin/AdminOverviewView";
import AdminUsersView from "./components/admin/AdminUsersView";
import AdminRegisterView from "./components/admin/AdminRegisterView";
import AdminDepartmentsView from "./components/admin/AdminDepartmentsView";
import AdminClassesView from "./components/admin/AdminClassesView";
import AdminSemestersView from "./components/admin/AdminSemestersView";
import AdminCoursesView from "./components/admin/AdminCoursesView";

const studentNavItems = [
  { id: "about", icon: Info, label: "About Me", color: "text-indigo-400" },
  { id: "courses", icon: BookOpen, label: "Courses", color: "text-purple-400" },
  { id: "registration", icon: FileCheck, label: "Registration", color: "text-emerald-400" },
  { id: "application", icon: UserIcon, label: "Application", color: "text-blue-400" },
];

const teacherNavItems = [
  { id: "addMark",  icon: ClipboardPenLine, label: "Add Mark",   color: "text-indigo-400" },
  { id: "students", icon: Users,            label: "Students",   color: "text-emerald-400" },
  { id: "rank",     icon: Trophy,           label: "Class Rank", color: "text-yellow-400" },
];

const registrarNavItems = [
  { id: "regStudents", icon: Users, label: "All Students", color: "text-indigo-400" },
  { id: "regRegister", icon: UserPlus, label: "Register Student", color: "text-emerald-400" },
];

const departmentHeadNavItems = [
  { id: "dhTimetable",       icon: CalendarDays,    label: "Timetable",        color: "text-emerald-400" },
  { id: "dhAssignSections",  icon: GraduationCap,   label: "Assign Sections",  color: "text-amber-400"   },
];

const adminNavItems = [
  { id: "adminOverview", icon: LayoutDashboard, label: "Overview", color: "text-indigo-400" },
  { id: "adminRegister", icon: UserPlus, label: "Register", color: "text-blue-400" },
  { id: "adminUsers", icon: Users, label: "Users", color: "text-emerald-400" },
  { id: "adminDepartments", icon: Building2, label: "Departments", color: "text-cyan-400" },
  { id: "adminClasses", icon: School, label: "Classes", color: "text-amber-400" },
  { id: "adminSemesters", icon: CalendarDays, label: "Semesters", color: "text-violet-400" },
  { id: "adminCourses", icon: Layers, label: "Course Init", color: "text-fuchsia-400" },
];

export default function DashboardPage() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isTeacher       = user?.role === "teacher";
  const isRegistrar     = user?.role === "registrar";
  const isDepartmentHead = user?.role === "departmentHead";
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState("about");
  const navItems = isAdmin
    ? adminNavItems
    : isTeacher
    ? teacherNavItems
    : isRegistrar
    ? registrarNavItems
    : isDepartmentHead
    ? departmentHeadNavItems
    : studentNavItems;
  const effectiveActiveTab =
    navItems.find((item) => item.id === activeTab)?.id || navItems[0]?.id || "about";

  useEffect(() => {
    setMounted(true);
    if (!token && typeof window !== "undefined") {
      router.replace("/login");
    }
  }, [token, router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isAdmin) {
      switch (effectiveActiveTab) {
        case "adminRegister":
          return <AdminRegisterView />;
        case "adminUsers":
          return <AdminUsersView />;
        case "adminDepartments":
          return <AdminDepartmentsView />;
        case "adminClasses":
          return <AdminClassesView />;
        case "adminSemesters":
          return <AdminSemestersView />;
        case "adminCourses":
          return <AdminCoursesView />;
        default:
          return <AdminOverviewView />;
      }
    }

    if (isTeacher) {
      switch (effectiveActiveTab) {
        case "addMark":  return <TeacherAddMarkView />;
        case "students": return <TeacherStudentsView />;
        case "rank":     return <TeacherRankView />;
        default:         return <TeacherAddMarkView />;
      }
    }

    if (isRegistrar) {
      switch (effectiveActiveTab) {
        case "regStudents":
          return <RegistrarStudentsView />;
        case "regRegister":
          return <RegistrarRegisterView />;
        default:
          return <RegistrarStudentsView />;
      }
    }

    if (isDepartmentHead) {
      switch (effectiveActiveTab) {
        case "dhAssignSections": return <DHAssignSectionStudent />;
        default:                 return <DHTimetableView />;
      }
    }

    switch (effectiveActiveTab) {
      case "about":
        return <AboutMeView />;
      case "courses":
        return <CoursesView />;
      case "registration":
        return <RegistrationView />;
      case "application":
        return <ApplicationView />;
      default:
        return <AboutMeView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex">

      {/* ── Sidebar ── */}
      <aside className="w-64 xl:w-72 hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/70">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/70 cursor-pointer" onClick={() => router.push("/")}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold tracking-tight">EduPortal</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-widest">
            {isAdmin
              ? "Admin Portal"
              : isTeacher
              ? "Teacher Portal"
              : isRegistrar
              ? "Registrar Office"
              : isDepartmentHead
              ? "Department Head"
              : "Student Portal"}
          </p>
          {navItems.map(({ id, icon: Icon, label, color }) => {
            const active = effectiveActiveTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-indigo-400" : `group-hover:${color}`} transition-colors shrink-0`} />
                {label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-500" />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-800/70 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/30 border border-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-200 text-sm font-medium truncate">{user.name}</p>
              <p className="text-slate-500 text-xs capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 md:ml-64 xl:ml-72 flex flex-col min-h-screen relative z-10">

        {/* Top Header */}
        <header className="h-16 sticky top-0 z-20 flex items-center justify-between px-6 border-b border-slate-800/70 bg-slate-900/50 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight capitalize">
              {navItems.find((n) => n.id === effectiveActiveTab)?.label}
            </h1>
            <p className="text-slate-500 text-xs hidden sm:block">Welcome back, {user.name.split(" ")[0]} 👋</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all border border-transparent hover:border-slate-700">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all border border-transparent hover:border-slate-700">
              <Settings className="w-4 h-4" />
            </button>
            <div className="ml-1 w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto relative">
          {/* Ambient glow */}
          <div aria-hidden className="pointer-events-none absolute top-0 right-0 w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px]" />

          <div className="relative z-10">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
