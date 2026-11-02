# College Management Portal - REST API Specification

Base URL: `/api`  
Authentication: Bearer Token (`Authorization: Bearer <jwt_token>`)

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
- **Access:** Public
- **Body:**
  ```json
  {
    "email": "student@college.edu",
    "password": "Student@123"
  }
  ```
- **Responses:**
  - `200 OK`: Returns JWT token and user profile object.
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid credentials or password incorrect.
  - `403 Forbidden`: Account is inactive/deactivated.

### `GET /api/auth/me`
- **Access:** Authenticated (Student, Faculty, Admin)
- **Response:**
  - `200 OK`: Returns authenticated user with role-specific profile details.

### `GET /api/auth/demo-accounts`
- **Access:** Public
- **Response:**
  - `200 OK`: Returns list of pre-configured local development accounts.

---

## 2. Course Management & Registration Endpoints (Primary Assessment Module)

### `GET /api/courses`
- **Access:** Authenticated
- **Query Params:** `departmentId` (int), `search` (string), `status` ('active'|'inactive')
- **Response:**
  - `200 OK`: List of courses with computed `enrolled_count` and `available_seats`.

### `GET /api/courses/:id`
- **Access:** Authenticated
- **Response:**
  - `200 OK`: Single course details.
  - `404 Not Found`: Course does not exist.

### `POST /api/courses`
- **Access:** Admin only
- **Body:** `{ course_code, title, description, department_id, credits, faculty_id, capacity, semester, status }`
- **Responses:**
  - `201 Created`: Course created.
  - `400 Bad Request`: Validation failure (missing title/code or non-positive capacity).
  - `409 Conflict`: Duplicate course code.

### `PUT /api/courses/:id`
- **Access:** Admin only
- **Responses:** `200 OK`, `404 Not Found`, `409 Conflict`.

### `DELETE /api/courses/:id`
- **Access:** Admin only
- **Responses:** `200 OK`, `404 Not Found`.

### `POST /api/enrollments/register`
- **Access:** Student, Admin
- **Body:** `{ courseId: 1 }`
- **Transactions & Concurrency:** Serialized with `SELECT ... FOR UPDATE` row locking.
- **Responses:**
  - `201 Created`: `{ success: true, message: "Successfully registered...", data: { ... } }`
  - `400 Bad Request`: Course full capacity reached, or course inactive, or invalid courseId.
  - `404 Not Found`: Course or student profile not found.
  - `409 Conflict`: Student already registered for this course (duplicate prevented).

### `POST /api/enrollments/drop`
- **Access:** Student, Admin
- **Body:** `{ courseId: 1 }`
- **Responses:**
  - `200 OK`: Course registration safely dropped.
  - `404 Not Found`: No active registration found.

### `GET /api/enrollments/my-courses`
- **Access:** Student only
- **Response:**
  - `200 OK`: List of all active enrolled courses for the logged-in student.

### `GET /api/enrollments/course/:courseId`
- **Access:** Faculty (assigned), Admin
- **Response:**
  - `200 OK`: Student roster actively registered for this course.

---

## 3. Student Management Endpoints

### `GET /api/students`
- **Access:** Admin, Faculty
- **Query Params:** `departmentId`, `search`
- **Response:** `200 OK`: List of students with department and enrolled course counts.

### `GET /api/students/profile/me`
- **Access:** Student only
- **Response:** `200 OK`: Returns authenticated student's profile.

