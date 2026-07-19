const express = require("express");

const User = require("../models/User");
const Note = require("../models/Note");
const PYQ = require("../models/PYQ");
const Feedback = require("../models/Feedback");
const Announcement = require("../models/Announcement");
const Support = require("../models/Support");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { asyncHandler } = require("../utils/helpers");

const router = express.Router();

router.get(
  "/admin-stats",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const [
      totalStudents,
      totalAdmins,
      totalNotes,
      totalPYQ,
      totalFeedback,
      totalAnnouncements,
      pendingNotes,
      pendingPYQ,
      supportOpen
    ] = await Promise.all([
      User.countByRole("student"),
      User.countByRole("admin"),
      Note.countMany(),
      PYQ.countMany(),
      Feedback.count(),
      Announcement.count(),
      Note.countMany({ status: "pending" }),
      PYQ.countMany({ status: "pending" }),
      Support.countByStatus("open")
    ]);

    res.json({
      totalStudents,
      totalAdmins,
      totalNotes,
      totalPYQ,
      totalFeedback,
      totalAnnouncements,
      pendingNotes,
      pendingPYQ,
      supportOpen
    });
  })
);

router.get(
  "/student-stats",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const [totalNotes, totalPYQ, myNotes, myPYQ, pendingUploads, approvedUploads, unreadAnnouncements] =
      await Promise.all([
        Note.countMany({ status: "approved" }),
        PYQ.countMany({ status: "approved" }),
        Note.countMany({ uploadedBy: req.user.id }),
        PYQ.countMany({ uploadedBy: req.user.id }),
        Promise.all([
          Note.countMany({ uploadedBy: req.user.id, status: "pending" }),
          PYQ.countMany({ uploadedBy: req.user.id, status: "pending" })
        ]).then(([notes, pyq]) => notes + pyq),
        Promise.all([
          Note.countMany({ uploadedBy: req.user.id, status: "approved" }),
          PYQ.countMany({ uploadedBy: req.user.id, status: "approved" })
        ]).then(([notes, pyq]) => notes + pyq),
        Announcement.count()
      ]);

    res.json({
      totalNotes,
      totalPYQ,
      myUploads: myNotes + myPYQ,
      pendingUploads,
      approvedUploads,
      unreadAnnouncements
    });
  })
);

router.get(
  "/recent",
  asyncHandler(async (req, res) => {
    const [recentNotes, recentPYQ, recentAnnouncements, recentUsers, recentSupport] =
      await Promise.all([
        Note.findMany({}, { limit: 5 }),
        PYQ.findMany({}, { limit: 5 }),
        Announcement.findMany({ limit: 5 }),
        User.findRecent(5),
        Support.findRecent(5)
      ]);

    res.json({
      recentNotes,
      recentPYQ,
      recentPyq: recentPYQ,
      recentAnnouncements,
      recentUsers,
      recentSupport
    });
  })
);

module.exports = router;