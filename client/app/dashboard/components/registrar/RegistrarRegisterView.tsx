"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { UserPlus, CheckCircle2, Loader2 } from "lucide-react";
import { useRegisterStudent } from "../../../../hooks/useRegistrar";
import { getApiErrorMessage } from "../../../../utils/apiError";
import type { StudentRegistrationPayload, StreamType } from "../../../../services/registrar.service";

const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return `${y}`;
});

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
};

function Field({ label, required, children, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-slate-600 text-sm">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full bg-slate-950/60 border border-slate-800/70 text-white rounded-xl px-4 py-3.5 text-base placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition";

const selectClass =
  "w-full bg-slate-950/60 border border-slate-800/70 text-white rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition [&>option]:bg-slate-900";

const numberInputClass =
  `${inputClass} appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

const defaultForm: Omit<StudentRegistrationPayload, "grade" | "stream"> & {
  grade: string;
  stream: string;
} = {
  name: "",
  email: "",
  password: "",
  age: 0,
  gender: "",
  phone: "",
  address: "",
  zone: "",
  woreda: "",
  kebele: "",
  village: "",
  grade: "",
  stream: "",
  academicYear: ACADEMIC_YEARS[0],
};

export default function RegistrarRegisterView() {
  const [form, setForm] = useState(defaultForm);
  const [success, setSuccess] = useState<{ studentId: string; name: string; enrolledCourses: number } | null>(null);

  const { mutate, isPending } = useRegisterStudent();

  const gradeNum = Number(form.grade);
  const needsStream = gradeNum === 11 || gradeNum === 12;

  const set = (key: keyof typeof defaultForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) =>
    setForm((prev) => {
      if (key === "grade") {
        const nextGrade = Number(e.target.value);
        const requiresStream = nextGrade === 11 || nextGrade === 12;
        return {
          ...prev,
          grade: e.target.value,
          stream: requiresStream ? prev.stream : "",
        };
      }
      return { ...prev, [key]: e.target.value };
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.gender ||
      !form.grade ||
      !form.academicYear ||
      !form.zone ||
      !form.woreda ||
      !form.kebele ||
      !form.village
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (needsStream && !form.stream) {
      toast.error("Stream is required for Grade 11 and 12.");
      return;
    }

    const payload: StudentRegistrationPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password || "changeme123",
      age: Number(form.age) || 0,
      gender: form.gender,
      phone: form.phone || undefined,
      address: form.address || undefined,
      zone: form.zone.trim(),
      woreda: form.woreda.trim(),
      kebele: form.kebele.trim(),
      village: form.village.trim(),
      grade: Number(form.grade),
      stream: needsStream ? (form.stream as StreamType) : null,
      academicYear: form.academicYear,
    };

    mutate(payload, {
      onSuccess: (data) => {
        toast.success(`${data.user.name} registered successfully!`);
        setSuccess({
          studentId: data.student.studentId,
          name: data.user.name,
          enrolledCourses: data.enrolledCourses,
        });
        setForm(defaultForm);
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, "Failed to register student"));
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white">Register Student</h2>
        <p className="text-slate-400 text-base mt-0.5">
          Fill in the details below information. Courses will be automatically assigned based on grade and stream for the students.
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 font-semibold text-base">Student Registered!</p>
            <p className="text-emerald-400/80 text-base mt-0.5">
              <span className="font-medium">{success.name}</span> &mdash; ID:{" "}
              <span className="font-mono font-semibold">{success.studentId}</span>
            </p>
            <p className="text-emerald-500/70 text-sm mt-1">
              Enrolled in {success.enrolledCourses} course{success.enrolledCourses !== 1 ? "s" : ""} automatically.
            </p>
          </div>
        </div>
      )}

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="bg-slate-900/50 border border-slate-800/70 rounded-2xl p-6 space-y-5"
      >
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-2">
          Personal Information
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input
              type="text"
              className={inputClass}
              placeholder="Enter full name"
              autoComplete="off"
              value={form.name}
              onChange={set("name")}
            />
          </Field>

          <Field label="Email" required>
            <input
              type="email"
              className={inputClass}
              placeholder="Enter email"
              autoComplete="off"
              value={form.email}
              onChange={set("email")}
            />
          </Field>

          <Field label="Password" hint="Default: changeme123 if left empty">
            <input
              type="password"
              className={inputClass}
              placeholder="Enter password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
            />
          </Field>

          <Field label="Age">
            <input
              type="number"
              className={numberInputClass}
              placeholder="Enter age"
              min={1}
              autoComplete="off"
              value={form.age || ""}
              onChange={set("age")}
            />
          </Field>

          <Field label="Gender" required>
            <select className={selectClass} value={form.gender} onChange={set("gender")}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              className={inputClass}
              placeholder="Enter phone number"
              autoComplete="off"
              value={form.phone}
              onChange={set("phone")}
            />
          </Field>
        </div>

        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-2 pt-1">
          Location Information
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Zone" required>
            <input
              type="text"
              className={inputClass}
              placeholder="Enter zone"
              autoComplete="off"
              value={form.zone || ""}
              onChange={set("zone")}
            />
          </Field>

          <Field label="Woreda" required>
            <input
              type="text"
              className={inputClass}
              placeholder="Enter woreda"
              autoComplete="off"
              value={form.woreda || ""}
              onChange={set("woreda")}
            />
          </Field>

          <Field label="Kebele" required>
            <input
              type="text"
              className={inputClass}
              placeholder="Enter kebele"
              autoComplete="off"
              value={form.kebele || ""}
              onChange={set("kebele")}
            />
          </Field>

          <Field label="Village" required>
            <input
              type="text"
              className={inputClass}
              placeholder="Enter village"
              autoComplete="off"
              value={form.village || ""}
              onChange={set("village")}
            />
          </Field>
        </div>

        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-2 pt-1">
          Academic Information
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Grade" required>
            <select className={selectClass} value={form.grade} onChange={set("grade")}>
              <option value="">Select grade</option>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
          </Field>

          <Field
            label="Stream"
            required={needsStream}
            hint={!needsStream && form.grade ? "N/A for Grade 9 & 10" : undefined}
          >
            <select
              className={selectClass}
              value={form.stream}
              onChange={set("stream")}
              disabled={!needsStream}
            >
              <option value="">
                {needsStream ? "Select stream" : "—"}
              </option>
              {needsStream && (
                <>
                  <option value="natural">Natural Science</option>
                  <option value="social">Social Science</option>
                </>
              )}
            </select>
          </Field>

          <Field label="Academic Year" required>
            <select className={selectClass} value={form.academicYear} onChange={set("academicYear")}>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:text-indigo-300 text-white font-semibold rounded-xl px-6 py-2.5 text-base transition"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering…
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Register Student
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
