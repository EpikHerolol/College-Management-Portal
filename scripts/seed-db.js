import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initDatabase } from './init-db.js';

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
  waitForConnections: true,
  connectionLimit: 5
};

if (useSocket) {
  dbConfig.socketPath = socketPath;
} else {
  dbConfig.host = process.env.DB_HOST || '127.0.0.1';
  dbConfig.port = parseInt(process.env.DB_PORT || '3306', 10);
}

export async function seedDatabase(targetDb = null) {
  const dbName = targetDb || process.env.DB_NAME || 'college_mgmt';
  
  // Ensure the database and schema exist before attempting to seed
  await initDatabase(dbName);

  console.log(`[DB SEED] Seeding database "${dbName}"...`);

  const conn = await mysql.createConnection({
    ...dbConfig,
    database: dbName
  });

  try {
    // Disable foreign key checks for clean wiping of tables
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
    const tables = [
      'attendance_defaulters',
      'results',
      'attendance',
      'enrollments',
      'courses',
      'students',
      'faculty',
      'departments',
      'users'
    ];
    for (const tbl of tables) {
      await conn.query(`TRUNCATE TABLE \`${tbl}\`;`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 1. Departments (10 departments)
    console.log('[DB SEED] Inserting 10 departments...');
    const [deptRes] = await conn.query(`
      INSERT INTO departments (code, name, description) VALUES
      ('CS', 'Computer Science and Engineering', 'Department of Computer Science and Software Engineering'),
      ('ECE', 'Electronics and Communication', 'Department of Electronics and Telecommunications'),
      ('ME', 'Mechanical Engineering', 'Department of Mechanical Engineering and Robotics'),
      ('MATH', 'Mathematics and Computing', 'Department of Applied Mathematics and Computing'),
      ('IT', 'Information Technology', 'Department of Information Systems and Cloud Computing'),
      ('EE', 'Electrical Engineering', 'Department of Power Systems and Power Electronics'),
      ('CE', 'Civil Engineering', 'Department of Structural and Environmental Engineering'),
      ('CHE', 'Chemical Engineering', 'Department of Process Engineering and Biotechnology'),
      ('BIO', 'Biotechnology Engineering', 'Department of Biological Engineering and Bioinformatics'),
      ('PHY', 'Applied Physics', 'Department of Materials Science and Nanotechnology');
    `);

    const csDeptId = 1;
    const eceDeptId = 2;
    const meDeptId = 3;
    const mathDeptId = 4;
    const itDeptId = 5;
    const eeDeptId = 6;
    const ceDeptId = 7;
    const cheDeptId = 8;
    const bioDeptId = 9;
    const phyDeptId = 10;

    // 2. Users (Admin, 10 Faculty, 12 Students -> 23 Users)
    console.log('[DB SEED] Inserting 23 users...');
    const adminPassHash = await bcrypt.hash('Admin@123', 10);
    const facultyPassHash = await bcrypt.hash('Faculty@123', 10);
    const studentPassHash = await bcrypt.hash('Student@123', 10);

    // Admin
    const [adminUserRes] = await conn.query(
      `INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')`,
      ['admin@college.edu', adminPassHash]
    );

    // 10 Faculty Users
    const facultyUsers = [
      ['faculty@college.edu', facultyPassHash],
      ['shannon@college.edu', facultyPassHash],
      ['lovelace@college.edu', facultyPassHash],
      ['neumann@college.edu', facultyPassHash],
      ['wirth@college.edu', facultyPassHash],
      ['backus@college.edu', facultyPassHash],
      ['hamilton@college.edu', facultyPassHash],
      ['liskov@college.edu', facultyPassHash],
      ['lee@college.edu', facultyPassHash],
      ['ritchie@college.edu', facultyPassHash]
    ];
    const facUserIds = [];
    for (const [em, pw] of facultyUsers) {
      const [res] = await conn.query(`INSERT INTO users (email, password, role) VALUES (?, ?, 'faculty')`, [em, pw]);
      facUserIds.push(res.insertId);
    }

    // 12 Student Users
    const studentUsers = [
      ['student@college.edu', studentPassHash],
      ['bob@college.edu', studentPassHash],
      ['charlie@college.edu', studentPassHash],
      ['diana@college.edu', studentPassHash],
      ['ethan@college.edu', studentPassHash],
      ['fiona@college.edu', studentPassHash],
      ['george@college.edu', studentPassHash],
      ['hannah@college.edu', studentPassHash],
      ['ian@college.edu', studentPassHash],
      ['julia@college.edu', studentPassHash],
      ['kevin@college.edu', studentPassHash],
      ['laura@college.edu', studentPassHash]
    ];
    const stuUserIds = [];
    for (const [em, pw] of studentUsers) {
      const [res] = await conn.query(`INSERT INTO users (email, password, role) VALUES (?, ?, 'student')`, [em, pw]);
      stuUserIds.push(res.insertId);
    }

    // 3. Faculty Profiles (10 records)
    console.log('[DB SEED] Inserting 10 faculty records...');
    const facultyData = [
      [facUserIds[0], 'FAC-2024-001', 'Alan', 'Turing', 'faculty@college.edu', '+1-555-0101', csDeptId, 'Professor'],
      [facUserIds[1], 'FAC-2024-002', 'Claude', 'Shannon', 'shannon@college.edu', '+1-555-0102', eceDeptId, 'Associate Professor'],
      [facUserIds[2], 'FAC-2024-003', 'Ada', 'Lovelace', 'lovelace@college.edu', '+1-555-0103', csDeptId, 'Assistant Professor'],
      [facUserIds[3], 'FAC-2024-004', 'John', 'von Neumann', 'neumann@college.edu', '+1-555-0104', mathDeptId, 'Professor'],
      [facUserIds[4], 'FAC-2024-005', 'Niklaus', 'Wirth', 'wirth@college.edu', '+1-555-0105', itDeptId, 'Professor'],
      [facUserIds[5], 'FAC-2024-006', 'John', 'Backus', 'backus@college.edu', '+1-555-0106', csDeptId, 'Professor'],
      [facUserIds[6], 'FAC-2024-007', 'Margaret', 'Hamilton', 'hamilton@college.edu', '+1-555-0107', eeDeptId, 'Associate Professor'],
      [facUserIds[7], 'FAC-2024-008', 'Barbara', 'Liskov', 'liskov@college.edu', '+1-555-0108', ceDeptId, 'Professor'],
      [facUserIds[8], 'FAC-2024-009', 'Tim', 'Berners-Lee', 'lee@college.edu', '+1-555-0109', cheDeptId, 'Associate Professor'],
      [facUserIds[9], 'FAC-2024-010', 'Dennis', 'Ritchie', 'ritchie@college.edu', '+1-555-0110', bioDeptId, 'Associate Professor']
    ];
    const facIds = [];
    for (const row of facultyData) {
      const [res] = await conn.query(
        `INSERT INTO faculty (user_id, faculty_id, first_name, last_name, email, phone, department_id, designation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
      facIds.push(res.insertId);
    }

    const fac1Id = facIds[0];
    const fac2Id = facIds[1];
    const fac3Id = facIds[2];
    const fac4Id = facIds[3];
    const fac5Id = facIds[4];
    const fac6Id = facIds[5];
    const fac7Id = facIds[6];
    const fac8Id = facIds[7];
    const fac9Id = facIds[8];
    const fac10Id = facIds[9];

    // 4. Student Profiles (12 records)
    console.log('[DB SEED] Inserting 12 student records...');
    const studentData = [
      [stuUserIds[0], 'STU-2024-001', 'Alice', 'Johnson', 'student@college.edu', '+1-555-0201', csDeptId, 3, '2024-08-15'],
      [stuUserIds[1], 'STU-2024-002', 'Bob', 'Smith', 'bob@college.edu', '+1-555-0202', csDeptId, 3, '2024-08-15'],
      [stuUserIds[2], 'STU-2024-003', 'Charlie', 'Brown', 'charlie@college.edu', '+1-555-0203', eceDeptId, 3, '2024-08-15'],
      [stuUserIds[3], 'STU-2024-004', 'Diana', 'Prince', 'diana@college.edu', '+1-555-0204', meDeptId, 1, '2024-08-15'],
      [stuUserIds[4], 'STU-2024-005', 'Ethan', 'Hunt', 'ethan@college.edu', '+1-555-0205', csDeptId, 1, '2024-08-15'],
      [stuUserIds[5], 'STU-2024-006', 'Fiona', 'Gallagher', 'fiona@college.edu', '+1-555-0206', csDeptId, 3, '2024-08-15'],
      [stuUserIds[6], 'STU-2024-007', 'George', 'Clark', 'george@college.edu', '+1-555-0207', mathDeptId, 2, '2024-08-15'],
      [stuUserIds[7], 'STU-2024-008', 'Hannah', 'Abbott', 'hannah@college.edu', '+1-555-0208', eceDeptId, 2, '2024-08-15'],
      [stuUserIds[8], 'STU-2024-009', 'Ian', 'Malcolm', 'ian@college.edu', '+1-555-0209', meDeptId, 4, '2024-08-15'],
      [stuUserIds[9], 'STU-2024-010', 'Julia', 'Roberts', 'julia@college.edu', '+1-555-0210', itDeptId, 1, '2024-08-15'],
      [stuUserIds[10], 'STU-2024-011', 'Kevin', 'Bacon', 'kevin@college.edu', '+1-555-0211', eeDeptId, 2, '2024-08-15'],
      [stuUserIds[11], 'STU-2024-012', 'Laura', 'Croft', 'laura@college.edu', '+1-555-0212', ceDeptId, 3, '2024-08-15']
    ];

    const stuIds = [];
    for (const row of studentData) {
      const [res] = await conn.query(
        `INSERT INTO students (user_id, student_id, first_name, last_name, email, phone, department_id, semester, enrollment_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
      stuIds.push(res.insertId);
    }

    const stu1Id = stuIds[0];
    const stu2Id = stuIds[1];
    const stu3Id = stuIds[2];
    const stu4Id = stuIds[3];
    const stu5Id = stuIds[4];
    const stu6Id = stuIds[5];
    const stu7Id = stuIds[6];
    const stu8Id = stuIds[7];
    const stu9Id = stuIds[8];
    const stu10Id = stuIds[9];
    const stu11Id = stuIds[10];
    const stu12Id = stuIds[11];

    // 5. Courses (12 records)
    console.log('[DB SEED] Inserting 12 courses...');
    const courseData = [
      ['CS101', 'Introduction to Computer Science', 'Foundations of computation, algorithms, and Python programming.', csDeptId, 4, fac1Id, 30, 1, 'active'],
      ['CS201', 'Data Structures & Algorithms', 'Stacks, queues, trees, graphs, sorting, and dynamic programming.', csDeptId, 4, fac3Id, 25, 3, 'active'],
      ['CS301', 'Database Management Systems', 'Relational models, SQL, transactions, normalization, and indexing.', csDeptId, 3, fac1Id, 20, 3, 'active'],
      ['CS401', 'Distributed Cloud Architecture', 'Consensus protocols, microservices, and distributed consistency.', csDeptId, 3, fac3Id, 2, 4, 'active'], // Capacity 2 for concurrency testing
      ['EC101', 'Digital Logic & Circuits', 'Boolean algebra, combinational and sequential circuit design.', eceDeptId, 4, fac2Id, 30, 1, 'active'],
      ['ME101', 'Engineering Mechanics', 'Statics, dynamics, vector mechanics, and friction analysis.', meDeptId, 3, null, 35, 1, 'active'],
      ['MATH101', 'Linear Algebra & Discrete Math', 'Matrices, vector spaces, eigenvalues, and combinatorics.', mathDeptId, 4, fac4Id, 40, 1, 'active'],
      ['IT201', 'Web & Cloud Technologies', 'REST APIs, reactive web interfaces, containerization, and cloud deployment.', itDeptId, 3, fac5Id, 30, 3, 'active'],
      ['EE101', 'Basic Electrical Engineering', 'Network theorems, AC fundamentals, magnetic circuits, and transformers.', eeDeptId, 4, fac7Id, 35, 1, 'active'],
      ['CE101', 'Structural Analysis & Mechanics', 'Stress, strain, shear forces, bending moments, and structural integrity.', ceDeptId, 3, fac8Id, 30, 1, 'active'],
      ['CHE101', 'Chemical Process Principles', 'Material balances, energy balances, phase equilibria, and reactors.', cheDeptId, 3, fac9Id, 25, 1, 'active'],
      ['BIO101', 'Fundamentals of Bio-computation', 'Molecular genetics, sequence alignment, algorithms in bioinformatics.', bioDeptId, 3, fac10Id, 25, 1, 'active']
    ];

    const courseIds = [];
    for (const c of courseData) {
      const [res] = await conn.query(
        `INSERT INTO courses (course_code, title, description, department_id, credits, faculty_id, capacity, semester, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        c
      );
      courseIds.push(res.insertId);
    }

    const c1Id = courseIds[0];
    const c2Id = courseIds[1];
    const c3Id = courseIds[2];
    const c4Id = courseIds[3];
    const c5Id = courseIds[4];
    const c6Id = courseIds[5];
    const c7Id = courseIds[6];
    const c8Id = courseIds[7];
    const c9Id = courseIds[8];
    const c10Id = courseIds[9];
    const c11Id = courseIds[10];
    const c12Id = courseIds[11];

    // 6. Enrollments (23 records)
    console.log('[DB SEED] Inserting 23 enrollments...');
    const enrollmentPairs = [
      // Original required test enrollments
      [stu1Id, c1Id], [stu1Id, c2Id], [stu1Id, c3Id],
      [stu2Id, c1Id], [stu2Id, c2Id], [stu2Id, c4Id],
      [stu3Id, c5Id],
      [stu5Id, c1Id],
      // Additional student enrollments
      [stu6Id, c1Id], [stu6Id, c2Id], [stu6Id, c8Id],
      [stu7Id, c2Id], [stu7Id, c7Id],
      [stu8Id, c5Id], [stu8Id, c9Id],
      [stu9Id, c6Id], [stu9Id, c10Id],
      [stu10Id, c7Id], [stu10Id, c8Id],
      [stu11Id, c11Id], [stu11Id, c1Id],
      [stu12Id, c10Id], [stu12Id, c3Id]
    ];

    for (const [sId, cId] of enrollmentPairs) {
      await conn.query(
        `INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, 'enrolled')`,
        [sId, cId]
      );
    }

    // 7. Attendance (25 records)
    console.log('[DB SEED] Inserting 25 attendance records...');
    const attendanceRecords = [
      // CS101 sessions
      [stu1Id, c1Id, '2026-10-10', 'Present', fac1Id],
      [stu2Id, c1Id, '2026-10-10', 'Present', fac1Id],
      [stu5Id, c1Id, '2026-10-10', 'Present', fac1Id],
      [stu6Id, c1Id, '2026-10-10', 'Present', fac1Id],
      [stu11Id, c1Id, '2026-10-10', 'Absent', fac1Id],

      [stu1Id, c1Id, '2026-10-12', 'Present', fac1Id],
      [stu2Id, c1Id, '2026-10-12', 'Absent', fac1Id],
      [stu5Id, c1Id, '2026-10-12', 'Present', fac1Id],
      [stu6Id, c1Id, '2026-10-12', 'Present', fac1Id],
      [stu11Id, c1Id, '2026-10-12', 'Present', fac1Id],

      [stu1Id, c1Id, '2026-10-14', 'Present', fac1Id],
      [stu2Id, c1Id, '2026-10-14', 'Present', fac1Id],
      [stu5Id, c1Id, '2026-10-14', 'Absent', fac1Id],
      [stu6Id, c1Id, '2026-10-14', 'Present', fac1Id],
      [stu11Id, c1Id, '2026-10-14', 'Absent', fac1Id],

      // CS201 sessions
      [stu1Id, c2Id, '2026-10-11', 'Present', fac3Id],
      [stu2Id, c2Id, '2026-10-11', 'Present', fac3Id],
      [stu6Id, c2Id, '2026-10-11', 'Present', fac3Id],
      [stu7Id, c2Id, '2026-10-11', 'Absent', fac3Id],

      // EC101 sessions
      [stu3Id, c5Id, '2026-10-13', 'Present', fac2Id],
      [stu8Id, c5Id, '2026-10-13', 'Present', fac2Id],

      // MATH101 sessions
      [stu7Id, c7Id, '2026-10-15', 'Present', fac4Id],
      [stu10Id, c7Id, '2026-10-15', 'Present', fac4Id],

      // IT201 sessions
      [stu6Id, c8Id, '2026-10-16', 'Present', fac5Id],
      [stu10Id, c8Id, '2026-10-16', 'Absent', fac5Id]
    ];

    for (const record of attendanceRecords) {
      await conn.query(
        `INSERT INTO attendance (student_id, course_id, attendance_date, status, marked_by)
         VALUES (?, ?, ?, ?, ?)`,
        record
      );
    }

    // 8. Results (14 records)
    console.log('[DB SEED] Inserting 14 results...');
    const results = [
      // Original 5 test results
      [stu1Id, c1Id, 88.50, 100.00, 'A', 1, fac1Id],
      [stu1Id, c2Id, 94.00, 100.00, 'A+', 3, fac3Id],
      [stu2Id, c1Id, 76.00, 100.00, 'B', 1, fac1Id],
      [stu2Id, c2Id, 68.50, 100.00, 'C', 3, fac3Id],
      [stu3Id, c5Id, 82.00, 100.00, 'A', 1, fac2Id],
      // Additional results
      [stu5Id, c1Id, 85.00, 100.00, 'A', 1, fac1Id],
      [stu6Id, c1Id, 91.50, 100.00, 'A+', 1, fac1Id],
      [stu6Id, c2Id, 79.00, 100.00, 'B', 3, fac3Id],
      [stu7Id, c2Id, 84.00, 100.00, 'A', 3, fac3Id],
      [stu8Id, c5Id, 73.00, 100.00, 'B', 1, fac2Id],
      [stu9Id, c6Id, 65.00, 100.00, 'C', 1, fac1Id],
      [stu10Id, c7Id, 95.00, 100.00, 'A+', 1, fac4Id],
      [stu11Id, c1Id, 58.00, 100.00, 'D', 1, fac1Id],
      [stu12Id, c3Id, 90.00, 100.00, 'A+', 3, fac1Id]
    ];

    for (const res of results) {
      await conn.query(
        `INSERT INTO results (student_id, course_id, marks, max_marks, grade, semester, evaluator_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        res
      );
    }

    console.log(`[DB SEED] Database "${dbName}" seeded successfully with comprehensive demo data!`);
  } finally {
    await conn.end();
  }
}

if (process.argv[1] === __filename) {
  try {
    const target = process.argv[2] || process.env.DB_NAME || 'college_mgmt';
    await seedDatabase(target);
    process.exit(0);
  } catch (err) {
    console.error('[DB SEED] Error:', err);
    process.exit(1);
  }
}
