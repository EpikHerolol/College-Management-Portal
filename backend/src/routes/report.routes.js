import express from 'express';
import {
  getDashboardStats,
  getEnrollmentReport,
  getAttendanceReport,
  getResultReport,
  exportReportCsv
} from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard-stats', authenticate, authorize(['admin']), getDashboardStats);
router.get('/enrollments', authenticate, authorize(['admin']), getEnrollmentReport);
router.get('/attendance', authenticate, authorize(['admin']), getAttendanceReport);
router.get('/results', authenticate, authorize(['admin']), getResultReport);
router.get('/export/:reportType', authenticate, authorize(['admin']), exportReportCsv);

export default router;

