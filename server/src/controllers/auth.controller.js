import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Student, Teacher, DepartmentHead } from "../config/model.js";
import AppError from "../utils/AppError.js";

const ALL_ROLES = ["admin", "teacher", "student", "registrar", "departmentHead", "finance"];
const PUBLIC_REGISTER_ROLES = ["student", "admin"];

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "90d",
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  });
};

const createUniqueCode = async (model, fieldName, prefix) => {
  let uniqueValue;
  let exists = true;

  while (exists) {
    uniqueValue = `${prefix}${Date.now().toString().slice(-6)}${Math.floor(
      100 + Math.random() * 900
    )}`;
    exists = await model.findOne({ [fieldName]: uniqueValue });
  }

  return uniqueValue;
};

export const register = async (req, res, next) => {
  try {
    const { name, age, email, password, gender, phone, address, role } = req.body;
    const requestedRole = role || "student";

    if (!name || !age || !email || !password || !gender) {
      return next(new AppError("Please provide name, age, email, password, and gender", 400));
    }

    if (!ALL_ROLES.includes(requestedRole)) {
      return next(new AppError("Invalid role selected", 400));
    }

    if (!PUBLIC_REGISTER_ROLES.includes(requestedRole)) {
      return next(new AppError("This role cannot self-register", 403));
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError("Email already exists", 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      age,
      email,
      password: hashedPassword,
      gender,
      phone,
      address,
      role: requestedRole,
    });

    // Keep role-specific profile documents in sync with auth user records.
    if (requestedRole === "student") {
      const studentId = await createUniqueCode(Student, "studentId", "STD");
      await Student.create({
        userId: newUser._id,
        studentId,
      });
    }

    if (requestedRole === "teacher") {
      const employeeId = await createUniqueCode(Teacher, "employeeId", "EMP");
      await Teacher.create({
        userId: newUser._id,
        employeeId,
      });
    }

    if (requestedRole === "departmentHead") {
      const employeeId = await createUniqueCode(DepartmentHead, "employeeId", "DH");
      // Find or create a default department for initial setup
      const { Department } = await import("../config/model.js");
      let dept = await Department.findOne();
      if (!dept) dept = await Department.create({ name: "General" });
      await DepartmentHead.create({
        userId: newUser._id,
        employeeId,
        departmentId: dept._id,
      });
    }

    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    user.password = undefined;
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};
