import { Student, Enrollment, Grade, Rank, Timetable, Semester } from "../config/model.js";

const createUniqueStudentId = async () => {
  let newStudentId;
  let exists = true;

  while (exists) {
    newStudentId = `STD${Date.now().toString().slice(-6)}${Math.floor(
      100 + Math.random() * 900
    )}`;
    exists = await Student.findOne({ studentId: newStudentId });
  }

  return newStudentId;
};

const ensureStudentProfile = async (userId) => {
  let student = await Student.findOne({ userId });
  if (!student) {
    const generatedStudentId = await createUniqueStudentId();
    student = await Student.create({
      userId,
      studentId: generatedStudentId,
    });
  }
  return student;
};

export const getStudentPerformanceData = async (userId) => {
  const student = await ensureStudentProfile(userId);
  await student.populate("classId");

  // All grades for this student, with semester populated
  const myGrades = await Grade.find({ studentId: student._id })
    .populate({ path: "semesterId", model: Semester })
    .lean();

  // ── Determine semesters relevant to this student ────────────────────────────
  const seenSemIds = [
    ...new Set(
      myGrades.filter((g) => g.semesterId?._id).map((g) => g.semesterId._id.toString())
    ),
  ];

  let semesters = [];
  if (seenSemIds.length > 0) {
    semesters = await Semester.find({ _id: { $in: seenSemIds } })
      .sort({ year: 1, name: 1 })
      .lean();
  } else if (student.classId) {
    // Fallback: pull semesters from timetable for this class
    const timetableEntries = await Timetable.find({
      classId: student.classId._id ?? student.classId,
      semesterId: { $ne: null },
    })
      .select("semesterId")
      .lean();
    const semIds = [...new Set(timetableEntries.map((t) => t.semesterId.toString()))];
    semesters = await Semester.find({ _id: { $in: semIds } })
      .sort({ year: 1, name: 1 })
      .lean();
  }

  // ── Load all classmates' grades for rank calculation ───────────────────────
  let allClassGrades = [];
  if (student.classId) {
    const classmates = await Student.find({
      classId: student.classId._id ?? student.classId,
    })
      .select("_id")
      .lean();
    const classmateIds = classmates.map((s) => s._id);
    allClassGrades = await Grade.find({ studentId: { $in: classmateIds } })
      .select("studentId semesterId total")
      .lean();
  }

  // Helper: compute rank among classmates for a specific semester (or all if null)
  const calcRank = (myTotal, semId) => {
    const filtered = semId
      ? allClassGrades.filter((g) => g.semesterId?.toString() === semId)
      : allClassGrades;

    const totalsMap = new Map();
    filtered.forEach((g) => {
      const key = g.studentId.toString();
      totalsMap.set(key, (totalsMap.get(key) ?? 0) + (g.total ?? 0));
    });

    if (totalsMap.size === 0) return null;
    const higherCount = Array.from(totalsMap.values()).filter((t) => t > myTotal).length;
    return higherCount + 1;
  };

  // ── Per-semester breakdown ─────────────────────────────────────────────────
  const semesterStats = semesters.map((sem) => {
    const semId = sem._id.toString();
    const semGrades = myGrades.filter(
      (g) => g.semesterId?._id?.toString() === semId
    );
    const totalMarks = semGrades.reduce((sum, g) => sum + (g.total ?? 0), 0);
    const courseCount = semGrades.length;
    const average =
      courseCount > 0 ? parseFloat((totalMarks / courseCount).toFixed(2)) : 0;
    const rank = courseCount > 0 ? calcRank(totalMarks, semId) : null;

    return { id: semId, name: sem.name, totalMarks, average, rank, courseCount };
  });

  // ── Combined (all semesters together) ─────────────────────────────────────
  const combinedTotal = myGrades.reduce((sum, g) => sum + (g.total ?? 0), 0);
  const combinedCount = myGrades.length;
  const combinedAverage =
    combinedCount > 0 ? parseFloat((combinedTotal / combinedCount).toFixed(2)) : 0;
  const combinedRank = combinedCount > 0 ? calcRank(combinedTotal, null) : null;

  return {
    semesters: semesterStats,
    combined: {
      totalMarks: combinedTotal,
      average: combinedAverage,
      rank: combinedRank,
      courseCount: combinedCount,
    },
  };
};

