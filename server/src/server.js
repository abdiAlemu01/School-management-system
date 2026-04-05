import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import registrarRoutes from "./routes/registrar.routes.js";
import departmentHeadRoutes from "./routes/departmentHead.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import financeRoutes from "./routes/finance.routes.js";

// Seed
import { getCoursesByGradeStream } from "./services/registrar.service.js";

// Middleware imports
import errorHandler from "./middlewares/error.middleware.js";
import AppError from "./utils/AppError.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://school-ms-f4de.onrender.com",
];

// Middleware setup
app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin/server-to-server tools (Postman, curl) with no Origin header.
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Example base route
app.get("/", (req, res) => {
  res.send("Server is running and connected to MongoDB via Mongoose!");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/registrar",       registrarRoutes);
app.use("/api/department",      departmentHeadRoutes);
app.use("/api/admin",           adminRoutes);
app.use("/api/finance",         financeRoutes);

// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

async function seedCourses() {
  const combos = [
    { grade: 9,  stream: null },
    { grade: 10, stream: null },
    { grade: 11, stream: "natural" },
    { grade: 11, stream: "social" },
    { grade: 12, stream: "natural" },
    { grade: 12, stream: "social" },
  ];
  for (const { grade, stream } of combos) {
    await getCoursesByGradeStream(grade, stream);
  }
  console.log("Courses seeded ✅");
}

async function startServer() {
  try {
    // ✅ Connect to MongoDB via Mongoose
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB via Mongoose 🚀");

    // Auto-seed standard courses on every startup (idempotent)
    await seedCourses();

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

startServer();