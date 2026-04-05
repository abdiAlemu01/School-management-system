import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFinanceStudents,
  getFinanceSummary,
  getFinanceFees,
  getAdminFinanceStudents,
  getAdminFinanceSummary,
  getAdminFinanceFees,
  updateAdminFinanceFees,
  type GradeFee,
} from "../services/finance.service";

const financeKeys = {
  financeStudents: (grade?: number) => ["finance-students", grade ?? "all"],
  financeSummary: ["finance-summary"],
  financeFees: ["finance-fees"],
  adminFinanceStudents: (grade?: number) => ["admin-finance-students", grade ?? "all"],
  adminFinanceSummary: ["admin-finance-summary"],
  adminFinanceFees: ["admin-finance-fees"],
};

export const useFinanceStudents = (grade?: number) =>
  useQuery({
    queryKey: financeKeys.financeStudents(grade),
    queryFn: () => getFinanceStudents(grade),
  });

export const useFinanceSummary = () =>
  useQuery({
    queryKey: financeKeys.financeSummary,
    queryFn: getFinanceSummary,
  });

export const useFinanceFees = () =>
  useQuery({
    queryKey: financeKeys.financeFees,
    queryFn: getFinanceFees,
  });

export const useAdminFinanceStudents = (grade?: number) =>
  useQuery({
    queryKey: financeKeys.adminFinanceStudents(grade),
    queryFn: () => getAdminFinanceStudents(grade),
  });

export const useAdminFinanceSummary = () =>
  useQuery({
    queryKey: financeKeys.adminFinanceSummary,
    queryFn: getAdminFinanceSummary,
  });

export const useAdminFinanceFees = () =>
  useQuery({
    queryKey: financeKeys.adminFinanceFees,
    queryFn: getAdminFinanceFees,
  });

export const useUpdateAdminFinanceFees = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fees: GradeFee[]) => updateAdminFinanceFees(fees),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.adminFinanceFees });
      qc.invalidateQueries({ queryKey: financeKeys.adminFinanceStudents() });
      qc.invalidateQueries({ queryKey: financeKeys.adminFinanceSummary });
      qc.invalidateQueries({ queryKey: financeKeys.financeFees });
      qc.invalidateQueries({ queryKey: financeKeys.financeStudents() });
      qc.invalidateQueries({ queryKey: financeKeys.financeSummary });
    },
  });
};
