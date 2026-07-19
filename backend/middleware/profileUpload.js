const multer = require("multer");
const path = require("path");
const fs = require("fs");

const profileDir = path.join(__dirname, "..", "uploads", "profiles");

if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, profileDir);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase()
      .slice(0, 50);

    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
  const allowedMime = ["image/jpeg", "image/png", "image/webp"];

  if (allowedExt.includes(ext) && allowedMime.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error("Only JPG, PNG or WEBP profile images are allowed"));
}

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});