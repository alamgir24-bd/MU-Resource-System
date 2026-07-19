const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "university_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false
});

async function connectDB() {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected successfully");
    connection.release();
  } catch (error) {
    console.error("MySQL connection error:", error.message);
    process.exit(1);
  }
}

module.exports = { connectDB, pool };