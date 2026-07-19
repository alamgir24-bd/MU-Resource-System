const { pool } = require("../config/db");

function mapRecord(row, courses = []) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,
    student: row.student_id,
    label: row.label,
    gpa: Number(row.gpa),
    credits: row.credits,
    courses: courses.map(c => ({
      name: c.name,
      credits: c.credits,
      grade: c.grade
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function attachCourses(records) {
  if (!records.length) return records.map(r => mapRecord(r, []));

  const ids = records.map(r => r.id);
  const [courseRows] = await pool.query(
    `SELECT * FROM semester_courses WHERE semester_record_id IN (?) ORDER BY id ASC`,
    [ids]
  );

  const byRecord = new Map();
  courseRows.forEach(c => {
    if (!byRecord.has(c.semester_record_id)) byRecord.set(c.semester_record_id, []);
    byRecord.get(c.semester_record_id).push(c);
  });

  return records.map(r => mapRecord(r, byRecord.get(r.id) || []));
}

async function create({ student, label, gpa, credits, courses = [] }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      "INSERT INTO semester_records (student_id, label, gpa, credits) VALUES (?, ?, ?, ?)",
      [student, label, gpa, credits]
    );

    const recordId = result.insertId;

    if (Array.isArray(courses) && courses.length) {
      const values = courses.map(c => [
        recordId,
        String(c.name || ""),
        Number(c.credits) || 0,
        String(c.grade || "")
      ]);

      await connection.query(
        "INSERT INTO semester_courses (semester_record_id, name, credits, grade) VALUES ?",
        [values]
      );
    }

    await connection.commit();

    return findById(recordId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM semester_records WHERE id = ?", [id]);
  if (!rows[0]) return null;

  const [mapped] = await attachCourses([rows[0]]);
  return mapped;
}

async function findOwnedById(id, studentId) {
  const [rows] = await pool.query(
    "SELECT * FROM semester_records WHERE id = ? AND student_id = ?",
    [id, studentId]
  );
  if (!rows[0]) return null;

  const [mapped] = await attachCourses([rows[0]]);
  return mapped;
}

async function findByStudent(studentId) {
  const [rows] = await pool.query(
    "SELECT * FROM semester_records WHERE student_id = ? ORDER BY created_at ASC, id ASC",
    [studentId]
  );

  return attachCourses(rows);
}

async function updateLabel(id, label) {
  await pool.query("UPDATE semester_records SET label = ? WHERE id = ?", [label, id]);
  return findById(id);
}

async function deleteById(id) {
  // semester_courses rows are removed automatically (ON DELETE CASCADE)
  const [result] = await pool.query("DELETE FROM semester_records WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  create,
  findById,
  findOwnedById,
  findByStudent,
  updateLabel,
  deleteById
};