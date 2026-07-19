

USE university_system;

SET FOREIGN_KEY_CHECKS = 0;


ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'student', 'alumni') NOT NULL DEFAULT 'student';

ALTER TABLE users
  ADD COLUMN current_company  VARCHAR(150) NOT NULL DEFAULT '' AFTER profile_image,
  ADD COLUMN designation      VARCHAR(150) NOT NULL DEFAULT '' AFTER current_company,
  ADD COLUMN linkedin_profile VARCHAR(255) NOT NULL DEFAULT '' AFTER designation;



CREATE TABLE IF NOT EXISTS jobs (
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


CREATE TABLE IF NOT EXISTS messages (
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


CREATE TABLE IF NOT EXISTS semester_records (
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


CREATE TABLE IF NOT EXISTS semester_courses (
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