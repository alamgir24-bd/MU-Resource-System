const express = require("express");

const SemesterRecord = require("../models/SemesterRecord");
const authMiddleware = require("../middleware/authMiddleware");
const { asyncHandler, cleanText, validateId } = require("../utils/helpers");

const router = express.Router();

/* Get all semesters for logged-in student */
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const records = await SemesterRecord.findByStudent(req.user.id);
    res.json(records);
  })
);

/* Save a new semester */
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const label = cleanText(req.body.label);
    const gpa = parseFloat(req.body.gpa);
    const credits = parseInt(req.body.credits, 10);
    const courses = Array.isArray(req.body.courses) ? req.body.courses : [];

    if (!label || Number.isNaN(gpa) || Number.isNaN(credits)) {
      return res.status(400).json({
        message: "Label, GPA and credits are required"
      });
    }

    const record = await SemesterRecord.create({
      student: req.user.id,
      label,
      gpa,
      credits,
      courses
    });

    res.status(201).json({
      message: "Semester saved successfully",
      record
    });
  })
);

/* Update semester label */
router.put(
  "/:id",
  authMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const record = await SemesterRecord.findOwnedById(req.params.id, req.user.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    const label = cleanText(req.body.label);
    const updatedRecord = label
      ? await SemesterRecord.updateLabel(req.params.id, label)
      : record;

    res.json({
      message: "Semester updated successfully",
      record: updatedRecord
    });
  })
);

/* Delete a semester */
router.delete(
  "/:id",
  authMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const record = await SemesterRecord.findOwnedById(req.params.id, req.user.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    await SemesterRecord.deleteById(req.params.id);

    res.json({ message: "Semester deleted successfully" });
  })
);

module.exports = router;