# Comprehensive Test Report - College Management Portal

**Project:** College Management Portal (Software Engineering Academic MVP)  
**Selected Assessment Focus:** Course Management & Course Registration Module  
**Automated Testing Frameworks:** Vitest 2.1.9, Supertest 7.0.0, Testing Library React, jsdom  
**Database Under Test:** MySQL 8.4 (`college_mgmt_test`)  
**Execution Timestamp:** 2026-10-20  

---

## 1. Executive Summary

| Test Category | Total Tests | Passed | Failed | Blocked | Execution Status |
|---|---|---|---|---|---|
| **Course Registration & Capacity (Required Scenarios 1–9)** | 10 | 10 | 0 | 0 | **100% Passed** |
| **Authentication & RBAC Suite** | 8 | 8 | 0 | 0 | **100% Passed** |
| **Academic Modules (Student, Faculty, Attendance, Results, Reports)** | 13 | 13 | 0 | 0 | **100% Passed** |
| **Frontend UI Components Suite** | 5 | 5 | 0 | 0 | **100% Passed** |
| **TOTAL** | **36** | **36** | **0** | **0** | **ALL PASSED** |

---

## 2. Automated Test Cases & Genuine Execution Results

All 36 tests below were executed against the live Express backend, MySQL 8.4 database, and React component test runners.

### Course Registration Module (Highest-Priority Assessment Module)

| Test ID | Scenario Description | Preconditions | Input Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC-REG-01** | Scenario 1: Valid student successfully registers for an available course | Student Alice authenticated; course `EC101` has open capacity and student is not yet enrolled | `POST /api/enrollments/register` `{ courseId: 5 }` | HTTP 201 Created; enrollment saved in MySQL; active count increases | HTTP 201; course registered; verified row in MySQL `enrollments` table | **PASS** |
| **TC-REG-02** | Scenario 2: Registration rejected when course reaches max capacity | Course `TEST-CAP-101` created with capacity = 1; first seat taken | `POST /api/enrollments/register` by second student `{ courseId }` | HTTP 400 Bad Request; message stating capacity reached | HTTP 400; message: "Course has reached its maximum enrollment capacity" | **PASS** |
| **TC-REG-03** | Scenario 3: Duplicate registration rejected | Student Alice is already registered for course `CS101` | `POST /api/enrollments/register` `{ courseId: 1 }` | HTTP 409 Conflict; duplicate rejected; no duplicate row created | HTTP 409; message: "Student is already registered for course CS101. Duplicate registration is rejected." | **PASS** |
| **TC-REG-04** | Scenario 4: Registration for nonexistent course rejected | Student authenticated | `POST /api/enrollments/register` `{ courseId: 999999 }` | HTTP 404 Not Found; clear error message | HTTP 404; message: "Course with ID 999999 not found" | **PASS** |
| **TC-REG-05** | Scenario 5: Invalid or missing course ID input rejected | Student authenticated | `POST /api/enrollments/register` `{}` and `{ courseId: "invalid" }` | HTTP 400 Bad Request | HTTP 400; validation rejected before database query | **PASS** |
| **TC-REG-06** | Scenario 6: Unauthenticated user cannot register | No Authorization Bearer header provided | `POST /api/enrollments/register` `{ courseId: 1 }` | HTTP 401 Unauthorized; token required error | HTTP 401; message: "Authentication required. No token provided." | **PASS** |
| **TC-REG-07** | Scenario 7: User without required role cannot register or modify | Faculty user token provided for course creation or student action | `POST /api/courses` with Faculty token | HTTP 403 Forbidden; role restriction error | HTTP 403; message: "Forbidden: Access restricted to [admin] role(s)" | **PASS** |
| **TC-REG-08** | Scenario 8: Failed registration leaves enrollment database count unchanged | Enrollment count measured before failed request | Registration attempt for invalid course ID 88888 | Database row count after attempt equals count before | Exact match: before count = after count; zero orphan rows created | **PASS** |
| **TC-REG-09** | Scenario 9: Concurrent registration attempts cannot exceed capacity | Course `CONCUR-101` with capacity = 1; 3 distinct students | 3 simultaneous requests via `Promise.all` | Exactly 1 request succeeds (201); 2 requests rejected (400); DB active count = 1 | Exactly 1 success (201), 2 capacity rejections (400); DB count = 1 | **PASS** |
| **TC-REG-10** | Safe Course Drop | Student enrolled in `ME101` | `POST /api/enrollments/drop` `{ courseId }` | HTTP 200 OK; enrollment status changed to 'dropped'; seat freed | HTTP 200; status updated to 'dropped'; seat freed for other students | **PASS** |

