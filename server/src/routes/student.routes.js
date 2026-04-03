import express from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import {
  getPerformance,
  getCourses,
  getRegistrationStatus,
  getStudentProfile,
  getStudentResults,
} from "../controllers/student.controller.js";

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Restrict these routes to students only
router.use(restrictTo("student"));

router.get("/performance", getPerformance);
router.get("/courses", getCourses);
router.get("/registration", getRegistrationStatus);
router.get("/profile", getStudentProfile);
router.get("/results", getStudentResults);

export default router;
