import {
  getStudentPerformanceData,
  getStudentCoursesData,
  getStudentRegistrationData,
  getStudentProfileData,
  getStudentResultsData,
} from "../services/student.service.js";

// @route   GET /api/student/performance
// @desc    Get student performance overview
// @access  Private (student only)
export const getPerformance = async (req, res, next) => {
  try {
    const performance = await getStudentPerformanceData(req.user.id);

    res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/student/courses
// @desc    Get courses student is enrolled in with teacher and grade info
// @access  Private (student only)
export const getCourses = async (req, res, next) => {
  try {
    const courses = await getStudentCoursesData(req.user.id);

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/student/registration
// @desc    Get student course enrollment status
// @access  Private (student only)
export const getRegistrationStatus = async (req, res, next) => {
  try {
    const registrationStatus = await getStudentRegistrationData(req.user.id);

    res.status(200).json({
      success: true,
      message: registrationStatus.message,
      data: registrationStatus.data,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/student/profile
// @desc    Get full student profile
// @access  Private (student only)
export const getStudentProfile = async (req, res, next) => {
  try {
    const profile = await getStudentProfileData(req.user);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/student/results
// @desc    Get student grade results with course details
// @access  Private (student only)
export const getStudentResults = async (req, res, next) => {
  try {
    const results = await getStudentResultsData(req.user.id);
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