### Authentication & Role-Based Access Control

| Test ID | Scenario Description | Preconditions | Input Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC-AUTH-01** | Valid Student Login | Student account exists in seed data | `student@college.edu` / `Student@123` | HTTP 200, JWT token returned, role = 'student' | HTTP 200, token present, profile loaded | **PASS** |
| **TC-AUTH-02** | Valid Faculty Login | Faculty account exists in seed data | `faculty@college.edu` / `Faculty@123` | HTTP 200, JWT token returned, role = 'faculty' | HTTP 200, token present, faculty ID loaded | **PASS** |
| **TC-AUTH-03** | Valid Administrator Login | Admin account exists in seed data | `admin@college.edu` / `Admin@123` | HTTP 200, JWT token returned, role = 'admin' | HTTP 200, token present, role = 'admin' | **PASS** |
| **TC-AUTH-04** | Invalid Password Rejection | Registered account email | `admin@college.edu` / `WrongPassword` | HTTP 401 Unauthorized; clear error message | HTTP 401; "Invalid credentials. Password incorrect." | **PASS** |
| **TC-AUTH-05** | Nonexistent Email Rejection | Unregistered email | `nobody@college.edu` / `AnyPassword` | HTTP 401 Unauthorized | HTTP 401; "Invalid credentials. User not found." | **PASS** |
| **TC-AUTH-06** | Missing Input Rejection | Incomplete payload | `{ email: "admin@college.edu" }` | HTTP 400 Bad Request | HTTP 400; "Please provide both email and password." | **PASS** |
| **TC-AUTH-07** | `/api/auth/me` Session Verification | Active JWT token provided | `GET /api/auth/me` | HTTP 200; user profile returned | HTTP 200; returned user details and permissions | **PASS** |
| **TC-AUTH-08** | Demo Accounts Endpoint | Public access | `GET /api/auth/demo-accounts` | HTTP 200; returns 3 demo accounts | HTTP 200; 3 development accounts returned | **PASS** |

### Academic Modules (Student, Faculty, Attendance, Results, Reports)

