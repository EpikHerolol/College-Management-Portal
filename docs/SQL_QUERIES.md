# 15 Meaningful SQL Operations & Laboratory Report

This document compiles and categorizes **15 meaningful SQL queries** implemented and verified against MySQL 8.4 for the College Management Portal. These queries cover data retrieval, multi-table joins, aggregations, grouping with `HAVING`, correlated/nested subqueries, set operations, and analytical reporting.

The complete executable script is also available at [`backend/src/db/queries.sql`](file:///home/soham_sikdar/Desktop/Codes%20And%20Projects/College%20Management/backend/src/db/queries.sql).

---

## Query Mapping & Classification Table

| # | Query Title | Category | Key SQL Operations |
|---|---|---|---|
| **Q1** | Active Course Catalog by Credits | Basic Data Retrieval & Filtering | `SELECT`, `WHERE`, `ORDER BY`, `JOIN` |
| **Q2** | Upperclassmen Student Population | Data Retrieval & Sorting | `CONCAT()`, `WHERE`, `ORDER BY` |
| **Q3** | Unified Student Enrollment Roster | Multi-Table Join | 4-Table `INNER JOIN` (`enrollments`, `students`, `courses`, `departments`) |
| **Q4** | Faculty Teaching Assignment & Workload | Outer Joins & Null Handling | `LEFT JOIN`, `COALESCE()` |
| **Q5** | Master Examination Grade Sheet | Multi-Table Evaluator Join | 4-Table `INNER JOIN` (`results`, `students`, `courses`, `faculty`) |
| **Q6** | Institutional Department Statistics | Distinct Aggregation & Grouping | `COUNT(DISTINCT ...)`, `GROUP BY`, `LEFT JOIN` |
| **Q7** | Cumulative Student Attendance Percentage | Conditional Aggregation | `SUM(CASE WHEN ...)` , `NULLIF()`, `ROUND()`, `HAVING` |
| **Q8** | High-Demand Course Occupancy | Group Filtering | `GROUP BY`, `HAVING COUNT(*) >= 2`, Percentage Calculation |
| **Q9** | Course Section Marks Summary | Statistical Aggregations | `AVG()`, `MIN()`, `MAX()`, `COUNT()`, `GROUP BY` |
| **Q10** | Live Catalog with Dynamic Seat Availability | Correlated Subquery | Correlated `(SELECT COUNT(*) ...)`, `GREATEST()` |
| **Q11** | Students with No Upper-Level Courses | Nested Subquery with Set Negation | `NOT IN (SELECT ...)`, Multiple `JOIN` |
| **Q12** | High-Achieving Students Above Section Mean | Scalar Subquery Aggregation | `WHERE marks > (SELECT AVG(...) ...)` |
| **Q13** | Academic Attendance Defaulters Scanner | Multi-table Filtering & Thresholds | `GROUP BY`, `HAVING pct < 75.0` |
| **Q14** | Department-Level Capacity Utilization | Cross-Entity Utilization Math | `SUM()`, `COUNT()`, `NULLIF()`, `GROUP BY` |
| **Q15** | Unified University Directory | Set Operations | `UNION ALL`, Literal Discriminator Columns |

---

## Detailed Query Specifications and Demonstrations

### 1. Active Course Catalog Filtered by Department & Credits
* **Business Objective:** Enables students and counselors to view active curriculum modules offering at least 3 credits.
```sql
SELECT 
    c.id AS course_id,
    c.course_code,
    c.title AS course_title,
    c.credits,
    c.capacity,
    c.semester,
    d.code AS dept_code,
    d.name AS department_name
FROM courses c
INNER JOIN departments d ON c.department_id = d.id
WHERE c.status = 'active' AND c.credits >= 3
ORDER BY c.semester ASC, c.course_code ASC;
```

---

### 2. Upperclassmen Student Population
* **Business Objective:** Retrieves students in sophomore, junior, or senior academic standing (semester $\ge 2$).
```sql
SELECT 
    s.id AS profile_id,
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS full_name,
    s.email,
    s.semester,
    s.enrollment_date,
    d.code AS department_code
FROM students s
INNER JOIN departments d ON s.department_id = d.id
WHERE s.semester >= 2
ORDER BY s.semester DESC, s.last_name ASC;
```

---

### 3. Unified Student Enrollment Roster (4-Table INNER JOIN)
* **Business Objective:** Generates the institutional master enrollment roster connecting students, courses, offering departments, and matriculation dates.
```sql
SELECT 
    e.id AS enrollment_id,
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.course_code,
    c.title AS course_title,
    d.code AS department_code,
    e.status AS registration_status,
    e.enrollment_date
FROM enrollments e
INNER JOIN students s ON e.student_id = s.id
INNER JOIN courses c ON e.course_id = c.id
INNER JOIN departments d ON c.department_id = d.id
WHERE e.status = 'enrolled'
ORDER BY c.course_code ASC, s.student_id ASC;
```

---

### 4. Faculty Teaching Workload and Assignment Status (LEFT JOIN)
* **Business Objective:** Inspects instructional workload across all faculty members; includes faculty members not yet assigned to any course using `COALESCE()`.
```sql
SELECT 
    f.faculty_id,
    CONCAT(f.first_name, ' ', f.last_name) AS faculty_name,
    f.designation,
    d.name AS department_name,
    COALESCE(c.course_code, 'UNASSIGNED') AS course_code,
    COALESCE(c.title, 'No Teaching Assignment Currently') AS course_title,
    COALESCE(c.capacity, 0) AS course_capacity
FROM faculty f
INNER JOIN departments d ON f.department_id = d.id
LEFT JOIN courses c ON c.faculty_id = f.id
ORDER BY f.faculty_id ASC;
```

---

### 5. Master Examination Grade Sheet (Results + Students + Courses + Evaluators)
* **Business Objective:** Produces official academic scorecards showing student marks, letter grade, and the specific professor who performed the evaluation.
```sql
SELECT 
    r.id AS result_id,
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.course_code,
    c.title AS course_title,
    r.marks,
    r.max_marks,
    r.grade,
    CONCAT(f.first_name, ' ', f.last_name) AS evaluated_by
FROM results r
INNER JOIN students s ON r.student_id = s.id
INNER JOIN courses c ON r.course_id = c.id
INNER JOIN faculty f ON r.evaluator_id = f.id
ORDER BY c.course_code ASC, r.marks DESC;
```

---

### 6. Institutional Cross-Distribution Analytics (COUNT DISTINCT)
* **Business Objective:** Calculates university departmental census counts without Cartesian product distortion.
```sql
SELECT 
    d.id AS dept_id,
    d.code AS dept_code,
    d.name AS department_name,
    COUNT(DISTINCT s.id) AS total_students,
    COUNT(DISTINCT f.id) AS total_faculty,
    COUNT(DISTINCT c.id) AS total_courses
FROM departments d
LEFT JOIN students s ON s.department_id = d.id
LEFT JOIN faculty f ON f.department_id = d.id
LEFT JOIN courses c ON c.department_id = d.id
GROUP BY d.id, d.code, d.name
ORDER BY total_students DESC, d.code ASC;
```

---

### 7. Student Cumulative Attendance Percentage per Course (Conditional Aggregation)
* **Business Objective:** Calculates session attendance compliance per enrolled course, handling divide-by-zero safely via `NULLIF()`.
```sql
SELECT 
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.course_code,
    c.title AS course_title,
    COUNT(a.id) AS total_sessions_held,
    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS attended_sessions,
    ROUND(
        (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 
        1
    ) AS attendance_percentage
FROM enrollments e
INNER JOIN students s ON e.student_id = s.id
INNER JOIN courses c ON e.course_id = c.id
LEFT JOIN attendance a ON a.student_id = s.id AND a.course_id = c.id
WHERE e.status = 'enrolled'
GROUP BY s.id, s.student_id, student_name, c.id, c.course_code, c.title
HAVING total_sessions_held > 0
ORDER BY attendance_percentage ASC, s.student_id ASC;
```

---

### 8. High Demand Courses Exceeding Registration Threshold (HAVING clause)
* **Business Objective:** Identifies popular courses with $\ge 2$ active student enrollments and computes room occupancy rate.
```sql
SELECT 
    c.course_code,
    c.title AS course_title,
    c.capacity,
    COUNT(e.id) AS active_enrollments,
    ROUND((COUNT(e.id) / c.capacity) * 100, 1) AS occupancy_percentage
FROM courses c
INNER JOIN enrollments e ON e.course_id = c.id AND e.status = 'enrolled'
GROUP BY c.id, c.course_code, c.title, c.capacity
HAVING COUNT(e.id) >= 2
ORDER BY active_enrollments DESC, occupancy_percentage DESC;
```

---

### 9. Academic Course Grade Statistics & Performance Distribution
* **Business Objective:** Provides course coordinators with sectional averages, minimum marks, and highest marks.
```sql
SELECT 
    c.course_code,
    c.title AS course_title,
    COUNT(r.id) AS total_graded_students,
    ROUND(AVG(r.marks), 2) AS average_marks,
    MIN(r.marks) AS lowest_mark,
    MAX(r.marks) AS highest_mark
FROM courses c
INNER JOIN results r ON r.course_id = c.id
GROUP BY c.id, c.course_code, c.title
ORDER BY average_marks DESC;
```

---

### 10. Dynamic Catalog with Live Enrolled Count and Seat Math (Correlated Subquery)
* **Business Objective:** Powers the student registration portal with live seat counters without needing data replication.
```sql
SELECT 
    c.id,
    c.course_code,
    c.title,
    c.capacity,
    (SELECT COUNT(*) 
     FROM enrollments e 
     WHERE e.course_id = c.id AND e.status = 'enrolled'
    ) AS enrolled_count,
    GREATEST(0, c.capacity - (
        SELECT COUNT(*) 
        FROM enrollments e 
        WHERE e.course_id = c.id AND e.status = 'enrolled'
    )) AS available_seats
FROM courses c
WHERE c.status = 'active'
ORDER BY available_seats ASC, c.course_code ASC;
```

---

### 11. Underclassmen Roster with No Advanced Enrollments (Nested NOT IN Subquery)
* **Business Objective:** Identifies students who have no upper-division registrations (semester $\ge 3$) for academic guidance.
```sql
SELECT 
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.email,
    s.semester,
    d.name AS department_name
FROM students s
INNER JOIN departments d ON s.department_id = d.id
WHERE s.id NOT IN (
    SELECT DISTINCT e.student_id
    FROM enrollments e
    INNER JOIN courses c ON e.course_id = c.id
    WHERE c.semester >= 3 AND e.status = 'enrolled'
)
ORDER BY s.semester ASC, s.student_id ASC;
```

---

### 12. High-Achieving Students Above Course Section Mean (Scalar Subquery)
* **Business Objective:** Identifies candidates qualifying for departmental honors by comparing student scores against section averages.
```sql
SELECT 
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.course_code,
    c.title AS course_title,
    r.marks,
    r.grade
FROM results r
INNER JOIN students s ON r.student_id = s.id
INNER JOIN courses c ON r.course_id = c.id
WHERE r.marks > (
    SELECT AVG(r2.marks)
    FROM results r2
    WHERE r2.course_id = r.course_id
)
ORDER BY c.course_code ASC, r.marks DESC;
```

---

### 13. Attendance Defaulters Scanner Query (< 75% Attendance Compliance)
* **Business Objective:** Audits student roster to identify individuals barred from end-term examinations due to $< 75\%$ attendance.
```sql
SELECT 
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.email,
    c.course_code,
    c.title AS course_title,
    COUNT(a.id) AS total_classes,
    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS attended_classes,
    ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 1) AS attendance_pct
FROM enrollments e
INNER JOIN students s ON e.student_id = s.id
INNER JOIN courses c ON e.course_id = c.id
INNER JOIN attendance a ON a.student_id = s.id AND a.course_id = c.id
WHERE e.status = 'enrolled'
GROUP BY s.id, s.student_id, student_name, s.email, c.id, c.course_code, c.title
HAVING total_classes > 0 AND attendance_pct < 75.0
ORDER BY attendance_pct ASC;
```

---

### 14. Department-Level Seat Occupancy and Utilization Analytics
* **Business Objective:** Provides university deans with space and seat efficiency metrics across departments.
```sql
SELECT 
    d.code AS dept_code,
    d.name AS dept_name,
    SUM(c.capacity) AS total_department_capacity,
    COUNT(e.id) AS total_enrolled_seats,
    ROUND((COUNT(e.id) / NULLIF(SUM(c.capacity), 0)) * 100, 1) AS seat_occupancy_pct
FROM departments d
INNER JOIN courses c ON c.department_id = d.id AND c.status = 'active'
LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'enrolled'
GROUP BY d.id, d.code, d.name
ORDER BY seat_occupancy_pct DESC, total_enrolled_seats DESC;
```

---

### 15. Unified University Personnel Directory (UNION ALL Operation)
* **Business Objective:** Merges faculty instructors and student learners into a single searchable directory with normalized roles.
```sql
SELECT 
    'Faculty' AS affiliation,
    f.faculty_id AS institutional_id,
    CONCAT(f.first_name, ' ', f.last_name) AS full_name,
    f.email,
    d.name AS department_name,
    f.designation AS role_or_level
FROM faculty f
INNER JOIN departments d ON f.department_id = d.id

UNION ALL

SELECT 
    'Student' AS affiliation,
    s.student_id AS institutional_id,
    CONCAT(s.first_name, ' ', s.last_name) AS full_name,
    s.email,
    d.name AS department_name,
    CONCAT('Semester ', s.semester) AS role_or_level
FROM students s
INNER JOIN departments d ON s.department_id = d.id

ORDER BY affiliation ASC, institutional_id ASC;
```

---

## Verifying Query Execution
To run all 15 queries sequentially and verify outputs on your local MySQL server:
```bash
mysql -u root -S /tmp/college_mysql/mysql.sock college_mgmt < backend/src/db/queries.sql
```

