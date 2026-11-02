import bcrypt from 'bcryptjs';
import { getConnection, query } from '../config/db.js';

export const getAllStudents = async (req, res, next) => {
  try {
    const { departmentId, search } = req.query;

    let sql = `
      SELECT 
        s.id,
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.semester,
        s.enrollment_date,
        s.created_at,
        u.id AS user_id,
        u.status AS user_status,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,
        (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id AND e.status = 'enrolled') AS enrolled_courses_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;

    const params = [];

    if (departmentId) {
      sql += ' AND s.department_id = ?';
      params.push(departmentId);
    }

    if (search) {
      sql += ' AND (s.student_id LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR s.email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY s.student_id ASC';

    const students = await query(sql, params);
    return res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check authorization: if student role, can only access their own profile
    if (req.user.role === 'student' && req.user.studentProfileId !== parseInt(id, 10)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access other students’ profiles.'
      });
    }

    const sql = `
      SELECT 
        s.id,
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.semester,
        s.enrollment_date,
        s.created_at,
        u.status AS account_status,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN departments d ON s.department_id = d.id
      WHERE s.id = ?
    `;

    const students = await query(sql, [id]);
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: students[0]
    });
  } catch (err) {
    next(err);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const studentProfileId = req.user.studentProfileId;
    if (!studentProfileId) {
      return res.status(400).json({
        success: false,
        message: 'No student profile associated with this account.'
      });
    }

    const sql = `
      SELECT 
        s.id,
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.semester,
        s.enrollment_date,
        s.created_at,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code
      FROM students s
      JOIN departments d ON s.department_id = d.id
      WHERE s.id = ?
    `;

    const students = await query(sql, [studentProfileId]);
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: students[0]
    });
  } catch (err) {
    next(err);
  }
};

export const createStudent = async (req, res, next) => {
  const conn = await getConnection();
  try {
    const {
      student_id,
      first_name,
      last_name,
      email,
      phone = '',
      department_id,
      semester = 1,
      password = 'Student@123'
    } = req.body;

    if (!student_id || !first_name || !last_name || !email || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, first name, last name, email, and department are required.'
      });
    }

    await conn.beginTransaction();

    // Check duplicate student_id
    const [dupStudentId] = await conn.query('SELECT id FROM students WHERE student_id = ?', [student_id.trim()]);
    if (dupStudentId.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `Student ID "${student_id}" is already assigned.`
      });
    }

    // Check duplicate email
    const [dupEmail] = await conn.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (dupEmail.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `Email "${email}" is already registered.`
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [userResult] = await conn.query(
      'INSERT INTO users (email, password, role, status) VALUES (?, ?, "student", "active")',
      [email.trim().toLowerCase(), hashedPassword]
    );

    // Create student
    const [studentResult] = await conn.query(
      `INSERT INTO students (user_id, student_id, first_name, last_name, email, phone, department_id, semester)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userResult.insertId,
        student_id.trim().toUpperCase(),
        first_name.trim(),
        last_name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        department_id,
        semester
      ]
    );

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Student record created successfully.',
      data: {
        id: studentResult.insertId,
        student_id: student_id.trim().toUpperCase(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase()
      }
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const updateStudent = async (req, res, next) => {
  const conn = await getConnection();
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      phone,
      department_id,
      semester,
      status
    } = req.body;

    const [existing] = await conn.query('SELECT id, user_id FROM students WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    await conn.beginTransaction();

    await conn.query(
      `UPDATE students SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        department_id = COALESCE(?, department_id),
        semester = COALESCE(?, semester)
       WHERE id = ?`,
      [
        first_name ? first_name.trim() : null,
        last_name ? last_name.trim() : null,
        phone !== undefined ? phone.trim() : null,
        department_id || null,
        semester || null,
        id
      ]
    );

    if (status) {
      await conn.query('UPDATE users SET status = ? WHERE id = ?', [status, existing[0].user_id]);
    }

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully.'
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const deleteStudent = async (req, res, next) => {
  const conn = await getConnection();
  try {
    const { id } = req.params;

    const [existing] = await conn.query('SELECT id, user_id, student_id FROM students WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    await conn.beginTransaction();
    // Deleting the user will cascade delete student, enrollments, attendance, results via foreign key!
    await conn.query('DELETE FROM users WHERE id = ?', [existing[0].user_id]);
    await conn.commit();

    return res.status(200).json({
      success: true,
      message: `Student ${existing[0].student_id} deleted successfully.`
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

