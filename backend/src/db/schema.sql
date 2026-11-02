-- schema.sql: College Management Portal normalized MySQL schema

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_dept_code CHECK (CHAR_LENGTH(code) >= 2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'faculty', 'admin') NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  faculty_id VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(20),
  department_id INT NOT NULL,
  designation VARCHAR(50) DEFAULT 'Assistant Professor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_faculty_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_faculty_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  INDEX idx_faculty_dept (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(20),
  department_id INT NOT NULL,
  semester INT NOT NULL DEFAULT 1,
  enrollment_date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_students_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT chk_students_semester CHECK (semester BETWEEN 1 AND 8),
  INDEX idx_students_dept (department_id),
  INDEX idx_students_semester (semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  department_id INT NOT NULL,
  credits INT NOT NULL DEFAULT 3,
  faculty_id INT NULL,
  capacity INT NOT NULL DEFAULT 30,
  semester INT NOT NULL DEFAULT 1,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_courses_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL,
  CONSTRAINT chk_courses_capacity CHECK (capacity > 0),
  CONSTRAINT chk_courses_credits CHECK (credits >= 1 AND credits <= 10),
  CONSTRAINT chk_courses_semester CHECK (semester BETWEEN 1 AND 8),
  INDEX idx_courses_dept (department_id),
  INDEX idx_courses_faculty (faculty_id),
  INDEX idx_courses_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('enrolled', 'dropped') DEFAULT 'enrolled',
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_course (student_id, course_id),
  INDEX idx_enrollments_course (course_id),
  INDEX idx_enrollments_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('Present', 'Absent') NOT NULL,
  marked_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_faculty FOREIGN KEY (marked_by) REFERENCES faculty(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_student_course_date (student_id, course_id, attendance_date),
  INDEX idx_attendance_course_date (course_id, attendance_date),
  INDEX idx_attendance_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Results Table
CREATE TABLE IF NOT EXISTS results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  marks DECIMAL(5,2) NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  grade VARCHAR(5) NOT NULL,
  semester INT NOT NULL DEFAULT 1,
  evaluator_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_results_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_results_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_results_faculty FOREIGN KEY (evaluator_id) REFERENCES faculty(id) ON DELETE RESTRICT,
  CONSTRAINT chk_results_max_marks CHECK (max_marks > 0.00),
  CONSTRAINT chk_results_marks CHECK (marks >= 0.00 AND marks <= max_marks),
  CONSTRAINT chk_results_semester CHECK (semester BETWEEN 1 AND 8),
  UNIQUE KEY uk_student_course_sem (student_id, course_id, semester),
  INDEX idx_results_student (student_id),
  INDEX idx_results_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