| Test ID | Scenario Description | Preconditions | Input Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC-ACAD-01** | Admin views all students | Admin authenticated | `GET /api/students` | HTTP 200, array of student records | HTTP 200, array of 5+ students returned | **PASS** |
| **TC-ACAD-02** | Create student & duplicate prevention | Admin authenticated | Duplicate student ID `STU-TEST-999` | First creates (201); duplicate rejected (409) | 201 on first, 409 on second with duplicate warning | **PASS** |
| **TC-ACAD-03** | Student profile isolation | Alice authenticated | Alice requests Bob's profile (`GET /api/students/2`) | HTTP 403 Forbidden; cannot view others | HTTP 403 Forbidden | **PASS** |
| **TC-ACAD-04** | Admin views all faculty | Admin authenticated | `GET /api/faculty` | HTTP 200, array of faculty records | HTTP 200, faculty list returned | **PASS** |
| **TC-ACAD-05** | Admin creates faculty member | Admin authenticated | New faculty member data | HTTP 201 Created | HTTP 201 Created | **PASS** |
| **TC-ACAD-06** | Faculty records attendance | Instructor teaches CS101 | Date `2026-10-25`, student 1 (Present), student 2 (Absent) | HTTP 200 OK; 2 records written to MySQL | HTTP 200; records verified in DB | **PASS** |
| **TC-ACAD-07** | Rejects attendance for non-enrolled student | Student 4 is not enrolled in CS101 | Submit attendance for student 4 in CS101 | HTTP 400 Bad Request | HTTP 400; "Student is not actively enrolled" | **PASS** |
| **TC-ACAD-08** | Student views own attendance summary | Student authenticated | `GET /api/attendance/my-attendance` | HTTP 200; summary with % compliance per course | HTTP 200; calculated percentage returned | **PASS** |
| **TC-ACAD-09** | Faculty enters marks & grade calculation | Faculty teaches course | Student 1, marks: 95.5 / 100 in CS301 | HTTP 201 Created; Grade = 'A+' | HTTP 201; Grade 'A+' calculated | **PASS** |
| **TC-ACAD-10** | Rejects invalid marks range | Faculty authenticated | Marks = -10 and Marks = 110 | HTTP 400 Bad Request for both | HTTP 400; rejected out of range marks | **PASS** |
| **TC-ACAD-11** | Student views own report card | Student authenticated | `GET /api/results/my-results` | HTTP 200; list of graded subjects & GPA | HTTP 200; transcript returned | **PASS** |
| **TC-ACAD-12** | Aggregated Admin dashboard stats | Admin authenticated | `GET /api/reports/dashboard-stats` | HTTP 200; real counts > 0 from database | HTTP 200; totalStudents > 0, courses > 0 | **PASS** |
| **TC-ACAD-13** | Admin downloads CSV report | Admin authenticated | `GET /api/reports/export/enrollments` | HTTP 200; `Content-Type: text/csv` | HTTP 200; text/csv attachment with CSV headers | **PASS** |

### Frontend UI Components Suite

| Test ID | Component | Input / Interaction | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **TC-UI-01** | `Badge.jsx` | Variant "success", Text "Enrolled" | Renders badge with emerald styling | Renders text and CSS classes | **PASS** |
| **TC-UI-02** | `Alert.jsx` | Type "error", Title, Message, close button | Renders alert, triggers `onClose` on click | Displayed properly, callback fired once | **PASS** |
| **TC-UI-03** | `StatCard.jsx` | Title, Value 12, subtitle | Displays formatted numerical metrics | Text and values rendered | **PASS** |
| **TC-UI-04** | `Modal.jsx` | `isOpen: true`, title, children | Renders dialog backdrop and body | Displayed in DOM | **PASS** |
| **TC-UI-05** | `ConfirmDialog.jsx` | Click "Confirm Drop" button | Fires confirmation callback handler | `handleConfirm` called once | **PASS** |

---

## 3. Defect Log & Resolutions

During test execution, one defect was discovered and resolved:

| Defect ID | Severity | Module | Description | Root Cause | Status | Resolution |
|---|---|---|---|---|---|---|
| **DEF-01** | Medium | Reports API | `totalStudents`, `totalCourses` returned `0` in `/api/reports/dashboard-stats` | The database helper `query()` already returns the array of rows. Destructuring with `const [stuCount] = await query(...)` assigned the row object to `stuCount`. Subsequent code accessed `stuCount[0]?.total`, which returned `undefined`. | **RESOLVED** | Updated `report.controller.js` to parse row fields directly via `parseInt(stuRow?.total || 0, 10)`. Re-ran Vitest suite; all tests passed. |

---

## 4. Step-by-Step Instructions: Manual Testing via User Interface

Follow these steps to manually verify Course Registration and system features in your browser:

### Step 1: Start the Portal
Run the following command from the project root:
```bash
npm run dev
```
Open **`http://localhost:5173`** in your web browser.

