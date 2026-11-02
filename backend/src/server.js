import app from './app.js';
import { ping } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const isDbConnected = await ping();
    if (!isDbConnected) {
      console.error('❌ Failed to connect to MySQL database.');
      console.error('👉 Start MySQL by running: npm run db:start');
      process.exit(1);
    }
    console.log('✅ Connected to MySQL database successfully.');

    const server = app.listen(PORT, () => {
      console.log(`🚀 College Management API Server running on http://localhost:${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use by another process.`);
        console.error(`👉 To free port ${PORT}, run: fuser -k ${PORT}/tcp or npx kill-port ${PORT}`);
      } else {
        console.error('❌ Server error:', err.message || err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ Error during server startup:', err.message || err);
    if (err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('ENOENT'))) {
      console.error('👉 MySQL database is offline. Please start it with: npm run db:start');
    }
    process.exit(1);
  }
}

startServer();

