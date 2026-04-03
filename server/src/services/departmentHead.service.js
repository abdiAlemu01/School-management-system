import { Course, Teacher, Timetable, Class, User, DepartmentHead, Student } from "../config/model.js";
import AppError from "../utils/AppError.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert "HH:MM" → total minutes for overlap comparison */
const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** True if [s1,e1) overlaps with [s2,e2) */
const overlaps = (s1, e1, s2, e2) =>
  toMinutes(s1) < toMinutes(e2) && toMinutes(e1) > toMinutes(s2);

// ─── Course / Teacher assignment ──────────────────────────────────────────────

export const getCoursesGrouped = async ({ grade, stream } = {}) => {
  const filter = {};
  if (grade)  filter.grade  = Number(grade);
  if (stream) filter.stream = stream === "null" ? null : stream;

  const courses = await Course.find(filter)
    .populate({ path: "teacherId", populate: { path: "userId", select: "name email" } })
    .sort({ grade: 1, stream: 1, courseName: 1 });

  // Group by grade then stream
  const tree = {};
  for (const c of courses) {
    const g  = c.grade;
    const st = c.stream || "none";
    if (!tree[g])     tree[g]     = {};
    if (!tree[g][st]) tree[g][st] = [];
    tree[g][st].push({
      id:       c._id,
      courseName: c.courseName,
      grade:    c.grade,
      stream:   c.stream,
      teacher:  c.teacherId
        ? {
            id:         c.teacherId._id,
            employeeId: c.teacherId.employeeId,
            name:       c.teacherId.userId?.name ?? "—",
            email:      c.teacherId.userId?.email ?? "—",
          }
        : null,
    });
  }

  return Object.keys(tree)
    .sort((a, b) => Number(a) - Number(b))
    .map((g) => ({
      grade: Number(g),
      streams: Object.keys(tree[g])
        .sort()
        .map((st) => ({
          stream:   st === "none" ? null : st,
          label:    st === "none" ? `Grade ${g}` : `Grade ${g} – ${st.charAt(0).toUpperCase() + st.slice(1)}`,
          courses:  tree[g][st],
        })),
    }));
};

export const getAllTeachers = async () => {
  const teachers = await Teacher.find()
    .populate({ path: "userId", select: "name email" });

  return teachers.map((t) => ({
    id:         t._id,
    employeeId: t.employeeId,
    name:       t.userId?.name  ?? "Unknown",
    email:      t.userId?.email ?? "—",
  }));
};

export const assignTeacherToCourse = async ({ departmentHeadUserId, courseId, teacherId }) => {
  if (!courseId || !teacherId) {
    throw new AppError("courseId and teacherId are required", 400);
  }

  const [course, teacher, departmentHead] = await Promise.all([
    Course.findById(courseId),
    Teacher.findById(teacherId),
    DepartmentHead.findOne({ userId: departmentHeadUserId }),
  ]);

  if (!course) throw new AppError("Course not found", 404);
  if (!teacher) throw new AppError("Teacher not found", 404);
  if (!departmentHead) throw new AppError("Department head profile not found", 404);

  course.teacherId = teacher._id;
  course.assignedBy = departmentHead._id;
  await course.save();

  return Course.findById(course._id)
    .populate({ path: "teacherId", populate: { path: "userId", select: "name email" } })
    .populate({ path: "classId", select: "name grade stream section academicYear" })
    .populate({ path: "semesterId", select: "name year" });
};

// ─── Timetable ────────────────────────────────────────────────────────────────

export const createTimetableEntry = async (data) => {
  const { classId, courseId, teacherId, day, startTime, endTime, semesterId } = data;

  // Validate existence
  const [cls, course, teacher] = await Promise.all([
    Class.findById(classId),
    Course.findById(courseId),
    Teacher.findById(teacherId),
  ]);
  if (!cls)     throw new AppError("Class not found",   404);
  if (!course)  throw new AppError("Course not found",  404);
  if (!teacher) throw new AppError("Teacher not found", 404);

  if (toMinutes(startTime) >= toMinutes(endTime)) {
    throw new AppError("startTime must be before endTime", 400);
  }

  // Conflict: same class, same day, overlapping slot
  const classConflicts = await Timetable.find({ classId, day });
  for (const entry of classConflicts) {
    if (overlaps(startTime, endTime, entry.startTime, entry.endTime)) {
      throw new AppError(
        `Class schedule conflict: ${entry.startTime}–${entry.endTime} on ${day} is already occupied`,
        409
      );
    }
  }

  // Conflict: same teacher, same day, overlapping slot
  const teacherConflicts = await Timetable.find({ teacherId, day });
  for (const entry of teacherConflicts) {
    if (overlaps(startTime, endTime, entry.startTime, entry.endTime)) {
      throw new AppError(
        `Teacher schedule conflict: teacher already has a class at ${entry.startTime}–${entry.endTime} on ${day}`,
        409
      );
    }
  }

  const entry = await Timetable.create({ classId, courseId, teacherId, day, startTime, endTime, semesterId });
  return _populateEntry(entry);
};

