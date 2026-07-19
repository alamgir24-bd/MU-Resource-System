const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const sendEmail = require("../utils/sendEmail");
const { asyncHandler, cleanText, toPublicUser } = require("../utils/helpers");

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const name = cleanText(req.body.name);
    const email = cleanText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    const department = cleanText(req.body.department);
    const batch = cleanText(req.body.batch);
    const semester = cleanText(req.body.semester);
    const studentId = cleanText(req.body.studentId);

    if (!name || !email || !password || !department || !batch) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      department,
      batch,
      semester,
      studentId
    });

    res.status(201).json({
      message: "Student registered successfully",
      user: toPublicUser(user)
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = cleanText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        message: "Your account has been blocked"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const token = createToken(user);

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name,
      user: toPublicUser(user)
    });
  })
);

router.post(
  "/change-password",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const oldPassword = String(req.body.oldPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters"
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.updateById(user.id, { password: hashedPassword });

    res.json({
      message: "Password changed successfully"
    });
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const email = cleanText(req.body.email).toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.json({
        message: "If this email exists, a password reset OTP has been sent"
      });
    }

    const rawCode = String(Math.floor(100000 + Math.random() * 900000));
    const hashedCode = crypto.createHash("sha256").update(rawCode).digest("hex");

    await User.updateById(user.id, {
      resetPasswordCode: hashedCode,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000)
    });

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Your MU Resource System password reset OTP",
      text: `Your password reset OTP is ${rawCode}. This code will expire in 10 minutes.`,
      html: `
        <h2>Password Reset OTP</h2>
        <p>Use the OTP below to reset your password. This code will expire in 10 minutes.</p>
        <h1 style="letter-spacing: 6px;">${rawCode}</h1>
        <p>If you did not request this, you can safely ignore this email.</p>
      `
    });

    res.json({
      message: "If this email exists, a password reset OTP has been sent",
      previewOtp: emailResult.sent ? undefined : rawCode
    });
  })
);

router.post(
  "/reset-password/:token",
  asyncHandler(async (req, res) => {
    const password = String(req.body.password || "");

    if (!password) {
      return res.status(400).json({
        message: "Password is required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findByResetToken(hashedToken);

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.updateById(user.id, {
      password: hashedPassword,
      resetPasswordToken: "",
      resetPasswordCode: "",
      resetPasswordExpires: null
    });

    res.json({
      message: "Password reset successful"
    });
  })
);

module.exports = router;