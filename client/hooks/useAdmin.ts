import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminDepartments,
  createAdminDepartment,
  updateAdminDepartment,
  deleteAdminDepartment,
  getAdminClasses,
  createAdminClass,
  updateAdminClass,
  deleteAdminClass,
  getAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  type CreateAdminUserPayload,
  type CreateAdminClassPayload,
  type CreateAdminCoursePayload,
} from "../services/admin.service";

const adminKeys = {
  users: ["admin-users"],
  departments: ["admin-departments"],
  classes: ["admin-classes"],
  courses: ["admin-courses"],
};

export const useAdminUsers = () => useQuery({ queryKey: adminKeys.users, queryFn: getAdminUsers });
export const useAdminDepartments = () =>
  useQuery({ queryKey: adminKeys.departments, queryFn: getAdminDepartments });
export const useAdminClasses = () => useQuery({ queryKey: adminKeys.classes, queryFn: getAdminClasses });
export const useAdminCourses = () => useQuery({ queryKey: adminKeys.courses, queryFn: getAdminCourses });

export const useCreateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminUserPayload) => createAdminUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.users }),
  });
};

export const useUpdateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateAdminUserPayload> }) =>
      updateAdminUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.users }),
  });
};

export const useDeleteAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.users }),
  });
};

export const useCreateAdminDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => createAdminDepartment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.departments }),
  });
};

export const useUpdateAdminDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string } }) =>
      updateAdminDepartment(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.departments }),
  });
};

export const useDeleteAdminDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.departments }),
  });
};

export const useCreateAdminClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminClassPayload) => createAdminClass(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.classes }),
  });
};

export const useUpdateAdminClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateAdminClassPayload> }) =>
      updateAdminClass(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.classes }),
  });
};

export const useDeleteAdminClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminClass(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.classes }),
  });
};

export const useCreateAdminCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminCoursePayload) => createAdminCourse(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.courses }),
  });
};

export const useUpdateAdminCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateAdminCoursePayload> }) =>
      updateAdminCourse(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.courses }),
  });
};

export const useDeleteAdminCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminCourse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.courses }),
  });
};
