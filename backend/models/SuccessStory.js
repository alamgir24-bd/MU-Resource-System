const { pool } = require("../config/db");

function mapStory(row) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    designation: row.designation,
    company: row.company,
    companyLogo: row.company_logo,
    studentImage: row.student_image,
    profileLink: row.profile_link,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function create({
  name,
  designation,
  company,
  companyLogo = "",
  studentImage = "",
  profileLink = "",
  status = "active",
  sortOrder = 0
}) {
  const [result] = await pool.query(
    `INSERT INTO success_stories
       (name, designation, company, company_logo, student_image, profile_link, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, designation, company, companyLogo, studentImage, profileLink, status, sortOrder]
  );

  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM success_stories WHERE id = ?", [id]);
  return mapStory(rows[0]);
}

const FIELD_MAP = {
  name: "name",
  designation: "designation",
  company: "company",
  companyLogo: "company_logo",
  studentImage: "student_image",
  profileLink: "profile_link",
  status: "status",
  sortOrder: "sort_order"
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
  await pool.query(`UPDATE success_stories SET ${columns.join(", ")} WHERE id = ?`, values);

  return findById(id);
}

async function deleteById(id) {
  const story = await findById(id);
  if (!story) return null;

  await pool.query("DELETE FROM success_stories WHERE id = ?", [id]);
  return story;
}

function buildWhere(filter = {}) {
  const clauses = [];
  const params = [];

  if (filter.status) {
    clauses.push("status = ?");
    params.push(filter.status);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params
  };
}

async function findMany(filter = {}, { limit, offset = 0 } = {}) {
  const { where, params } = buildWhere(filter);

  let sql = `SELECT * FROM success_stories ${where} ORDER BY sort_order ASC, created_at DESC, id DESC`;
  const finalParams = [...params];

  if (limit) {
    sql += " LIMIT ? OFFSET ?";
    finalParams.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, finalParams);
  return rows.map(mapStory);
}

async function countMany(filter = {}) {
  const { where, params } = buildWhere(filter);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM success_stories ${where}`, params);
  return rows[0].total;
}

async function findAllAdmin() {
  const [rows] = await pool.query(
    "SELECT * FROM success_stories ORDER BY sort_order ASC, created_at DESC, id DESC"
  );
  return rows.map(mapStory);
}

module.exports = {
  create,
  findById,
  updateById,
  deleteById,
  findMany,
  countMany,
  findAllAdmin
};