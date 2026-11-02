import express from 'express';
import {
  enterOrUpdateResult,
  getCourseResults,
  getMyResults,
  getAllResults
} from '../controllers/result.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Faculty/Admin enter marks
router.post('/enter', authenticate, authorize(['faculty', 'admin']), enterOrUpdateResult);

// Faculty/Admin view results for a course
router.get('/course/:courseId', authenticate, authorize(['faculty', 'admin']), getCourseResults);

// Student view own results
router.get('/my-results', authenticate, authorize(['student']), getMyResults);

// Admin view all results
router.get('/', authenticate, authorize(['admin']), getAllResults);

export default router;

