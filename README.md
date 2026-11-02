# Apex College Management Portal (SE Project MVP)

A full-stack, responsive, and robust **College Management Portal** built for our Software Engineering college project. The portal features role-based access control (Student, Faculty, Administrator), academic record administration, attendance tracking, examination grading, real-time reports with CSV export, and an ACID-compliant **Course Registration Module** featuring transactional row-locking concurrency control.

---

## 1. Technology Stack

- **Frontend:** React 18 with Vite, Tailwind CSS, Lucide React icons, Axios
- **Backend:** Node.js with Express.js, REST API architecture
- **Database:** MySQL 8.4 (InnoDB engine, parameterized queries, atomic transactions, row-level locking)
- **Authentication:** JSON Web Tokens (JWT) & Bcrypt password hashing
- **Testing:** Vitest 2.1.9, Supertest 7.0.0, Testing Library React, JSDOM
- **Platform:** Ubuntu Linux / VS Code / Antigravity IDE

---

## 2. Functional Modules Implemented

1. **Authentication & RBAC:**
   - Role-based access control (Student, Faculty, Administrator).
   - Secure Bcrypt password hashing (10 salt rounds).
   - JWT tokens with role-specific payload validation and authorization middleware.
   - Interactive 1-click Demo Account selectors on the login page for effortless local evaluation.
2. **Student Management:**
   - Administrators can view, search, filter, add, edit, and delete student records.
   - Field validations for unique student IDs and emails.
   - Students can view their academic profile with security safeguards preventing modification of administrative records.
3. **Faculty Management:**
   - Administrators can manage instructor profiles, departments, and academic designations.
   - Faculty members can view their instructional profiles and assigned teaching modules.
4. **Course Management & Course Registration (Primary Focus Module):**
   - Administrators create and configure courses with credit weightings, instructor assignments, and maximum capacities.
   - Students can browse available courses with live capacity meters (`enrolled / capacity`) and real-time seat counts.
   - **Atomic Concurrency Protection:** Backend uses `SELECT ... FOR UPDATE` inside MySQL transactions to serialize enrollment requests, blocking over-capacity enrollments even under simultaneous concurrent submissions.
   - Duplicate registrations are rejected with HTTP 409 and descriptive feedback.
   - Students can view their enrolled course roster and safely drop courses with confirmation modals.
5. **Attendance Management:**
   - Faculty instructors record session attendance (Present / Absent) for enrolled students in their assigned courses.
   - Duplicate prevention enforces one record per student, course, and date (`UNIQUE(student_id, course_id, attendance_date)`).
   - Students can view their cumulative attendance percentages and historical logs per course.
6. **Result Management:**
   - Faculty can enter and update numerical marks (0 - 100) for enrolled students.
   - Automatic letter grade calculation (A+, A, B, C, D, F).
   - Students can view their official grade transcripts with calculated semester averages and earned credits.
7. **Report Generation & CSV Export:**
   - Administrator dashboard with live metrics: total students, faculty, courses, seat occupancy %, and attendance rates.
   - Department distributions and grade breakdowns calculated using real MySQL queries.
   - One-click CSV exports for Enrollments, Attendance compliance (< 75%), and Exam Results.

---

## 3. Project Directory Structure

