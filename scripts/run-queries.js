import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  database: process.env.DB_NAME || 'college_mgmt'
};

if (useSocket) {
  dbConfig.socketPath = socketPath;
} else {
  dbConfig.host = process.env.DB_HOST || '127.0.0.1';
  dbConfig.port = parseInt(process.env.DB_PORT || '3306', 10);
}

async function runQueries() {
  console.log(`[QUERIES] Connecting to "${dbConfig.database}" to execute 15 SQL operations...\n`);
  const conn = await mysql.createConnection(dbConfig);

  try {
    const queriesFile = path.resolve(__dirname, '../backend/src/db/queries.sql');
    const content = fs.readFileSync(queriesFile, 'utf8');

    // Split queries by semicolon, ignoring USE and comment-only chunks
    const rawStatements = content
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        if (!s || s.length === 0) return false;
        const cleaned = s.replace(/--.*$/gm, '').trim();
        return cleaned.length > 0 && !cleaned.toUpperCase().startsWith('USE');
      });

    let count = 0;
    for (const stmt of rawStatements) {
      // Find comment header if any
      const lines = stmt.split('\n');
      const headerLine = lines.find(l => l.trim().startsWith('-- Query')) || `Query ${count + 1}`;
      const queryTitle = headerLine.replace(/^--\s*/, '').trim();

      count++;
      console.log(`================================================================================`);
      console.log(`[OPERATION ${count}] ${queryTitle}`);
      console.log(`================================================================================`);

      const [rows] = await conn.query(stmt);
      if (Array.isArray(rows)) {
        if (rows.length === 0) {
          console.log('(0 rows returned)\n');
        } else {
          console.table(rows);
          console.log(`Count: ${rows.length} row(s)\n`);
        }
      } else {
        console.log(`Affected rows: ${rows.affectedRows}\n`);
      }
    }

    console.log(`[QUERIES] Successfully executed all ${count} SQL operations!`);
  } finally {
    await conn.end();
  }
}

runQueries().catch(err => {
  console.error('[QUERIES ERROR]', err.message);
  process.exit(1);
});
