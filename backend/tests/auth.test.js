import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Authentication & RBAC Module', () => {
  it('Successfully logs in with valid student credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@college.edu',
        password: 'Student@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
    expect(res.body.user.profile.student_id).toBe('STU-2024-001');
  });

  it('Successfully logs in with valid faculty credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'faculty@college.edu',
        password: 'Faculty@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('faculty');
    expect(res.body.user.profile.faculty_id).toBe('FAC-2024-001');
  });

  it('Successfully logs in with valid administrator credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@college.edu',
        password: 'Admin@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
  });

  it('Rejects login with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@college.edu',
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('Rejects login with nonexistent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@college.edu',
        password: 'AnyPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Rejects login with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@college.edu'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Authenticates and returns current user details on /api/auth/me', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@college.edu',
        password: 'Student@123'
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.email).toBe('student@college.edu');
    expect(meRes.body.user.role).toBe('student');
  });

  it('Returns demo accounts list for quick local testing', async () => {
    const res = await request(app).get('/api/auth/demo-accounts');
    expect(res.status).toBe(200);
    expect(res.body.accounts.length).toBe(3);
    expect(res.body.accounts[0].role).toBe('Administrator');
  });
});

