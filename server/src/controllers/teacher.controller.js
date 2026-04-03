import {
  getTeacherSections,
  getStudentsForTeacher,
  bulkUpsertMarksForTeacher,
  updateSingleMarkForTeacher,
  getClassRanks,
  getAvailableSemesters,
} from "../services/teacher.service.js";

export const getTeacherSectionsHandler = async (req, res, next) => {
  try {
    const sections = await getTeacherSections(req.user.id);
    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    next(error);
  }
};

export const getTeacherClassesHandler = getTeacherSectionsHandler;

export const getTeacherStudents = async (req, res, next) => {
  try {
    const { courseId, classId, semesterId } = req.query;
    const students = await getStudentsForTeacher(req.user.id, courseId, classId, semesterId);
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

export const bulkUpsertMarks = async (req, res, next) => {
  try {
    const { courseId, marks, semesterId } = req.body;
    const updatedMarks = await bulkUpsertMarksForTeacher(req.user.id, courseId, marks, semesterId);
    res.status(200).json({
      success: true,
      message: "Marks saved successfully",
      data: updatedMarks,
    });
  } catch (error) {
    next(error);
  }
};

export const upsertTeacherGrades = bulkUpsertMarks;

export const updateSingleMark = async (req, res, next) => {
  try {
    const updatedMark = await updateSingleMarkForTeacher(
      req.user.id,
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Mark updated successfully",
      data: updatedMark,
    });
  } catch (error) {
    next(error);
  }
};

export const getClassRanksHandler = async (req, res, next) => {
  try {
    const { classId, semesterId } = req.query;
    if (!classId) {
      return res.status(400).json({ success: false, message: "classId is required" });
    }
    const result = await getClassRanks(req.user.id, classId, semesterId || "all");
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getSemestersHandler = async (req, res, next) => {
  try {
    const semesters = await getAvailableSemesters();
    res.status(200).json({ success: true, data: semesters });
  } catch (error) {
    next(error);
  }
};
