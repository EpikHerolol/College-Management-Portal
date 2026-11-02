import { getConnection, query } from '../config/db.js';

export const markAttendance = async (req, res, next) => {
  const conn = await getConnection();
  try {
    const { courseId, attendanceDate, records } = req.body;

    if (!courseId || !attendanceDate || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'courseId, attendanceDate (YYYY-MM-DD), and a non-empty records array are required.'
      });
    }

    // Verify course exists
    const [courses] = await conn.query('SELECT id, course_code, title, faculty_id FROM courses WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }
    const course = courses[0];

    // If user is faculty, ensure they teach this course
    if (req.user.role === 'faculty' && course.faculty_id !== req.user.facultyProfileId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not the assigned instructor for this course.'
      });
    }

    const facultyProfileId = req.user.facultyProfileId || course.faculty_id || 1;

    await conn.beginTransaction();

    let insertedCount = 0;
    let updatedCount = 0;

    for (const rec of records) {
      const { studentId, status } = rec;
      if (!studentId || !['Present', 'Absent'].includes(status)) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Invalid record: studentId=${studentId}, status=${status}. Status must be "Present" or "Absent".`
        });
      }

      // Check if student is enrolled in this course
      const [enrollment] = await conn.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND status = "enrolled"',
        [studentId, courseId]
      );

      if (enrollment.length === 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Student with ID ${studentId} is not actively enrolled in course ${course.course_code}.`
        });
      }

      // Check existing record for this date
      const [existing] = await conn.query(
        'SELECT id, status FROM attendance WHERE student_id = ? AND course_id = ? AND attendance_date = ?',
        [studentId, courseId, attendanceDate]
      );

      if (existing.length > 0) {
        // Update existing record
        await conn.query(
          'UPDATE attendance SET status = ?, marked_by = ? WHERE id = ?',
          [status, facultyProfileId, existing[0].id]
        );
        updatedCount++;
      } else {
        // Insert new record
        await conn.query(
          `INSERT INTO attendance (student_id, course_id, attendance_date, status, marked_by)
           VALUES (?, ?, ?, ?, ?)`,
          [studentId, courseId, attendanceDate, status, facultyProfileId]
        );
        insertedCount++;
      }
    }

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: `Attendance recorded for ${records.length} students (${insertedCount} new, ${updatedCount} updated).`,
      data: {
        courseId,
        attendanceDate,
        total: records.length,
        insertedCount,
        updatedCount
      }
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const getCourseAttendance = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { date, startDate, endDate } = req.query;

    let sql = `
      SELECT 
        a.id,
        a.attendance_date,
        a.status,
        a.created_at,
        s.id AS student_profile_id,
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, '')) AS marked_by_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN faculty f ON a.marked_by = f.id
      WHERE a.course_id = ?
    `;

    const params = [courseId];

    if (date) {
      sql += ' AND a.attendance_date = ?';
      params.push(date);
    } else if (startDate && endDate) {
      sql += ' AND a.attendance_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    sql += ' ORDER BY a.attendance_date DESC, s.student_id ASC';

    const records = await query(sql, params);

    // Also get distinct dates for calendar/table view
    const dates = await query(
      'SELECT DISTINCT attendance_date FROM attendance WHERE course_id = ? ORDER BY attendance_date DESC',
      [courseId]
    );

    return res.status(200).json({
      success: true,
      count: records.length,
      availableDates: dates.map(d => d.attendance_date),
      data: records
    });
  } catch (err) {
    next(err);
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    const studentProfileId = req.user.studentProfileId;
    if (!studentProfileId) {
      return res.status(400).json({
        success: false,
        message: 'No student profile linked to this user.'
      });
    }

    // 1. Get detailed attendance history
    const historySql = `
      SELECT 
        a.id,
        a.attendance_date,
        a.status,
        c.id AS course_id,
        c.course_code,
        c.title AS course_title
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.attendance_date DESC, c.course_code ASC
    `;
    const history = await query(historySql, [studentProfileId]);

    // 2. Summary stats per enrolled course
    const summarySql = `
      SELECT 
        c.id AS course_id,
        c.course_code,
        c.title AS course_title,
        COUNT(a.id) AS total_classes,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
        ROUND(
          (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 
          1
        ) AS attendance_percentage
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN attendance a ON a.course_id = c.id AND a.student_id = e.student_id
      WHERE e.student_id = ? AND e.status = 'enrolled'
      GROUP BY c.id, c.course_code, c.title
    `;
    const summary = await query(summarySql, [studentProfileId]);

    return res.status(200).json({
      success: true,
      summary,
      history
    });
  } catch (err) {
    next(err);
  }
};

