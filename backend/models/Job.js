const { pool } = require("../config/db");

function mapJob(row) {
  if (!row) return null;

  const postedBy = row.poster_name !== undefined
    ? {
        id: row.posted_by,
        _id: row.posted_by,
        name: row.poster_name,
        email: row.poster_email,
        department: row.poster_department,
        currentCompany: row.poster_current_company,
        designation: row.poster_designation,
        linkedinProfile: row.poster_linkedin_profile,
        profileImage: row.poster_profile_image
      }
    : row.posted_by;

  return {
    id: row.id,
    _id: row.id,
    title: row.title,
    company: row.company,
    description: row.description,
    jobType: row.job_type,
    location: row.location,
    applyLink: row.apply_link,
    deadline: row.deadline,
    status: row.status,
    postedBy,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function create({
  title,
  company,
  description,
  jobType = "full-time",
  location = "",
  applyLink = "",
  deadline = null,
  postedBy
}) {
  const [result] = await pool.query(
    `INSERT INTO jobs (title, company, description, job_type, location, apply_link, deadline, posted_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, company, description, jobType, location, applyLink, deadline, postedBy]
  );

  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [id]);
  return mapJob(rows[0]);
}

const FIELD_MAP = {
  title: "title",
  company: "company",
  description: "description",
  jobType: "job_type",
  location: "location",
  applyLink: "apply_link",
  deadline: "deadline",
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
  await pool.query(`UPDATE jobs SET ${columns.join(", ")} WHERE id = ?`, values);

  return findById(id);
}

async function deleteById(id) {
  const job = await findById(id);
  if (!job) return null;

  await pool.query("DELETE FROM jobs WHERE id = ?", [id]);
  return job;
}

const JOIN_SELECT = `
  SELECT
    j.*,
    u.name AS poster_name,
    u.email AS poster_email,
    u.department AS poster_department,
    u.current_company AS poster_current_company,
    u.designation AS poster_designation,
    u.linkedin_profile AS poster_linkedin_profile,
    u.profile_image AS poster_profile_image
  FROM jobs j
  LEFT JOIN users u ON u.id = j.posted_by
`;

async function findMany(filter = {}, { limit, offset = 0 } = {}) {
  const clauses = [];
  const params = [];

  if (filter.status) {
    clauses.push("j.status = ?");
    params.push(filter.status);
  }

  if (filter.jobType) {
    clauses.push("j.job_type = ?");
    params.push(filter.jobType);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  let sql = `${JOIN_SELECT} ${where} ORDER BY j.created_at DESC, j.id DESC`;
  const finalParams = [...params];

  if (limit) {
    sql += " LIMIT ? OFFSET ?";
    finalParams.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, finalParams);
  return rows.map(mapJob);
}

async function countMany(filter = {}) {
  const clauses = [];
  const params = [];

  if (filter.status) {
    clauses.push("status = ?");
    params.push(filter.status);
  }

  if (filter.jobType) {
    clauses.push("job_type = ?");
    params.push(filter.jobType);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM jobs ${where}`, params);
  return rows[0].total;
}

async function findByPoster(postedBy) {
  const [rows] = await pool.query(
    "SELECT * FROM jobs WHERE posted_by = ? ORDER BY created_at DESC, id DESC",
    [postedBy]
  );
  return rows.map(mapJob);
}

module.exports = {
  create,
  findById,
  updateById,
  deleteById,
  findMany,
  countMany,
  findByPoster
};