const { pool } = require("../config/db");

function mapFeedback(row) {
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
    message: row.message,
    rating: row.rating,
    userId,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function create({ message, rating, userId }) {
  const [result] = await pool.query(
    "INSERT INTO feedbacks (message, rating, user_id) VALUES (?, ?, ?)",
    [message, rating, userId || null]
  );

  const [rows] = await pool.query("SELECT * FROM feedbacks WHERE id = ?", [result.insertId]);
  return mapFeedback(rows[0]);
}

async function findAllWithUser() {
  const [rows] = await pool.query(
    `SELECT
       f.*,
       u.name AS user_name,
       u.email AS user_email,
       u.department AS user_department,
       u.batch AS user_batch
     FROM feedbacks f
     LEFT JOIN users u ON u.id = f.user_id
     ORDER BY f.created_at DESC, f.id DESC`
  );

  return rows.map(mapFeedback);
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM feedbacks WHERE id = ?", [id]);
  return mapFeedback(rows[0]);
}

async function deleteById(id) {
  const feedback = await findById(id);
  if (!feedback) return null;

  await pool.query("DELETE FROM feedbacks WHERE id = ?", [id]);
  return feedback;
}

async function count() {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM feedbacks");
  return rows[0].total;
}

module.exports = {
  create,
  findAllWithUser,
  findById,
  deleteById,
  count
};