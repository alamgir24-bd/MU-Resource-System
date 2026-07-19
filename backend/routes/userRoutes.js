const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Note = require("../models/Note");
const PYQ = require("../models/PYQ");
const Announcement = require("../models/Announcement");
const Bookmark = require("../models/Bookmark");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const profileUpload = require("../middleware/profileUpload");
const {
  asyncHandler,
  cleanText,
  getPagination,
  deleteUploadedFile,
  toUploadPath,
  toPublicUser,
  validateId
} = require("../utils/helpers");

const router = express.Router();

router.get(
  "/profile",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await User.findSafeById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(toPublicUser(user));
  })
);

router.put(
  "/profile",
  authMiddleware,
  profileUpload.single("profileImage"),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const fields = ["name", "department", "batch", "semester", "studentId", "phone", "address"];
    const updates = {};

    fields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = cleanText(req.body[field]);
      }
    });

    if (Object.prototype.hasOwnProperty.call(updates, "name") && !updates.name) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (req.file) {
      if (user.profile_image) deleteUploadedFile(user.profile_image);
      updates.profileImage = toUploadPath(req.file);
    }

    const updatedUser = await User.updateById(user.id, updates);

    res.json({
      message: "Profile updated successfully",
      user: toPublicUser(updatedUser)
    });
  })
);

router.get(
  "/my-uploads",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const [notes, pyq] = await Promise.all([
      Note.findMany({ uploadedBy: req.user.id }, { sort: "newest" }),
      PYQ.findMany({ uploadedBy: req.user.id }, { sort: "newest" })
    ]);

    res.json({ notes, pyq });
  })
);

router.get(
  "/notifications",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const [announcements, recentNotes, recentPYQ] = await Promise.all([
      Announcement.findMany({ limit: 5 }),
      Note.findMany({ uploadedBy: req.user.id }, { sort: "updatedDesc", limit: 5 }),
      PYQ.findMany({ uploadedBy: req.user.id }, { sort: "updatedDesc", limit: 5 })
    ]);

    const uploadNotifications = [
      ...recentNotes.map(item => ({
        type: "note",
        title: item.title,
        message: `Your note is ${item.status}`,
        status: item.status,
        createdAt: item.updatedAt || item.createdAt
      })),
      ...recentPYQ.map(item => ({
        type: "pyq",
        title: item.title,
        message: `Your PYQ is ${item.status}`,
        status: item.status,
        createdAt: item.updatedAt || item.createdAt
      }))
    ];

    const noticeNotifications = announcements.map(item => ({
      type: "announcement",
      title: item.title,
      message: item.message || item.description || "New announcement published",
      status: "info",
      createdAt: item.createdAt
    }));

    res.json(
      [...uploadNotifications, ...noticeNotifications]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 10)
    );
  })
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const filter = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.search) {
      filter.search = req.query.search;
    }

    const { page, limit, skip } = getPagination(req.query);

    if (!limit) {
      const users = await User.findMany(filter);
      return res.json(users.map(toPublicUser));
    }

    const [items, total] = await Promise.all([
      User.findMany(filter, { limit, offset: skip }),
      User.countMany(filter)
    ]);

    res.json({
      items: items.map(toPublicUser),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  })
);

router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const name = cleanText(req.body.name);
    const email = cleanText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const exists = await User.findByEmail(email);

    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: "admin"
    });

    res.status(201).json({
      message: "Admin created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  })
);

router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid user status" });
    }

    if (String(req.params.id) === String(req.user.id) && status === "blocked") {
      return res.status(400).json({ message: "You cannot block your own account" });
    }

    const user = await User.updateById(req.params.id, { status });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `User ${status} successfully`, user: toPublicUser(user) });
  })
);

router.patch(
  "/:id/role",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const { role } = req.body;

    // Admin accounts are only created via POST /users/admin — this endpoint
    // is just for toggling a user between student and alumni.
    if (!["student", "alumni"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.updateById(req.params.id, { role });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `User role changed to ${role}`, user: toPublicUser(user) });
  })
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.deleteById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  })
);

router.post(
  "/bookmarks",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { resourceType, resourceId } = req.body;
    const parsedResourceId = Number(resourceId);

    if (!["notes", "pyq"].includes(resourceType) || !Number.isInteger(parsedResourceId)) {
      return res.status(400).json({ message: "Valid resource type and resource ID are required" });
    }

    const Model = resourceType === "notes" ? Note : PYQ;
    const resource = await Model.findById(parsedResourceId);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const bookmarks = await Bookmark.addOne({
      userId: req.user.id,
      resourceType,
      resourceId: parsedResourceId
    });

    res.json({ message: "Bookmark saved successfully", bookmarks });
  })
);

router.delete(
  "/bookmarks/:resourceType/:resourceId",
  authMiddleware,
  validateId("resourceId"),
  asyncHandler(async (req, res) => {
    const { resourceType, resourceId } = req.params;

    if (!["notes", "pyq"].includes(resourceType)) {
      return res.status(400).json({ message: "Invalid resource type" });
    }

    const bookmarks = await Bookmark.removeOne({
      userId: req.user.id,
      resourceType,
      resourceId
    });

    res.json({ message: "Bookmark removed successfully", bookmarks });
  })
);

module.exports = router;