export const getTimetable = async ({ classId, grade, stream, day } = {}) => {
  const timetableFilter = {};

  if (classId) {
    // Direct filter by classId — most specific, used when a class is selected in the sidebar
    timetableFilter.classId = classId;
  } else {
    // Fall back to grade/stream filter
    const classFilter = {};
    if (grade)  classFilter.grade  = Number(grade);
    if (stream && stream !== "") classFilter.stream = stream === "null" ? null : stream;

    if (Object.keys(classFilter).length) {
      const classes  = await Class.find(classFilter);
      const classIds = classes.map((c) => c._id);
      // Always set the filter — $in: [] returns zero results (no leaking across grades)
      timetableFilter.classId = { $in: classIds };
    }
  }

  if (day) timetableFilter.day = day;

  const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const entries = await Timetable.find(timetableFilter)
    .populate({ path: "classId",  select: "name grade stream academicYear" })
    .populate({ path: "courseId", select: "courseName grade stream" })
    .populate({ path: "teacherId", populate: { path: "userId", select: "name" } });

  const shaped = entries.map((e) => ({
    id:           e._id,
    day:          e.day,
    startTime:    e.startTime,
    endTime:      e.endTime,
    courseName:   e.courseId?.courseName      ?? "—",
    teacherName:  e.teacherId?.userId?.name   ?? "—",
    teacherId:    e.teacherId?._id,
    classId:      e.classId?._id,
    className:    e.classId?.name             ?? "—",
    grade:        e.classId?.grade,
    stream:       e.classId?.stream           ?? null,
    academicYear: e.classId?.academicYear     ?? "—",
  }));

  return shaped.sort((a, b) => {
    const di = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
    if (di !== 0) return di;
    return toMinutes(a.startTime) - toMinutes(b.startTime);
  });
};

export const deleteTimetableEntry = async (entryId) => {
  const entry = await Timetable.findByIdAndDelete(entryId);
  if (!entry) throw new AppError("Timetable entry not found", 404);
  return { id: entryId };
};

export const getSemesters = async () => {
  const { Semester } = await import("../config/model.js");
  return Semester.find().sort({ year: -1 });
};

export const getClasses = async () => {
  return Class.find().sort({ grade: 1, stream: 1, section: 1, academicYear: -1 });
};

export const createSection = async ({ grade, stream, academicYear, section }) => {
  if (!grade || !academicYear || !section) {
    throw new AppError("grade, academicYear and section are required", 400);
  }

  const normalizedStream = stream || null;
  const normalizedSection = section.trim().toUpperCase();

  // Prevent duplicate section for same grade+stream+year
  const existing = await Class.findOne({
    grade: Number(grade),
    stream: normalizedStream,
    academicYear,
    section: normalizedSection,
  });
  if (existing) {
    throw new AppError(
      `Section ${normalizedSection} already exists for Grade ${grade}${normalizedStream ? ` (${normalizedStream})` : ""} – ${academicYear}`,
      409
    );
  }

  const streamLabel = normalizedStream
    ? ` (${normalizedStream.charAt(0).toUpperCase() + normalizedStream.slice(1)})`
    : "";
  const name = `Grade ${grade}${streamLabel} – Section ${normalizedSection}`;

  const cls = await Class.create({
    name,
    grade: Number(grade),
    stream: normalizedStream,
    section: normalizedSection,
    academicYear,
  });

  return {
    _id:          cls._id,
    name:         cls.name,
    grade:        cls.grade,
    stream:       cls.stream,
    section:      cls.section,
    academicYear: cls.academicYear,
  };
};

// ─── Student section assignment ───────────────────────────────────────────────

export const getStudentsByGrade = async ({ grade, stream } = {}) => {
  // Build a filter for all classes matching the grade/stream (sectioned or not)
  const classFilter = {};
  if (grade) classFilter.grade = Number(grade);
  if (stream !== undefined && stream !== "") {
    classFilter.stream = stream === "null" ? null : (stream || null);
  }

  const classes = await Class.find(classFilter);
  if (!classes.length) return [];

  const classIds = classes.map((c) => c._id);

  const students = await Student.find({ classId: { $in: classIds } })
    .populate({ path: "userId",  select: "name email" })
    .populate({ path: "classId", select: "name grade stream section academicYear" })
    .sort({ createdAt: 1 });

  return students
    .filter((s) => s.userId && s.classId)
    .map((s) => ({
      id:          s._id,
      studentId:   s.studentId,
      name:        s.userId.name,
      email:       s.userId.email,
      grade:       s.classId.grade,
      stream:      s.classId.stream   ?? null,
      section:     s.classId.section  ?? null,
      academicYear: s.classId.academicYear,
      classId:     s.classId._id,
      className:   s.classId.name,
    }));
};

export const assignStudentSection = async (studentId, sectionClassId) => {
  const student = await Student.findById(studentId).populate("classId");
  if (!student) throw new AppError("Student not found", 404);

  const targetClass = await Class.findById(sectionClassId);
  if (!targetClass)        throw new AppError("Section class not found", 404);
  if (!targetClass.section) throw new AppError("Target class is not a named section", 400);

  // Grade must match
  if (student.classId && student.classId.grade !== targetClass.grade) {
    throw new AppError(
      `Grade mismatch: student is Grade ${student.classId.grade}, section is Grade ${targetClass.grade}`,
      400
    );
  }

  // Stream must match
  const studentStream = student.classId?.stream ?? null;
  const targetStream  = targetClass.stream ?? null;
  if (studentStream !== targetStream) {
    throw new AppError(
      `Stream mismatch: student stream "${studentStream}", section stream "${targetStream}"`,
      400
    );
  }

  student.classId = sectionClassId;
  await student.save();

  return {
    id:        student._id,
    studentId: student.studentId,
    classId:   targetClass._id,
    className: targetClass.name,
    section:   targetClass.section,
  };
};

// ─── Private ──────────────────────────────────────────────────────────────────

const _populateEntry = (entry) =>
  Timetable.findById(entry._id)
    .populate({ path: "classId",  select: "name grade stream academicYear" })
    .populate({ path: "courseId", select: "courseName grade stream" })
    .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
    .populate({ path: "semesterId", select: "name year" });
