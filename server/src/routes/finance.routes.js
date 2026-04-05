import express from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import {
  getFinanceStudentsHandler,
  getFinanceSummaryHandler,
  getFinanceFeesHandler,
} from "../controllers/finance.controller.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("finance", "admin"));

router.get("/students", getFinanceStudentsHandler);
router.get("/summary", getFinanceSummaryHandler);
router.get("/fees", getFinanceFeesHandler);

export default router;
