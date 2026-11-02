import express from 'express';
import {
  registerCourse,
  dropCourse,
  getMyEnrollments,
  getCourseEnrollments
} from '../controllers/enrollment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Student routes
router.post('/register', authenticate, authorize(['student', 'admin']), registerCourse);
router.post('/drop', authenticate, authorize(['student', 'admin']), dropCourse);
router.get('/my-courses', authenticate, authorize(['student']), getMyEnrollments);

// Faculty & Admin roster route
router.get('/course/:courseId', authenticate, authorize(['faculty', 'admin']), getCourseEnrollments);

export default router;

