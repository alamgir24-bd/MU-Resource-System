const express = require("express");

const Announcement = require("../models/Announcement");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { asyncHandler, cleanText, getPagination, validateId } = require("../utils/helpers");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const title = cleanText(req.body.title);
    const description = cleanText(req.body.description || req.body.message);
    const priority = cleanText(req.body.priority || "normal");

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required"
      });
    }

    const announcement = await Announcement.create({
      title,
      description,
      priority: ["normal", "important", "urgent"].includes(priority) ? priority : "normal",
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Announcement added successfully",
      announcement
    });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);

    if (!limit) {
      const announcements = await Announcement.findMany();
      return res.json(announcements);
    }

    const [items, total] = await Promise.all([
      Announcement.findMany({ limit, offset: skip }),
      Announcement.count()
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  })
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const title = cleanText(req.body.title);
    const description = cleanText(req.body.description || req.body.message);
    const priority = cleanText(req.body.priority || "normal");

    const existing = await Announcement.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (["normal", "important", "urgent"].includes(priority)) {
      updates.priority = priority;
    }

    const announcement = await Announcement.updateById(req.params.id, updates);

    res.json({
      message: "Announcement updated successfully",
      announcement
    });
  })
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.deleteById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    res.json({
      message: "Announcement deleted successfully"
    });
  })
);

module.exports = router;