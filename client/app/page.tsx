
"use client";
// Type for registration data
type RegisterData = {
  name: string;
  age: string;
  email: string;
  password: string;
  gender: string;
  role: "student" | "admin";
};

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Mail, Lock, Eye, EyeOff, User, ChevronDown } from "lucide-react";
import type { AxiosError } from "axios";

function passwordStrength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return {
    score: s,
    label: ["", "Weak", "Fair", "Good", "Strong"][s],
    color: ["", "bg-rose-500", "bg-amber-500", "bg-blue-400", "bg-emerald-500"][s],
  };
}

const INPUT =
  "w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all hover:border-slate-600";

function getRoleRedirect(role: string): string {
  switch (role) {
    case "admin":
    case "teacher":
    case "student":
    case "registrar":
    default:
      return "/dashboard";
  }
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}

export default function AuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [view, setView] = useState<"login" | "register">("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register state
  const [reg, setReg] = useState<RegisterData>({
    name: "",
    age: "",
    email: "",
    password: "",
    gender: "other",
    role: "student",
  });
  const [showRegPw, setShowRegPw] = useState(false);
  const { score, label, color } = passwordStrength(reg.password);

  // Mutations
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      const user = data.data.user;
      setAuth(user, data.token);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`, {
        style: { background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" },
      });
      router.push(getRoleRedirect(user.role));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Invalid credentials"), {
        style: { background: "#1e1a1a", color: "#fca5a5", border: "1px solid #7f1d1d" },
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register({ ...data, age: Number(data.age) }),
    onSuccess: () => {
      toast.success("Account created! Please sign in.", {
        style: { background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" },
      });
      setLoginEmail(reg.email);
      setLoginPassword("");
      setView("login");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Registration failed"), {
        style: { background: "#1e1a1a", color: "#fca5a5", border: "1px solid #7f1d1d" },
      });
    },
  });

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden">

      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-700/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-700/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12">

        {/* ══════════ LOGIN VIEW ══════════ */}
        {view === "login" && (
          <div>
           

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); loginMutation.mutate({ email: loginEmail, password: loginPassword }); }}>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input type="email" required autoComplete="username" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="example@gmail.com" className={INPUT} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">Password</label>
                  <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input type={showLoginPw ? "text" : "password"} required autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className={`${INPUT} pr-12`} />
                  <button type="button" onClick={() => setShowLoginPw(!showLoginPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loginMutation.isPending}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60 hover:scale-[1.01] flex items-center justify-center gap-2">
                {loginMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign in"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <button onClick={() => setView("register")} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Create account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ══════════ REGISTER VIEW ══════════ */}
        {view === "register" && (
          <div>
            <div className="mb-7">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1.5">Create account</h2>

            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); registerMutation.mutate(reg); }}>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input type="text" required value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} placeholder="Jane Smith" className={INPUT} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Age</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="number"
                    required
                    value={reg.age === undefined ? "" : reg.age}
                    onChange={e => setReg({ ...reg, age: e.target.value })}
                    placeholder="25"
                    className={INPUT}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input type="email" required autoComplete="username" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} placeholder="example@gmail.com" className={INPUT} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input type={showRegPw ? "text" : "password"} required autoComplete="new-password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} placeholder="Min. 8 characters" className={`${INPUT} pr-12`} />
                  <button type="button" onClick={() => setShowRegPw(!showRegPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {reg.password && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${(score / 4) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-10 text-right">{label}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Gender</label>
                <div className="relative">
                  <select required value={reg.gender} onChange={(e) => setReg({ ...reg, gender: e.target.value })}
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all hover:border-slate-600 appearance-none">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Register as</label>
                <div className="relative">
                  <select
                    required
                    value={reg.role}
                    onChange={(e) =>
                      setReg({
                        ...reg,
                        role: e.target.value as RegisterData["role"],
                      })
                    }
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all hover:border-slate-600 appearance-none"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <button type="submit" disabled={registerMutation.isPending}
                className="w-full py-3.5 mt-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60 hover:scale-[1.01] flex items-center justify-center gap-2">
                {registerMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : "Create Account"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <button onClick={() => setView("login")} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Sign in
                </button>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