```
College Management SE/
├── package.json                 # Root orchestration scripts
├── .env.example                 # Environment variables template
├── .env                         # Local active environment configuration
├── .gitignore                   # Excludes node_modules, .env, logs
├── scripts/
│   ├── start-mysql.sh           # Shell script to start local MySQL daemon
│   ├── init-db.js               # Database schema initialization script
│   ├── seed-db.js               # Comprehensive realistic demo data seeder (10+ records/table)
│   ├── run-queries.js           # Interactive executor for the 15 required SQL operations
│   └── reset-db.js              # Safe interactive database reset procedure
├── backend/
│   ├── package.json
│   ├── vitest.config.js         # Backend test configuration
│   ├── src/
│   │   ├── app.js               # Express application setup, routes & static fallback
│   │   ├── server.js            # Server entry point
│   │   ├── config/
│   │   │   └── db.js            # MySQL2 connection pool (supports socket & host/port)
│   │   ├── db/
│   │   │   ├── schema.sql       # Normalized MySQL DDL schema (with CHECK constraints)
│   │   │   ├── procedures_triggers.sql # Stored Procedures, Functions, Triggers & Cursor
│   │   │   └── queries.sql      # 15 Meaningful SQL operations
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT authentication and RBAC middleware
│   │   │   └── errorHandler.js  # Centralized error handler
│   │   ├── services/
│   │   │   └── enrollment.service.js # Transactional course registration & concurrency
│   │   ├── controllers/         # REST API route handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── course.controller.js
│   │   │   ├── enrollment.controller.js
│   │   │   ├── student.controller.js
│   │   │   ├── faculty.controller.js
│   │   │   ├── attendance.controller.js
│   │   │   ├── result.controller.js
│   │   │   └── report.controller.js
│   │   └── routes/              # Express API routers
│   └── tests/                   # Automated Vitest/Supertest test suites
│       ├── setup.js             # Test database isolation setup
│       ├── auth.test.js         # Authentication & RBAC tests (8 tests)
│       ├── course-registration.test.js # Required scenarios 1–9 + drop (10 tests)
│       └── academic-modules.test.js    # Student, Faculty, Attendance, Results, Reports (13 tests)
├── frontend/
│   ├── package.json
│   ├── vite.config.js           # Vite configuration with API proxy to port 5000
│   ├── tailwind.config.js       # Tailwind CSS theme configuration
│   ├── index.html
│   ├── vitest.config.js         # Frontend component test configuration
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # Client-side routing with ProtectedRoute
│       ├── index.css            # Tailwind styles
│       ├── context/
│       │   └── AuthContext.jsx  # Authentication session state
│       ├── services/
│       │   └── api.js           # Axios API client
│       ├── components/common/   # Reusable UI (Navbar, Sidebar, Modal, ConfirmDialog, StatCard, Badge, Alert)
│       ├── pages/
│       │   ├── Login.jsx        # Login page with 1-click demo accounts
│       │   ├── admin/           # Admin Dashboard, Courses, Students, Faculty, Reports
│       │   ├── faculty/         # Faculty Dashboard, Attendance, Results, Profile
│       │   └── student/         # Student Dashboard, Course Registration, Attendance, Results, Profile
│       └── test/                # Frontend component unit tests (5 tests)
└── docs/
    ├── TEST_REPORT.md           # Formal test report with test cases & execution results
    ├── DATABASE_SCHEMA.md       # Relational schema specification & ER diagram
    ├── SQL_QUERIES.md           # Formal specifications and output tables for 15 SQL operations
    └── API_SPEC.md              # REST API endpoint documentation
```

---

## 4. Prerequisites

- **Operating System:** Ubuntu Linux (or any standard Linux/macOS/WSL environment)
- **Node.js:** v18.0.0 or higher (v24.x tested and verified)
- **npm:** v9.0.0 or higher
- **MySQL:** MySQL Server 8.0+ or 8.4

---

## 5. Database Setup & Initialization

### A. Start MySQL
If your MySQL server is not currently running as a background service, use the included helper script:
```bash
npm run db:start
```
*Note: This automatically initializes a local data directory at `/tmp/college_mysql` and starts `mysqld` on socket `/tmp/college_mysql/mysql.sock` without requiring root permissions.*

### B. Initialize Database Schema
Run the initialization script to create the development database (`college_mgmt`) and isolated test database (`college_mgmt_test`):
```bash
npm run db:init
```

### C. Seed Realistic Demo Data
Populate both databases with fictional students, faculty instructors, courses, enrollments, attendance sessions, and grades:
```bash
npm run db:seed
```

### D. Execute 15 Demonstration SQL Queries
To execute and print formatted results for the 15 required SQL operations (retrieval, multi-table joins, conditional aggregations, correlated/nested subqueries, and set operations):
```bash
npm run db:queries
```

