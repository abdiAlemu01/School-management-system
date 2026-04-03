import express from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import {
  registerStudentHandler,
  getStudentsList,
  seedCourses,
} from "../controllers/registrar.controller.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("registrar"));

router.get("/students", getStudentsList);
router.post("/students", registerStudentHandler);
router.post("/students/register", registerStudentHandler);
router.post("/seed-courses", seedCourses);

export default router;
