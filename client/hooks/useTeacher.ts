
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getTeacherSections,
  getTeacherStudents,
  saveTeacherMarksBulk,
  updateTeacherSingleMark,
  getAvailableSemesters,
  getClassRanks,
} from "../services/teacher.api";

export const useTeacherSections = () => {
  return useQuery({
    queryKey: ["teacherSections"],
    queryFn: getTeacherSections,
  });
};

export const useTeacherStudents = (courseId?: string, classId?: string, semesterId?: string) => {
  return useQuery({
    queryKey: ["teacherStudents", courseId ?? "all", classId ?? "all", semesterId ?? "all"],
    queryFn: () => getTeacherStudents(courseId, classId, semesterId),
    enabled: !!(courseId || classId),
  });
};

export const useSaveTeacherMarksBulk = () => {
  return useMutation({
    mutationFn: saveTeacherMarksBulk,
  });
};

export const useUpdateTeacherSingleMark = () => {
  return useMutation({
    mutationFn: ({ markId, payload }: { markId: string; payload: import("../services/teacher.service").SingleMarkPayload }) =>
      updateTeacherSingleMark(markId, payload),
  });
};

export const useAvailableSemesters = () => {
  return useQuery({
    queryKey: ["teacherSemesters"],
    queryFn:  getAvailableSemesters,
  });
};

export const useClassRanks = (classId?: string, semesterId: string = "all") => {
  return useQuery({
    queryKey: ["classRanks", classId ?? "", semesterId],
    queryFn:  () => getClassRanks(classId!, semesterId),
    enabled:  !!classId,
  });
};
