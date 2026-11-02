import express from 'express';
import {
  markAttendance,
  getCourseAttendance,
  getMyAttendance
} from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Faculty/Admin mark attendance
router.post('/mark', authenticate, authorize(['faculty', 'admin']), markAttendance);

// Faculty/Admin view attendance for a course
router.get('/course/:courseId', authenticate, authorize(['faculty', 'admin']), getCourseAttendance);

// Student view own attendance
router.get('/my-attendance', authenticate, authorize(['student']), getMyAttendance);

export default router;

