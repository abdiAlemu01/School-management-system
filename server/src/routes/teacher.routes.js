import express from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import {
  getTeacherSectionsHandler,
  getTeacherClassesHandler,
  getTeacherStudents,
  bulkUpsertMarks,
  upsertTeacherGrades,
  updateSingleMark,
  getClassRanksHandler,
  getSemestersHandler,
} from "../controllers/teacher.controller.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("teacher"));

router.get("/sections",  getTeacherSectionsHandler);
router.get("/classes", getTeacherClassesHandler);
router.get("/students",  getTeacherStudents);
router.get("/class/:classId/course/:courseId/students", (req, _res, next) => {
  req.query.classId = req.params.classId;
  req.query.courseId = req.params.courseId;
  next();
}, getTeacherStudents);
router.post("/marks",    bulkUpsertMarks);
router.post("/grades", upsertTeacherGrades);
router.put("/marks/:id", updateSingleMark);
router.get("/ranks",     getClassRanksHandler);
router.get("/semesters", getSemestersHandler);

export default router;
