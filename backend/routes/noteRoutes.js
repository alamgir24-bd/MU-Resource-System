const express = require("express");

const Note = require("../models/Note");
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  asyncHandler,
  cleanText,
  buildResourceQuery,
  getPagination,
  getSort,
  toUploadPath,
  deleteUploadedFile,
  validateId
} = require("../utils/helpers");

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const title = cleanText(req.body.title);
    const subject = cleanText(req.body.subject);
    const department = cleanText(req.body.department);
    const semester = cleanText(req.body.semester);

    if (!title || !subject || !department || !semester) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "PDF file is required"
      });
    }

    const note = await Note.create({
      title,
      subject,
      department,
      semester,
      filePath: toUploadPath(req.file),
      status: req.user.role === "admin" ? "approved" : "pending",
      uploadedBy: req.user.id
    });

    res.status(201).json({
      message: req.user.role === "admin"
        ? "Note uploaded successfully"
        : "Note submitted for admin approval",
      note
    });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = buildResourceQuery(req.query);

    if (req.query.status === "all") {
      delete filter.status;
    } else if (!req.query.status) {
      filter.status = "approved";
    }

    const { page, limit, skip } = getPagination(req.query);
    const sort = getSort(req.query.sort);

    if (!limit) {
      const notes = await Note.findMany(filter, { sort });
      return res.json(notes);
    }

    const [items, total] = await Promise.all([
      Note.findMany(filter, { sort, limit, offset: skip }),
      Note.countMany(filter)
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

router.get(
  "/:id",
  validateId(),
  asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.json(note);
  })
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    const title = cleanText(req.body.title);
    const subject = cleanText(req.body.subject);
    const department = cleanText(req.body.department);
    const semester = cleanText(req.body.semester);

    const updates = {};
    if (title) updates.title = title;
    if (subject) updates.subject = subject;
    if (department) updates.department = department;
    if (semester) updates.semester = semester;

    if (req.file) {
      deleteUploadedFile(note.filePath);
      updates.filePath = toUploadPath(req.file);
    }

    const updatedNote = await Note.updateById(req.params.id, updates);

    res.json({
      message: "Note updated successfully",
      note: updatedNote
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

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    const note = await Note.updateById(req.params.id, { status });

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.json({
      message: `Note ${status} successfully`,
      note
    });
  })
);

router.patch(
  "/:id/download",
  validateId(),
  asyncHandler(async (req, res) => {
    const note = await Note.incrementDownload(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.json({
      message: "Download count updated",
      downloadCount: note.downloadCount
    });
  })
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const note = await Note.deleteById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    deleteUploadedFile(note.filePath);

    res.json({
      message: "Note deleted successfully"
    });
  })
);

module.exports = router;