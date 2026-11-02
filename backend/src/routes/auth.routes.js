import express from 'express';
import { login, getMe, logout, getDemoAccounts } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/demo-accounts', getDemoAccounts);
router.get('/me', authenticate, getMe);

export default router;