### `GET /api/students/:id`
- **Access:** Admin or matching Student
- **Responses:** `200 OK`, `403 Forbidden` (if student attempts to read another student's record), `404 Not Found`.

### `POST /api/students`
- **Access:** Admin only
- **Body:** `{ student_id, first_name, last_name, email, phone, department_id, semester, password }`
- **Responses:** `201 Created`, `400 Bad Request`, `409 Conflict` (duplicate email or student ID).

### `PUT /api/students/:id`
- **Access:** Admin only
- **Responses:** `200 OK`, `404 Not Found`.

### `DELETE /api/students/:id`
- **Access:** Admin only
- **Responses:** `200 OK`, `404 Not Found`.

---

## 4. Faculty Management Endpoints

### `GET /api/faculty`
- **Access:** Authenticated
- **Response:** `200 OK`: List of faculty members with department & assigned teaching count.

### `GET /api/faculty/profile/me`
- **Access:** Faculty only
- **Response:** `200 OK`: Returns authenticated instructor profile and list of assigned courses.

### `GET /api/faculty/:id`
- **Access:** Authenticated
- **Responses:** `200 OK`, `404 Not Found`.

### `POST /api/faculty`
- **Access:** Admin only
- **Body:** `{ faculty_id, first_name, last_name, email, phone, department_id, designation, password }`
- **Responses:** `201 Created`, `400 Bad Request`, `409 Conflict`.

### `PUT /api/faculty/:id`
- **Access:** Admin only
- **Responses:** `200 OK`, `404 Not Found`.

### `DELETE /api/faculty/:id`
- **Access:** Admin only
- **Responses:** `200 OK`, `404 Not Found`.

---

## 5. Attendance Management Endpoints

### `POST /api/attendance/mark`
- **Access:** Faculty (assigned to course), Admin
- **Body:**
  ```json
  {
    "courseId": 1,
    "attendanceDate": "2026-10-25",
    "records": [
      { "studentId": 1, "status": "Present" },
      { "studentId": 2, "status": "Absent" }
    ]
  }
  ```
- **Responses:**
  - `200 OK`: Attendance recorded/updated.
  - `400 Bad Request`: Student is not enrolled in this course or invalid status.
  - `403 Forbidden`: Faculty is not assigned to this course.

### `GET /api/attendance/course/:courseId`
- **Access:** Faculty, Admin
- **Query Params:** `date` (YYYY-MM-DD), `startDate`, `endDate`
- **Response:** `200 OK`: List of attendance records for the course.

### `GET /api/attendance/my-attendance`
- **Access:** Student only
- **Response:**
  - `200 OK`: `{ summary: [ ... ], history: [ ... ] }` with percentage compliance per course.

---

## 6. Result Management Endpoints

### `POST /api/results/enter`
- **Access:** Faculty (assigned to course), Admin
- **Body:**
  ```json
  {
    "studentId": 1,
    "courseId": 3,
    "marks": 88.5,
    "maxMarks": 100,
    "semester": 3
  }
  ```
- **Responses:**
  - `201 Created` / `200 OK`: Evaluated result saved with calculated letter grade.
  - `400 Bad Request`: Marks out of range (negative or exceeding max marks).
  - `403 Forbidden`: Faculty is not assigned to course.

### `GET /api/results/course/:courseId`
- **Access:** Faculty, Admin
- **Response:** `200 OK`: Results of students in the course.

### `GET /api/results/my-results`
- **Access:** Student only
- **Response:** `200 OK`: Transcript of marks, letter grades, and overall percentage.

### `GET /api/results`
- **Access:** Admin only
- **Response:** `200 OK`: System-wide results with filters.

---

## 7. Reports & CSV Export Endpoints

### `GET /api/reports/dashboard-stats`
- **Access:** Admin only
- **Response:** `200 OK`: Real aggregated counts and distributions.

### `GET /api/reports/enrollments`
- **Access:** Admin only
- **Response:** `200 OK`: Course capacity and occupancy metrics.

### `GET /api/reports/attendance`
- **Access:** Admin only
- **Response:** `200 OK`: Attendance percentages and low attendance warnings (< 75%).

### `GET /api/reports/results`
- **Access:** Admin only
- **Response:** `200 OK`: Average marks, pass/fail counts, and highest scores.

### `GET /api/reports/export/:reportType`
- **Access:** Admin only (`reportType` = 'enrollments' | 'attendance' | 'results')
- **Response:** `200 OK`: Downloadable `.csv` file attachment.

