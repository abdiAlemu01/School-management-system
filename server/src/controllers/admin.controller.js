import AppError from "../utils/AppError.js";
import {
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  createClass,
  getClasses,
  updateClass,
  deleteClass,
  createSemester,
  getSemesters,
  updateSemester,
  deleteSemester,
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
} from "../services/admin.service.js";

const withHandler = (serviceFn, statusCode = 200) => async (req, res, next) => {
  try {
    const data = await serviceFn(req, res, next);
    res.status(statusCode).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const createUserHandler = withHandler((req) => createAdminUser(req.body), 201);
export const getUsersHandler = withHandler(() => getAdminUsers());
export const updateUserHandler = withHandler((req) => updateAdminUser(req.params.id, req.body));
export const deleteUserHandler = withHandler((req) => deleteAdminUser(req.params.id));

export const createDepartmentHandler = withHandler((req) => createDepartment(req.body), 201);
export const getDepartmentsHandler = withHandler(() => getDepartments());
export const updateDepartmentHandler = withHandler((req) => updateDepartment(req.params.id, req.body));
export const deleteDepartmentHandler = withHandler((req) => deleteDepartment(req.params.id));

export const createClassHandler = withHandler((req) => createClass(req.body), 201);
export const getClassesHandler = withHandler(() => getClasses());
export const updateClassHandler = withHandler((req) => updateClass(req.params.id, req.body));
export const deleteClassHandler = withHandler((req) => deleteClass(req.params.id));

export const createSemesterHandler = withHandler((req) => createSemester(req.body), 201);
export const getSemestersHandler = withHandler(() => getSemesters());
export const updateSemesterHandler = withHandler((req) => updateSemester(req.params.id, req.body));
export const deleteSemesterHandler = withHandler((req) => deleteSemester(req.params.id));

export const createCourseHandler = withHandler((req) => createCourse(req.body), 201);
export const getCoursesHandler = withHandler(() => getCourses());
export const updateCourseHandler = withHandler((req) => updateCourse(req.params.id, req.body));
export const deleteCourseHandler = withHandler((req) => deleteCourse(req.params.id));

export const validateIdParam = (req, _res, next) => {
  if (!req.params.id) {
    return next(new AppError("id parameter is required", 400));
  }
  next();
};
