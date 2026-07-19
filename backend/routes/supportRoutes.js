const express = require("express");

const Support = require("../models/Support");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { asyncHandler, cleanText, validateId } = require("../utils/helpers");

const router = express.Router();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const name = cleanText(req.body.name);
    const email = cleanText(req.body.email).toLowerCase();
    const type = cleanText(req.body.type);
    const message = cleanText(req.body.message);

    if (!name || !email || !type || !message) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const support = await Support.create({
      name,
      email,
      type,
      message,
      userId: req.user?.id
    });

    res.status(201).json({
      message: "Support request submitted successfully",
      support
    });
  })
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const support = await Support.findAllWithUser();
    res.json(support);
  })
);

router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!["open", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({
        message: "Invalid support status"
      });
    }

    const support = await Support.updateStatusById(req.params.id, status);

    if (!support) {
      return res.status(404).json({
        message: "Support request not found"
      });
    }

    res.json({
      message: "Support status updated successfully",
      support
    });
  })
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const support = await Support.deleteById(req.params.id);

    if (!support) {
      return res.status(404).json({
        message: "Support request not found"
      });
    }

    res.json({
      message: "Support request deleted successfully"
    });
  })
);

module.exports = router;