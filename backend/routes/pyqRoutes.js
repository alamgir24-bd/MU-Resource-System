const express = require("express");

const PYQ = require("../models/PYQ");
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
    const year = cleanText(req.body.year);

    if (!title || !subject || !department || !semester || !year) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "PDF file is required"
      });
    }

    const pyq = await PYQ.create({
      title,
      subject,
      department,
      semester,
      year,
      filePath: toUploadPath(req.file),
      status: req.user.role === "admin" ? "approved" : "pending",
      uploadedBy: req.user.id
    });

    res.status(201).json({
      message: req.user.role === "admin"
        ? "PYQ uploaded successfully"
        : "PYQ submitted for admin approval",
      pyq
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
      const pyqs = await PYQ.findMany(filter, { sort });
      return res.json(pyqs);
    }

    const [items, total] = await Promise.all([
      PYQ.findMany(filter, { sort, limit, offset: skip }),
      PYQ.countMany(filter)
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
    const pyq = await PYQ.findById(req.params.id);

    if (!pyq) {
      return res.status(404).json({
        message: "PYQ not found"
      });
    }

    res.json(pyq);
  })
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const pyq = await PYQ.findById(req.params.id);

    if (!pyq) {
      return res.status(404).json({
        message: "PYQ not found"
      });
    }

    const updates = {};

    ["title", "subject", "department", "semester", "year"].forEach(field => {
      if (req.body[field]) updates[field] = cleanText(req.body[field]);
    });

    if (req.file) {
      deleteUploadedFile(pyq.filePath);
      updates.filePath = toUploadPath(req.file);
    }

    const updatedPyq = await PYQ.updateById(req.params.id, updates);

    res.json({
      message: "PYQ updated successfully",
      pyq: updatedPyq
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

    const pyq = await PYQ.updateById(req.params.id, { status });

    if (!pyq) {
      return res.status(404).json({
        message: "PYQ not found"
      });
    }

    res.json({
      message: `PYQ ${status} successfully`,
      pyq
    });
  })
);

router.patch(
  "/:id/download",
  validateId(),
  asyncHandler(async (req, res) => {
    const pyq = await PYQ.incrementDownload(req.params.id);

    if (!pyq) {
      return res.status(404).json({
        message: "PYQ not found"
      });
    }

    res.json({
      message: "Download count updated",
      downloadCount: pyq.downloadCount
    });
  })
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const pyq = await PYQ.deleteById(req.params.id);

    if (!pyq) {
      return res.status(404).json({
        message: "PYQ not found"
      });
    }

    deleteUploadedFile(pyq.filePath);

    res.json({
      message: "PYQ deleted successfully"
    });
  })
);

module.exports = router;