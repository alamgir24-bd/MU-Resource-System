const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const SuccessStory = require("../models/SuccessStory");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { asyncHandler, cleanText, getPagination, validateId } = require("../utils/helpers");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads", "success-stories");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },

  filename(req, file, cb) {
    const safeName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.\-_]/g, "")
      .toLowerCase();

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
    cb(null, uniqueName);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
  const allowedMime = ["image/jpeg", "image/png", "image/webp"];

  if (allowedExt.includes(ext) && allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed"));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024
  }
});

function fileUrl(filename) {
  if (!filename) return "";
  return `/uploads/success-stories/${filename}`;
}

function deleteFile(filePath) {
  if (!filePath) return;

  const filename = path.basename(filePath);
  const fullPath = path.join(uploadDir, filename);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/* =========================
   Admin: Create Success Story
========================= */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "studentImage", maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const name = cleanText(req.body.name);
    const designation = cleanText(req.body.designation);
    const company = cleanText(req.body.company);
    const profileLink = cleanText(req.body.profileLink || "");
    const status = cleanText(req.body.status || "active");
    const sortOrder = Number(req.body.sortOrder || 0);

    if (!name || !designation || !company) {
      return res.status(400).json({
        message: "Name, designation and company are required"
      });
    }

    const story = await SuccessStory.create({
      name,
      designation,
      company,
      profileLink,
      status: ["active", "inactive"].includes(status) ? status : "active",
      sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      companyLogo: req.files?.companyLogo?.[0]
        ? fileUrl(req.files.companyLogo[0].filename)
        : "",
      studentImage: req.files?.studentImage?.[0]
        ? fileUrl(req.files.studentImage[0].filename)
        : ""
    });

    res.status(201).json({
      message: "Success story added successfully",
      story
    });
  })
);

/* =========================
   Public: Get Active Stories
   Home page e eta use hobe
========================= */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);

    const filter = {};

    if (req.query.status) {
      filter.status = cleanText(req.query.status);
    } else {
      filter.status = "active";
    }

    if (!limit) {
      const stories = await SuccessStory.findMany(filter);
      return res.json(stories);
    }

    const [items, total] = await Promise.all([
      SuccessStory.findMany(filter, { limit, offset: skip }),
      SuccessStory.countMany(filter)
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

/* =========================
   Admin: Get All Stories
========================= */
router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const stories = await SuccessStory.findAllAdmin();
    res.json(stories);
  })
);

/* =========================
   Admin: Update Success Story
========================= */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "studentImage", maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const story = await SuccessStory.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Success story not found"
      });
    }

    const name = cleanText(req.body.name);
    const designation = cleanText(req.body.designation);
    const company = cleanText(req.body.company);
    const profileLink = cleanText(req.body.profileLink || "");
    const status = cleanText(req.body.status || "");
    const sortOrder = Number(req.body.sortOrder);

    const updates = {};
    if (name) updates.name = name;
    if (designation) updates.designation = designation;
    if (company) updates.company = company;
    updates.profileLink = profileLink;

    if (["active", "inactive"].includes(status)) {
      updates.status = status;
    }

    if (!Number.isNaN(sortOrder)) {
      updates.sortOrder = sortOrder;
    }

    if (req.files?.companyLogo?.[0]) {
      deleteFile(story.companyLogo);
      updates.companyLogo = fileUrl(req.files.companyLogo[0].filename);
    }

    if (req.files?.studentImage?.[0]) {
      deleteFile(story.studentImage);
      updates.studentImage = fileUrl(req.files.studentImage[0].filename);
    }

    const updatedStory = await SuccessStory.updateById(req.params.id, updates);

    res.json({
      message: "Success story updated successfully",
      story: updatedStory
    });
  })
);

/* =========================
   Admin: Delete Success Story
========================= */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const story = await SuccessStory.deleteById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Success story not found"
      });
    }

    deleteFile(story.companyLogo);
    deleteFile(story.studentImage);

    res.json({
      message: "Success story deleted successfully"
    });
  })
);

module.exports = router;