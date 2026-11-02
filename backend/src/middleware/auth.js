import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-college-portal-2026';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.'
      });
    }

    // Check if user still exists in database and is active
    const users = await query(
      'SELECT id, email, role, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || users[0].status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or no longer exists.'
      });
    }

    const user = users[0];

    // Load role-specific profile ID if applicable
    let profile = null;
    if (user.role === 'student') {
      const students = await query(
        'SELECT id, student_id, first_name, last_name, department_id, semester FROM students WHERE user_id = ?',
        [user.id]
      );
      if (students.length > 0) {
        profile = students[0];
        user.studentProfileId = profile.id;
        user.studentId = profile.student_id;
      }
    } else if (user.role === 'faculty') {
      const faculty = await query(
        'SELECT id, faculty_id, first_name, last_name, department_id, designation FROM faculty WHERE user_id = ?',
        [user.id]
      );
      if (faculty.length > 0) {
        profile = faculty[0];
        user.facultyProfileId = profile.id;
        user.facultyId = profile.faculty_id;
      }
    }

    req.user = {
      ...user,
      profile
    };

    next();
  } catch (err) {
    return next(err);
  }
};

export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] role(s). Your role is "${req.user.role}".`
      });
    }

    next();
  };
};

