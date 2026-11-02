import express from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/course.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Anyone authenticated (or public for catalog) can view courses
router.get('/', authenticate, getAllCourses);
router.get('/:id', authenticate, getCourseById);

// Admin-only management
router.post('/', authenticate, authorize(['admin']), createCourse);
router.put('/:id', authenticate, authorize(['admin']), updateCourse);
router.delete('/:id', authenticate, authorize(['admin']), deleteCourse);

export default router;

