"use client";

import { useStudentProfile } from "../../../../hooks/useStudent";
import { User as UserIcon, Mail, Phone, Hash, Users, Activity, Globe, Map, Building2, Home, CalendarDays } from "lucide-react";
import { getApiErrorMessage } from "../../../../utils/apiError";
import { formatEthiopianYear } from "../../../../utils/ethiopianYear";

export default function ApplicationView() {
  const { data, isLoading, isError, error } = useStudentProfile();

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
        Failed to load profile data: {getApiErrorMessage(error, "Unable to fetch profile")}
      </div>
    );
  }

  const personalItems = [
    { label: "Full Name", value: data?.name, icon: UserIcon, color: "text-indigo-400" },
    { label: "Email Address", value: data?.email, icon: Mail, color: "text-blue-400" },
    { label: "Gender", value: data?.gender, icon: Activity, color: "text-emerald-400", capitalize: true },
    { label: "Phone Number", value: data?.phone, icon: Phone, color: "text-purple-400" },
    { label: "Student ID", value: data?.studentId, icon: Hash, color: "text-amber-400", isMono: true },
  ];

  const addressItems = [
    { label: "Zone", value: data?.zone, icon: Globe, color: "text-sky-400" },
    { label: "Woreda", value: data?.woreda, icon: Map, color: "text-teal-400" },
    { label: "Kebele", value: data?.kebele, icon: Building2, color: "text-orange-400" },
    { label: "Village", value: data?.village, icon: Home, color: "text-lime-400" },
  ];

  const academicItems = [
    { label: "Class Assigned", value: data?.className, icon: Users, color: "text-cyan-400" },
    { label: "Academic Year", value: formatEthiopianYear(data?.academicYear), icon: CalendarDays, color: "text-violet-400" },
  ];

  type ProfileItem = {
    label: string;
    value: string | undefined;
    icon: React.ElementType;
    color: string;
    isMono?: boolean;
    capitalize?: boolean;
  };

  const InfoCard = ({ label, value, icon: Icon, color, isMono, capitalize }: ProfileItem) => (
    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/50 hover:bg-slate-800/40 hover:border-slate-700/50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-slate-200 font-medium ${isMono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""} truncate`}>
        {value || "Not specified"}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Student Profile</h2>
        <p className="text-slate-400 text-sm">Your personal information and application details.</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/70 shadow-lg backdrop-blur-sm max-w-4xl space-y-6">
        {/* Avatar header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800/70">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-indigo-500/20">
            {data?.name?.charAt(0).toUpperCase() || "S"}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{data?.name}</h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold uppercase tracking-wide border border-indigo-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Student
            </span>
          </div>
        </div>

        {/* Personal information */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Personal Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalItems.map((item) => (
              <InfoCard key={item.label} {...item} />
            ))}
          </div>
        </div>

        {/* Address information */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 pt-2 border-t border-slate-800/50">Address Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {addressItems.map((item) => (
              <InfoCard key={item.label} {...item} />
            ))}
          </div>
        </div>

        {/* Academic information */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 pt-2 border-t border-slate-800/50">Academic Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {academicItems.map((item) => (
              <InfoCard key={item.label} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
