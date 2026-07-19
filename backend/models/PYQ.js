const { pool } = require("../config/db");

function mapPYQ(row) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,
    title: row.title,
    subject: row.subject,
    department: row.department,
    semester: row.semester,
    year: row.year,
    filePath: row.file_path,
    status: row.status,
    downloadCount: row.download_count,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function create({ title, subject, department, semester, year, filePath, status = "approved", uploadedBy }) {
  const [result] = await pool.query(
    `INSERT INTO pyqs (title, subject, department, semester, year, file_path, status, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, subject, department, semester, year, filePath, status, uploadedBy || null]
  );

  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM pyqs WHERE id = ?", [id]);
  return mapPYQ(rows[0]);
}

const FIELD_MAP = {
  title: "title",
  subject: "subject",
  department: "department",
  semester: "semester",
  year: "year",
  filePath: "file_path",
  status: "status"
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
  await pool.query(`UPDATE pyqs SET ${columns.join(", ")} WHERE id = ?`, values);

  return findById(id);
}

async function incrementDownload(id) {
  await pool.query("UPDATE pyqs SET download_count = download_count + 1 WHERE id = ?", [id]);
  return findById(id);
}

async function deleteById(id) {
  const pyq = await findById(id);
  if (!pyq) return null;

  await pool.query("DELETE FROM pyqs WHERE id = ?", [id]);
  return pyq;
}

function buildWhere(filter = {}) {
  const clauses = [];
  const params = [];

  if (filter.status) {
    clauses.push("status = ?");
    params.push(filter.status);
  }

  if (filter.uploadedBy) {
    clauses.push("uploaded_by = ?");
    params.push(filter.uploadedBy);
  }

  if (filter.department) {
    clauses.push("department LIKE ?");
    params.push(`%${filter.department}%`);
  }

  if (filter.semester) {
    clauses.push("semester LIKE ?");
    params.push(`%${filter.semester}%`);
  }

  if (filter.subject) {
    clauses.push("subject LIKE ?");
    params.push(`%${filter.subject}%`);
  }

  if (filter.year) {
    clauses.push("year LIKE ?");
    params.push(`%${filter.year}%`);
  }

  if (filter.search) {
    clauses.push("(title LIKE ? OR subject LIKE ? OR department LIKE ? OR semester LIKE ? OR year LIKE ?)");
    const term = `%${filter.search}%`;
    params.push(term, term, term, term, term);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params
  };
}

function buildOrderBy(sort = "newest") {
  if (sort === "oldest") return "ORDER BY created_at ASC, id ASC";
  if (sort === "title") return "ORDER BY title ASC, id ASC";
  if (sort === "downloads") return "ORDER BY download_count DESC, id DESC";
  if (sort === "updatedDesc") return "ORDER BY updated_at DESC, id DESC";
  return "ORDER BY created_at DESC, id DESC";
}

async function findMany(filter = {}, { sort = "newest", limit, offset = 0 } = {}) {
  const { where, params } = buildWhere(filter);
  const orderBy = buildOrderBy(sort);

  let sql = `SELECT * FROM pyqs ${where} ${orderBy}`;
  const finalParams = [...params];

  if (limit) {
    sql += " LIMIT ? OFFSET ?";
    finalParams.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, finalParams);
  return rows.map(mapPYQ);
}

async function countMany(filter = {}) {
  const { where, params } = buildWhere(filter);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM pyqs ${where}`, params);
  return rows[0].total;
}

module.exports = {
  create,
  findById,
  updateById,
  incrementDownload,
  deleteById,
  findMany,
  countMany
};