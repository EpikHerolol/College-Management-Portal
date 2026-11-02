-- ============================================================================
-- queries.sql: 15 Meaningful SQL Operations for College Management System
-- Database: MySQL 8.0+ (InnoDB Engine)
-- ============================================================================

USE college_mgmt;

-- ----------------------------------------------------------------------------
-- CATEGORY 1: DATA RETRIEVAL & FILTERING
-- ----------------------------------------------------------------------------

-- Query 1: Active Course Catalog Filtered by Department and Minimum Credits
-- Retrieves active curriculum courses offering 3 or more credits with department details.
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


-- Query 2: Upperclassmen Students Roster Filtered by Academic Semester
-- Filters student population in sophomore/junior/senior standing (semester >= 2).
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


-- ----------------------------------------------------------------------------
-- CATEGORY 2: MULTI-TABLE JOINS (INNER, LEFT, MULTI-WAY)
-- ----------------------------------------------------------------------------

-- Query 3: Multi-Table Active Enrollment Roster (4-Table INNER JOIN)
-- Joins enrollments, students, courses, and departments to construct unified student roster.
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


-- Query 4: Faculty Teaching Workload and Assignment Status (LEFT JOIN)
-- Displays all instructors with assigned courses or marks unassigned faculty.
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


-- Query 5: Comprehensive Examination Grade Sheet (Results + Students + Courses + Evaluators)
-- 4-Table Join connecting examination marks, candidate details, course info, and grading professor.
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


-- ----------------------------------------------------------------------------
-- CATEGORY 3: AGGREGATIONS & GROUPING (COUNT, SUM, AVG, MIN, MAX, HAVING)
-- ----------------------------------------------------------------------------

-- Query 6: Institutional Cross-Distribution Analytics (COUNT DISTINCT across relations)
-- Aggregates total students, faculty members, and courses across academic departments.
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


-- Query 7: Student Cumulative Attendance Percentage per Course (Conditional Aggregation)
-- Uses SUM(CASE WHEN ...) and NULLIF() to compute exact percentage compliance without div-by-zero.
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


-- Query 8: High Demand Courses Exceeding Registration Threshold (HAVING clause)
-- Identifies popular courses with 2 or more active enrollments and calculates occupancy.
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


-- Query 9: Academic Course Grade Statistics & Performance Distribution (AVG, MIN, MAX)
-- Calculates section average, highest score, lowest score, and graded student count.
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


-- ----------------------------------------------------------------------------
-- CATEGORY 4: SUBQUERIES (CORRELATED, NESTED IN/NOT IN, SCALAR)
-- ----------------------------------------------------------------------------

-- Query 10: Dynamic Catalog with Live Enrolled Count and Seat Math (Correlated Subquery)
-- Computes real-time seat counts and prevents negative availability via GREATEST().
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


-- Query 11: Underclassmen Roster with No Advanced Enrollments (Nested NOT IN Subquery)
-- Identifies students who have zero enrollments in upper-level courses (semester >= 3).
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


-- Query 12: High-Achieving Students Above Course Average (Scalar Aggregation Subquery)
-- Filters exam results where individual score strictly exceeds class section mean.
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


-- ----------------------------------------------------------------------------
-- CATEGORY 5: ADVANCED SQL OPERATIONS (SET OPERATIONS, CASE, AUDITING)
-- ----------------------------------------------------------------------------

-- Query 13: Attendance Defaulters Scanner Query (< 75% Attendance Compliance)
-- Flags all enrolled students whose attendance falls below mandatory academic threshold.
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


-- Query 14: Department-Level Seat Occupancy and Utilization Analytics
-- Aggregates university-wide classroom capacity utilization percentages by department.
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


-- Query 15: Unified University Personnel Directory (UNION ALL Operation)
-- Combines faculty members and students into an institutional master directory.
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

