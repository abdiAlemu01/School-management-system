import bcrypt from "bcryptjs";
import {
  User,
  Teacher,
  Registrar,
  DepartmentHead,
  Department,
  Class,
  Semester,
  Course,
} from "../config/model.js";
import AppError from "../utils/AppError.js";

const ALLOWED_ADMIN_ROLES = ["admin", "teacher", "registrar", "departmentHead", "finance"];
const STAFF_ROLES = ["teacher", "registrar", "departmentHead", "finance"];
const STAFF_ROLE_ERROR_MESSAGE = "role must be one of: teacher, registrar, departmentHead, finance";
const GRADE_STREAMS = {
  9: [null],
  10: [null],
  11: ["natural", "social"],
  12: ["natural", "social"],
};

const normalizeStream = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return String(value).trim().toLowerCase();
};

const normalizeRole = (value) => String(value ?? "").trim().toLowerCase();

const normalizeSection = (value) => String(value).trim().toUpperCase();
const normalizeAcademicYear = (value) => String(value).trim();

const validateGradeStream = (grade, stream) => {
  const parsedGrade = Number(grade);
  const allowedStreams = GRADE_STREAMS[parsedGrade];
  if (!allowedStreams) {
    throw new AppError("Grade must be one of: 9, 10, 11, 12", 400);
  }

  const normalizedStream = normalizeStream(stream);
  if (!allowedStreams.includes(normalizedStream)) {
    throw new AppError(
      parsedGrade <= 10
        ? `Grade ${parsedGrade} does not allow stream`
        : `Grade ${parsedGrade} requires stream: natural or social`,
      400
    );
  }

  return { parsedGrade, normalizedStream };
};

const makeClassName = ({ grade, stream, section, academicYear }) => {
  const streamLabel = stream ? ` - ${stream.charAt(0).toUpperCase()}${stream.slice(1)}` : "";
  return `Grade ${grade}${streamLabel} - Section ${section} - ${academicYear}`;
};

