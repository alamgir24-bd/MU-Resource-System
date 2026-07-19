const { pool } = require("../config/db");

function mapBookmark(row) {
  if (!row) return null;

  return {
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    createdAt: row.created_at
  };
}

async function addOne({ userId, resourceType, resourceId }) {
  
  await pool.query(
    "INSERT IGNORE INTO bookmarks (user_id, resource_type, resource_id) VALUES (?, ?, ?)",
    [userId, resourceType, resourceId]
  );

  return findByUser(userId);
}

async function removeOne({ userId, resourceType, resourceId }) {
  await pool.query(
    "DELETE FROM bookmarks WHERE user_id = ? AND resource_type = ? AND resource_id = ?",
    [userId, resourceType, resourceId]
  );

  return findByUser(userId);
}

async function findByUser(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC, id DESC",
    [userId]
  );

  return rows.map(mapBookmark);
}

module.exports = {
  addOne,
  removeOne,
  findByUser
};