### E. Safe Reset / Reseed Procedure
To reset and reseed the development database at any time, run:
```bash
npm run db:reset
```
> ⚠️ **Safety Warning:** This command will prompt for explicit confirmation before dropping existing data. To bypass in automated CI environments, pass the `--yes` flag: `npm run db:reset -- --yes`.

---

## 6. Starting the Application

### Option A: Development Mode (Recommended)
Runs both the Express backend API (Port 5000) and the React Vite dev server (Port 5173 with hot reloading):
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### Option B: Standalone Production Mode
Builds the frontend and runs the Express server serving both the REST API and the production client:
```bash
npm --prefix frontend run build
npm start --prefix backend
```
Open **`http://localhost:5000`** in your browser.

---

## 7. Demo Accounts for Local Testing

The login page features **1-Click Demo Account Buttons** for instant evaluation:

| Role | Email Address | Password | Permissions & Sample Data |
|---|---|---|---|
| **Administrator** | `admin@college.edu` | `Admin@123` | Full access: Course catalog CRUD, Student directory, Faculty management, Institutional reports, CSV exports. |
| **Faculty Member** | `faculty@college.edu` | `Faculty@123` | Dr. Alan Turing (CS Dept): Mark attendance for assigned courses, enter/update student exam marks. |
| **Student** | `student@college.edu` | `Student@123` | Alice Johnson (CS Dept, Sem 3): Course registration portal, drop courses, view personal attendance %, view grade transcript. |

Additional student accounts for testing capacity and concurrency:
- Bob Smith: `bob@college.edu` / `Student@123`
- Charlie Brown: `charlie@college.edu` / `Student@123`
- Diana Prince: `diana@college.edu` / `Student@123`
- Ethan Hunt: `ethan@college.edu` / `Student@123`

---

## 8. Running Automated Tests

The project includes **36 automated tests** covering backend APIs, MySQL transactions, concurrency safety, and frontend components:

```bash
# Run all tests (Backend API + Frontend Components)
npm test

# Run only Backend Vitest / Supertest tests
npm run test:backend

# Run only Frontend UI Component tests
npm run test:frontend
```

### Scenarios Verified in Automated Tests:
1. **Scenario 1:** Valid student registers for an available course.
2. **Scenario 2:** Registration is rejected when a course has reached full capacity.
3. **Scenario 3:** Duplicate registration attempt for the same course is rejected (HTTP 409).
4. **Scenario 4:** Registration for a nonexistent course returns HTTP 404.
5. **Scenario 5:** Missing or invalid course ID returns HTTP 400.
6. **Scenario 6:** Unauthenticated requests return HTTP 401.
7. **Scenario 7:** Role-restricted actions by unauthorized users return HTTP 403.
8. **Scenario 8:** Failed registration does not create an orphan record in MySQL.
9. **Scenario 9:** Simultaneous concurrent registration requests (`Promise.all`) cannot exceed course capacity.
10. **Scenario 10:** Safe course dropping frees seat capacity.

---

## 9. Common Errors and Troubleshooting

1. **MySQL connection error (`ECONNREFUSED` or `Can't connect to local MySQL server`)**:
   - Ensure the MySQL daemon is active: run `npm run db:start`.
   - Verify that `.env` contains `DB_SOCKET=/tmp/college_mysql/mysql.sock` or your system's `DB_HOST` and `DB_PORT`.
2. **Port 5000 or 5173 already in use**:
   - Check if an existing server process is running: `lsof -i :5000` or `lsof -i :5173`.
   - Update `PORT` in `.env` to a different port (e.g., 5001).
3. **Session Expired on page refresh**:
   - JWT tokens are set to expire in 24 hours. If token is invalid or user was removed, log in again using the demo buttons.

---

## 10. Known Limitations

- **Email Delivery:** Password resets and email notifications are simulated in the local environment and are not dispatched via an external SMTP service (by design, to avoid external cloud dependencies).
- **Single Institutional Term:** The current MVP manages active semester enrollments; archiving historical semesters can be performed via database migrations.

---

## 11. Authors & Academic Acknowledgement

Built for Database Systems and Software Engineering Project Course.
Stack: React (Vite) + Express.js + MySQL 8.4 + Vitest.

