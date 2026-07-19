function errorMiddleware(error, req, res, next) {
  console.error("ERROR:", error);

  if (error.code === "ER_DUP_ENTRY") {
    return res.status(400).json({
      message: "Duplicate value already exists"
    });
  }

  if (error.code === "ER_NO_REFERENCED_ROW" || error.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      message: "Referenced record does not exist"
    });
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File is too large"
    });
  }

  if (error.message && (error.message.includes("Only PDF") || error.message.includes("Only JPG"))) {
    return res.status(400).json({
      message: error.message
    });
  }

  res.status(error.statusCode || 500).json({
    message: error.message || "Server error"
  });
}

module.exports = errorMiddleware;