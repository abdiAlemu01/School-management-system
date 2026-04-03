export {
  getTeacherSections,
  getTeacherStudents,
  saveTeacherMarksBulk,
  updateTeacherSingleMark,
  getAvailableSemesters,
  getClassRanks,
} from "./teacher.service";

export type {
  TeacherSection,
  TeacherStudent,
  TeacherStudentCourseMark,
  BulkMarkItem,
  SingleMarkPayload,
  SemesterInfo,
  ClassRankEntry,
  SemesterBreakdown,
  ClassRankResponse,
} from "./teacher.service";
