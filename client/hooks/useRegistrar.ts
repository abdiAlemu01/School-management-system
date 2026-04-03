import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudentsList, registerNewStudent } from "../services/registrar.service";
import type { StudentRegistrationPayload } from "../services/registrar.service";

export const useRegistrarStudents = () => {
  return useQuery({
    queryKey: ["registrar-students"],
    queryFn: getStudentsList,
    staleTime: 1000 * 60,
  });
};

export const useRegisterStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StudentRegistrationPayload) => registerNewStudent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registrar-students"] });
    },
  });
};