### Step 2: Test Student Course Registration Flow
1. On the login page, click the **"Student"** pill button under **"1-Click Demo Accounts"**.  
   *(Notice email `student@college.edu` and password `Student@123` auto-populate).*
2. Click **"Sign In"**. You will be directed to the **Student Dashboard**.
3. In the sidebar or top banner, click **"Course Registration"** (or navigate to `/student/register-courses`).
4. Review the available courses list. Note that courses Alice is already enrolled in show a green **"Enrolled"** badge and a disabled button.
5. Find an available course that has open seats (e.g., `EC101: Digital Logic & Circuits`).
6. Click the **"Register for Course"** button.
   - **Expected Result:** A spinner briefly appears on the button, followed by a green confirmation alert: *"Registration Confirmed! You are now successfully enrolled in EC101"*.
   - The course's available seats counter decreases by 1.
   - The button changes to an **"Already Enrolled"** green badge.
7. Click the **"My Enrolled Courses"** tab at the top.
   - **Expected Result:** `EC101` now appears in your active semester roster, and the **Total Credits** counter is automatically incremented.
8. Click the red **"Drop"** button next to `EC101`.
   - **Expected Result:** A confirmation dialog appears asking: *"Are you sure you want to drop EC101? You will forfeit your enrolled seat in this course."*
9. Click **"Confirm Drop"**.
   - **Expected Result:** Success message appears; `EC101` is removed from your enrolled roster; total credits decrease accordingly.

### Step 3: Test Course Full Capacity Rejection
1. In another browser tab (or after signing out), log in as **Admin**: `admin@college.edu` / `Admin@123`.
2. Go to **"Course Catalog"** in the sidebar.
3. Click **"Add New Course"**.
4. Create a course with code `SE-CAP-1`, Title `Special Topics in Concurrency`, Department `Computer Science`, Capacity `1`, and Credits `3`. Click **"Create Course"**.
5. Log out as Admin and log in as student **Bob Smith**: `bob@college.edu` / `Student@123`.
6. Go to **Course Registration** and register for `SE-CAP-1`.
   - **Expected Result:** Registration succeeds. The seat is now filled (1 / 1).
7. Log out as Bob and log in as student **Diana Prince**: `diana@college.edu` / `Student@123`.
8. Go to **Course Registration** and locate `SE-CAP-1`.
   - **Expected Result:** The badge shows **"Full Capacity"** with 0 seats left. If a request is attempted, the system displays: *"Course has reached its maximum enrollment capacity"*.

### Step 4: Test Faculty Attendance & Results
1. Log in as **Faculty**: `faculty@college.edu` / `Faculty@123`.
2. Go to **"Attendance Marking"**.
3. Select `CS101: Introduction to Computer Science` and today's date.
4. Toggle students between **Present** and **Absent** (or click **"All Present"**). Click **"Save Attendance Records"**.
   - **Expected Result:** Success message confirms attendance saved in MySQL.
5. Go to **"Results & Grades"**.
6. Select `CS101` and enter numerical marks (e.g., `85`).
   - **Expected Result:** The system automatically calculates and displays **Grade A**. Click **"Submit"** to save.

### Step 5: Test Admin Reports & CSV Export
1. Log in as **Admin**: `admin@college.edu` / `Admin@123`.
2. Go to **"Reports & CSV"**.
3. Switch between tabs: **Enrollment Capacity**, **Attendance Compliance** (identifies students with < 75%), and **Course Performance**.
4. Click **"Export ENROLLMENTS CSV"**.
   - **Expected Result:** The browser downloads an authentic `.csv` spreadsheet generated from live MySQL queries.

---

## 5. Instructions for Running Automated Tests

To execute the entire automated test suite:

```bash
# Run both backend API tests (31 tests) and frontend tests (5 tests)
npm test

# Run only backend API tests
npm run test:backend

# Run only frontend component tests
npm run test:frontend
```
All tests connect to the isolated `college_mgmt_test` database, ensuring development data in `college_mgmt` remains untouched.

