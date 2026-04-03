import {
  registerStudent,
  getAllStudentsGrouped,
  getCoursesByGradeStream,
} from "../services/registrar.service.js";

export const registerStudentHandler = async (req, res, next) => {
  try {
    const result = await registerStudent(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getStudentsList = async (req, res, next) => {
  try {
    const { grade, academicYear } = req.query;
    const groups = await getAllStudentsGrouped({ grade, academicYear });
    res.status(200).json({ success: true, data: groups });
  } catch (err) {
    next(err);
  }
};

// Seeds all standard courses for every grade/stream combination.
// Safe to call multiple times — skips grades that already have courses.
export const seedCourses = async (req, res, next) => {
  try {
    const combos = [
      { grade: 9,  stream: null },
      { grade: 10, stream: null },
      { grade: 11, stream: "natural" },
      { grade: 11, stream: "social" },
      { grade: 12, stream: "natural" },
      { grade: 12, stream: "social" },
    ];

    const results = await Promise.all(
      combos.map(async ({ grade, stream }) => {
        const courses = await getCoursesByGradeStream(grade, stream);
        return { grade, stream: stream ?? "none", count: courses.length };
      })
    );

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};
