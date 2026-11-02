import express from 'express';
import {
  getAllStudents,
  getStudentById,
  getMyProfile,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/student.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Student self profile
router.get('/profile/me', authenticate, authorize(['student']), getMyProfile);

// Admin-only listing & operations
router.get('/', authenticate, authorize(['admin', 'faculty']), getAllStudents);
router.get('/:id', authenticate, authorize(['admin', 'student']), getStudentById);
router.post('/', authenticate, authorize(['admin']), createStudent);
router.put('/:id', authenticate, authorize(['admin']), updateStudent);
router.delete('/:id', authenticate, authorize(['admin']), deleteStudent);

export default router;

