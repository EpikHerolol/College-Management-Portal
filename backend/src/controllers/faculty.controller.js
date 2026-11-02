import bcrypt from 'bcryptjs';
import { getConnection, query } from '../config/db.js';

export const getAllFaculty = async (req, res, next) => {
  try {
    const { departmentId, search } = req.query;

    let sql = `
      SELECT 
        f.id,
        f.faculty_id,
        f.first_name,
        f.last_name,
        f.email,
        f.phone,
        f.designation,
        f.created_at,
        u.id AS user_id,
        u.status AS user_status,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,
        (SELECT COUNT(*) FROM courses c WHERE c.faculty_id = f.id) AS assigned_courses_count
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      JOIN departments d ON f.department_id = d.id
      WHERE 1=1
    `;

    const params = [];

    if (departmentId) {
      sql += ' AND f.department_id = ?';
      params.push(departmentId);
    }

    if (search) {
      sql += ' AND (f.faculty_id LIKE ? OR f.first_name LIKE ? OR f.last_name LIKE ? OR f.email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY f.faculty_id ASC';

    const facultyList = await query(sql, params);
    return res.status(200).json({
      success: true,
      count: facultyList.length,
      data: facultyList
    });
  } catch (err) {
    next(err);
  }
};

export const getFacultyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        f.id,
        f.faculty_id,
        f.first_name,
        f.last_name,
        f.email,
        f.phone,
        f.designation,
        f.created_at,
        u.status AS account_status,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      JOIN departments d ON f.department_id = d.id
      WHERE f.id = ?
    `;

    const result = await query(sql, [id]);
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found.'
      });
    }

    // Also get their assigned courses
    const courses = await query(
      `SELECT id, course_code, title, credits, semester, capacity,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = courses.id AND e.status = 'enrolled') AS enrolled_count
       FROM courses WHERE faculty_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...result[0],
        assigned_courses: courses
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyFacultyProfile = async (req, res, next) => {
  try {
    const facultyProfileId = req.user.facultyProfileId;
    if (!facultyProfileId) {
      return res.status(400).json({
        success: false,
        message: 'No faculty profile associated with this account.'
      });
    }

    const sql = `
      SELECT 
        f.id,
        f.faculty_id,
        f.first_name,
        f.last_name,
        f.email,
        f.phone,
        f.designation,
        f.created_at,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code
      FROM faculty f
      JOIN departments d ON f.department_id = d.id
      WHERE f.id = ?
    `;

    const result = await query(sql, [facultyProfileId]);
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found.'
      });
    }

    const courses = await query(
      `SELECT c.id, c.course_code, c.title, c.credits, c.semester, c.capacity,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled') AS enrolled_count
       FROM courses c
       WHERE c.faculty_id = ?
       ORDER BY c.course_code ASC`,
      [facultyProfileId]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...result[0],
        assigned_courses: courses
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createFaculty = async (req, res, next) => {
  const conn = await getConnection();
  try {
    const {
      faculty_id,
      first_name,
      last_name,
      email,
      phone = '',
      department_id,
      designation = 'Assistant Professor',
      password = 'Faculty@123'
    } = req.body;

    if (!faculty_id || !first_name || !last_name || !email || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Faculty ID, first name, last name, email, and department are required.'
      });
    }

    await conn.beginTransaction();

    // Check duplicate faculty_id
    const [dupFacultyId] = await conn.query('SELECT id FROM faculty WHERE faculty_id = ?', [faculty_id.trim()]);
    if (dupFacultyId.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `Faculty ID "${faculty_id}" is already assigned.`
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await conn.query(
      'INSERT INTO users (email, password, role, status) VALUES (?, ?, "faculty", "active")',
      [email.trim().toLowerCase(), hashedPassword]
    );

    const [facultyResult] = await conn.query(
      `INSERT INTO faculty (user_id, faculty_id, first_name, last_name, email, phone, department_id, designation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userResult.insertId,
        faculty_id.trim().toUpperCase(),
        first_name.trim(),
        last_name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        department_id,
        designation.trim()
      ]
    );

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Faculty member created successfully.',
      data: {
        id: facultyResult.insertId,
        faculty_id: faculty_id.trim().toUpperCase(),
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

export const updateFaculty = async (req, res, next) => {
  const conn = await getConnection();
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      phone,
      department_id,
      designation,
      status
    } = req.body;

    const [existing] = await conn.query('SELECT id, user_id FROM faculty WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found.'
      });
    }

    await conn.beginTransaction();

    await conn.query(
      `UPDATE faculty SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        department_id = COALESCE(?, department_id),
        designation = COALESCE(?, designation)
       WHERE id = ?`,
      [
        first_name ? first_name.trim() : null,
        last_name ? last_name.trim() : null,
        phone !== undefined ? phone.trim() : null,
        department_id || null,
        designation ? designation.trim() : null,
        id
      ]
    );

    if (status) {
      await conn.query('UPDATE users SET status = ? WHERE id = ?', [status, existing[0].user_id]);
    }

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: 'Faculty member updated successfully.'
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const deleteFaculty = async (req, res, next) => {
  const conn = await getConnection();
  try {
    const { id } = req.params;

    const [existing] = await conn.query('SELECT id, user_id, faculty_id FROM faculty WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found.'
      });
    }

    await conn.beginTransaction();
    await conn.query('DELETE FROM users WHERE id = ?', [existing[0].user_id]);
    await conn.commit();

    return res.status(200).json({
      success: true,
      message: `Faculty member ${existing[0].faculty_id} deleted successfully.`
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

