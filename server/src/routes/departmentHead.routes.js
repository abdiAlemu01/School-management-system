import express from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import {
  getCourses,
  getTeachers,
  getTimetableHandler,
  createTimetableHandler,
  deleteTimetableHandler,
  getSemestersHandler,
  getClassesHandler,
  createSectionHandler,
  getStudentsHandler,
  assignStudentSectionHandler,
  assignTeacherToCourseHandler,
} from "../controllers/departmentHead.controller.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("departmentHead", "admin"));

// Courses & teachers (used by Timetable form dropdowns)
router.get("/courses",  getCourses);
router.get("/teachers", getTeachers);
router.patch("/courses/assign-teacher", assignTeacherToCourseHandler);

// Timetable
router.get("/timetable",    getTimetableHandler);
router.post("/timetable",   createTimetableHandler);
router.delete("/timetable/:id", deleteTimetableHandler);

// Lookup helpers
router.get("/semesters",  getSemestersHandler);
router.get("/classes",    getClassesHandler);
router.post("/sections",  createSectionHandler);

// Student section assignment
router.get("/students",                    getStudentsHandler);
router.patch("/students/:id/section",      assignStudentSectionHandler);

export default router;
