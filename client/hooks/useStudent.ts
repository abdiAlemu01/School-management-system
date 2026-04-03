import { useQuery } from "@tanstack/react-query";
import {
  getStudentPerformance,
  getStudentCourses,
  getStudentRegistration,
  getStudentProfile,
} from "../services/student.service";

export const useStudentPerformance = () => {
  return useQuery({
    queryKey: ["studentPerformance"],
    queryFn: getStudentPerformance,
  });
};

export const useStudentCourses = () => {
  return useQuery({
    queryKey: ["studentCourses"],
    queryFn: getStudentCourses,
  });
};

export const useStudentRegistration = () => {
  return useQuery({
    queryKey: ["studentRegistration"],
    queryFn: getStudentRegistration,
  });
};

export const useStudentProfile = () => {
  return useQuery({
    queryKey: ["studentProfile"],
    queryFn: getStudentProfile,
  });
};
