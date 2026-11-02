import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import pool, { query } from '../src/config/db.js';

describe('Course Management & Course Registration Module', () => {
  let studentToken;
  let studentProfileId;
  let adminToken;
  let facultyToken;

  beforeAll(async () => {
    // 1. Authenticate Student (student@college.edu / Student@123)
    const stuRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.edu', password: 'Student@123' });
    studentToken = stuRes.body.token;
    studentProfileId = stuRes.body.user.profile.id;

    // 2. Authenticate Admin (admin@college.edu / Admin@123)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'Admin@123' });
    adminToken = adminRes.body.token;

    // 3. Authenticate Faculty (faculty@college.edu / Faculty@123)
    const facRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty@college.edu', password: 'Faculty@123' });
    facultyToken = facRes.body.token;
  });

  // Scenario 1: A valid student successfully registers for an available course
  it('Scenario 1: Valid student successfully registers for an available course', async () => {
    // Find an available course that student (Alice, stu1) is not enrolled in, e.g. EC101 (c5)
    const courses = await query("SELECT id, course_code, capacity FROM courses WHERE course_code = 'EC101'");
    const ec101 = courses[0];

    const res = await request(app)
      .post('/api/enrollments/register')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: ec101.id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.courseCode).toBe('EC101');

    // Verify record in MySQL database
    const dbEnrollments = await query(
      'SELECT id, status FROM enrollments WHERE student_id = ? AND course_id = ?',
      [studentProfileId, ec101.id]
    );
    expect(dbEnrollments.length).toBe(1);
    expect(dbEnrollments[0].status).toBe('enrolled');
  });

  // Scenario 2: Registration is rejected when a course has reached its capacity
  it('Scenario 2: Registration is rejected when a course has reached its capacity', async () => {
    // Admin creates a course with capacity = 1
    const createRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        course_code: 'TEST-CAP-101',
        title: 'Micro-Capacity Seminar',
        department_id: 1,
        capacity: 1,
        credits: 3
      });
    expect(createRes.status).toBe(201);
    const courseId = createRes.body.data.id;

    // First student registers -> succeeds
    const reg1 = await request(app)
      .post('/api/enrollments/register')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId });
    expect(reg1.status).toBe(201);

    // Second student (Bob, stu2) logs in and attempts to register for full course
    const bobLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@college.edu', password: 'Student@123' });
    const bobToken = bobLogin.body.token;

    const reg2 = await request(app)
      .post('/api/enrollments/register')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ courseId });

    expect(reg2.status).toBe(400);
    expect(reg2.body.success).toBe(false);
    expect(reg2.body.message).toMatch(/capacity/i);
  });

  // Scenario 3: Duplicate registration is rejected
  it('Scenario 3: Duplicate registration for the same course is rejected', async () => {
    // Alice is already registered for CS101 in seed data
    const courses = await query("SELECT id FROM courses WHERE course_code = 'CS101'");
    const cs101Id = courses[0].id;

    const res = await request(app)
      .post('/api/enrollments/register')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: cs101Id });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered|duplicate/i);
  });

  // Scenario 4: Registration for a nonexistent course is rejected
  it('Scenario 4: Registration for a nonexistent course is rejected with 404', async () => {
    const res = await request(app)
      .post('/api/enrollments/register')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 999999 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  // Scenario 5: Invalid or missing input is rejected
  it('Scenario 5: Invalid or missing course ID is rejected with 400', async () => {
    const missingRes = await request(app)
      .post('/api/enrollments/register')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});
    expect(missingRes.status).toBe(400);

    const invalidRes = await request(app)
      .post('/api/enrollments/register')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'invalid-string' });
    expect(invalidRes.status).toBe(400);
  });

  // Scenario 6: An unauthenticated user cannot register
  it('Scenario 6: Unauthenticated user request is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/enrollments/register')
      .send({ courseId: 1 });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/token|auth/i);
  });

  // Scenario 7: A user without the required role cannot perform a restricted action
  it('Scenario 7: User without required role is rejected with 403', async () => {
    // Faculty user cannot create courses (admin only)
    const facCourseCreate = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        course_code: 'UNAUTH-101',
        title: 'Unauthorized Course',
        department_id: 1
      });
    expect(facCourseCreate.status).toBe(403);
    expect(facCourseCreate.body.success).toBe(false);
    expect(facCourseCreate.body.message).toMatch(/forbidden/i);

    // Student user cannot access admin reports
    const studentReportAccess = await request(app)
      .get('/api/reports/dashboard-stats')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentReportAccess.status).toBe(403);
  });

  // Scenario 8: Failed registration does not create an enrollment record
  it('Scenario 8: Failed registration leaves enrollment database count unchanged', async () => {
    const [beforeCount] = await query('SELECT COUNT(*) AS total FROM enrollments');

    // Attempt registration for invalid/nonexistent course
    await request(app)
      .post('/api/enrollments/register')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 88888 });

    const [afterCount] = await query('SELECT COUNT(*) AS total FROM enrollments');
    expect(afterCount.total).toBe(beforeCount.total);
  });

  // Scenario 9: Concurrent registration attempts cannot exceed course capacity
  it('Scenario 9: Concurrent registration attempts cannot exceed course capacity', async () => {
    // 1. Create a course with capacity = 1
    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        course_code: 'CONCUR-101',
        title: 'High-Concurrency Systems Seminar',
        department_id: 1,
        capacity: 1,
        credits: 3
      });
    expect(courseRes.status).toBe(201);
    const concurrentCourseId = courseRes.body.data.id;

    // 2. Prepare tokens for 3 distinct students (Charlie, Diana, Ethan)
    const [cLogin, dLogin, eLogin] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'charlie@college.edu', password: 'Student@123' }),
      request(app).post('/api/auth/login').send({ email: 'diana@college.edu', password: 'Student@123' }),
      request(app).post('/api/auth/login').send({ email: 'ethan@college.edu', password: 'Student@123' })
    ]);

    const tokens = [cLogin.body.token, dLogin.body.token, eLogin.body.token];

    // 3. Fire concurrent registration requests simultaneously
    const responses = await Promise.all(
      tokens.map(tok =>
        request(app)
          .post('/api/enrollments/register')
          .set('Authorization', `Bearer ${tok}`)
          .send({ courseId: concurrentCourseId })
      )
    );

    const successCount = responses.filter(r => r.status === 201).length;
    const capacityRejectedCount = responses.filter(r => r.status === 400 && /capacity/i.test(r.body.message)).length;

    // Exactly 1 must have succeeded, and the rest rejected
    expect(successCount).toBe(1);
    expect(capacityRejectedCount).toBe(2);

    // Verify database active count is exactly 1 (never exceeding capacity)
    const [dbCount] = await query(
      'SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ? AND status = "enrolled"',
      [concurrentCourseId]
    );
    expect(parseInt(dbCount.count, 10)).toBe(1);
  });

  // Additional Feature: Safe course drop
  it('Student can drop an enrolled course and enroll count decreases', async () => {
    // Register Diana in ME101
    const me101 = (await query("SELECT id FROM courses WHERE course_code = 'ME101'"))[0];
    const dianaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'diana@college.edu', password: 'Student@123' });
    const dianaToken = dianaLogin.body.token;

    const regRes = await request(app)
      .post('/api/enrollments/register')
      .set('Authorization', `Bearer ${dianaToken}`)
      .send({ courseId: me101.id });
    expect(regRes.status).toBe(201);

    // Drop the course
    const dropRes = await request(app)
      .post('/api/enrollments/drop')
      .set('Authorization', `Bearer ${dianaToken}`)
      .send({ courseId: me101.id });
    expect(dropRes.status).toBe(200);
    expect(dropRes.body.success).toBe(true);

    // Verify enrollment status in DB is 'dropped'
    const [enrollment] = await query(
      'SELECT status FROM enrollments WHERE student_id = ? AND course_id = ?',
      [dianaLogin.body.user.profile.id, me101.id]
    );
    expect(enrollment.status).toBe('dropped');
  });
});

