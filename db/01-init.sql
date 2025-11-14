/** DATABASE CREATION - Schema Script **/
DROP DATABASE IF EXISTS marketplace;
CREATE DATABASE marketplace;
USE marketplace;

/** TABLES **/
-- USERS
CREATE TABLE users (
    user_id         INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    fname           VARCHAR(100) NOT NULL,
    lname           VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL
);

-- ADMINS
CREATE TABLE admins (
    admin_id        INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    fname           VARCHAR(100) NOT NULL,
    lname           VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL
);

-- POSTS (parent of events + market_posts)
-- post_type: 'event' or 'market'
CREATE TABLE posts (
    post_id     INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    post_type   ENUM('event','market') NOT NULL,
    postal_code VARCHAR(20),
    price       DECIMAL(10,2),
    posted_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- EVENTS (event_id = post_id)
CREATE TABLE event_posts (
    event_id          INT PRIMARY KEY,
    organization_name VARCHAR(255),
    event_date        DATETIME NOT NULL,
    FOREIGN KEY (event_id) REFERENCES posts(post_id)
);

-- MARKET POSTS (market_id = post_id)
CREATE TABLE market_posts (
    market_id      INT PRIMARY KEY,
    item_condition VARCHAR(100),
    FOREIGN KEY (market_id) REFERENCES posts(post_id)
);

-- SAVED POSTS (bookmark)
CREATE TABLE saved_posts (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
);

-- CONTACTED SELLER
CREATE TABLE contacted_seller (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
);

-- REPORTS BASE
-- report_type: 'user' or 'post'
CREATE TABLE reports (
    report_id   INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    report_type ENUM('user','post') NOT NULL,
    reason      TEXT NOT NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(user_id)
);

-- REPORT ABOUT A POST
CREATE TABLE post_report (
    report_id INT PRIMARY KEY,
    post_id   INT NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(report_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
);

-- REPORT ABOUT A USER
CREATE TABLE user_report (
    report_id        INT PRIMARY KEY,
    reported_user_id INT NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(report_id),
    FOREIGN KEY (reported_user_id) REFERENCES users(user_id)
);

-- ADMIN ACTION LOG
CREATE TABLE admin_actions (
    action_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id  INT NOT NULL,
    action    VARCHAR(255) NOT NULL,
    action_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
);

-- BANNED USERS (linked to an admin action)
CREATE TABLE banned_users (
    action_id  INT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    PRIMARY KEY (action_id, user_email),
    FOREIGN KEY (action_id) REFERENCES admin_actions(action_id)
);

-- IMAGES
CREATE TABLE images (
    image_id        INT AUTO_INCREMENT PRIMARY KEY,
    post_id         INT NOT NULL,
    image_text_data LONGBLOB,
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
);

/* Event Scheduler and verification code table for authentication */

SET GLOBAL event_scheduler = ON;

-- Create an event handler to delete expired verifcication codes 
-- ref: https://www.slingacademy.com/article/how-to-set-expiration-date-for-record-in-mysql-8/
CREATE EVENT IF NOT EXISTS expire_codes_event
ON SCHEDULE EVERY 4 MINUTE 
DO
  DELETE FROM verification_codes
  WHERE expiration_date < CURTIME();
  
-- Create a table with a FULLTEXT index
CREATE TABLE IF NOT EXISTS verification_codes (
    randomCode VARCHAR(8) PRIMARY KEY,
    expiration_date TIME
);

-- Add index to make checking the expiration_date faster
ALTER TABLE verification_codes 
ADD INDEX (expiration_date);

-- Insert some sample data

INSERT INTO verification_codes (randomCode, expiration_date) VALUES
(  UPPER(LEFT( UUID(), 8)), DATE_ADD(CURTIME(), INTERVAL 5 MINUTE) ); 

INSERT INTO verification_codes (randomCode, expiration_date) VALUES
( UPPER(LEFT( UUID(), 8)) , DATE_ADD(CURTIME(), INTERVAL 5 MINUTE) );