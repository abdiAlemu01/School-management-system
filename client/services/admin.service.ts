import api from "./api";

export type AdminRole = "admin" | "teacher" | "registrar" | "departmentHead";
export type StaffRole = "teacher" | "registrar" | "departmentHead";
export type StreamType = "natural" | "social" | null;

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}

export interface AdminDepartment {
  _id: string;
  name: string;
  createdAt?: string;
}

export interface AdminSemester {
  _id: string;
  name: string;
  year: number;
  startDate?: string;
  endDate?: string;
}

export interface AdminClass {
  _id: string;
  name: string;
  grade: number;
  stream: StreamType;
  section: string;
  academicYear: string;
  semesterId?: { _id: string; name: string; year: number } | null;
}

export interface AdminCourse {
  _id: string;
  courseName: string;
  grade: number;
  stream: StreamType;
  classId?: { _id: string; name: string } | null;
  semesterId?: { _id: string; name: string; year: number } | null;
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
}

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await api.get("/admin/users");
  return response.data.data;
};

export const createAdminUser = async (payload: CreateAdminUserPayload) => {
  const response = await api.post("/admin/users", payload);
  return response.data.data;
};

export const updateAdminUser = async (id: string, payload: Partial<CreateAdminUserPayload>) => {
  const response = await api.put(`/admin/users/${id}`, payload);
  return response.data.data;
};

export const deleteAdminUser = async (id: string) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data.data;
};

export const getAdminDepartments = async (): Promise<AdminDepartment[]> => {
  const response = await api.get("/admin/departments");
  return response.data.data;
};

export const createAdminDepartment = async (payload: { name: string }) => {
  const response = await api.post("/admin/departments", payload);
  return response.data.data;
};

export const updateAdminDepartment = async (id: string, payload: { name: string }) => {
  const response = await api.put(`/admin/departments/${id}`, payload);
  return response.data.data;
};

export const deleteAdminDepartment = async (id: string) => {
  const response = await api.delete(`/admin/departments/${id}`);
  return response.data.data;
};

export interface CreateAdminClassPayload {
  grade: number;
  stream?: StreamType;
  section: string;
  academicYear: string;
  semesterId?: string;
}

export const getAdminClasses = async (): Promise<AdminClass[]> => {
  const response = await api.get("/admin/classes");
  return response.data.data;
};

export const createAdminClass = async (payload: CreateAdminClassPayload) => {
  const response = await api.post("/admin/classes", payload);
  return response.data.data;
};

export const updateAdminClass = async (id: string, payload: Partial<CreateAdminClassPayload>) => {
  const response = await api.put(`/admin/classes/${id}`, payload);
  return response.data.data;
};

export const deleteAdminClass = async (id: string) => {
  const response = await api.delete(`/admin/classes/${id}`);
  return response.data.data;
};

export interface CreateAdminSemesterPayload {
  name: string;
  year: number;
  startDate?: string;
  endDate?: string;
}

export const getAdminSemesters = async (): Promise<AdminSemester[]> => {
  const response = await api.get("/admin/semesters");
  return response.data.data;
};

export const createAdminSemester = async (payload: CreateAdminSemesterPayload) => {
  const response = await api.post("/admin/semesters", payload);
  return response.data.data;
};

export const updateAdminSemester = async (id: string, payload: Partial<CreateAdminSemesterPayload>) => {
  const response = await api.put(`/admin/semesters/${id}`, payload);
  return response.data.data;
};

export const deleteAdminSemester = async (id: string) => {
  const response = await api.delete(`/admin/semesters/${id}`);
  return response.data.data;
};

export interface CreateAdminCoursePayload {
  courseName: string;
  grade: number;
  stream?: StreamType;
  classId?: string;
  semesterId?: string;
}

export const getAdminCourses = async (): Promise<AdminCourse[]> => {
  const response = await api.get("/admin/courses");
  return response.data.data;
};

export const createAdminCourse = async (payload: CreateAdminCoursePayload) => {
  const response = await api.post("/admin/courses", payload);
  return response.data.data;
};

export const updateAdminCourse = async (id: string, payload: Partial<CreateAdminCoursePayload>) => {
  const response = await api.put(`/admin/courses/${id}`, payload);
  return response.data.data;
};

export const deleteAdminCourse = async (id: string) => {
  const response = await api.delete(`/admin/courses/${id}`);
  return response.data.data;
};
