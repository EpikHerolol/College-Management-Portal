import { getConnection, query } from '../config/db.js';

class EnrollmentService {
  /**
   * Registers a student for a course safely with row locking and transactions.
   * Concurrency safe: prevents over-capacity registration and duplicate enrollments.
   */
  async registerStudent(studentProfileId, courseId) {
    if (!studentProfileId) {
      const err = new Error('Student profile identifier is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!courseId || isNaN(parseInt(courseId, 10))) {
      const err = new Error('A valid numeric Course ID is required.');
      err.statusCode = 400;
      throw err;
    }

    const cId = parseInt(courseId, 10);
    const sId = parseInt(studentProfileId, 10);

    const conn = await getConnection();

    try {
      await conn.beginTransaction();

      // 1. Verify student exists
      const [students] = await conn.query(
        'SELECT id, student_id, first_name, last_name FROM students WHERE id = ? FOR UPDATE',
        [sId]
      );

      if (students.length === 0) {
        const err = new Error('Student record not found.');
        err.statusCode = 404;
        throw err;
      }
      const student = students[0];

      // 2. Lock course record and verify it exists and is active
      const [courses] = await conn.query(
        'SELECT id, course_code, title, capacity, status, credits FROM courses WHERE id = ? FOR UPDATE',
        [cId]
      );

      if (courses.length === 0) {
        const err = new Error(`Course with ID ${cId} not found.`);
        err.statusCode = 404;
        throw err;
      }

      const course = courses[0];

      if (course.status !== 'active') {
        const err = new Error(`Course "${course.course_code}: ${course.title}" is currently not open for enrollment.`);
        err.statusCode = 400;
        throw err;
      }

      // 3. Check for existing enrollment (duplicate prevention)
      const [existingEnrollments] = await conn.query(
        'SELECT id, status FROM enrollments WHERE student_id = ? AND course_id = ? FOR UPDATE',
        [sId, cId]
      );

      if (existingEnrollments.length > 0) {
        const existing = existingEnrollments[0];
        if (existing.status === 'enrolled') {
          const err = new Error(`Student ${student.student_id} is already registered for course ${course.course_code}. Duplicate registration is rejected.`);
          err.statusCode = 409;
          throw err;
        }
      }

      // 4. Lock and count current active enrollments
      const [countResult] = await conn.query(
        'SELECT COUNT(*) AS activeCount FROM enrollments WHERE course_id = ? AND status = "enrolled" FOR UPDATE',
        [cId]
      );

      const activeCount = parseInt(countResult[0].activeCount, 10);

      // 5. Enforce capacity limit
      if (activeCount >= course.capacity) {
        const err = new Error(`Course "${course.course_code}" has reached its maximum enrollment capacity of ${course.capacity} students.`);
        err.statusCode = 400;
        throw err;
      }

      let enrollmentId;
      if (existingEnrollments.length > 0) {
        // Re-enrolling after previous drop
        enrollmentId = existingEnrollments[0].id;
        await conn.query(
          'UPDATE enrollments SET status = "enrolled", enrollment_date = CURRENT_TIMESTAMP WHERE id = ?',
          [enrollmentId]
        );
      } else {
        // New enrollment
        const [insertRes] = await conn.query(
          'INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, "enrolled")',
          [sId, cId]
        );
        enrollmentId = insertRes.insertId;
      }

      await conn.commit();

      return {
        enrollmentId,
        studentId: student.id,
        studentCode: student.student_id,
        courseId: course.id,
        courseCode: course.course_code,
        courseTitle: course.title,
        credits: course.credits,
        status: 'enrolled',
        enrolledCount: activeCount + 1,
        capacity: course.capacity,
        message: `Successfully registered for ${course.course_code}: ${course.title}`
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Safely drops a course registration for a student.
   */
  async dropStudentCourse(studentProfileId, courseId) {
    if (!studentProfileId || !courseId) {
      const err = new Error('Student Profile ID and Course ID are required.');
      err.statusCode = 400;
      throw err;
    }

    const cId = parseInt(courseId, 10);
    const sId = parseInt(studentProfileId, 10);

    const conn = await getConnection();

    try {
      await conn.beginTransaction();

      const [enrollment] = await conn.query(
        'SELECT id, status FROM enrollments WHERE student_id = ? AND course_id = ? FOR UPDATE',
        [sId, cId]
      );

      if (enrollment.length === 0 || enrollment[0].status !== 'enrolled') {
        const err = new Error('Active course registration not found.');
        err.statusCode = 404;
        throw err;
      }

      await conn.query(
        'UPDATE enrollments SET status = "dropped" WHERE id = ?',
        [enrollment[0].id]
      );

      await conn.commit();
      return { success: true, message: 'Course successfully dropped.' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Returns all active enrolled courses for a given student.
   */
  async getStudentEnrollments(studentProfileId) {
    const sId = parseInt(studentProfileId, 10);
    const sql = `
      SELECT 
        e.id AS enrollment_id,
        e.status AS enrollment_status,
        e.enrollment_date,
        c.id AS course_id,
        c.course_code,
        c.title AS course_title,
        c.description,
        c.credits,
        c.semester,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,
        CONCAT(COALESCE(f.first_name, ''), ' ', COALESCE(f.last_name, '')) AS faculty_name,
        f.email AS faculty_email
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN departments d ON c.department_id = d.id
      LEFT JOIN faculty f ON c.faculty_id = f.id
      WHERE e.student_id = ? AND e.status = 'enrolled'
      ORDER BY c.course_code ASC
    `;
    return await query(sql, [sId]);
  }

  /**
   * Returns all students enrolled in a specific course.
   */
  async getCourseEnrollments(courseId) {
    const cId = parseInt(courseId, 10);
    const sql = `
      SELECT 
        e.id AS enrollment_id,
        e.enrollment_date,
        e.status AS enrollment_status,
        s.id AS student_profile_id,
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        s.semester,
        d.name AS department_name
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN departments d ON s.department_id = d.id
      WHERE e.course_id = ? AND e.status = 'enrolled'
      ORDER BY s.student_id ASC
    `;
    return await query(sql, [cId]);
  }
}

export default new EnrollmentService();

