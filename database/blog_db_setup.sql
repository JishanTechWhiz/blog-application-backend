-- Optional: Select data from old table
-- SELECT * FROM mywork.tbl_todo;

-- Create and use the blog database
CREATE DATABASE IF NOT EXISTS db_blog_application;
USE db_blog_application;

-- =========================
-- 1. USERS TABLE
-- =========================
CREATE TABLE `tbl_user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fullname` VARCHAR(100),
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255),
  `country_code` VARCHAR(10),
  `phone` VARCHAR(20),
  `profile_pic` VARCHAR(255),
  `login_type` ENUM('social', 'normal') DEFAULT 'normal',
  `social_id` VARCHAR(255),
  `is_active` TINYINT(1) DEFAULT 1,
  `is_verified` TINYINT(1) DEFAULT 0,
  `is_login` TINYINT(1) DEFAULT 0,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `step` TINYINT DEFAULT 0,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- =========================
-- 2. CATEGORIES TABLE
-- =========================
CREATE TABLE `tbl_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- =========================
-- 3. POSTS TABLE
-- =========================
CREATE TABLE `tbl_posts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `image_url` VARCHAR(255),
  `author_id` INT NOT NULL,
  `category_id` INT,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`author_id`),
  INDEX (`category_id`),
  INDEX (`is_active`),
  CONSTRAINT `fk_post_author` FOREIGN KEY (`author_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_category` FOREIGN KEY (`category_id`) REFERENCES `tbl_categories` (`id`) ON DELETE SET NULL
);

-- =========================
-- 4. COMMENTS TABLE
-- =========================
CREATE TABLE `tbl_comments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `comment` TEXT NOT NULL,
  `author_id` INT,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`post_id`),
  INDEX (`author_id`),
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `tbl_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_author` FOREIGN KEY (`author_id`) REFERENCES `tbl_user` (`id`) ON DELETE SET NULL
);
