
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

type SavedCredential = {
  email: string;
  password: string;
};

import { useEffect, useRef, useState } from "react";
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
  "w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border-2 border-slate-500/90 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 transition-all hover:border-slate-400";

function getRoleRedirect(role: string): string {
  switch (role) {
    case "admin":
    case "teacher":
    case "student":
    case "registrar":
    case "departmentHead":
    case "finance":
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

  const [recentCredentials, setRecentCredentials] = useState<SavedCredential[]>([]);
  const [showCredentialSuggestions, setShowCredentialSuggestions] = useState(false);
  const emailFieldWrapperRef = useRef<HTMLDivElement | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [allowLoginInputEditing, setAllowLoginInputEditing] = useState(false);

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

  function resetLoginForm() {
    setLoginEmail("");
    setLoginPassword("");
    setShowLoginPw(false);
    setAllowLoginInputEditing(false);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("sms_recent_credentials");
      if (stored) {
        const parsed = JSON.parse(stored) as SavedCredential[];
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((item) => typeof item?.email === "string" && typeof item?.password === "string")
            .slice(0, 6);
          setRecentCredentials(cleaned);
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!emailFieldWrapperRef.current) return;
      if (!emailFieldWrapperRef.current.contains(event.target as Node)) {
        setShowCredentialSuggestions(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (view === "login") {
      resetLoginForm();
    }
  }, [view]);

  function saveRecentCredential(email: string, password: string) {
    if (!email || !password) return;
    setRecentCredentials((prev) => {
      const next = [{ email, password }, ...prev.filter((item) => item.email !== email)].slice(0, 6);
      try {
        localStorage.setItem("sms_recent_credentials", JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  function applySavedCredential(credential: SavedCredential) {
    setAllowLoginInputEditing(true);
    setLoginEmail(credential.email);
    setLoginPassword(credential.password);
    setShowCredentialSuggestions(false);
  }

  const filteredCredentials = recentCredentials.filter((item) =>
    item.email.toLowerCase().includes(loginEmail.toLowerCase())
  );

  // Mutations
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      const user = data.data.user;
      setAuth(user, data.token);
      saveRecentCredential(loginEmail.trim(), loginPassword);
      resetLoginForm();
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
      resetLoginForm();
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

      <div className="relative z-10 w-full max-w-lg px-6 py-12">

        {/* ══════════ LOGIN VIEW ══════════ */}
        {view === "login" && (
          <div>
            <div className="mb-7 text-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                🏫 School Management System
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300">
                Smart, Simple, and Efficient School Administration Platform
              </p>
            </div>

            <form autoComplete="off" className="space-y-5" onSubmit={(e) => { e.preventDefault(); loginMutation.mutate({ email: loginEmail, password: loginPassword }); }}>

              <div className="rounded-2xl border-2 border-slate-500/90 bg-slate-950/40 p-6 space-y-5 min-h-[320px]">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">Email address</label>
                  <div ref={emailFieldWrapperRef} className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      name="login-email"
                      required
                      autoComplete="off"
                      readOnly={!allowLoginInputEditing}
                      onFocus={() => {
                        setAllowLoginInputEditing(true);
                        setShowCredentialSuggestions(true);
                      }}
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setShowCredentialSuggestions(true);
                      }}
                      placeholder="Enter email"
                      className={INPUT}
                    />

                    {showCredentialSuggestions && filteredCredentials.length > 0 && (
                      <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/40">
                        {filteredCredentials.map((credential) => (
                          <button
                            key={credential.email}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              applySavedCredential(credential);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 transition-colors border-b border-slate-800 last:border-b-0"
                          >
                            <div className="text-sm text-slate-200">{credential.email}</div>
                            <div className="text-xs text-slate-400">{"•".repeat(Math.max(8, credential.password.length))}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-300">Password</label>
                    <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input type={showLoginPw ? "text" : "password"} name="login-password" required autoComplete="off" readOnly={!allowLoginInputEditing} onFocus={() => setAllowLoginInputEditing(true)} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter password" className={`${INPUT} pr-12`} />
                    <button type="button" onClick={() => setShowLoginPw(!showLoginPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loginMutation.isPending}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60 hover:scale-[1.01] flex items-center justify-center gap-2">
                  {loginMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign in"}
                </button>
              </div>
            </form>

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
                <button onClick={() => { resetLoginForm(); setView("login"); }} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
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
