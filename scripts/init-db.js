import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const socketPath = process.env.DB_SOCKET;
const useSocket = socketPath && fs.existsSync(socketPath);

const dbConfig = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 5
};

if (useSocket) {
  dbConfig.socketPath = socketPath;
} else {
  dbConfig.host = process.env.DB_HOST || '127.0.0.1';
  dbConfig.port = parseInt(process.env.DB_PORT || '3306', 10);
}

export async function initDatabase(targetDb = null) {
  const dbToInit = targetDb || process.env.DB_NAME || 'college_mgmt';
  console.log(`[DB INIT] Initializing database "${dbToInit}"...`);

  // Connect without database to ensure DB exists
  const rootConn = await mysql.createConnection(dbConfig);
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbToInit}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.end();

  // Connect to target DB and apply schema
  const dbConn = await mysql.createConnection({
    ...dbConfig,
    database: dbToInit
  });

  const schemaPath = path.resolve(__dirname, '../backend/src/db/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  await dbConn.query(schemaSql);
  console.log(`[DB INIT] Schema successfully applied to "${dbToInit}".`);

  // Apply stored procedures, functions, triggers, and cursors
  const procPath = path.resolve(__dirname, '../backend/src/db/procedures_triggers.sql');
  if (fs.existsSync(procPath)) {
    const procSql = fs.readFileSync(procPath, 'utf8');
    const chunks = procSql.split('$$').map(c => c.trim()).filter(Boolean);
    for (const chunk of chunks) {
      let stmt = chunk
        .replace(/^DELIMITER\s*.*$/gim, '')
        .replace(/USE\s+[^;]+;/gi, '')
        .trim();
      if (stmt && stmt.length > 5) {
        await dbConn.query(stmt);
      }
    }
    console.log(`[DB INIT] Procedures, functions, triggers, and cursors applied to "${dbToInit}".`);
  }

  await dbConn.end();
}

// If executed directly
if (process.argv[1] === __filename) {
  try {
    const target = process.argv[2] || process.env.DB_NAME || 'college_mgmt';
    await initDatabase(target);
    // Also init test database if requested or by default
    if (process.env.DB_TEST_NAME) {
      await initDatabase(process.env.DB_TEST_NAME);
    }
    console.log('[DB INIT] Complete!');
    process.exit(0);
  } catch (err) {
    console.error('[DB INIT] Error:', err);
    process.exit(1);
  }
}

