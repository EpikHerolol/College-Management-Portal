import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from backend or root
const rootEnv = path.resolve(process.cwd(), '../.env');
const localEnv = path.resolve(process.cwd(), '.env');
if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

const dbName = process.env.NODE_ENV === 'test'
  ? (process.env.DB_TEST_NAME || 'college_mgmt_test')
  : (process.env.DB_NAME || 'college_mgmt');

const socketPath = process.env.DB_SOCKET;
const useSocket = socketPath && fs.existsSync(socketPath);

const dbConfig = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  decimalNumbers: true,
  timezone: '+00:00',
  multipleStatements: true
};

if (useSocket) {
  dbConfig.socketPath = socketPath;
} else {
  dbConfig.host = process.env.DB_HOST || '127.0.0.1';
  dbConfig.port = parseInt(process.env.DB_PORT || '3306', 10);
}

const pool = mysql.createPool(dbConfig);

export const query = async (sql, params = []) => {
  const [results] = await pool.query(sql, params);
  return results;
};

export const execute = async (sql, params = []) => {
  const [results] = await pool.execute(sql, params);
  return results;
};

export const getConnection = async () => {
  return await pool.getConnection();
};

export const ping = async () => {
  const [res] = await pool.query('SELECT 1 AS alive');
  return res[0]?.alive === 1;
};

export default pool;

