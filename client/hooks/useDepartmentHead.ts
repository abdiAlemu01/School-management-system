import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  dhGetCourses,
  dhGetTeachers,
  dhGetTimetable,
  dhCreateTimetableEntry,
  dhDeleteTimetableEntry,
  dhGetSemesters,
  dhGetClasses,
  dhCreateSection,
  dhGetStudents,
  dhAssignStudentSection,
} from "../services/departmentHead.service";
import type {
  CreateTimetablePayload,
  CreateSectionPayload,
} from "../services/departmentHead.service";

export const useDHCourses = (params?: { grade?: number | string; stream?: string }) =>
  useQuery({
    queryKey: ["dh-courses", params],
    queryFn: () => dhGetCourses(params),
    staleTime: 60_000,
  });

export const useDHTeachers = () =>
  useQuery({
    queryKey: ["dh-teachers"],
    queryFn: dhGetTeachers,
    staleTime: 120_000,
  });

export const useDHTimetable = (params?: {
  classId?: string;
  grade?: number | string;
  stream?: string;
  day?: string;
}) =>
  useQuery({
    queryKey: ["dh-timetable", params],
    queryFn: () => dhGetTimetable(params),
    staleTime: 60_000,
  });

export const useDHCreateTimetable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTimetablePayload) => dhCreateTimetableEntry(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dh-timetable"] }),
  });
};

export const useDHDeleteTimetable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dhDeleteTimetableEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dh-timetable"] }),
  });
};

export const useDHSemesters = () =>
  useQuery({
    queryKey: ["dh-semesters"],
    queryFn: dhGetSemesters,
    staleTime: 300_000,
  });

export const useDHClasses = () =>
  useQuery({
    queryKey: ["dh-classes"],
    queryFn: dhGetClasses,
    staleTime: 120_000,
  });

export const useDHCreateSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSectionPayload) => dhCreateSection(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dh-classes"] }),
  });
};

export const useDHStudents = (params: { grade: number | string; stream?: string } | null) =>
  useQuery({
    queryKey: ["dh-students", params],
    queryFn:  () => dhGetStudents(params!),
    staleTime: 30_000,
    enabled:  !!params?.grade,
  });

export const useDHAssignStudentSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, sectionClassId }: { studentId: string; sectionClassId: string }) =>
      dhAssignStudentSection(studentId, sectionClassId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dh-students"] }),
  });
};
