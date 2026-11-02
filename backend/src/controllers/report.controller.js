import { query } from '../config/db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core metric counts
    const [stuRow] = await query('SELECT COUNT(*) AS total FROM students');
    const [facRow] = await query('SELECT COUNT(*) AS total FROM faculty');
    const [courseRow] = await query('SELECT COUNT(*) AS total FROM courses WHERE status = "active"');
    const [enrollRow] = await query('SELECT COUNT(*) AS total FROM enrollments WHERE status = "enrolled"');

    const totalStudents = parseInt(stuRow?.total || 0, 10);
    const totalFaculty = parseInt(facRow?.total || 0, 10);
    const totalCourses = parseInt(courseRow?.total || 0, 10);
    const totalEnrolled = parseInt(enrollRow?.total || 0, 10);

    // 2. Total capacity across active courses
    const [capRow] = await query('SELECT SUM(capacity) AS total_capacity FROM courses WHERE status = "active"');
    const totalCapacity = parseInt(capRow?.total_capacity || 1, 10);
    const occupancyRate = ((totalEnrolled / totalCapacity) * 100).toFixed(1);

    // 3. Department breakdown
    const deptStats = await query(`
      SELECT 
        d.id,
        d.code,
        d.name,
        COUNT(DISTINCT s.id) AS student_count,
        COUNT(DISTINCT f.id) AS faculty_count,
        COUNT(DISTINCT c.id) AS course_count
      FROM departments d
      LEFT JOIN students s ON s.department_id = d.id
      LEFT JOIN faculty f ON f.department_id = d.id
      LEFT JOIN courses c ON c.department_id = d.id
      GROUP BY d.id, d.code, d.name
      ORDER BY student_count DESC
    `);

    // 4. Overall attendance percentage
    const [attRow] = await query(`
      SELECT 
        COUNT(*) AS total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_count
      FROM attendance
    `);
    const totalAtt = parseInt(attRow?.total_records || 0, 10);
    const presentAtt = parseInt(attRow?.present_count || 0, 10);
    const avgAttendance = totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(1) : 0;

    // 5. Recent enrollments (latest 6)
    const recentEnrollments = await query(`
      SELECT 
        e.id,
        e.enrollment_date,
        s.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        c.course_code,
        c.title AS course_title
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.status = 'enrolled'
      ORDER BY e.enrollment_date DESC
      LIMIT 6
    `);

    // 6. Grade distribution
    const gradeDistribution = await query(`
      SELECT grade, COUNT(*) AS count 
      FROM results 
      GROUP BY grade 
      ORDER BY FIELD(grade, 'A+', 'A', 'B', 'C', 'D', 'F')
    `);

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalFaculty,
        totalCourses,
        totalEnrollments: totalEnrolled,
        occupancyRate: `${occupancyRate}%`,
        avgAttendance: `${avgAttendance}%`
      },
      deptStats,
      recentEnrollments,
      gradeDistribution
    });
  } catch (err) {
    next(err);
  }
};

