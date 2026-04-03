import {
  getCoursesGrouped,
  getAllTeachers,
  createTimetableEntry,
  getTimetable,
  deleteTimetableEntry,
  getSemesters,
  getClasses,
  createSection,
  getStudentsByGrade,
  assignStudentSection,
  assignTeacherToCourse,
} from "../services/departmentHead.service.js";
import AppError from "../utils/AppError.js";

// ─── Courses & teachers (used by Timetable form) ──────────────────────────────

export const getCourses = async (req, res, next) => {
  try {
    const { grade, stream } = req.query;
    const data = await getCoursesGrouped({ grade, stream });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

export const getTeachers = async (req, res, next) => {
  try {
    const data = await getAllTeachers();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ─── Timetable ────────────────────────────────────────────────────────────────

export const getTimetableHandler = async (req, res, next) => {
  try {
    const { classId, grade, stream, day } = req.query;
    const data = await getTimetable({ classId, grade, stream, day });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

export const createTimetableHandler = async (req, res, next) => {
  try {
    const { classId, courseId, teacherId, day, startTime, endTime, semesterId } = req.body;
    if (!classId || !courseId || !teacherId || !day || !startTime || !endTime) {
      return next(new AppError("classId, courseId, teacherId, day, startTime, and endTime are required", 400));
    }
    const data = await createTimetableEntry({ classId, courseId, teacherId, day, startTime, endTime, semesterId });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

export const deleteTimetableHandler = async (req, res, next) => {
  try {
    const data = await deleteTimetableEntry(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

export const getSemestersHandler = async (req, res, next) => {
  try {
    const data = await getSemesters();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

export const getClassesHandler = async (req, res, next) => {
  try {
    const data = await getClasses();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

export const createSectionHandler = async (req, res, next) => {
  try {
    const { grade, stream, academicYear, section } = req.body;
    const data = await createSection({ grade, stream, academicYear, section });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

export const assignTeacherToCourseHandler = async (req, res, next) => {
  try {
    const { courseId, teacherId } = req.body;
    const data = await assignTeacherToCourse({
      departmentHeadUserId: req.user.id,
      courseId,
      teacherId,
    });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// ─── Student section assignment ───────────────────────────────────────────────

export const getStudentsHandler = async (req, res, next) => {
  try {
    const { grade, stream } = req.query;
    if (!grade) return next(new AppError("grade query param is required", 400));
    const data = await getStudentsByGrade({ grade, stream });
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

export const assignStudentSectionHandler = async (req, res, next) => {
  try {
    const { id: studentId } = req.params;
    const { sectionClassId } = req.body;
    if (!sectionClassId) return next(new AppError("sectionClassId is required", 400));
    const data = await assignStudentSection(studentId, sectionClassId);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};
