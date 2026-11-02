import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { query } from '../src/config/db.js';

describe('Academic Modules (Students, Faculty, Attendance, Results, Reports)', () => {
  let adminToken;
  let facultyToken;
  let studentToken;

  beforeAll(async () => {
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'Admin@123' });
    adminToken = adminRes.body.token;

    const facRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty@college.edu', password: 'Faculty@123' });
    facultyToken = facRes.body.token;

    const stuRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.edu', password: 'Student@123' });
    studentToken = stuRes.body.token;
  });

  // Student Management Tests
  describe('Student Management', () => {
    it('Admin can view all students', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('Admin can create a new student and prevents duplicate email or student ID', async () => {
      const newStudentData = {
        student_id: 'STU-TEST-999',
        first_name: 'Grace',
        last_name: 'Hopper',
        email: 'grace.hopper@college.edu',
        department_id: 1,
        semester: 1
      };

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newStudentData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Attempt duplicate creation with same student_id
      const dupIdRes = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...newStudentData, email: 'different@college.edu' });

      expect(dupIdRes.status).toBe(409);
      expect(dupIdRes.body.message).toMatch(/already assigned/i);
    });

    it('Student can view their own profile but cannot view others', async () => {
      const ownRes = await request(app)
        .get('/api/students/profile/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(ownRes.status).toBe(200);
      expect(ownRes.body.data.student_id).toBe('STU-2024-001');

      // Attempt to view Bob's profile (id: 2) directly as Alice
      const otherRes = await request(app)
        .get('/api/students/2')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(otherRes.status).toBe(403);
    });
  });

  // Faculty Management Tests
  describe('Faculty Management', () => {
    it('Admin can view all faculty members', async () => {
      const res = await request(app)
        .get('/api/faculty')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('Admin can create a new faculty member with validation', async () => {
      const newFaculty = {
        faculty_id: 'FAC-TEST-888',
        first_name: 'Donald',
        last_name: 'Knuth',
        email: 'knuth@college.edu',
        department_id: 1,
        designation: 'Professor'
      };

      const res = await request(app)
        .post('/api/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newFaculty);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // Attendance Management Tests
  describe('Attendance Management', () => {
    it('Faculty records attendance for enrolled students on a specific date', async () => {
      // Alan Turing teaches CS101 (id 1)
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          courseId: 1,
          attendanceDate: '2026-10-25',
          records: [
            { studentId: 1, status: 'Present' },
            { studentId: 2, status: 'Absent' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);

      // Verify records in DB
      const dbAtt = await query(
        'SELECT student_id, status FROM attendance WHERE course_id = 1 AND attendance_date = "2026-10-25"'
      );
      expect(dbAtt.length).toBe(2);
    });

    it('Rejects attendance marking for students not enrolled in the course', async () => {
      // Diana (id: 4) is not enrolled in CS101
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          courseId: 1,
          attendanceDate: '2026-10-26',
          records: [
            { studentId: 4, status: 'Present' }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not actively enrolled/i);
    });

    it('Student can view their own attendance records and percentages', async () => {
      const res = await request(app)
        .get('/api/attendance/my-attendance')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.summary)).toBe(true);
    });
  });

  // Result Management Tests
  describe('Result Management', () => {
    it('Faculty enters marks for a student and calculates letter grade', async () => {
      // Alan Turing enters marks for Alice (id 1) in CS301 (id 3)
      const res = await request(app)
        .post('/api/results/enter')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          studentId: 1,
          courseId: 3,
          marks: 95.5,
          maxMarks: 100,
          semester: 3
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.grade).toBe('A+');
    });

    it('Rejects invalid marks exceeding max marks or negative marks', async () => {
      const negRes = await request(app)
        .post('/api/results/enter')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          studentId: 1,
          courseId: 3,
          marks: -10,
          maxMarks: 100
        });
      expect(negRes.status).toBe(400);

      const excessRes = await request(app)
        .post('/api/results/enter')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          studentId: 1,
          courseId: 3,
          marks: 110,
          maxMarks: 100
        });
      expect(excessRes.status).toBe(400);
    });

    it('Student can view their own results', async () => {
      const res = await request(app)
        .get('/api/results/my-results')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Report Generation Tests
  describe('Report Generation', () => {
    it('Admin can view real aggregated dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.totalStudents).toBeGreaterThan(0);
      expect(res.body.stats.totalCourses).toBeGreaterThan(0);
      expect(Array.isArray(res.body.deptStats)).toBe(true);
    });

    it('Admin can download CSV report for enrollments', async () => {
      const res = await request(app)
        .get('/api/reports/export/enrollments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('Course Code');
      expect(res.text).toContain('CS101');
    });
  });
});

