import bcrypt from "bcryptjs";
import { User, Student, Class, Course, Enrollment } from "../config/model.js";
import AppError from "../utils/AppError.js";
import { createOrUpdatePaidFinanceRecord } from "./finance.service.js";

// ─── Course catalogue ────────────────────────────────────────────────────────
// Defines which courses belong to each grade/stream.
// Keys: grade number → stream (null | "natural" | "social") → course names.

const COURSE_CATALOGUE = {
  9: {
    null: [
      "English", "Afaan Oromoo", "Amharic", "Mathematics",
      "Physics", "Chemistry", "Biology", "Gada", "Sport", "Civic",
    ],
  },
  10: {
    null: [
      "English", "Afaan Oromoo", "Amharic", "Mathematics",
      "Physics", "Chemistry", "Biology", "Gada", "Sport", "Civic",
    ],
  },
  11: {
    natural: ["English", "Mathematics", "Physics", "Chemistry", "Biology", "Civic"],
    social:  ["English", "Mathematics", "Geography", "History", "Civic"],
  },
  12: {
    natural: ["English", "Mathematics", "Physics", "Chemistry", "Biology", "Civic"],
    social:  ["English", "Mathematics", "Geography", "History", "Civic"],
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const GRADE_STREAMS = {
  9:  [null],
  10: [null],
  11: ["natural", "social"],
  12: ["natural", "social"],
};

const validateGradeStream = (grade, stream) => {
  const allowedStreams = GRADE_STREAMS[grade];
  if (!allowedStreams) {
    throw new AppError(`Invalid grade: ${grade}. Must be 9, 10, 11 or 12.`, 400);
  }
  const normalizedStream = stream || null;
  if (!allowedStreams.includes(normalizedStream)) {
    throw new AppError(
      grade <= 10
        ? `Grade ${grade} does not have streams.`
        : `Grade ${grade} requires a stream: "natural" or "social".`,
      400
    );
  }
  return normalizedStream;
};

const generateUniqueStudentId = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = `STD${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    exists = await Student.findOne({ studentId: id });
  }
  return id;
};

// ─── Service functions ───────────────────────────────────────────────────────

export const findOrCreateClass = async (grade, stream, academicYear) => {
  const normalizedStream = stream || null;
  const streamLabel = normalizedStream ? ` (${normalizedStream})` : "";
  const className = `Grade ${grade}${streamLabel} - ${academicYear}`;

  // section: null ensures we never accidentally match a DH-created sectioned class
  // (e.g. "Grade 9 – Section A") when the registrar looks up the default class.
  let cls = await Class.findOne({ grade, stream: normalizedStream, academicYear, section: null });
  if (!cls) {
    cls = await Class.create({
      name: className,
      grade,
      stream: normalizedStream,
      academicYear,
      section: null,
    });
  }
  return cls;
};

export const getCoursesByGradeStream = async (grade, stream) => {
  const normalizedStream = stream || null;
  let courses = await Course.find({ grade, stream: normalizedStream });

  // Auto-seed courses for this grade/stream if none exist yet
  if (courses.length === 0) {
    const streamKey = normalizedStream ?? "null";
    const names = COURSE_CATALOGUE[grade]?.[streamKey] ?? [];
    if (names.length > 0) {
      const docs = names.map((courseName) => ({ courseName, grade, stream: normalizedStream }));
      courses = await Course.insertMany(docs);
    }
  }

  return courses;
};

export const enrollStudentInCourses = async (studentId, courses) => {
  if (!courses.length) return [];
  const enrollments = courses.map((course) => ({
    studentId,
    courseId: course._id,
  }));
  return Enrollment.insertMany(enrollments, { ordered: false });
};

export const registerStudent = async (data) => {
  const {
    name,
    email,
    password,
    age,
    gender,
    phone,
    zone,
    woreda,
    kebele,
    village,
    grade,
    stream,
    academicYear,
    address,
  } = data;

  // 1. Validate grade/stream combination
  const normalizedStream = validateGradeStream(Number(grade), stream || null);

  // 2. Check duplicate email
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("A user with this email already exists.", 400);
  }

  // 3. Create User with role student
  const hashed = await bcrypt.hash(password || "changeme123", 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    age: Number(age),
    gender,
    phone: phone || undefined,
    address: address || undefined,
    zone: zone || undefined,
    woreda: woreda || undefined,
    kebele: kebele || undefined,
    village: village || undefined,
    role: "student",
  });

  // 4. Find or create Class
  const cls = await findOrCreateClass(Number(grade), normalizedStream, academicYear);

  // 5. Create Student record
  const studentId = await generateUniqueStudentId();
  const student = await Student.create({
    userId: user._id,
    studentId,
    classId: cls._id,
  });

  // 5.1 Auto-create finance record as fully paid (required by finance policy)
  const financeRecord = await createOrUpdatePaidFinanceRecord({
    studentObjectId: student._id,
    grade: Number(grade),
  });

  // 6. Fetch matching courses and enroll
  const courses = await getCoursesByGradeStream(Number(grade), normalizedStream);
  const enrollments = await enrollStudentInCourses(student._id, courses);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    student: {
      id: student._id,
      studentId: student.studentId,
      classId: cls._id,
      className: cls.name,
      grade: cls.grade,
      stream: cls.stream,
      academicYear: cls.academicYear,
    },
    enrolledCourses: enrollments.length,
    finance: {
      totalFee: financeRecord.totalFee,
      paidAmount: financeRecord.paidAmount,
      remainingBalance: financeRecord.remainingBalance,
      status: financeRecord.status,
    },
  };
};

export const getAllStudentsGrouped = async ({ grade, academicYear, stream } = {}) => {
  const students = await Student.find()
    .populate({ path: "userId", select: "name email phone gender" })
    .populate({ path: "classId", select: "name grade stream academicYear" });

  // Apply optional filters in JS (avoids Mongoose populate-match null edge-cases)
  const filtered = students.filter((s) => {
    if (!s.userId || !s.classId) return false;
    if (grade      && s.classId.grade       !== Number(grade))      return false;
    if (academicYear && s.classId.academicYear !== academicYear)    return false;
    if (stream !== undefined && stream !== "") {
      const want = stream === "null" || stream === null ? null : stream;
      if (s.classId.stream !== want) return false;
    }
    return true;
  });

  // Build:  { year → { "grade:stream" → { meta, students[] } } }
  const tree = {};
  for (const s of filtered) {
    const year = s.classId.academicYear;
    const g    = s.classId.grade;
    const st   = s.classId.stream || null;
    const key  = `${g}:${st ?? "none"}`;

    if (!tree[year])       tree[year] = {};
    if (!tree[year][key])  tree[year][key] = { grade: g, stream: st, students: [] };

    tree[year][key].students.push({
      id:          s._id,
      studentId:   s.studentId,
      name:        s.userId.name,
      email:       s.userId.email,
      phone:       s.userId.phone || "N/A",
      gender:      s.userId.gender || "N/A",
      grade:       g,
      stream:      st,
      academicYear: year,
      className:   s.classId.name,
    });
  }

  // Convert to sorted array: newest year first, grades ascending
  return Object.keys(tree)
    .sort((a, b) => b.localeCompare(a))
    .map((year) => ({
      academicYear: year,
      groups: Object.values(tree[year])
        .sort((a, b) => {
          if (a.grade !== b.grade) return a.grade - b.grade;
          return (a.stream ?? "").localeCompare(b.stream ?? "");
        })
        .map((g) => ({
          grade:    g.grade,
          stream:   g.stream,
          label:    g.stream ? `Grade ${g.grade} – ${g.stream.charAt(0).toUpperCase() + g.stream.slice(1)}` : `Grade ${g.grade}`,
          count:    g.students.length,
          students: g.students,
        })),
    }));
};
