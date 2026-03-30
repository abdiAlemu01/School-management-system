"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "next/navigation";
import {
  LogOut, User as UserIcon, Settings, Bell, LayoutDashboard,
  Calendar, BookOpen, GraduationCap, ChevronRight,
  ShieldCheck, Activity, Users
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, color: "text-indigo-400" },
  { icon: BookOpen, label: "My Courses", active: false, color: "text-purple-400" },
  { icon: Calendar, label: "Schedule", active: false, color: "text-emerald-400" },
  { icon: Users, label: "Classmates", active: false, color: "text-blue-400" },
];

const statCards = [
  { label: "Enrolled Courses", value: "0", icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { label: "Attendance Rate", value: "—", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "Grade Average", value: "—", icon: GraduationCap, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
];

export default function DashboardPage() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
          <p className="px-3 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-widest">Main</p>
          {navItems.map(({ icon: Icon, label, active, color }) => (
            <a key={label} href="#"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-indigo-400" : `group-hover:${color}`} transition-colors shrink-0`} />
              {label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-500" />}
            </a>
          ))}
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
      <div className="flex-1 md:ml-64 xl:ml-72 flex flex-col min-h-screen">

        {/* Top Header */}
        <header className="h-16 sticky top-0 z-20 flex items-center justify-between px-6 border-b border-slate-800/70 bg-slate-900/50 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-slate-500 text-xs hidden sm:block">Overview of your academic activity</p>
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

          {/* Welcome */}
          <div className="mb-8 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
              Good day, {user.name.split(" ")[0]}! 👋
            </h2>
            <p className="text-slate-400 text-sm">Here's a summary of your academic standing.</p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 relative z-10">
            {statCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/70 hover:border-slate-700 transition-all shadow-lg hover:shadow-xl backdrop-blur-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{value}</p>
                <p className="text-slate-400 text-sm">{label}</p>
              </div>
            ))}
          </div>

          {/* Profile + Status Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-10">

            {/* Profile Card */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-slate-800/70 backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3 mb-5">
                <UserIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Account Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Full Name", value: user.name },
                  { label: "Email Address", value: user.email },
                  { label: "Role", value: user.role, isTag: true },
                  { label: "User ID", value: user._id, isMono: true },
                ].map(({ label, value, isTag, isMono }) => (
                  <div key={label} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</p>
                    {isTag ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold capitalize border border-indigo-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />{value}
                      </span>
                    ) : (
                      <p className={`text-slate-100 text-sm font-medium truncate ${isMono ? "font-mono text-xs text-slate-400" : ""}`}>{value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Status Panel */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800/40 to-slate-900/50 border border-slate-800/70 backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">System Status</h3>
              </div>
              <div className="flex-1 space-y-3">
                {[
                  { label: "Authentication", status: "Active", color: "text-emerald-400", dot: "bg-emerald-500" },
                  { label: "Database Link", status: "Connected", color: "text-emerald-400", dot: "bg-emerald-500" },
                  { label: "Session Token", status: "Valid", color: "text-indigo-400", dot: "bg-indigo-500" },
                ].map(({ label, status, color, dot }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/50">
                    <span className="text-slate-300 text-sm">{label}</span>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}>
                      <span className={`w-2 h-2 rounded-full ${dot} animate-pulse`} />
                      {status}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { logout(); router.push("/login"); }}
                className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/30 transition-all flex items-center justify-center gap-2 group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Sign Out
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
