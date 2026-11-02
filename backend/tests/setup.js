import { beforeAll, afterAll } from 'vitest';
import pool from '../src/config/db.js';
import { seedDatabase } from '../../scripts/seed-db.js';

beforeAll(async () => {
  // Ensure college_mgmt_test is seeded with clean state
  await seedDatabase('college_mgmt_test');
});

afterAll(async () => {
  // Cleanly close pool connection after all tests run
  await pool.end();
});

