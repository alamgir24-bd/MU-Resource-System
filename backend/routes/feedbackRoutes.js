const express = require("express");

const Feedback = require("../models/Feedback");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { asyncHandler, cleanText, validateId } = require("../utils/helpers");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const message = cleanText(req.body.message);
    const rating = Number(req.body.rating || 5);

    if (!message) {
      return res.status(400).json({
        message: "Feedback message is required"
      });
    }

    const feedback = await Feedback.create({
      message,
      rating: Math.min(Math.max(rating, 1), 5),
      userId: req.user.id
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback
    });
  })
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const feedback = await Feedback.findAllWithUser();
    res.json(feedback);
  })
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const feedback = await Feedback.deleteById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found"
      });
    }

    res.json({
      message: "Feedback deleted successfully"
    });
  })
);

module.exports = router;