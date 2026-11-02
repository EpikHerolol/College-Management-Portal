import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-college-portal-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const users = await query(
      'SELECT id, email, password, role, status FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    // Fetch linked profile
    let profile = null;
    let studentProfileId = null;
    let facultyProfileId = null;

    if (user.role === 'student') {
      const students = await query(
        `SELECT s.id, s.student_id, s.first_name, s.last_name, s.phone, s.semester, s.enrollment_date,
                d.id AS department_id, d.name AS department_name, d.code AS department_code
         FROM students s
         JOIN departments d ON s.department_id = d.id
         WHERE s.user_id = ?`,
        [user.id]
      );
      if (students.length > 0) {
        profile = students[0];
        studentProfileId = profile.id;
      }
    } else if (user.role === 'faculty') {
      const faculty = await query(
        `SELECT f.id, f.faculty_id, f.first_name, f.last_name, f.phone, f.designation,
                d.id AS department_id, d.name AS department_name, d.code AS department_code
         FROM faculty f
         JOIN departments d ON f.department_id = d.id
         WHERE f.user_id = ?`,
        [user.id]
      );
      if (faculty.length > 0) {
        profile = faculty[0];
        facultyProfileId = profile.id;
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        studentProfileId,
        facultyProfileId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

export const getDemoAccounts = (req, res) => {
  return res.status(200).json({
    success: true,
    accounts: [
      {
        role: 'Administrator',
        email: 'admin@college.edu',
        password: 'Admin@123',
        description: 'Full administrative access to all modules and reports'
      },
      {
        role: 'Faculty',
        email: 'faculty@college.edu',
        password: 'Faculty@123',
        description: 'Dr. Alan Turing (CS Dept) - Course instructor, attendance & marks'
      },
      {
        role: 'Student',
        email: 'student@college.edu',
        password: 'Student@123',
        description: 'Alice Johnson (CS Dept) - Course registration, attendance & results'
      }
    ]
  });
};

