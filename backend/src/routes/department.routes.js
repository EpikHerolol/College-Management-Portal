import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const departments = await query('SELECT id, code, name, description FROM departments ORDER BY name ASC');
    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (err) {
    next(err);
  }
});

export default router;

