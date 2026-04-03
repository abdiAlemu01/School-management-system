import {
  Teacher,
  Course,
  Enrollment,
  Student,
  Grade,
  User,
  Class,
  Timetable,
  Semester,
} from "../config/model.js";
import AppError from "../utils/AppError.js";

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildTotal = ({ quiz, assignment, midExam, finalExam }) => {
  return [quiz, assignment, midExam, finalExam]
    .map((v) => (v === null ? 0 : v))
    .reduce((sum, v) => sum + v, 0);
};

const getTeacherProfile = async (userId) => {
  return await Teacher.findOne({ userId });
};

// Returns every unique (class × course) pair the teacher is scheduled to teach,
// derived from the Timetable — this is the source of truth for what sections
// a teacher actually covers.
export const getTeacherSections = async (userId) => {
  const teacher = await getTeacherProfile(userId);
  if (!teacher) return [];

  const entries = await Timetable.find({ teacherId: teacher._id })
    .populate({ path: "classId", model: Class,  select: "name grade stream section academicYear" })
    .populate({ path: "courseId", model: Course, select: "courseName" });

  // Deduplicate: one card per unique (classId, courseId) pair
  const seen = new Set();
  const sections = [];

  for (const entry of entries) {
    if (!entry.classId || !entry.courseId) continue;
    const key = `${entry.classId._id}-${entry.courseId._id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Count students enrolled in this course whose classId matches this section
    const enrollments = await Enrollment.find({ courseId: entry.courseId._id })
      .populate({ path: "studentId", model: Student, select: "classId" });
    const count = enrollments.filter(
      (e) => e.studentId?.classId?.toString() === entry.classId._id.toString()
    ).length;

    sections.push({
      classId:      entry.classId._id,
      className:    entry.classId.name,
      grade:        entry.classId.grade,
      stream:       entry.classId.stream,
      section:      entry.classId.section,
      academicYear: entry.classId.academicYear,
      courseId:     entry.courseId._id,
      courseName:   entry.courseId.courseName,
      studentCount: count,
    });
  }

  return sections.sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return (a.section ?? "").localeCompare(b.section ?? "");
  });
};

export const getStudentsForTeacher = async (userId, courseId, classId, semesterId) => {
  const teacher = await getTeacherProfile(userId);
  if (!teacher) {
    return [];
  }

  // When both classId and courseId are given (primary path), verify via Timetable
  // that this teacher is actually scheduled to teach this course in this section.
  if (classId && courseId) {
    const scheduled = await Timetable.findOne({ teacherId: teacher._id, classId, courseId });
    if (!scheduled) {
      throw new AppError("You are not scheduled to teach this course in this section.", 403);
    }
  }

  // Determine which course(s) to load
  let resolvedCourseIds;
  if (courseId) {
    resolvedCourseIds = [courseId];
  } else {
    // Fallback: derive from timetable (no specific courseId given)
    const entries = await Timetable.find({ teacherId: teacher._id }).select("courseId");
    resolvedCourseIds = [...new Set(entries.map((e) => e.courseId.toString()))];
    if (!resolvedCourseIds.length) return [];
  }

  // Fetch enrollments for those courses, including the student's current classId
  const enrollments = await Enrollment.find({ courseId: { $in: resolvedCourseIds } })
    .populate({
      path: "studentId",
      model: Student,
      select: "studentId userId classId",
      populate: { path: "userId", model: User, select: "name email" },
    })
    .populate({
      path: "courseId",
      model: Course,
      select: "courseName classId",
      populate: { path: "classId", model: Class, select: "name section grade stream academicYear" },
    });

  // Filter by section: only students whose classId matches the requested section
  const filtered = classId
    ? enrollments.filter(
        (e) => e.studentId?.classId?.toString() === classId.toString()
      )
    : enrollments;

  // Fetch grades filtered by semester so Semester 1 and Semester 2 rows stay separate
  const gradeFilter = { courseId: { $in: resolvedCourseIds } };
  if (semesterId) gradeFilter.semesterId = semesterId;

  const grades = await Grade.find(gradeFilter).select(
    "_id studentId courseId quiz assignment midExam finalExam total semesterId"
  );

  const gradeMap = new Map(
    grades.map((g) => [`${g.courseId.toString()}-${g.studentId.toString()}`, g])
  );

  const studentsMap = new Map();

  filtered.forEach((enrollment) => {
    const student = enrollment.studentId;
    if (!student?.userId) return;

    const course  = enrollment.courseId;
    const cls     = course?.classId;
    const gradeKey = `${course._id.toString()}-${student._id.toString()}`;
    const grade   = gradeMap.get(gradeKey);
    const studentKey = student._id.toString();

    if (!studentsMap.has(studentKey)) {
      studentsMap.set(studentKey, {
        id:        student._id,
        studentId: student.studentId,
        name:      student.userId.name,
        email:     student.userId.email,
        className: cls?.name    || "N/A",
        section:   cls?.section || null,
        courses:   [],
      });
    }

    const existing = studentsMap.get(studentKey);
    const mark = {
      id:         course._id,
      courseName: course.courseName,
      markId:     grade?._id   || null,
      quiz:       grade?.quiz        ?? null,
      assignment: grade?.assignment  ?? null,
      midExam:    grade?.midExam     ?? null,
      finalExam:  grade?.finalExam   ?? null,
      total:      grade?.total       ?? null,
    };
    existing.courses.push(mark);

    // selectedCourseMark is set whenever a specific courseId was requested
    if (courseId) existing.selectedCourseMark = mark;
  });

  return Array.from(studentsMap.values());
};

export const bulkUpsertMarksForTeacher = async (userId, courseId, marks, semesterId) => {
  if (!courseId) {
    throw new AppError("courseId is required", 400);
  }

  if (!Array.isArray(marks) || marks.length === 0) {
    throw new AppError("marks must be a non-empty array", 400);
  }

  const teacher = await getTeacherProfile(userId);
  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  // Verify ownership via Timetable — the DH links teachers to courses through
  // timetable entries, not by setting Course.teacherId directly.
  const [course, scheduled] = await Promise.all([
    Course.findById(courseId),
    Timetable.findOne({ teacherId: teacher._id, courseId }),
  ]);
  if (!course)    throw new AppError("Course not found", 404);
  if (!scheduled) throw new AppError("Course not assigned to this teacher", 403);

  const studentIds = marks.map((entry) => entry.studentId);
  const enrollments = await Enrollment.find({
    courseId,
    studentId: { $in: studentIds },
  });
  const enrolledStudentIds = new Set(
    enrollments.map((enrollment) => enrollment.studentId.toString())
  );

  const updates = [];

  for (const entry of marks) {
    if (!entry.studentId) {
      throw new AppError("studentId is required for each mark", 400);
    }
    if (!enrolledStudentIds.has(entry.studentId.toString())) {
      throw new AppError("One or more students are not enrolled in this course", 400);
    }

    const quiz = toNumberOrNull(entry.quiz);
    const assignment = toNumberOrNull(entry.assignment);
    const midExam = toNumberOrNull(entry.midExam);
    const finalExam = toNumberOrNull(entry.finalExam);

    if (
      (entry.quiz !== undefined && quiz === null) ||
      (entry.assignment !== undefined && assignment === null) ||
      (entry.midExam !== undefined && midExam === null) ||
      (entry.finalExam !== undefined && finalExam === null)
    ) {
      throw new AppError("Marks must be valid numbers", 400);
    }

    const total = buildTotal({ quiz, assignment, midExam, finalExam });

    // Resolve the semester for this save — teacher selection takes priority
    const resolvedSemesterId = semesterId || scheduled.semesterId || course.semesterId || null;

    // Include semesterId in the filter so Semester 1 and Semester 2 are stored
    // as SEPARATE Grade documents and never overwrite each other.
    const updated = await Grade.findOneAndUpdate(
      { courseId, studentId: entry.studentId, semesterId: resolvedSemesterId },
      {
        $set: { quiz, assignment, midExam, finalExam, total, semesterId: resolvedSemesterId },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    updates.push(updated);
  }

  return updates;
};

export const updateSingleMarkForTeacher = async (userId, markId, payload) => {
  if (!markId) {
    throw new AppError("Mark id is required", 400);
  }

  const teacher = await getTeacherProfile(userId);
  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }
  const mark = await Grade.findById(markId);
  if (!mark) {
    throw new AppError("Mark entry not found", 404);
  }

  // Verify via Timetable that this teacher teaches the course the mark belongs to
  const scheduled = await Timetable.findOne({ teacherId: teacher._id, courseId: mark.courseId });
  if (!scheduled) {
    throw new AppError("You are not allowed to update this mark", 403);
  }

  const quiz = toNumberOrNull(
    payload.quiz !== undefined ? payload.quiz : mark.quiz
  );
  const assignment = toNumberOrNull(
    payload.assignment !== undefined ? payload.assignment : mark.assignment
  );
  const midExam = toNumberOrNull(
    payload.midExam !== undefined ? payload.midExam : mark.midExam
  );
  const finalExam = toNumberOrNull(
    payload.finalExam !== undefined ? payload.finalExam : mark.finalExam
  );

  if (
    (payload.quiz !== undefined && quiz === null) ||
    (payload.assignment !== undefined && assignment === null) ||
    (payload.midExam !== undefined && midExam === null) ||
    (payload.finalExam !== undefined && finalExam === null)
  ) {
    throw new AppError("Marks must be valid numbers", 400);
  }

  mark.quiz = quiz;
  mark.assignment = assignment;
  mark.midExam = midExam;
  mark.finalExam = finalExam;
  mark.total = buildTotal({ quiz, assignment, midExam, finalExam });
  await mark.save();

  return mark;
};

// ─── Class Rank ───────────────────────────────────────────────────────────────

export const getAvailableSemesters = async () => {
  let semesters = await Semester.find({}).sort({ year: 1, name: 1 }).lean();

  // Auto-seed two default semesters if none exist yet so the teacher UI
  // always has options to choose from without manual admin setup.
  if (semesters.length === 0) {
    const currentYear = new Date().getFullYear();
    await Semester.insertMany([
      { name: "Semester 1", year: currentYear },
      { name: "Semester 2", year: currentYear },
    ]);
    semesters = await Semester.find({}).sort({ year: 1, name: 1 }).lean();
  }

  return semesters;
};

/**
 * Returns ranked students for a class, optionally filtered to one semester.
 * semesterId = "all"  →  sum every grade the student has in this class
 * semesterId = <id>   →  sum only grades whose semesterId matches
 */
export const getClassRanks = async (userId, classId, semesterId = "all") => {
  const teacher = await getTeacherProfile(userId);
  if (!teacher) throw new AppError("Teacher profile not found", 404);

  // Verify teacher is assigned to at least one course in this class
  const scheduled = await Timetable.findOne({ teacherId: teacher._id, classId });
  if (!scheduled) throw new AppError("You are not assigned to this class", 403);

  // All students currently in this class
  const students = await Student.find({ classId })
    .populate({ path: "userId", model: User, select: "name email" })
    .lean();
  if (!students.length) return { students: [], semesters: [] };

  const studentIds = students.map((s) => s._id);

  // All grades for these students (we'll filter below)
  const allGrades = await Grade.find({ studentId: { $in: studentIds } })
    .populate({ path: "courseId", model: Course, select: "courseName" })
    .lean();

  // Derive semesters that actually appear in these grades
  const seenSemesterIds = [
    ...new Set(
      allGrades.filter((g) => g.semesterId).map((g) => g.semesterId.toString())
    ),
  ];
  const semesters =
    seenSemesterIds.length > 0
      ? await Semester.find({ _id: { $in: seenSemesterIds } })
          .sort({ year: 1, name: 1 })
          .lean()
      : [];

  // Grades to use for the primary total (filtered or all)
  const filteredGrades =
    semesterId && semesterId !== "all"
      ? allGrades.filter((g) => g.semesterId?.toString() === semesterId)
      : allGrades;

  // Build per-student accumulators
  const resultMap = new Map();
  students.forEach((s) => {
    const breakdown = {};
    semesters.forEach((sem) => {
      breakdown[sem._id.toString()] = { total: 0, count: 0, name: sem.name };
    });
    resultMap.set(s._id.toString(), {
      id:         s._id,
      studentId:  s.studentId,
      name:       s.userId?.name  ?? "Unknown",
      email:      s.userId?.email ?? "",
      totalScore: 0,
      courseCount: 0,
      semesterBreakdown: breakdown,
    });
  });

  // Fill semester breakdown from ALL grades
  allGrades.forEach((g) => {
    const entry = resultMap.get(g.studentId.toString());
    if (!entry) return;
    const semKey = g.semesterId?.toString();
    if (semKey && entry.semesterBreakdown[semKey]) {
      entry.semesterBreakdown[semKey].total += g.total ?? 0;
      entry.semesterBreakdown[semKey].count += 1;
    }
  });

  // Fill primary total from filtered grades
  filteredGrades.forEach((g) => {
    const entry = resultMap.get(g.studentId.toString());
    if (!entry) return;
    entry.totalScore  += g.total ?? 0;
    entry.courseCount += 1;
  });

  // Sort descending, then assign ranks (handle ties with equal rank)
  const sorted = Array.from(resultMap.values()).sort(
    (a, b) => b.totalScore - a.totalScore
  );

  let currentRank = 1;
  sorted.forEach((s, i) => {
    if (i > 0 && s.totalScore < sorted[i - 1].totalScore) currentRank = i + 1;
    s.rank    = s.courseCount > 0 ? currentRank : null;
    s.average =
      s.courseCount > 0
        ? parseFloat((s.totalScore / s.courseCount).toFixed(2))
        : 0;
  });

  return { students: sorted, semesters };
};
