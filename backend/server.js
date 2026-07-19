const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { connectDB } = require("./config/db");
const errorMiddleware = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const pyqRoutes = require("./routes/pyqRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const supportRoutes = require("./routes/supportRoutes");
const cgpaRoutes = require("./routes/cgpaRoutes");
const successStoryRoutes = require("./routes/successStoryRoutes");
const alumniRoutes = require("./routes/alumniRoutes");
const jobRoutes = require("./routes/jobRoutes");
const messageRoutes = require("./routes/messageRoutes");
const semesterRoutes = require("./routes/semesterRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "University System API is running",
    version: "2.0.0"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/pyq", pyqRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/cgpa", cgpaRoutes);
app.use("/api/success-stories", successStoryRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/semesters", semesterRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use(errorMiddleware);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});