export const getStudentCoursesData = async (userId) => {
  const student = await ensureStudentProfile(userId);
  const enrollments = await Enrollment.find({ studentId: student._id }).populate({
    path: "courseId",
    select: "courseName classId teacherId semesterId",
    populate: {
      path: "teacherId",
      select: "userId employeeId",
      populate: {
        path: "userId",
        select: "name email phone",
      },
    },
  });

  const grades = await Grade.find({ studentId: student._id });

  return enrollments
    .map((enrollment) => {
      const course = enrollment.courseId;
      if (!course) return null;

      const teacherUser = course.teacherId?.userId;
      const grade = grades.find((g) => g.courseId.toString() === course._id.toString());

      return {
        id: course._id,
        courseName: course.courseName,
        teacherName: teacherUser ? teacherUser.name : "N/A",
        teacherEmail: teacherUser ? teacherUser.email : "N/A",
        assessments: {
          quiz: grade?.quiz || "N/A",
          assignment: grade?.assignment || "N/A",
          midExam: grade?.midExam || "N/A",
          finalExam: grade?.finalExam || "N/A",
          total: grade?.total || "N/A",
        },
      };
    })
    .filter(Boolean);
};

export const getStudentRegistrationData = async (userId) => {
  const student = await ensureStudentProfile(userId);
  const enrollments = await Enrollment.find({ studentId: student._id }).populate({
    path: "courseId",
    select: "courseName",
  });

  if (!enrollments.length) {
    return {
      message: "No courses registered yet",
      data: [],
    };
  }

  return {
    message: "Registered successfully",
    data: enrollments.map((enrollment) => ({
      id: enrollment.courseId._id,
      courseName: enrollment.courseId.courseName,
    })),
  };
};

export const getStudentProfileData = async (user) => {
  const student = await ensureStudentProfile(user._id);
  await student.populate("classId");

  const cls = student.classId;
  // Strip the year portion from class name (e.g. "Grade 9 - 2025/2026" → "Grade 9")
  const rawClassName = cls ? cls.name : null;
  const classLabel = rawClassName
    ? rawClassName.replace(/\s*-\s*\d{4}\/\d{4}$/, "").trim()
    : "N/A";

  // Backward compatibility:
  // some existing records stored location as JSON string in `address`.
  let legacyLocation = {};
  if (typeof user.address === "string") {
    try {
      const parsed = JSON.parse(user.address);
      if (parsed && typeof parsed === "object") {
        legacyLocation = parsed;
      }
    } catch {
      // address is plain text, ignore
    }
  }

  return {
    name: user.name,
    email: user.email,
    gender: user.gender || "N/A",
    phone: user.phone || "N/A",
    address: user.address || "N/A",
    zone: user.zone || legacyLocation.zone || "N/A",
    woreda: user.woreda || legacyLocation.woreda || "N/A",
    kebele: user.kebele || legacyLocation.kebele || "N/A",
    village: user.village || legacyLocation.village || "N/A",
    studentId: student.studentId,
    className: classLabel,
    academicYear: cls ? cls.academicYear : "N/A",
  };
};

export const getStudentResultsData = async (userId) => {
  const student = await ensureStudentProfile(userId);
  const grades = await Grade.find({ studentId: student._id })
    .populate({ path: "courseId", select: "courseName grade stream" })
    .populate({ path: "semesterId", select: "name year" })
    .sort({ createdAt: -1 });

  return grades.map((entry) => ({
    id: entry._id,
    courseId: entry.courseId?._id || null,
    courseName: entry.courseId?.courseName || "N/A",
    grade: entry.courseId?.grade ?? null,
    stream: entry.courseId?.stream ?? null,
    semesterId: entry.semesterId?._id || null,
    semesterName: entry.semesterId?.name || "N/A",
    semesterYear: entry.semesterId?.year || null,
    quiz: entry.quiz ?? 0,
    assignment: entry.assignment ?? 0,
    midExam: entry.midExam ?? 0,
    finalExam: entry.finalExam ?? 0,
    total: entry.total ?? 0,
  }));
};
