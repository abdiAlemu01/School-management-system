import api from "./api";

export interface SemesterStat {
  id: string;
  name: string;
  totalMarks: number;
  average: number;
  rank: number | null;
  courseCount: number;
}

export interface StudentPerformance {
  semesters: SemesterStat[];
  combined: {
    totalMarks: number;
    average: number;
    rank: number | null;
    courseCount: number;
  };
}

export interface StudentCourse {
  id: string;
  courseName: string;
  teacherName: string;
  teacherEmail: string;
  assessments: {
    quiz: number | string;
    assignment: number | string;
    midExam: number | string;
    finalExam: number | string;
    total: number | string;
  };
}

export interface StudentRegistration {
  id: string;
  courseName: string;
}

export interface StudentProfile {
  name: string;
  email: string;
  gender: string;
  phone: string;
  address: string;
  zone: string;
  woreda: string;
  kebele: string;
  village: string;
  studentId: string;
  className: string;
  academicYear: string;
}

export const getStudentPerformance = async (): Promise<StudentPerformance> => {
  const response = await api.get("/student/performance");
  return response.data.data;
};

export const getStudentCourses = async (): Promise<StudentCourse[]> => {
  const response = await api.get("/student/courses");
  return response.data.data;
};

export const getStudentRegistration = async (): Promise<{ message: string; data: StudentRegistration[] }> => {
  const response = await api.get("/student/registration");
  return { message: response.data.message, data: response.data.data };
};

export const getStudentProfile = async (): Promise<StudentProfile> => {
  const response = await api.get("/student/profile");
  return response.data.data;
};
