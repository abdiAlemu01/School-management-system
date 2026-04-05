import api from "./api";

export interface GradeFee {
  grade: number;
  amount: number;
}

export interface FinanceStudentRecord {
  studentId: string;
  studentCode: string;
  studentName: string;
  grade: number;
  academicYear: string;
  className: string;
  totalFee: number;
  paidAmount: number;
  remainingBalance: number;
  status: "Paid" | "Partially Paid" | "Unpaid";
}

export interface FinanceSummary {
  totalIncome: number;
  totalCollectedAmount: number;
  incomeByGrade: Record<number, number>;
  studentsByGrade: Record<number, number>;
  totalStudents: number;
}

export const getFinanceStudents = async (grade?: number): Promise<FinanceStudentRecord[]> => {
  const response = await api.get("/finance/students", {
    params: grade ? { grade } : undefined,
  });
  return response.data.data;
};

export const getFinanceSummary = async (): Promise<FinanceSummary> => {
  const response = await api.get("/finance/summary");
  return response.data.data;
};

export const getFinanceFees = async (): Promise<GradeFee[]> => {
  const response = await api.get("/finance/fees");
  return response.data.data;
};

export const getAdminFinanceStudents = async (grade?: number): Promise<FinanceStudentRecord[]> => {
  const response = await api.get("/admin/finance/students", {
    params: grade ? { grade } : undefined,
  });
  return response.data.data;
};

export const getAdminFinanceSummary = async (): Promise<FinanceSummary> => {
  const response = await api.get("/admin/finance/summary");
  return response.data.data;
};

export const getAdminFinanceFees = async (): Promise<GradeFee[]> => {
  const response = await api.get("/admin/finance/fees");
  return response.data.data;
};

export const updateAdminFinanceFees = async (fees: GradeFee[]): Promise<GradeFee[]> => {
  const response = await api.put("/admin/finance/fees", { fees });
  return response.data.data;
};
