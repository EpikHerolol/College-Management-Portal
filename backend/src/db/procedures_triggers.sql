-- procedures_triggers.sql
-- Review II Database Implementation: Procedures, Functions, Triggers, and Cursors

USE college_mgmt;

DELIMITER $$

-- ============================================================================
-- 1. STORED FUNCTIONS
-- ============================================================================

-- Function 1: Calculate Letter Grade from numerical marks
DROP FUNCTION IF EXISTS fn_CalculateGrade$$
CREATE FUNCTION fn_CalculateGrade(p_marks DECIMAL(5,2), p_max_marks DECIMAL(5,2))
RETURNS VARCHAR(5)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_percent DECIMAL(5,2);
    DECLARE v_grade VARCHAR(5);

    IF p_max_marks <= 0 THEN
        RETURN 'F';
    END IF;

    SET v_percent = (p_marks / p_max_marks) * 100;

    IF v_percent >= 90.00 THEN
        SET v_grade = 'A+';
    ELSEIF v_percent >= 80.00 THEN
        SET v_grade = 'A';
    ELSEIF v_percent >= 70.00 THEN
        SET v_grade = 'B';
    ELSEIF v_percent >= 60.00 THEN
        SET v_grade = 'C';
    ELSEIF v_percent >= 50.00 THEN
        SET v_grade = 'D';
    ELSE
        SET v_grade = 'F';
    END IF;

    RETURN v_grade;
END$$

