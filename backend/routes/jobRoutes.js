const express = require("express");

const Job = require("../models/Job");
const authMiddleware = require("../middleware/authMiddleware");
const alumniMiddleware = require("../middleware/alumniMiddleware");
const { asyncHandler, cleanText, getPagination, validateId } = require("../utils/helpers");

const router = express.Router();

const ALLOWED_TYPES = ["full-time", "part-time", "internship", "remote", "contract"];

/* =========================
   Alumni: Post a New Job
========================= */
router.post(
  "/",
  authMiddleware,
  alumniMiddleware,
  asyncHandler(async (req, res) => {
    const title = cleanText(req.body.title);
    const company = cleanText(req.body.company);
    const description = cleanText(req.body.description);
    const jobType = cleanText(req.body.jobType || "full-time");
    const location = cleanText(req.body.location || "");
    const applyLink = cleanText(req.body.applyLink || "");
    const deadline = req.body.deadline ? new Date(req.body.deadline) : null;

    if (!title || !company || !description) {
      return res.status(400).json({
        message: "Title, company and description are required"
      });
    }

    const job = await Job.create({
      title,
      company,
      description,
      jobType: ALLOWED_TYPES.includes(jobType) ? jobType : "full-time",
      location,
      applyLink,
      deadline,
      postedBy: req.user.id
    });

    res.status(201).json({
      message: "Job posted successfully",
      job
    });
  })
);

/* =========================
   Public: Get All Open Jobs
========================= */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);

    const filter = { status: "open" };

    if (req.query.jobType) {
      filter.jobType = cleanText(req.query.jobType);
    }

    if (!limit) {
      const jobs = await Job.findMany(filter);
      return res.json(jobs);
    }

    const [items, total] = await Promise.all([
      Job.findMany(filter, { limit, offset: skip }),
      Job.countMany(filter)
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
   Alumni: Get My Posted Jobs
========================= */
router.get(
  "/my-jobs",
  authMiddleware,
  alumniMiddleware,
  asyncHandler(async (req, res) => {
    const jobs = await Job.findByPoster(req.user.id);
    res.json(jobs);
  })
);

/* =========================
   Alumni / Admin: Update a Job
========================= */
router.put(
  "/:id",
  authMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const posterId = job.postedBy && job.postedBy.id !== undefined ? job.postedBy.id : job.postedBy;
    const isOwner = String(posterId) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to update this job"
      });
    }

    const title = cleanText(req.body.title);
    const company = cleanText(req.body.company);
    const description = cleanText(req.body.description);
    const jobType = cleanText(req.body.jobType || "");
    const location = cleanText(req.body.location || "");
    const applyLink = cleanText(req.body.applyLink || "");
    const status = cleanText(req.body.status || "");

    const updates = {};
    if (title) updates.title = title;
    if (company) updates.company = company;
    if (description) updates.description = description;
    if (ALLOWED_TYPES.includes(jobType)) updates.jobType = jobType;
    updates.location = location;
    updates.applyLink = applyLink;
    if (req.body.deadline) updates.deadline = new Date(req.body.deadline);
    if (["open", "closed"].includes(status)) updates.status = status;

    const updatedJob = await Job.updateById(req.params.id, updates);

    res.json({
      message: "Job updated successfully",
      job: updatedJob
    });
  })
);

/* =========================
   Alumni / Admin: Delete a Job
========================= */
router.delete(
  "/:id",
  authMiddleware,
  validateId(),
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const posterId = job.postedBy && job.postedBy.id !== undefined ? job.postedBy.id : job.postedBy;
    const isOwner = String(posterId) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to delete this job"
      });
    }

    await Job.deleteById(req.params.id);

    res.json({ message: "Job deleted successfully" });
  })
);

module.exports = router;