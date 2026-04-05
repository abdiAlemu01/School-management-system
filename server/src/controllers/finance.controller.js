import {
  getStudentFinanceRecords,
  getFinanceSummary,
  getGradeFees,
} from "../services/finance.service.js";

export const getFinanceStudentsHandler = async (req, res, next) => {
  try {
    const data = await getStudentFinanceRecords({ grade: req.query.grade });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getFinanceSummaryHandler = async (_req, res, next) => {
  try {
    const data = await getFinanceSummary();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getFinanceFeesHandler = async (_req, res, next) => {
  try {
    const data = await getGradeFees();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
