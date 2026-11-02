import express from 'express';
import {
  getAllFaculty,
  getFacultyById,
  getMyFacultyProfile,
  createFaculty,
  updateFaculty,
  deleteFaculty
} from '../controllers/faculty.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Faculty self profile
router.get('/profile/me', authenticate, authorize(['faculty']), getMyFacultyProfile);

// Admin & authenticated routes
router.get('/', authenticate, getAllFaculty);
router.get('/:id', authenticate, getFacultyById);
router.post('/', authenticate, authorize(['admin']), createFaculty);
router.put('/:id', authenticate, authorize(['admin']), updateFaculty);
router.delete('/:id', authenticate, authorize(['admin']), deleteFaculty);

export default router;