-- Function 2: Get available seats for a course
DROP FUNCTION IF EXISTS fn_GetAvailableSeats$$
CREATE FUNCTION fn_GetAvailableSeats(p_course_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_capacity INT DEFAULT 0;
    DECLARE v_enrolled INT DEFAULT 0;

    SELECT capacity INTO v_capacity FROM courses WHERE id = p_course_id;
    SELECT COUNT(*) INTO v_enrolled FROM enrollments WHERE course_id = p_course_id AND status = 'enrolled';

    IF (v_capacity - v_enrolled) < 0 THEN
        RETURN 0;
    ELSE
        RETURN (v_capacity - v_enrolled);
    END IF;
END$$


-- ============================================================================
-- 2. STORED PROCEDURES
-- ============================================================================

-- Procedure 1: Business operation to safely enroll a student into a course
DROP PROCEDURE IF EXISTS sp_EnrollStudent$$
CREATE PROCEDURE sp_EnrollStudent(
    IN p_student_id INT,
    IN p_course_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_capacity INT DEFAULT 0;
    DECLARE v_enrolled_count INT DEFAULT 0;
    DECLARE v_existing_count INT DEFAULT 0;

    -- Exit handler for unexpected SQL errors
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = 500;
        SET p_result_message = 'Database transaction failed. Changes rolled back.';
    END;

    START TRANSACTION;

    -- Step 1: Lock course row and fetch capacity
    SELECT capacity INTO v_capacity
    FROM courses
    WHERE id = p_course_id AND status = 'active'
    FOR UPDATE;

    IF v_capacity IS NULL OR v_capacity = 0 THEN
        ROLLBACK;
        SET p_result_code = 404;
        SET p_result_message = 'Course not found or is currently inactive.';
        LEAVE proc_label;
    END IF;

    -- Step 2: Check for duplicate active registration
    SELECT COUNT(*) INTO v_existing_count
    FROM enrollments
    WHERE student_id = p_student_id AND course_id = p_course_id AND status = 'enrolled';

    IF v_existing_count > 0 THEN
        ROLLBACK;
        SET p_result_code = 409;
        SET p_result_message = 'Student is already registered for this course.';
        LEAVE proc_label;
    END IF;

    -- Step 3: Check capacity against current active enrollments
    SELECT COUNT(*) INTO v_enrolled_count
    FROM enrollments
    WHERE course_id = p_course_id AND status = 'enrolled'
    FOR UPDATE;

    IF v_enrolled_count >= v_capacity THEN
        ROLLBACK;
        SET p_result_code = 400;
        SET p_result_message = 'Course registration full. Capacity limit reached.';
        LEAVE proc_label;
    END IF;

    -- Step 4: Insert enrollment record
    INSERT INTO enrollments (student_id, course_id, status)
    VALUES (p_student_id, p_course_id, 'enrolled');

    COMMIT;
    SET p_result_code = 200;
    SET p_result_message = 'Student registered successfully.';
END$$


-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Trigger 1: Automatically compute and assign grade before inserting result
DROP TRIGGER IF EXISTS trg_before_insert_result$$
CREATE TRIGGER trg_before_insert_result
BEFORE INSERT ON results
FOR EACH ROW
BEGIN
    IF NEW.max_marks IS NULL OR NEW.max_marks <= 0 THEN
        SET NEW.max_marks = 100.00;
    END IF;

    IF NEW.marks < 0 OR NEW.marks > NEW.max_marks THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Marks cannot be negative or exceed max marks.';
    END IF;

    SET NEW.grade = fn_CalculateGrade(NEW.marks, NEW.max_marks);
END$$

-- Trigger 2: Automatically update grade before updating result
DROP TRIGGER IF EXISTS trg_before_update_result$$
CREATE TRIGGER trg_before_update_result
BEFORE UPDATE ON results
FOR EACH ROW
BEGIN
    IF NEW.marks < 0 OR NEW.marks > NEW.max_marks THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Marks cannot be negative or exceed max marks.';
    END IF;

    SET NEW.grade = fn_CalculateGrade(NEW.marks, NEW.max_marks);
END$$


-- ============================================================================
-- 4. CURSOR IMPLEMENTATION
-- ============================================================================

-- Audit table for attendance defaulters (< 75%)
CREATE TABLE IF NOT EXISTS attendance_defaulters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    student_name VARCHAR(100),
    total_classes INT,
    attended_classes INT,
    attendance_pct DECIMAL(5,2),
    flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)$$

-- Procedure with CURSOR: Iterate over course roster, identify defaulters, and store in audit table
DROP PROCEDURE IF EXISTS sp_IdentifyAttendanceDefaulters$$
CREATE PROCEDURE sp_IdentifyAttendanceDefaulters(
    IN p_course_id INT,
    IN p_threshold DECIMAL(5,2)
)
BEGIN
    -- Cursor variables
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_student_id INT;
    DECLARE v_student_name VARCHAR(100);
    DECLARE v_total INT;
    DECLARE v_present INT;
    DECLARE v_pct DECIMAL(5,2);

    -- Declare cursor over enrolled students for the course
    DECLARE cur_students CURSOR FOR
        SELECT s.id, CONCAT(s.first_name, ' ', s.last_name)
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        WHERE e.course_id = p_course_id AND e.status = 'enrolled';

    -- Declare continue handler for cursor completion
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    -- Clean previous run data for this course
    DELETE FROM attendance_defaulters WHERE course_id = p_course_id;

    OPEN cur_students;

    read_loop: LOOP
        FETCH cur_students INTO v_student_id, v_student_name;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- Calculate total classes and attended classes for this student
        SELECT 
            COUNT(*), 
            COALESCE(SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END), 0)
        INTO v_total, v_present
        FROM attendance
        WHERE course_id = p_course_id AND student_id = v_student_id;

        IF v_total > 0 THEN
            SET v_pct = (v_present / v_total) * 100;
        ELSE
            SET v_pct = 0.00;
        END IF;

        -- Check if student is below threshold (e.g., 75%)
        IF v_total > 0 AND v_pct < p_threshold THEN
            INSERT INTO attendance_defaulters (
                course_id, student_id, student_name, total_classes, attended_classes, attendance_pct
            ) VALUES (
                p_course_id, v_student_id, v_student_name, v_total, v_present, v_pct
            );
        END IF;
    END LOOP;

    CLOSE cur_students;

    -- Return the generated defaulters list
    SELECT 
        student_id,
        student_name,
        total_classes,
        attended_classes,
        attendance_pct,
        flagged_at
    FROM attendance_defaulters
    WHERE course_id = p_course_id
    ORDER BY attendance_pct ASC;
END$$

DELIMITER ;

