const express = require("express");
const { asyncHandler } = require("../utils/helpers");

const router = express.Router();

function gradeToPoint(grade) {
  const gradeMap = {
    "A+": 4.0,
    A: 3.75,
    "A-": 3.5,
    "B+": 3.25,
    B: 3.0,
    "B-": 2.75,
    "C+": 2.5,
    C: 2.25,
    D: 2.0,
    F: 0.0
  };

  return gradeMap[String(grade || "").toUpperCase()] ?? Number(grade || 0);
}

router.post(
  "/calculate",
  asyncHandler(async (req, res) => {
    const subjects = req.body.subjects || req.body.courses;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        message: "Subjects data is required"
      });
    }

    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach(subject => {
      const credit = Number(subject.credit || 0);
      const point = gradeToPoint(subject.grade || subject.gradePoint);

      if (credit > 0) {
        totalCredits += credit;
        totalPoints += credit * point;
      }
    });

    if (!totalCredits) {
      return res.status(400).json({
        message: "Total credit must be greater than zero"
      });
    }

    const cgpa = totalPoints / totalCredits;

    res.json({
      cgpa: cgpa.toFixed(2),
      totalCredits: totalCredits.toFixed(2),
      message: "CGPA calculated successfully"
    });
  })
);

router.post(
  "/predict",
  asyncHandler(async (req, res) => {
    const subjects = req.body.subjects || req.body.courses;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        message: "Subjects data is required"
      });
    }

    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach(subject => {
      const point = gradeToPoint(subject.grade || subject.gradePoint);
      const credit = Number(subject.credit || 0);

      totalPoints += point * credit;
      totalCredits += credit;
    });

    const currentCgpa = totalCredits ? totalPoints / totalCredits : 0;

    let predictedCgpa = currentCgpa;

    if (currentCgpa >= 3.75) predictedCgpa += 0.05;
    else if (currentCgpa >= 3.25) predictedCgpa += 0.08;
    else if (currentCgpa >= 2.75) predictedCgpa += 0.1;
    else predictedCgpa += 0.12;

    if (predictedCgpa > 4.0) predictedCgpa = 4.0;

    let performance = "Needs Improvement";

    if (currentCgpa >= 3.75) performance = "Excellent";
    else if (currentCgpa >= 3.25) performance = "Very Good";
    else if (currentCgpa >= 2.75) performance = "Good";
    else if (currentCgpa >= 2.0) performance = "Pass";

    res.json({
      currentCgpa: currentCgpa.toFixed(2),
      predictedCgpa: predictedCgpa.toFixed(2),
      performance,
      message: "CGPA prediction generated successfully"
    });
  })
);

module.exports = router;