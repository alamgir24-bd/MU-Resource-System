const { pool } = require("../config/db");

function mapAnnouncement(row) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function create({ title, description, priority = "normal", createdBy }) {
  const [result] = await pool.query(
    `INSERT INTO announcements (title, description, priority, created_by)
     VALUES (?, ?, ?, ?)`,
    [title, description, priority, createdBy || null]
  );

  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM announcements WHERE id = ?", [id]);
  return mapAnnouncement(rows[0]);
}

const FIELD_MAP = {
  title: "title",
  description: "description",
  priority: "priority"
};

async function updateById(id, fields = {}) {
  const columns = [];
  const values = [];

  Object.keys(fields).forEach(key => {
    const column = FIELD_MAP[key];
    if (column && fields[key] !== undefined) {
      columns.push(`${column} = ?`);
      values.push(fields[key]);
    }
  });

  if (!columns.length) return findById(id);

  values.push(id);
  await pool.query(`UPDATE announcements SET ${columns.join(", ")} WHERE id = ?`, values);

  return findById(id);
}

async function deleteById(id) {
  const announcement = await findById(id);
  if (!announcement) return null;

  await pool.query("DELETE FROM announcements WHERE id = ?", [id]);
  return announcement;
}

async function findMany({ limit, offset = 0 } = {}) {
  let sql = "SELECT * FROM announcements ORDER BY created_at DESC, id DESC";
  const params = [];

  if (limit) {
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, params);
  return rows.map(mapAnnouncement);
}

async function count() {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM announcements");
  return rows[0].total;
}

module.exports = {
  create,
  findById,
  updateById,
  deleteById,
  findMany,
  count
};