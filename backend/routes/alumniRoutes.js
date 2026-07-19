const express = require("express");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const alumniMiddleware = require("../middleware/alumniMiddleware");
const { asyncHandler, cleanText, toPublicAlumni } = require("../utils/helpers");

const router = express.Router();

/* =========================
   Public: List All Alumni
========================= */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const department = req.query.department ? cleanText(req.query.department) : undefined;

    const alumni = await User.findAlumni({ department });

    res.json(alumni.map(toPublicAlumni));
  })
);

/* =========================
   Alumni: Update Alumni Profile Fields
========================= */
router.put(
  "/profile",
  authMiddleware,
  alumniMiddleware,
  asyncHandler(async (req, res) => {
    const updates = {
      currentCompany: cleanText(req.body.currentCompany || ""),
      designation: cleanText(req.body.designation || ""),
      linkedinProfile: cleanText(req.body.linkedinProfile || "")
    };

    const user = await User.updateById(req.user.id, updates);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Alumni profile updated successfully",
      user: toPublicAlumni(user)
    });
  })
);

module.exports = router;