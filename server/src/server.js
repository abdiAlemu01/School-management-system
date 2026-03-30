import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

// Route imports
import authRoutes from "./routes/auth.routes.js";

// Middleware imports
import errorHandler from "./middlewares/error.middleware.js";
import AppError from "./utils/AppError.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Example base route
app.get("/", (req, res) => {
  res.send("Server is running and connected to MongoDB via Mongoose!");
});

// API Routes
app.use("/api/auth", authRoutes);

// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    // ✅ Connect to MongoDB via Mongoose
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB via Mongoose 🚀");

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

startServer();