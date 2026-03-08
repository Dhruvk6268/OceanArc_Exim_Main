-- OceanArc Exim - Analytics table
-- Import this file on your server database to enable admin analytics.

CREATE TABLE IF NOT EXISTS `website_analytics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(128) NOT NULL,
  `user_id` CHAR(32) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `page_url` VARCHAR(500) NOT NULL DEFAULT '/',
  `referrer` VARCHAR(500) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT 'Unknown',
  `city` VARCHAR(100) DEFAULT 'Unknown',
  `device_type` VARCHAR(30) DEFAULT 'desktop',
  `browser` VARCHAR(50) DEFAULT 'Other',
  `os` VARCHAR(50) DEFAULT 'Unknown',
  `is_returning` TINYINT(1) NOT NULL DEFAULT 0,
  `first_visit` DATETIME DEFAULT NULL,
  `visit_start` DATETIME NOT NULL,
  `last_activity` DATETIME NOT NULL,
  `duration_seconds` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_analytics_user` (`user_id`),
  KEY `idx_analytics_session` (`session_id`),
  KEY `idx_analytics_activity` (`last_activity`),
  KEY `idx_analytics_visit_start` (`visit_start`),
  KEY `idx_analytics_page` (`page_url`(191)),
  KEY `idx_analytics_session_page_recent` (`session_id`,`page_url`(191),`last_activity`),
  KEY `idx_analytics_date_activity` (`visit_start`,`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
