const { pool } = require("../config/db");

function mapSupport(row) {
  if (!row) return null;

  const userId = row.user_id
    ? row.user_name !== undefined
      ? {
          id: row.user_id,
          _id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          department: row.user_department,
          batch: row.user_batch
        }
      : row.user_id
    : null;

  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    email: row.email,
    type: row.type,
    message: row.message,
    status: row.status,
    userId,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function create({ name, email, type, message, userId }) {
  const [result] = await pool.query(
    "INSERT INTO supports (name, email, type, message, user_id) VALUES (?, ?, ?, ?, ?)",
    [name, email, type, message, userId || null]
  );

  const [rows] = await pool.query("SELECT * FROM supports WHERE id = ?", [result.insertId]);
  return mapSupport(rows[0]);
}

async function findAllWithUser() {
  const [rows] = await pool.query(
    `SELECT
       s.*,
       u.name AS user_name,
       u.email AS user_email,
       u.department AS user_department,
       u.batch AS user_batch
     FROM supports s
     LEFT JOIN users u ON u.id = s.user_id
     ORDER BY s.created_at DESC, s.id DESC`
  );

  return rows.map(mapSupport);
}

async function findRecent(limit = 5) {
  const [rows] = await pool.query(
    "SELECT * FROM supports ORDER BY created_at DESC, id DESC LIMIT ?",
    [Number(limit)]
  );
  return rows.map(mapSupport);
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM supports WHERE id = ?", [id]);
  return mapSupport(rows[0]);
}

async function updateStatusById(id, status) {
  await pool.query("UPDATE supports SET status = ? WHERE id = ?", [status, id]);
  return findById(id);
}

async function deleteById(id) {
  const support = await findById(id);
  if (!support) return null;

  await pool.query("DELETE FROM supports WHERE id = ?", [id]);
  return support;
}

async function countByStatus(status) {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM supports WHERE status = ?", [status]);
  return rows[0].total;
}

module.exports = {
  create,
  findAllWithUser,
  findRecent,
  findById,
  updateStatusById,
  deleteById,
  countByStatus
};