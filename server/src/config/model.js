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
    enum: ["admin", "teacher", "student", "registrar", "departmentHead"],
    required: true,
    index: true
  },

  phone: String,
  address: String,
  zone: String,
  woreda: String,
  kebele: String,
  village: String,

  gender: {
    type: String,
    enum: ["male", "female", "other"]
  }
}, { timestamps: true });

export const User = model("User", userSchema);


// ======================
// 2. DEPARTMENT
// ======================
const departmentSchema = new Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: true });

export const Department = model("Department", departmentSchema);


// ======================
// 3. SEMESTER
// ======================
const semesterSchema = new Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  startDate: Date,
  endDate: Date
}, { timestamps: true });

export const Semester = model("Semester", semesterSchema);


// ======================
// 4. CLASS
// ======================
const classSchema = new Schema({
  name: { type: String, required: true },

  grade: {
    type: Number,
    enum: [9, 10, 11, 12],
    required: true,
    index: true
  },

  stream: {
    type: String,
    enum: ["natural", "social", null],
    default: null
  },

  section: {
    type: String,
    default: null   // e.g. "A", "B", "C"
  },

  academicYear: { type: String, required: true },

  semesterId: { type: Schema.Types.ObjectId, ref: "Semester" }
}, { timestamps: true });

classSchema.index({ grade: 1, stream: 1, section: 1, academicYear: 1 });

export const Class = model("Class", classSchema);


// ======================
// 5. STUDENT
// ======================
const studentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  studentId: { type: String, unique: true, required: true },
  // classId is optional: self-registered students have no class until the
  // Registrar formally enrols them; Registrar-registered students always have one.
  classId: { type: Schema.Types.ObjectId, ref: "Class", default: null }
}, { timestamps: true });

export const Student = model("Student", studentSchema);


// ======================
// 6. TEACHER
// ======================
const teacherSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  employeeId: { type: String, unique: true, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department" }
}, { timestamps: true });

export const Teacher = model("Teacher", teacherSchema);


// ======================
// 7. DEPARTMENT HEAD
// ======================
const departmentHeadSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  employeeId: { type: String, unique: true, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true }
}, { timestamps: true });

export const DepartmentHead = model("DepartmentHead", departmentHeadSchema);


// ======================
// 8. COURSE
// ======================
const courseSchema = new Schema({
  courseName: { type: String, required: true },

  grade: { type: Number, enum: [9, 10, 11, 12], required: true, index: true },

  stream: {
    type: String,
    enum: ["natural", "social", null],
    default: null
  },

  classId: { type: Schema.Types.ObjectId, ref: "Class" },

  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" },

  assignedBy: { type: Schema.Types.ObjectId, ref: "DepartmentHead" },

  semesterId: { type: Schema.Types.ObjectId, ref: "Semester" }
}, { timestamps: true });

export const Course = model("Course", courseSchema);


// ======================
// 9. ENROLLMENT
// ======================
const enrollmentSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true }
}, { timestamps: true });

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Enrollment = model("Enrollment", enrollmentSchema);


// ======================
// 10. ATTENDANCE
// ======================
const attendanceSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },

  date: { type: Date, required: true },

  status: {
    type: String,
    enum: ["present", "absent"],
    default: "present"
  },

  markedBy: { type: Schema.Types.ObjectId, ref: "Teacher" }
}, { timestamps: true });

attendanceSchema.index(
  { studentId: 1, courseId: 1, date: 1 },
  { unique: true }
);

export const Attendance = model("Attendance", attendanceSchema);


// ======================
// 11. GRADE
// ======================
const gradeSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },

  quiz: { type: Number, default: 0 },
  assignment: { type: Number, default: 0 },
  midExam: { type: Number, default: 0 },
  finalExam: { type: Number, default: 0 },

  total: { type: Number, default: 0 },

  semesterId: { type: Schema.Types.ObjectId, ref: "Semester" }
}, { timestamps: true });

export const Grade = model("Grade", gradeSchema);


// ======================
// 12. RANK
// ======================
const rankSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  semesterId: { type: Schema.Types.ObjectId, ref: "Semester" },

  totalScore: Number,
  average: Number,
  rankPosition: Number
}, { timestamps: true });

export const Rank = model("Rank", rankSchema);


// ======================
// 13. ANNOUNCEMENT
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
}, { timestamps: true });

export const Announcement = model("Announcement", announcementSchema);


// ======================
// 14. REGISTRAR
// ======================
const registrarSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  employeeId: { type: String, unique: true, required: true },
  office: String,
  permissions: [{ type: String }]
}, { timestamps: true });

export const Registrar = model("Registrar", registrarSchema);


// ======================
// 15. TIMETABLE (SCHEDULE)
// ======================
const timetableSchema = new Schema({
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },

  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    required: true
  },

  startTime: { type: String, required: true },
  endTime: { type: String, required: true },

  semesterId: { type: Schema.Types.ObjectId, ref: "Semester" }
}, { timestamps: true });

export const Timetable = model("Timetable", timetableSchema);





