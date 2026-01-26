-- Initial setup script for MySQL
-- This script runs automatically when MySQL container starts for the first time

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Use the football_booking database
USE football_booking;

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON football_booking.* TO 'footballuser'@'%';
FLUSH PRIVILEGES;

-- Create tables will be done by Sequelize automatically
-- This is just for any additional setup if needed

SELECT 'Database initialization completed!' as message;
