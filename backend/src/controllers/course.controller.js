import { query } from '../config/db.js';

export const getAllCourses = async (req, res, next) => {
  try {
    const { departmentId, search, status } = req.query;

    let sql = `
      SELECT 
        c.id,
        c.course_code,
        c.title,
        c.description,
        c.credits,
        c.capacity,
        c.semester,
        c.status,
        c.created_at,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,
        f.id AS faculty_id,
        f.faculty_id AS faculty_code,
        CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, '')) AS faculty_name,
        f.email AS faculty_email,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled') AS enrolled_count,
        GREATEST(0, c.capacity - (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled')) AS available_seats
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      LEFT JOIN faculty f ON c.faculty_id = f.id
      WHERE 1=1
    `;

    const params = [];

    if (departmentId) {
      sql += ' AND c.department_id = ?';
      params.push(departmentId);
    }

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (c.course_code LIKE ? OR c.title LIKE ? OR c.description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY c.course_code ASC';

    const courses = await query(sql, params);
    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    next(err);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        c.id,
        c.course_code,
        c.title,
        c.description,
        c.credits,
        c.capacity,
        c.semester,
        c.status,
        c.created_at,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,
        f.id AS faculty_id,
        f.faculty_id AS faculty_code,
        CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, '')) AS faculty_name,
        f.email AS faculty_email,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled') AS enrolled_count,
        GREATEST(0, c.capacity - (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled')) AS available_seats
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      LEFT JOIN faculty f ON c.faculty_id = f.id
      WHERE c.id = ?
    `;

    const courses = await query(sql, [id]);
    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Course with ID ${id} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: courses[0]
    });
  } catch (err) {
    next(err);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const {
      course_code,
      title,
      description = '',
      department_id,
      credits = 3,
      faculty_id = null,
      capacity = 30,
      semester = 1,
      status = 'active'
    } = req.body;

    if (!course_code || !title || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Course code, title, and department are required fields.'
      });
    }

    if (parseInt(capacity, 10) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be greater than zero.'
      });
    }

    // Check duplicate course code
    const existing = await query('SELECT id FROM courses WHERE course_code = ?', [course_code.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Course code "${course_code}" is already in use.`
      });
    }

    const result = await query(
      `INSERT INTO courses (course_code, title, description, department_id, credits, faculty_id, capacity, semester, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_code.trim().toUpperCase(),
        title.trim(),
        description ? description.trim() : '',
        department_id,
        credits,
        faculty_id || null,
        capacity,
        semester,
        status
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: {
        id: result.insertId,
        course_code: course_code.trim().toUpperCase(),
        title: title.trim()
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      course_code,
      title,
      description,
      department_id,
      credits,
      faculty_id,
      capacity,
      semester,
      status
    } = req.body;

    const existingCourse = await query('SELECT id, capacity FROM courses WHERE id = ?', [id]);
    if (existingCourse.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }

    if (course_code) {
      const dup = await query('SELECT id FROM courses WHERE course_code = ? AND id != ?', [course_code.trim(), id]);
      if (dup.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Course code "${course_code}" is already used by another course.`
        });
      }
    }

    if (capacity !== undefined && parseInt(capacity, 10) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be greater than zero.'
      });
    }

    await query(
      `UPDATE courses SET 
        course_code = COALESCE(?, course_code),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        department_id = COALESCE(?, department_id),
        credits = COALESCE(?, credits),
        faculty_id = ?,
        capacity = COALESCE(?, capacity),
        semester = COALESCE(?, semester),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        course_code ? course_code.trim().toUpperCase() : null,
        title ? title.trim() : null,
        description !== undefined ? description : null,
        department_id || null,
        credits || null,
        faculty_id !== undefined ? (faculty_id || null) : null,
        capacity || null,
        semester || null,
        status || null,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await query('SELECT id, course_code FROM courses WHERE id = ?', [id]);
    if (course.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }

    await query('DELETE FROM courses WHERE id = ?', [id]);
    return res.status(200).json({
      success: true,
      message: `Course ${course[0].course_code} deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
};

