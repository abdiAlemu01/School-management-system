import api from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type StreamType = "natural" | "social" | null;

export interface DHTeacher {
  id: string;
  employeeId: string;
  name: string;
  email: string;
}

export interface DHCourse {
  id: string;
  courseName: string;
  grade: number;
  stream: StreamType;
  teacher: DHTeacher | null;
}

export interface StreamGroup {
  stream: StreamType;
  label: string;
  courses: DHCourse[];
}

export interface GradeGroup {
  grade: number;
  streams: StreamGroup[];
}

export interface TimetableEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  courseName: string;
  teacherName: string;
  teacherId: string;
  classId: string;
  className: string;
  grade: number;
  stream: StreamType;
  academicYear: string;
}

export interface Semester {
  _id: string;
  name: string;
  year: number;
}

export interface ClassRecord {
  _id: string;
  name: string;
  grade: number;
  stream: StreamType;
  section: string | null;
  academicYear: string;
}

export interface CreateSectionPayload {
  grade: number;
  stream?: StreamType;
  academicYear: string;
  section: string;
}

export interface CreateTimetablePayload {
  classId: string;
  courseId: string;
  teacherId: string;
  day: string;
  startTime: string;
  endTime: string;
  semesterId?: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const dhGetCourses = async (params?: {
  grade?: number | string;
  stream?: string;
}): Promise<GradeGroup[]> => {
  const res = await api.get("/department/courses", { params });
  return res.data.data;
};

export const dhGetTeachers = async (): Promise<DHTeacher[]> => {
  const res = await api.get("/department/teachers");
  return res.data.data;
};

export const dhGetTimetable = async (params?: {
  classId?: string;
  grade?: number | string;
  stream?: string;
  day?: string;
}): Promise<TimetableEntry[]> => {
  const res = await api.get("/department/timetable", { params });
  return res.data.data;
};

export const dhCreateTimetableEntry = async (
  payload: CreateTimetablePayload
): Promise<TimetableEntry> => {
  const res = await api.post("/department/timetable", payload);
  return res.data.data;
};

export const dhDeleteTimetableEntry = async (id: string): Promise<void> => {
  await api.delete(`/department/timetable/${id}`);
};

export const dhGetSemesters = async (): Promise<Semester[]> => {
  const res = await api.get("/department/semesters");
  return res.data.data;
};

export const dhGetClasses = async (): Promise<ClassRecord[]> => {
  const res = await api.get("/department/classes");
  return res.data.data;
};

export const dhCreateSection = async (payload: CreateSectionPayload): Promise<ClassRecord> => {
  const res = await api.post("/department/sections", payload);
  return res.data.data;
};

// ─── Students ─────────────────────────────────────────────────────────────────

export interface DHStudent {
  id: string;
  studentId: string;
  name: string;
  email: string;
  grade: number;
  stream: StreamType;
  section: string | null;
  academicYear: string;
  classId: string;
  className: string;
}

export const dhGetStudents = async (params: {
  grade: number | string;
  stream?: string;
}): Promise<DHStudent[]> => {
  const res = await api.get("/department/students", { params });
  return res.data.data;
};

export const dhAssignStudentSection = async (
  studentId: string,
  sectionClassId: string
): Promise<{ id: string; studentId: string; classId: string; className: string; section: string }> => {
  const res = await api.patch(`/department/students/${studentId}/section`, { sectionClassId });
  return res.data.data;
};
