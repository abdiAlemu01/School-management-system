import api from "./api";
import type { AxiosError } from "axios";

/** One unique (section × course) pair the teacher is scheduled to teach. */
export interface TeacherSection {
  classId: string;
  className: string;
  grade: number;
  stream: string | null;
  section: string | null;
  academicYear: string;
  courseId: string;
  courseName: string;
  studentCount: number;
}

export interface TeacherStudentCourseMark {
  id: string;
  courseName: string;
  markId: string | null;
  quiz: number | null;
  assignment: number | null;
  midExam: number | null;
  finalExam: number | null;
  total: number | null;
}

export interface TeacherStudent {
  id: string;
  studentId: string;
  name: string;
  email: string;
  className: string;
  section: string | null;
  courses: TeacherStudentCourseMark[];
  selectedCourseMark?: TeacherStudentCourseMark;
}

export interface BulkMarkItem {
  studentId: string;
  quiz?: number | string;
  assignment?: number | string;
  midExam?: number | string;
  finalExam?: number | string;
}

export interface SingleMarkPayload {
  quiz?: number | string;
  assignment?: number | string;
  midExam?: number | string;
  finalExam?: number | string;
}

export interface SemesterInfo {
  _id: string;
  name: string;
  year: number;
}

export interface SemesterBreakdown {
  total: number;
  count: number;
  name: string;
}

export interface ClassRankEntry {
  id: string;
  studentId: string;
  name: string;
  email: string;
  rank: number | null;
  totalScore: number;
  courseCount: number;
  average: number;
  semesterBreakdown: Record<string, SemesterBreakdown>;
}

export interface ClassRankResponse {
  students: ClassRankEntry[];
  semesters: SemesterInfo[];
}

const teacherPaths = {
  students:  ["/teacher/students",  "/teachers/students"],
  marks:     ["/teacher/marks",     "/teachers/marks"],
  ranks:     ["/teacher/ranks",     "/teachers/ranks"],
  semesters: ["/teacher/semesters", "/teachers/semesters"],
};

const is404 = (error: unknown): boolean => {
  const axiosError = error as AxiosError;
  return axiosError?.response?.status === 404;
};

const getWithFallback = async <T>(paths: string[], config?: { params?: Record<string, unknown> }): Promise<T> => {
  try {
    const response = await api.get(paths[0], config);
    return response.data.data;
  } catch (error) {
    if (!is404(error) || paths.length < 2) throw error;
    const response = await api.get(paths[1], config);
    return response.data.data;
  }
};

const writeWithFallback = async (
  method: "post" | "put",
  paths: string[],
  payload: unknown
) => {
  try {
    const response = await api[method](paths[0], payload);
    return response.data;
  } catch (error) {
    if (!is404(error) || paths.length < 2) throw error;
    const response = await api[method](paths[1], payload);
    return response.data;
  }
};

export const getTeacherSections = async (): Promise<TeacherSection[]> => {
  return getWithFallback<TeacherSection[]>(["/teacher/sections", "/teachers/sections"]);
};

export const getTeacherStudents = async (
  courseId?: string,
  classId?: string,
  semesterId?: string,
): Promise<TeacherStudent[]> => {
  const params: Record<string, string> = {};
  if (courseId)   params.courseId   = courseId;
  if (classId)    params.classId    = classId;
  if (semesterId) params.semesterId = semesterId;
  return getWithFallback<TeacherStudent[]>(teacherPaths.students, {
    params: Object.keys(params).length ? params : undefined,
  });
};

export const saveTeacherMarksBulk = async (payload: {
  courseId: string;
  marks: BulkMarkItem[];
  semesterId?: string;
}) => {
  return writeWithFallback("post", teacherPaths.marks, payload);
};

export const updateTeacherSingleMark = async (markId: string, payload: SingleMarkPayload) => {
  return writeWithFallback(
    "put",
    [`${teacherPaths.marks[0]}/${markId}`, `${teacherPaths.marks[1]}/${markId}`],
    payload
  );
};

export const getAvailableSemesters = async (): Promise<SemesterInfo[]> => {
  return getWithFallback<SemesterInfo[]>(teacherPaths.semesters);
};

export const getClassRanks = async (
  classId: string,
  semesterId: string = "all"
): Promise<ClassRankResponse> => {
  return getWithFallback<ClassRankResponse>(teacherPaths.ranks, {
    params: { classId, semesterId },
  });
};
