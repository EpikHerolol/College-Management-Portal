import { getConnection, query } from '../config/db.js';

const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

export const enterOrUpdateResult = async (req, res, next) => {
  const conn = await getConnection();
  try {
    const {
      studentId,
      courseId,
      marks,
      maxMarks = 100.0,
      semester = 1
    } = req.body;

    if (!studentId || !courseId || marks === undefined || marks === null) {
      return res.status(400).json({
        success: false,
        message: 'studentId, courseId, and marks are required.'
      });
    }

    const numericMarks = parseFloat(marks);
    const numericMax = parseFloat(maxMarks);

    if (isNaN(numericMarks) || isNaN(numericMax) || numericMarks < 0 || numericMarks > numericMax) {
      return res.status(400).json({
        success: false,
        message: `Marks must be a valid number between 0 and maximum marks (${numericMax}). Received: ${marks}`
      });
    }

    // Verify course
    const [courses] = await conn.query('SELECT id, course_code, faculty_id FROM courses WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }
    const course = courses[0];

    // If faculty, verify assignment
    if (req.user.role === 'faculty' && course.faculty_id !== req.user.facultyProfileId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not the assigned instructor for this course.'
      });
    }

    const evaluatorId = req.user.facultyProfileId || course.faculty_id || 1;

    // Verify enrollment
    const [enrollment] = await conn.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND status = "enrolled"',
      [studentId, courseId]
    );

    if (enrollment.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student is not actively enrolled in this course.'
      });
    }

    const percentage = (numericMarks / numericMax) * 100;
    const grade = calculateGrade(percentage);

    await conn.beginTransaction();

    // Check if result already exists for this semester
    const [existing] = await conn.query(
      'SELECT id FROM results WHERE student_id = ? AND course_id = ? AND semester = ?',
      [studentId, courseId, semester]
    );

    let resultId;
    let isUpdate = false;

    if (existing.length > 0) {
      resultId = existing[0].id;
      isUpdate = true;
      await conn.query(
        `UPDATE results SET 
          marks = ?, 
          max_marks = ?, 
          grade = ?, 
          evaluator_id = ?, 
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [numericMarks, numericMax, grade, evaluatorId, resultId]
      );
    } else {
      const [insertRes] = await conn.query(
        `INSERT INTO results (student_id, course_id, marks, max_marks, grade, semester, evaluator_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [studentId, courseId, numericMarks, numericMax, grade, semester, evaluatorId]
      );
      resultId = insertRes.insertId;
    }

    await conn.commit();

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: `Marks ${isUpdate ? 'updated' : 'recorded'} successfully. Grade: ${grade} (${percentage.toFixed(1)}%)`,
      data: {
        id: resultId,
        studentId,
        courseId,
        marks: numericMarks,
        maxMarks: numericMax,
        grade,
        percentage: percentage.toFixed(2),
        semester
      }
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const getCourseResults = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const sql = `
      SELECT 
        r.id,
        r.marks,
        r.max_marks,
        r.grade,
        r.semester,
        r.created_at,
        r.updated_at,
        s.id AS student_profile_id,
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, '')) AS evaluator_name
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN faculty f ON r.evaluator_id = f.id
      WHERE r.course_id = ?
      ORDER BY s.student_id ASC
    `;

    const results = await query(sql, [courseId]);
    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

export const getMyResults = async (req, res, next) => {
  try {
    const studentProfileId = req.user.studentProfileId;
    if (!studentProfileId) {
      return res.status(400).json({
        success: false,
        message: 'No student profile linked to this user.'
      });
    }

    const sql = `
      SELECT 
        r.id,
        r.marks,
        r.max_marks,
        r.grade,
        r.semester,
        r.created_at,
        c.id AS course_id,
        c.course_code,
        c.title AS course_title,
        c.credits,
        d.name AS department_name
      FROM results r
      JOIN courses c ON r.course_id = c.id
      JOIN departments d ON c.department_id = d.id
      WHERE r.student_id = ?
      ORDER BY r.semester DESC, c.course_code ASC
    `;

    const results = await query(sql, [studentProfileId]);

    // Calculate overall GPA/average
    let totalMarks = 0;
    let totalMaxMarks = 0;
    let totalCredits = 0;

    results.forEach(r => {
      totalMarks += parseFloat(r.marks);
      totalMaxMarks += parseFloat(r.max_marks);
      totalCredits += parseInt(r.credits, 10);
    });

    const overallPercentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(2) : 0;

    return res.status(200).json({
      success: true,
      count: results.length,
      overallPercentage,
      totalCredits,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

export const getAllResults = async (req, res, next) => {
  try {
    const { departmentId, courseId, semester } = req.query;

    let sql = `
      SELECT 
        r.id,
        r.marks,
        r.max_marks,
        r.grade,
        r.semester,
        r.created_at,
        s.id AS student_profile_id,
        s.student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        c.id AS course_id,
        c.course_code,
        c.title AS course_title,
        c.credits,
        d.name AS department_name,
        CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, '')) AS evaluator_name
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN courses c ON r.course_id = c.id
      JOIN departments d ON c.department_id = d.id
      JOIN faculty f ON r.evaluator_id = f.id
      WHERE 1=1
    `;

    const params = [];

    if (departmentId) {
      sql += ' AND d.id = ?';
      params.push(departmentId);
    }

    if (courseId) {
      sql += ' AND c.id = ?';
      params.push(courseId);
    }

    if (semester) {
      sql += ' AND r.semester = ?';
      params.push(semester);
    }

    sql += ' ORDER BY c.course_code ASC, s.student_id ASC';

    const results = await query(sql, params);
    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

