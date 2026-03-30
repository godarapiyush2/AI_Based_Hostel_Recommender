-- 1. Create the Database
CREATE DATABASE IF NOT EXISTS hostel_db;
USE hostel_db;

-- 2. Create the Hostels Table
-- This matches your /api/admin/dashboard-stats and /api/get-recommendation routes
CREATE TABLE IF NOT EXISTS hostels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('Boys', 'Girls', 'Any') NOT NULL DEFAULT 'Girls',
    price INT NOT NULL,
    seats_available INT NOT NULL DEFAULT 10,
    rating DECIMAL(3,2) DEFAULT 4.5,
    image_url TEXT,
    specifications TEXT,
    is_studio TINYINT(1) DEFAULT 0,
    has_kitchen TINYINT(1) DEFAULT 0,
    has_garden TINYINT(1) DEFAULT 0,
    has_balcony TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the Users (Leads) Table
-- This matches your /api/start-chat and /api/book-visit routes
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) UNIQUE NOT NULL, -- This is the email
    hostel_interest VARCHAR(255),            -- Saved when they book a visit
    visit_date VARCHAR(100),                 -- Saved when they book a visit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Insert some Dummy Data so the Chatbot has something to recommend
INSERT INTO hostels (name, type, price, seats_available, rating, specifications, image_url)
VALUES 
('Elite Residency', 'Girls', 15500, 5, 4.8, 'AC, Wifi, 3 Meals, Gym', 'https://images.unsplash.com/photo-1555854817-5b273832363c'),
('Sunshine Stay', 'Girls', 12000, 2, 4.2, 'Non-AC, Wifi, Attached Washroom', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af'),
('Royal Boys Hostel', 'Boys', 14000, 8, 4.5, 'AC, Laundry, Gaming Zone', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf');

-- 5. Verify the tables exist
SHOW TABLES;

