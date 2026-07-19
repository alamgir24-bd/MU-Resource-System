const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findSafeById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User account not found"
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        message: "Your account has been blocked"
      });
    }

    req.user = {
      id: String(user.id),
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

module.exports = authMiddleware;