import express from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import {
  createUserHandler,
  getUsersHandler,
  updateUserHandler,
  deleteUserHandler,
  createDepartmentHandler,
  getDepartmentsHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
  createClassHandler,
  getClassesHandler,
  updateClassHandler,
  deleteClassHandler,
  createSemesterHandler,
  getSemestersHandler,
  updateSemesterHandler,
  deleteSemesterHandler,
  createCourseHandler,
  getCoursesHandler,
  updateCourseHandler,
  deleteCourseHandler,
  validateIdParam,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("admin"));

router.route("/users").post(createUserHandler).get(getUsersHandler);
router.route("/users/:id").put(validateIdParam, updateUserHandler).delete(validateIdParam, deleteUserHandler);

router.route("/departments").post(createDepartmentHandler).get(getDepartmentsHandler);
router
  .route("/departments/:id")
  .put(validateIdParam, updateDepartmentHandler)
  .delete(validateIdParam, deleteDepartmentHandler);

router.route("/classes").post(createClassHandler).get(getClassesHandler);
router.route("/classes/:id").put(validateIdParam, updateClassHandler).delete(validateIdParam, deleteClassHandler);

router.route("/semesters").post(createSemesterHandler).get(getSemestersHandler);
router
  .route("/semesters/:id")
  .put(validateIdParam, updateSemesterHandler)
  .delete(validateIdParam, deleteSemesterHandler);

router.route("/courses").post(createCourseHandler).get(getCoursesHandler);
router.route("/courses/:id").put(validateIdParam, updateCourseHandler).delete(validateIdParam, deleteCourseHandler);

export default router;
