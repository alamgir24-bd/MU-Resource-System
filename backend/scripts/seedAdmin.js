const bcrypt = require("bcryptjs");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env")
});

const { pool } = require("../config/db");
const User = require("../models/User");

async function seedAdmin() {
  try {
    console.log("Starting admin seed...");

    const name = process.env.ADMIN_NAME || "System Admin";
    const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "Admin@12345";

    const hashedPassword = await bcrypt.hash(password, 12);

    const existingAdmin = await User.findByEmail(email);

    if (existingAdmin) {
      await User.updateById(existingAdmin.id, {
        name,
        password: hashedPassword,
        role: "admin",
        status: "active"
      });

      console.log("Admin updated successfully");
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);

      await pool.end();
      process.exit(0);
    }

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      status: "active"
    });

    console.log("Admin created successfully");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Seed admin error:", error.message);
    process.exit(1);
  }
}

seedAdmin();