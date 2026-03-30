// models/index.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ======================
// 1. USER (AUTH ONLY)
// ======================
const userSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },

  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["admin", "teacher", "student", "registrar"],
    required: true,
    index: true
  },

  phone: String,
  address: String,
  gender: {
    type: String,
    enum: ["male", "female","other"]
  }
}, );

export const User = model("User", userSchema);

// ======================
// 2. DEPARTMENT
// ======================

const departmentSchema = new Schema({
  name: { type: String, required: true, unique: true }
}, );

export const Department = model("Department", departmentSchema);

// ======================
// 3. SEMESTER
// ======================
const semesterSchema = new Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true }
}, );

export const Semester = model("Semester", semesterSchema);

// ======================
// 4. CLASS
// ======================
const classSchema = new Schema({
  name: { type: String, required: true },
  academicYear: { type: String, required: true },
  semesterId: { type: Schema.Types.ObjectId, ref: "Semester" }
}, );

export const Class = model("Class", classSchema);

// ======================
// 5. STUDENT
// ======================
const studentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  studentId: { type: String, unique: true, required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class" }
}, );

export const Student = model("Student", studentSchema);

// ======================
// 6. TEACHER
// ======================
const teacherSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  employeeId: { type: String, unique: true, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department" }
}, );

export const Teacher = model("Teacher", teacherSchema);

// ======================
// 7. COURSE
// ======================
const courseSchema = new Schema({
  courseName: { type: String, required: true },

  classId: { type: Schema.Types.ObjectId, ref: "Class" },
  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" },
  semesterId: { type: Schema.Types.ObjectId, ref: "Semester" }
}, );

export const Course = model("Course", courseSchema);

// ======================
// 8. ENROLLMENT
// ======================
const enrollmentSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "Student" },
  courseId: { type: Schema.Types.ObjectId, ref: "Course" }
}, );

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Enrollment = model("Enrollment", enrollmentSchema);

// ======================
// 9. ATTENDANCE
// ======================
const attendanceSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "Student" },
  courseId: { type: Schema.Types.ObjectId, ref: "Course" },

  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["present", "absent"],
    default: "present"
  },

  markedBy: { type: Schema.Types.ObjectId, ref: "Teacher" }
}, );

attendanceSchema.index(
  { studentId: 1, courseId: 1, date: 1 },
  { unique: true }
);

export const Attendance = model("Attendance", attendanceSchema);

// ======================
// 10. GRADE
// ======================
const gradeSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "Student" },
  courseId: { type: Schema.Types.ObjectId, ref: "Course" },

  quiz: Number,
  assignment: Number,
  midExam: Number,
  finalExam: Number,

  total: Number,

  semesterId: { type: Schema.Types.ObjectId, ref: "Semester" }
}, );

export const Grade = model("Grade", gradeSchema);

// ======================
// 11. RANK
// ======================
const rankSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "Student" },
  classId: { type: Schema.Types.ObjectId, ref: "Class" },
  semesterId: { type: Schema.Types.ObjectId, ref: "Semester" },

  totalScore: Number,
  average: Number,
  rankPosition: Number
}, );

export const Rank = model("Rank", rankSchema);

// ======================
// 12. ANNOUNCEMENT
// ======================
const announcementSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },

  targetRole: {
    type: String,
    enum: ["student", "teacher", "all"],
    default: "all"
  },

  createdBy: { type: Schema.Types.ObjectId, ref: "User" }
}, );

export const Announcement = model("Announcement", announcementSchema);


// ======================
// 13. REGISTRAR
// ======================
const registrarSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  employeeId: { type: String, unique: true, required: true },
  office: { type: String },
  permissions: [{ type: String }] // e.g., ["enroll_student", "manage_records", "publish_results"]
}, );

export const Registrar = model("Registrar", registrarSchema);




