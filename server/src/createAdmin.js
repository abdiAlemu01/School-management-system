

import mongoose from "mongoose";
import bcrypt from "bcrypt";

// 🔗 1. Connect to MongoDB (REPLACE PASSWORD)
mongoose.connect("mongodb+srv://mongoDB:123abdialemu@cluster0.jeuphwc.mongodb.net/?appName=Cluster0")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Error:", err));

// 👤 2. User Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String
});

const User = mongoose.model("User", userSchema);

// 🛠️ 3. Create Admin
async function createAdmin() {
  const existingAdmin = await User.findOne({ email: "admin@gmail.com" });

  if (existingAdmin) {
    console.log("⚠️ Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("123@admin", 10);

  const admin = new User({
    email: "admin@gmail.com",
    password: hashedPassword,
    role: "admin"
  });

  await admin.save();
  console.log("✅ Admin created");
}

// 🔐 4. Login Function
async function login(email, inputPassword) {
  const user = await User.findOne({ email });

  if (!user) {
    console.log("❌ User not found");
    return;
  }

  const isMatch = await bcrypt.compare(inputPassword, user.password);

  if (isMatch) {
    console.log("✅ Login success");
  } else {
    console.log("❌ Invalid password");
  }
}

// 🚀 5. Run Everything
async function run() {
  await createAdmin(); // create admin if not exists

  // Test login
  await login("admin@gmail.com", "123@admin");

  mongoose.connection.close();
}

run();