
CREATE DATABASE IF NOT EXISTS university_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE university_system;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  name                     VARCHAR(80)  NOT NULL,
  email                    VARCHAR(150) NOT NULL,
  password                 VARCHAR(255) NOT NULL,
  role                     ENUM('admin', 'student', 'alumni') NOT NULL DEFAULT 'student',
  department               VARCHAR(100) NOT NULL DEFAULT '',
  batch                    VARCHAR(50)  NOT NULL DEFAULT '',
  semester                 VARCHAR(50)  NOT NULL DEFAULT '',
  student_id               VARCHAR(50)  NOT NULL DEFAULT '',
  phone                    VARCHAR(30)  NOT NULL DEFAULT '',
  address                  VARCHAR(250) NOT NULL DEFAULT '',
  profile_image            VARCHAR(255) NOT NULL DEFAULT '',
  current_company          VARCHAR(150) NOT NULL DEFAULT '',
  designation              VARCHAR(150) NOT NULL DEFAULT '',
  linkedin_profile         VARCHAR(255) NOT NULL DEFAULT '',
  status                   ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
  reset_password_token     VARCHAR(255) NOT NULL DEFAULT '',
  reset_password_code      VARCHAR(255) NOT NULL DEFAULT '',
  reset_password_expires   DATETIME NULL,
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. notes
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS notes;
CREATE TABLE notes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(150) NOT NULL,
  subject         VARCHAR(100) NOT NULL,
  department      VARCHAR(100) NOT NULL,
  semester        VARCHAR(50)  NOT NULL,
  file_path       VARCHAR(255) NOT NULL,
  status          ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  download_count  INT NOT NULL DEFAULT 0,
  uploaded_by     INT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notes_uploaded_by FOREIGN KEY (uploaded_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_notes_department (department),
  INDEX idx_notes_semester (semester),
  INDEX idx_notes_subject (subject),
  INDEX idx_notes_status (status),
  INDEX idx_notes_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. pyqs  (Previous Year Questions)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS pyqs;
CREATE TABLE pyqs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(150) NOT NULL,
  subject         VARCHAR(100) NOT NULL,
  department      VARCHAR(100) NOT NULL,
  semester        VARCHAR(50)  NOT NULL,
  year            VARCHAR(10)  NOT NULL,
  file_path       VARCHAR(255) NOT NULL,
  status          ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  download_count  INT NOT NULL DEFAULT 0,
  uploaded_by     INT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pyqs_uploaded_by FOREIGN KEY (uploaded_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_pyqs_department (department),
  INDEX idx_pyqs_semester (semester),
  INDEX idx_pyqs_subject (subject),
  INDEX idx_pyqs_year (year),
  INDEX idx_pyqs_status (status),
  INDEX idx_pyqs_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. announcements
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS announcements;
CREATE TABLE announcements (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(150)  NOT NULL,
  description  VARCHAR(2000) NOT NULL,
  priority     ENUM('normal', 'important', 'urgent') NOT NULL DEFAULT 'normal',
  created_by   INT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_announcements_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. feedbacks
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS feedbacks;
CREATE TABLE feedbacks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  message     VARCHAR(2000) NOT NULL,
  rating      TINYINT NOT NULL DEFAULT 5,
  user_id     INT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedbacks_user_id FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_feedbacks_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. success_stories
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS success_stories;
CREATE TABLE success_stories (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  designation     VARCHAR(150) NOT NULL,
  company         VARCHAR(150) NOT NULL,
  company_logo    VARCHAR(255) NOT NULL DEFAULT '',
  student_image   VARCHAR(255) NOT NULL DEFAULT '',
  profile_link    VARCHAR(255) NOT NULL DEFAULT '',
  status          ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_success_stories_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. supports
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS supports;
CREATE TABLE supports (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)   NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  type        VARCHAR(100)  NOT NULL,
  message     VARCHAR(2000) NOT NULL,
  status      ENUM('open', 'in-progress', 'resolved') NOT NULL DEFAULT 'open',
  user_id     INT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_supports_user_id FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_supports_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. bookmarks 
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS bookmarks;
CREATE TABLE bookmarks (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  resource_type  ENUM('notes', 'pyq') NOT NULL,
  resource_id    INT NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookmarks_user_id FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_bookmark_per_user (user_id, resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. jobs  (posted by alumni)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS jobs;
CREATE TABLE jobs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(150)  NOT NULL,
  company       VARCHAR(100)  NOT NULL,
  description   VARCHAR(3000) NOT NULL,
  job_type      ENUM('full-time', 'part-time', 'internship', 'remote', 'contract') NOT NULL DEFAULT 'full-time',
  location      VARCHAR(120)  NOT NULL DEFAULT '',
  apply_link    VARCHAR(255)  NOT NULL DEFAULT '',
  deadline      DATE NULL,
  status        ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  posted_by     INT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobs_posted_by FOREIGN KEY (posted_by)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_job_type (job_type),
  INDEX idx_jobs_posted_by (posted_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. messages  (alumni <-> student direct messages)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  sender_id     INT NOT NULL,
  recipient_id  INT NOT NULL,
  body          VARCHAR(2000) NOT NULL,
  read_at       DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_messages_recipient FOREIGN KEY (recipient_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_recipient (recipient_id),
  INDEX idx_messages_conversation (sender_id, recipient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. semester_records  (one row per semester saved in the CGPA tool)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS semester_records;
CREATE TABLE semester_records (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  label       VARCHAR(50) NOT NULL,
  gpa         DECIMAL(3,2) NOT NULL,
  credits     INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_semester_records_student FOREIGN KEY (student_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_semester_records_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. semester_courses  
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS semester_courses;
CREATE TABLE semester_courses (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  semester_record_id  INT NOT NULL,
  name                VARCHAR(150) NOT NULL DEFAULT '',
  credits             INT NOT NULL,
  grade               VARCHAR(10) NOT NULL,
  CONSTRAINT fk_semester_courses_record FOREIGN KEY (semester_record_id)
    REFERENCES semester_records (id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_semester_courses_record (semester_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;