export const getEnrollmentReport = async (req, res, next) => {
  try {
    const report = await query(`
      SELECT 
        c.id AS course_id,
        c.course_code,
        c.title AS course_title,
        c.credits,
        c.capacity,
        d.code AS department_code,
        d.name AS department_name,
        CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, '')) AS instructor,
        COUNT(e.id) AS enrolled_count,
        GREATEST(0, c.capacity - COUNT(e.id)) AS available_seats,
        ROUND((COUNT(e.id) / c.capacity) * 100, 1) AS occupancy_percentage
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      LEFT JOIN faculty f ON c.faculty_id = f.id
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'enrolled'
      GROUP BY c.id, c.course_code, c.title, c.credits, c.capacity, d.code, d.name, instructor
      ORDER BY occupancy_percentage DESC, c.course_code ASC
    `);

    return res.status(200).json({
      success: true,
      count: report.length,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

export const getAttendanceReport = async (req, res, next) => {
  try {
    const studentAttendance = await query(`
      SELECT 
        s.id AS student_profile_id,
        s.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        s.email,
        d.name AS department_name,
        COUNT(a.id) AS total_classes,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_classes,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_classes,
        ROUND(
          (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100,
          1
        ) AS attendance_percentage
      FROM students s
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN attendance a ON a.student_id = s.id
      GROUP BY s.id, s.student_id, student_name, s.email, d.name
      ORDER BY attendance_percentage ASC
    `);

    // Flag low attendance (< 75%)
    const lowAttendance = studentAttendance.filter(s => s.total_classes > 0 && parseFloat(s.attendance_percentage) < 75);

    return res.status(200).json({
      success: true,
      count: studentAttendance.length,
      lowAttendanceCount: lowAttendance.length,
      data: studentAttendance
    });
  } catch (err) {
    next(err);
  }
};

export const getResultReport = async (req, res, next) => {
  try {
    const coursePerformance = await query(`
      SELECT 
        c.id AS course_id,
        c.course_code,
        c.title AS course_title,
        d.name AS department_name,
        COUNT(r.id) AS total_graded_students,
        ROUND(AVG(r.marks), 2) AS average_marks,
        MAX(r.marks) AS highest_marks,
        MIN(r.marks) AS lowest_marks,
        SUM(CASE WHEN r.grade != 'F' THEN 1 ELSE 0 END) AS passed_count,
        SUM(CASE WHEN r.grade = 'F' THEN 1 ELSE 0 END) AS failed_count,
        ROUND(
          (SUM(CASE WHEN r.grade != 'F' THEN 1 ELSE 0 END) / NULLIF(COUNT(r.id), 0)) * 100,
          1
        ) AS pass_percentage
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      LEFT JOIN results r ON r.course_id = c.id
      GROUP BY c.id, c.course_code, c.title, d.name
      ORDER BY c.course_code ASC
    `);

    return res.status(200).json({
      success: true,
      count: coursePerformance.length,
      data: coursePerformance
    });
  } catch (err) {
    next(err);
  }
};

export const exportReportCsv = async (req, res, next) => {
  try {
    const { reportType } = req.params;

    let rows = [];
    let filename = `report_${reportType}_${Date.now()}.csv`;

    if (reportType === 'enrollments') {
      rows = await query(`
        SELECT 
          c.course_code AS 'Course Code',
          c.title AS 'Course Title',
          d.name AS 'Department',
          c.credits AS 'Credits',
          c.capacity AS 'Capacity',
          COUNT(e.id) AS 'Enrolled Students',
          GREATEST(0, c.capacity - COUNT(e.id)) AS 'Available Seats',
          ROUND((COUNT(e.id) / c.capacity) * 100, 1) AS 'Occupancy %'
        FROM courses c
        JOIN departments d ON c.department_id = d.id
        LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'enrolled'
        GROUP BY c.id, c.course_code, c.title, d.name, c.credits, c.capacity
        ORDER BY c.course_code ASC
      `);
    } else if (reportType === 'attendance') {
      rows = await query(`
        SELECT 
          s.student_id AS 'Student ID',
          CONCAT(s.first_name, ' ', s.last_name) AS 'Student Name',
          d.name AS 'Department',
          COUNT(a.id) AS 'Total Sessions',
          SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS 'Present Count',
          SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS 'Absent Count',
          ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 1) AS 'Attendance %'
        FROM students s
        JOIN departments d ON s.department_id = d.id
        LEFT JOIN attendance a ON a.student_id = s.id
        GROUP BY s.id, s.student_id, s.first_name, s.last_name, d.name
        ORDER BY s.student_id ASC
      `);
    } else if (reportType === 'results') {
      rows = await query(`
        SELECT 
          s.student_id AS 'Student ID',
          CONCAT(s.first_name, ' ', s.last_name) AS 'Student Name',
          c.course_code AS 'Course Code',
          c.title AS 'Course Title',
          r.marks AS 'Marks',
          r.max_marks AS 'Max Marks',
          r.grade AS 'Grade',
          r.semester AS 'Semester'
        FROM results r
        JOIN students s ON r.student_id = s.id
        JOIN courses c ON r.course_id = c.id
        ORDER BY c.course_code ASC, s.student_id ASC
      `);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid reportType. Choose "enrollments", "attendance", or "results".'
      });
    }

    if (rows.length === 0) {
      return res.status(200).send('No data available');
    }

    // Convert rows to CSV format
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(field => {
          const val = row[field] === null || row[field] === undefined ? '' : String(row[field]);
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    const csvContent = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