const createUniqueCode = async (model, fieldName, prefix) => {
  let candidate;
  let exists = true;
  while (exists) {
    candidate = `${prefix}${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    exists = await model.findOne({ [fieldName]: candidate });
  }
  return candidate;
};

const syncRoleProfile = async (userId, role) => {
  await Promise.all([
    Teacher.deleteOne({ userId }),
    Registrar.deleteOne({ userId }),
    DepartmentHead.deleteOne({ userId }),
  ]);

  if (role === "teacher") {
    const employeeId = await createUniqueCode(Teacher, "employeeId", "EMP");
    await Teacher.create({ userId, employeeId });
  }

  if (role === "registrar") {
    const employeeId = await createUniqueCode(Registrar, "employeeId", "REG");
    await Registrar.create({ userId, employeeId });
  }

  if (role === "departmentHead") {
    const employeeId = await createUniqueCode(DepartmentHead, "employeeId", "DH");
    let department = await Department.findOne();
    if (!department) {
      department = await Department.create({ name: "General" });
    }
    await DepartmentHead.create({ userId, employeeId, departmentId: department._id });
  }
};

// Users
export const createAdminUser = async (payload) => {
  const { name, email, password, role, age, gender, phone, address } = payload;
  const normalizedRole = normalizeRole(role);
  if (!name || !email || !password || !role) {
    throw new AppError("name, email, password and role are required", 400);
  }
  if (!STAFF_ROLES.includes(normalizedRole)) {
    throw new AppError(STAFF_ROLE_ERROR_MESSAGE, 400);
  }

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    role: normalizedRole,
    age: Number(age) || 30,
    gender,
    phone,
    address,
  });

  await syncRoleProfile(user._id, normalizedRole);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

export const getAdminUsers = async () => {
  const users = await User.find({ role: { $in: ALLOWED_ADMIN_ROLES } })
    .select("-password")
    .sort({ createdAt: -1 });
  return users;
};

export const updateAdminUser = async (id, payload) => {
  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404);

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.email !== undefined) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
    if (existing) throw new AppError("Email already exists", 409);
    updates.email = normalizedEmail;
  }
  if (payload.role !== undefined) {
    const normalizedRole = normalizeRole(payload.role);
    if (!STAFF_ROLES.includes(normalizedRole)) {
      throw new AppError(STAFF_ROLE_ERROR_MESSAGE, 400);
    }
    updates.role = normalizedRole;
  }
  if (payload.password !== undefined) {
    updates.password = await bcrypt.hash(payload.password, 10);
  }
  if (payload.age !== undefined) updates.age = Number(payload.age);
  if (payload.gender !== undefined) updates.gender = payload.gender;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.address !== undefined) updates.address = payload.address;

  const updated = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");

  if (payload.role !== undefined && updates.role !== user.role) {
    await syncRoleProfile(id, updates.role);
  }

  return updated;
};

export const deleteAdminUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404);

  await Promise.all([
    Teacher.deleteOne({ userId: id }),
    Registrar.deleteOne({ userId: id }),
    DepartmentHead.deleteOne({ userId: id }),
    User.findByIdAndDelete(id),
  ]);

  return { id };
};

// Departments
export const createDepartment = async ({ name }) => {
  if (!name?.trim()) throw new AppError("name is required", 400);
  const normalized = name.trim();
  const existing = await Department.findOne({ name: { $regex: `^${normalized}$`, $options: "i" } });
  if (existing) throw new AppError("Department already exists", 409);
  return Department.create({ name: normalized });
};

export const getDepartments = async () => Department.find().sort({ name: 1 });

export const updateDepartment = async (id, { name }) => {
  if (!name?.trim()) throw new AppError("name is required", 400);
  const normalized = name.trim();
  const duplicate = await Department.findOne({
    _id: { $ne: id },
    name: { $regex: `^${normalized}$`, $options: "i" },
  });
  if (duplicate) throw new AppError("Department already exists", 409);
  const department = await Department.findByIdAndUpdate(id, { name: normalized }, { new: true });
  if (!department) throw new AppError("Department not found", 404);
  return department;
};

export const deleteDepartment = async (id) => {
  const department = await Department.findByIdAndDelete(id);
  if (!department) throw new AppError("Department not found", 404);
  return { id };
};

// Classes
export const createClass = async ({ grade, stream, section, academicYear, semesterId }) => {
  if (!grade || !section || !academicYear) {
    throw new AppError("grade, section and academicYear are required", 400);
  }
  const { parsedGrade, normalizedStream } = validateGradeStream(grade, stream);
  const normalizedSection = normalizeSection(section);
  const normalizedYear = normalizeAcademicYear(academicYear);

  const existing = await Class.findOne({
    grade: parsedGrade,
    stream: normalizedStream,
    section: normalizedSection,
    academicYear: normalizedYear,
  });
  if (existing) throw new AppError("Class already exists for this grade/stream/section/year", 409);

  const name = makeClassName({
    grade: parsedGrade,
    stream: normalizedStream,
    section: normalizedSection,
    academicYear: normalizedYear,
  });

  return Class.create({
    name,
    grade: parsedGrade,
    stream: normalizedStream,
    section: normalizedSection,
    academicYear: normalizedYear,
    semesterId: semesterId || undefined,
  });
};

export const getClasses = async () =>
  Class.find()
    .populate("semesterId", "name year")
    .sort({ academicYear: -1, grade: 1, stream: 1, section: 1 });

export const updateClass = async (id, payload) => {
  const existingClass = await Class.findById(id);
  if (!existingClass) throw new AppError("Class not found", 404);

  const nextGrade = payload.grade !== undefined ? Number(payload.grade) : existingClass.grade;
  const nextStream =
    payload.stream !== undefined ? normalizeStream(payload.stream) : normalizeStream(existingClass.stream);
  const nextSection =
    payload.section !== undefined ? normalizeSection(payload.section) : normalizeSection(existingClass.section || "");
  const nextYear =
    payload.academicYear !== undefined
      ? normalizeAcademicYear(payload.academicYear)
      : normalizeAcademicYear(existingClass.academicYear);

  const { parsedGrade, normalizedStream } = validateGradeStream(nextGrade, nextStream);

  const duplicate = await Class.findOne({
    _id: { $ne: id },
    grade: parsedGrade,
    stream: normalizedStream,
    section: nextSection,
    academicYear: nextYear,
  });
  if (duplicate) throw new AppError("Class already exists for this grade/stream/section/year", 409);

  const name = makeClassName({
    grade: parsedGrade,
    stream: normalizedStream,
    section: nextSection,
    academicYear: nextYear,
  });

  const updated = await Class.findByIdAndUpdate(
    id,
    {
      grade: parsedGrade,
      stream: normalizedStream,
      section: nextSection,
      academicYear: nextYear,
      semesterId: payload.semesterId !== undefined ? payload.semesterId || null : existingClass.semesterId,
      name,
    },
    { new: true }
  ).populate("semesterId", "name year");

  return updated;
};

export const deleteClass = async (id) => {
  const cls = await Class.findByIdAndDelete(id);
  if (!cls) throw new AppError("Class not found", 404);
  return { id };
};

// Semesters
export const createSemester = async ({ name, year, startDate, endDate }) => {
  if (!name || !year) throw new AppError("name and year are required", 400);
  const parsedYear = Number(year);
  if (Number.isNaN(parsedYear)) throw new AppError("year must be a number", 400);

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (start && end && start > end) throw new AppError("startDate must be before endDate", 400);

  const duplicate = await Semester.findOne({ name: name.trim(), year: parsedYear });
  if (duplicate) throw new AppError("Semester already exists for this year", 409);

  return Semester.create({
    name: name.trim(),
    year: parsedYear,
    startDate: start || undefined,
    endDate: end || undefined,
  });
};

export const getSemesters = async () => Semester.find().sort({ year: -1, name: 1 });

export const updateSemester = async (id, payload) => {
  const existing = await Semester.findById(id);
  if (!existing) throw new AppError("Semester not found", 404);

  const nextName = payload.name !== undefined ? payload.name.trim() : existing.name;
  const nextYear = payload.year !== undefined ? Number(payload.year) : existing.year;
  if (!nextName || Number.isNaN(nextYear)) throw new AppError("Valid name and year are required", 400);

  const nextStart = payload.startDate !== undefined ? (payload.startDate ? new Date(payload.startDate) : null) : existing.startDate;
  const nextEnd = payload.endDate !== undefined ? (payload.endDate ? new Date(payload.endDate) : null) : existing.endDate;
  if (nextStart && nextEnd && nextStart > nextEnd) throw new AppError("startDate must be before endDate", 400);

  const duplicate = await Semester.findOne({ _id: { $ne: id }, name: nextName, year: nextYear });
  if (duplicate) throw new AppError("Semester already exists for this year", 409);

  return Semester.findByIdAndUpdate(
    id,
    {
      name: nextName,
      year: nextYear,
      startDate: nextStart,
      endDate: nextEnd,
    },
    { new: true }
  );
};

export const deleteSemester = async (id) => {
  const semester = await Semester.findByIdAndDelete(id);
  if (!semester) throw new AppError("Semester not found", 404);
  return { id };
};

// Courses
export const createCourse = async ({ courseName, grade, stream, classId, semesterId }) => {
  if (!courseName || !grade) throw new AppError("courseName and grade are required", 400);
  const { parsedGrade, normalizedStream } = validateGradeStream(grade, stream);
  const cleanedCourseName = courseName.trim();

  const duplicate = await Course.findOne({
    courseName: { $regex: `^${cleanedCourseName}$`, $options: "i" },
    grade: parsedGrade,
    stream: normalizedStream,
    classId: classId || null,
    semesterId: semesterId || null,
  });
  if (duplicate) throw new AppError("Course already exists for this setup", 409);

  return Course.create({
    courseName: cleanedCourseName,
    grade: parsedGrade,
    stream: normalizedStream,
    classId: classId || undefined,
    semesterId: semesterId || undefined,
    teacherId: undefined,
    assignedBy: undefined,
  });
};

export const getCourses = async () =>
  Course.find()
    .populate("classId", "name grade stream section academicYear")
    .populate("semesterId", "name year")
    .sort({ grade: 1, stream: 1, courseName: 1 });

export const updateCourse = async (id, payload) => {
  const existing = await Course.findById(id);
  if (!existing) throw new AppError("Course not found", 404);

  const nextCourseName = payload.courseName !== undefined ? payload.courseName.trim() : existing.courseName;
  const nextGrade = payload.grade !== undefined ? Number(payload.grade) : existing.grade;
  const nextStream =
    payload.stream !== undefined ? normalizeStream(payload.stream) : normalizeStream(existing.stream);
  const { parsedGrade, normalizedStream } = validateGradeStream(nextGrade, nextStream);
  const nextClassId = payload.classId !== undefined ? payload.classId || null : existing.classId || null;
  const nextSemesterId =
    payload.semesterId !== undefined ? payload.semesterId || null : existing.semesterId || null;

  const duplicate = await Course.findOne({
    _id: { $ne: id },
    courseName: { $regex: `^${nextCourseName}$`, $options: "i" },
    grade: parsedGrade,
    stream: normalizedStream,
    classId: nextClassId,
    semesterId: nextSemesterId,
  });
  if (duplicate) throw new AppError("Course already exists for this setup", 409);

  return Course.findByIdAndUpdate(
    id,
    {
      courseName: nextCourseName,
      grade: parsedGrade,
      stream: normalizedStream,
      classId: nextClassId,
      semesterId: nextSemesterId,
      teacherId: null,
    },
    { new: true }
  )
    .populate("classId", "name grade stream section academicYear")
    .populate("semesterId", "name year");
};

export const deleteCourse = async (id) => {
  const course = await Course.findByIdAndDelete(id);
  if (!course) throw new AppError("Course not found", 404);
  return { id };
};
