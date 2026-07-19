const { pool } = require("../config/db");

function mapMessage(row) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,
    sender: row.sender_name !== undefined
      ? { id: row.sender_id, _id: row.sender_id, name: row.sender_name, profileImage: row.sender_profile_image, role: row.sender_role }
      : row.sender_id,
    recipient: row.recipient_name !== undefined
      ? { id: row.recipient_id, _id: row.recipient_id, name: row.recipient_name, profileImage: row.recipient_profile_image, role: row.recipient_role }
      : row.recipient_id,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function create({ sender, recipient, body }) {
  const [result] = await pool.query(
    "INSERT INTO messages (sender_id, recipient_id, body) VALUES (?, ?, ?)",
    [sender, recipient, body]
  );

  const [rows] = await pool.query("SELECT * FROM messages WHERE id = ?", [result.insertId]);
  return mapMessage(rows[0]);
}

async function findConversation(userA, userB) {
  const [rows] = await pool.query(
    `SELECT * FROM messages
     WHERE (sender_id = ? AND recipient_id = ?)
        OR (sender_id = ? AND recipient_id = ?)
     ORDER BY created_at ASC, id ASC`,
    [userA, userB, userB, userA]
  );

  return rows.map(mapMessage);
}

async function markConversationRead(fromUserId, toUserId) {
  await pool.query(
    "UPDATE messages SET read_at = NOW() WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL",
    [fromUserId, toUserId]
  );
}

const JOIN_SELECT = `
  SELECT
    m.*,
    su.name AS sender_name, su.profile_image AS sender_profile_image, su.role AS sender_role,
    ru.name AS recipient_name, ru.profile_image AS recipient_profile_image, ru.role AS recipient_role
  FROM messages m
  LEFT JOIN users su ON su.id = m.sender_id
  LEFT JOIN users ru ON ru.id = m.recipient_id
`;

async function findAllForUser(userId) {
  const [rows] = await pool.query(
    `${JOIN_SELECT} WHERE m.sender_id = ? OR m.recipient_id = ? ORDER BY m.created_at DESC, m.id DESC`,
    [userId, userId]
  );

  return rows.map(mapMessage);
}

module.exports = {
  create,
  findConversation,
  markConversationRead,
  findAllForUser
};