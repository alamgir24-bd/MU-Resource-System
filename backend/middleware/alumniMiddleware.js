function alumniMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "alumni") {
    return res.status(403).json({
      message: "Access denied. Alumni only."
    });
  }
  next();
}

module.exports = alumniMiddleware;