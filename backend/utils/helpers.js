const fs = require("fs");
const path = require("path");

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function cleanText(value = "") {
  return String(value).trim();
}


function buildResourceQuery(query) {
  const filter = {};

  if (query.search) filter.search = cleanText(query.search);

  ["department", "semester", "subject", "year", "status"].forEach(field => {
    if (query[field]) filter[field] = cleanText(query[field]);
  });

  return filter;
}

function getPagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 0, 0), 50);
  const skip = limit ? (page - 1) * limit : 0;

  return { page, limit, skip };
}

function getSort(sort = "newest") {
  if (["oldest", "title", "downloads", "newest"].includes(sort)) return sort;
  return "newest";
}

function toUploadPath(file) {
  if (!file) return "";

  const uploadsRoot = path.join(__dirname, "..", "uploads");
  const relativePath = path.relative(uploadsRoot, file.path || "").replace(/\\/g, "/");

  return relativePath && !relativePath.startsWith("..")
    ? `/uploads/${relativePath}`
    : `/uploads/${file.filename}`;
}

function deleteUploadedFile(filePath) {
  if (!filePath) return;

  const cleanPath = String(filePath).replace(/\\/g, "/");
  const uploadIndex = cleanPath.lastIndexOf("/uploads/");
  const relativePath = uploadIndex >= 0
    ? cleanPath.slice(uploadIndex + "/uploads/".length)
    : path.basename(cleanPath);

  const fullPath = path.join(__dirname, "..", "uploads", relativePath);

  fs.unlink(fullPath, error => {
    if (error && error.code !== "ENOENT") {
      console.error("Failed to delete file:", error.message);
    }
  });
}


function toPublicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    batch: user.batch,
    semester: user.semester,
    studentId: user.student_id,
    phone: user.phone,
    address: user.address,
    profileImage: user.profile_image,
    status: user.status,
    createdAt: user.created_at
  };
}


function toPublicAlumni(user) {
  if (!user) return null;

  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    batch: user.batch,
    currentCompany: user.current_company,
    designation: user.designation,
    linkedinProfile: user.linkedin_profile,
    profileImage: user.profile_image,
    role: user.role,
    createdAt: user.created_at
  };
}


function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}


function validateId(paramName = "id") {
  return function (req, res, next) {
    const id = parseId(req.params[paramName]);

    if (id === null) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    req.params[paramName] = id;
    next();
  };
}

module.exports = {
  asyncHandler,
  cleanText,
  buildResourceQuery,
  getPagination,
  getSort,
  toUploadPath,
  deleteUploadedFile,
  toPublicUser,
  toPublicAlumni,
  parseId,
  validateId
};