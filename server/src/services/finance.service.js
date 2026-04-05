import { FinanceFee, Student, StudentFinance } from "../config/model.js";
import AppError from "../utils/AppError.js";

const DEFAULT_GRADE_FEES = {
  9: 3000,
  10: 3500,
  11: 4000,
  12: 4500,
};

const VALID_GRADES = [9, 10, 11, 12];

const parseGrade = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const grade = Number(value);
  if (!VALID_GRADES.includes(grade)) {
    throw new AppError("grade must be one of: 9, 10, 11, 12", 400);
  }
  return grade;
};

export const ensureDefaultFinanceFees = async () => {
  const ops = VALID_GRADES.map((grade) => ({
    updateOne: {
      filter: { grade },
      update: { $setOnInsert: { grade, amount: DEFAULT_GRADE_FEES[grade] } },
      upsert: true,
    },
  }));

  if (ops.length) {
    await FinanceFee.bulkWrite(ops, { ordered: false });
  }
};

export const getGradeFees = async () => {
  await ensureDefaultFinanceFees();
  const rows = await FinanceFee.find().sort({ grade: 1 });
  return rows.map((r) => ({ grade: r.grade, amount: r.amount }));
};

export const updateGradeFees = async (payload) => {
  const fees = Array.isArray(payload?.fees)
    ? payload.fees
    : payload && typeof payload === "object"
      ? Object.entries(payload).map(([grade, amount]) => ({ grade: Number(grade), amount }))
      : null;

  if (!fees || fees.length === 0) {
    throw new AppError("Provide fees as an array or object with grade amounts", 400);
  }

  const ops = fees.map((f) => {
    const grade = parseGrade(f.grade);
    const amount = Number(f.amount);

    if (grade === null || Number.isNaN(amount) || amount < 0) {
      throw new AppError("Each fee entry must include valid grade and non-negative amount", 400);
    }

    return {
      updateOne: {
        filter: { grade },
        update: { $set: { grade, amount } },
        upsert: true,
      },
    };
  });

  await FinanceFee.bulkWrite(ops, { ordered: false });
  return getGradeFees();
};

const buildSummary = (records) => {
  const incomeByGrade = { 9: 0, 10: 0, 11: 0, 12: 0 };
  const studentsByGrade = { 9: 0, 10: 0, 11: 0, 12: 0 };

  for (const r of records) {
    incomeByGrade[r.grade] += r.paidAmount;
    studentsByGrade[r.grade] += 1;
  }

  const totalIncome = Object.values(incomeByGrade).reduce((a, b) => a + b, 0);

  return {
    totalIncome,
    totalCollectedAmount: totalIncome,
    incomeByGrade,
    studentsByGrade,
    totalStudents: records.length,
  };
};

export const getStudentFinanceRecords = async ({ grade } = {}) => {
  const targetGrade = parseGrade(grade);
  await ensureDefaultFinanceFees();

  const feeRows = await FinanceFee.find().sort({ grade: 1 });
  const feeMap = new Map(feeRows.map((f) => [f.grade, f.amount]));

  const students = await Student.find()
    .populate({ path: "userId", select: "name email" })
    .populate({ path: "classId", select: "grade academicYear name" });

  const validStudents = students.filter((s) => {
    if (!s.userId || !s.classId) return false;
    if (targetGrade && s.classId.grade !== targetGrade) return false;
    return VALID_GRADES.includes(Number(s.classId.grade));
  });

  const studentIds = validStudents.map((s) => s._id);
  const existing = await StudentFinance.find({ studentId: { $in: studentIds } });
  const existingMap = new Map(existing.map((r) => [String(r.studentId), r]));

  const toCreate = [];
  for (const s of validStudents) {
    const key = String(s._id);
    if (!existingMap.has(key)) {
      const gradeValue = Number(s.classId.grade);
      const fee = feeMap.get(gradeValue) ?? DEFAULT_GRADE_FEES[gradeValue] ?? 0;
      toCreate.push({
        studentId: s._id,
        grade: gradeValue,
        totalFee: fee,
        paidAmount: fee,
        remainingBalance: 0,
        status: "Paid",
      });
    }
  }

  if (toCreate.length > 0) {
    await StudentFinance.insertMany(toCreate, { ordered: false });
  }

  const rows = await StudentFinance.find({ studentId: { $in: studentIds } });
  const financeMap = new Map(rows.map((r) => [String(r.studentId), r]));

  return validStudents
    .map((s) => {
      const finance = financeMap.get(String(s._id));
      const gradeValue = Number(s.classId.grade);
      const fee = feeMap.get(gradeValue) ?? DEFAULT_GRADE_FEES[gradeValue] ?? 0;

      return {
        studentId: String(s._id),
        studentCode: s.studentId,
        studentName: s.userId.name,
        grade: gradeValue,
        academicYear: s.classId.academicYear,
        className: s.classId.name,
        totalFee: finance?.totalFee ?? fee,
        paidAmount: finance?.paidAmount ?? fee,
        remainingBalance: finance?.remainingBalance ?? 0,
        status: finance?.status ?? "Paid",
      };
    })
    .sort((a, b) => a.grade - b.grade || a.studentName.localeCompare(b.studentName));
};

export const getFinanceSummary = async () => {
  const records = await getStudentFinanceRecords();
  return buildSummary(records);
};

export const createOrUpdatePaidFinanceRecord = async ({ studentObjectId, grade }) => {
  const parsedGrade = parseGrade(grade);
  if (parsedGrade === null) {
    throw new AppError("Valid grade is required for finance record creation", 400);
  }

  await ensureDefaultFinanceFees();
  const feeRow = await FinanceFee.findOne({ grade: parsedGrade });
  const amount = feeRow?.amount ?? DEFAULT_GRADE_FEES[parsedGrade] ?? 0;

  return StudentFinance.findOneAndUpdate(
    { studentId: studentObjectId },
    {
      $set: {
        grade: parsedGrade,
        totalFee: amount,
        paidAmount: amount,
        remainingBalance: 0,
        status: "Paid",
      },
    },
    { new: true, upsert: true }
  );
};
