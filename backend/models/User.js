const { pool } = require("../config/db");


const SAFE_COLUMNS = `
  id, name, email, role, department, batch, semester, student_id,
  phone, address, profile_image, current_company, designation, linkedin_profile,
  status, created_at, updated_at
`;

async function create({
  name,
  email,
  password,
  role = "student",
  department = "",
  batch = "",
  semester = "",
  studentId = "",
  status = "active"
}) {
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password, role, department, batch, semester, student_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, password, role, department, batch, semester, studentId, status]
  );

  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0] || null;
}

async function findSafeById(id) {
  const [rows] = await pool.query(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
}

async function findByResetToken(hashedToken) {
  const [rows] = await pool.query(
    `SELECT * FROM users
     WHERE (reset_password_token = ? OR reset_password_code = ?)
       AND reset_password_expires > NOW()
     LIMIT 1`,
    [hashedToken, hashedToken]
  );

  return rows[0] || null;
}

const FIELD_MAP = {
  name: "name",
  department: "department",
  batch: "batch",
  semester: "semester",
  studentId: "student_id",
  phone: "phone",
  address: "address",
  profileImage: "profile_image",
  currentCompany: "current_company",
  designation: "designation",
  linkedinProfile: "linkedin_profile",
  password: "password",
  status: "status",
  role: "role",
  resetPasswordToken: "reset_password_token",
  resetPasswordCode: "reset_password_code",
  resetPasswordExpires: "reset_password_expires"
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
  await pool.query(`UPDATE users SET ${columns.join(", ")} WHERE id = ?`, values);

  return findById(id);
}

async function deleteById(id) {
  const user = await findById(id);
  if (!user) return null;

  await pool.query("DELETE FROM users WHERE id = ?", [id]);
  return user;
}

async function countByRole(role) {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = ?", [role]);
  return rows[0].total;
}

function buildWhere({ role, search } = {}) {
  const clauses = [];
  const params = [];

  if (role) {
    clauses.push("role = ?");
    params.push(role);
  }

  if (search) {
    clauses.push(`(
      name LIKE ? OR email LIKE ? OR department LIKE ? OR batch LIKE ? OR student_id LIKE ?
    )`);
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params
  };
}

async function findMany(filter = {}, { limit, offset = 0 } = {}) {
  const { where, params } = buildWhere(filter);

  let sql = `SELECT ${SAFE_COLUMNS} FROM users ${where} ORDER BY created_at DESC, id DESC`;
  const finalParams = [...params];

  if (limit) {
    sql += " LIMIT ? OFFSET ?";
    finalParams.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, finalParams);
  return rows;
}

async function countMany(filter = {}) {
  const { where, params } = buildWhere(filter);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
  return rows[0].total;
}

async function findAlumni({ department } = {}) {
  const clauses = ["role = 'alumni'"];
  const params = [];

  if (department) {
    clauses.push("department LIKE ?");
    params.push(`%${department}%`);
  }

  const [rows] = await pool.query(
    `SELECT
       id, name, email, department, batch, current_company, designation,
       linkedin_profile, profile_image, created_at
     FROM users
     WHERE ${clauses.join(" AND ")}
     ORDER BY created_at DESC, id DESC`,
    params
  );

  return rows;
}

async function findRecent(limit = 5) {
  const [rows] = await pool.query(
    `SELECT name, email, role, department, batch, created_at
     FROM users ORDER BY created_at DESC, id DESC LIMIT ?`,
    [Number(limit)]
  );
  return rows;
}

module.exports = {
  create,
  findById,
  findSafeById,
  findByEmail,
  findByResetToken,
  updateById,
  deleteById,
  countByRole,
  findMany,
  countMany,
  findAlumni,
  findRecent
};