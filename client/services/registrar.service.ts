import api from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type StreamType = "natural" | "social" | null;

export interface RegistrarStudent {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  grade: number;
  stream: StreamType;
  academicYear: string;
  className: string;
}

/** One leaf node in the sidebar tree: a specific grade+stream combination */
export interface StudentGroup {
  grade: number;
  stream: StreamType;
  /** Human-readable label, e.g. "Grade 9" or "Grade 11 – Natural" */
  label: string;
  count: number;
  students: RegistrarStudent[];
}

/** Top-level grouping by academic year */
export interface YearGroup {
  academicYear: string;
  groups: StudentGroup[];
}

export interface StudentRegistrationPayload {
  name: string;
  email: string;
  password: string;
  age: number;
  gender: string;
  phone?: string;
  address?: string;
  zone?: string;
  woreda?: string;
  kebele?: string;
  village?: string;
  grade: number;
  stream?: StreamType;
  academicYear: string;
}

export interface RegisterStudentResult {
  user: { id: string; name: string; email: string; role: string };
  student: {
    id: string;
    studentId: string;
    classId: string;
    className: string;
    grade: number;
    stream: StreamType;
    academicYear: string;
  };
  enrolledCourses: number;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const getStudentsList = async (): Promise<YearGroup[]> => {
  const response = await api.get("/registrar/students");
  return response.data.data;
};

export const registerNewStudent = async (
  payload: StudentRegistrationPayload
): Promise<RegisterStudentResult> => {
  const response = await api.post("/registrar/students", payload);
  return response.data.data;
};
