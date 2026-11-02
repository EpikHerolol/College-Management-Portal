import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import studentRoutes from './routes/student.routes.js';
import facultyRoutes from './routes/faculty.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import resultRoutes from './routes/result.routes.js';
import reportRoutes from './routes/report.routes.js';
import departmentRoutes from './routes/department.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/departments', departmentRoutes);

// Serve static frontend build if it exists
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Fallback & Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
