-- WhatsApp Food Ordering System Database Schema
-- Execute this file to create and populate the database
--
-- To run this schema:
-- 1. Make sure MySQL is running
-- 2. From command line: mysql -u root -p < schema.sql
--    OR
-- 3. In MySQL Workbench: File > Open SQL Script > Select this file > Execute
--
-- All passwords for test users are provided in comments next to each user

-- Create database
CREATE DATABASE IF NOT EXISTS whatsapp_food_ordering;
USE whatsapp_food_ordering;

-- Users table (customers, restaurant owners, super admins)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL,
    password VARCHAR(255),
    role ENUM('customer', 'restaurant_owner', 'super_admin') DEFAULT 'customer',
    whatsapp_state VARCHAR(50) DEFAULT 'idle',
    cart TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Restaurants table
CREATE TABLE restaurants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    owner_id INT NOT NULL,
    phone VARCHAR(10),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Menu items table
CREATE TABLE menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Messages table (WhatsApp conversation log)
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    phone VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('incoming', 'outgoing', 'button_reply') DEFAULT 'incoming',
    message_sid VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert sample data

-- Create Indian super admin (password: admin123)
INSERT INTO users (name, phone, password, role) VALUES 
('Rahul Kumar', '9876543210', '$2a$10$3NtCpxoLXjuTv9MsXuQSlucjHNjW9t8HQz3h1oJhBf5H1O2yJpnOO', 'super_admin');

-- Create sample restaurant owner (password: owner123)
INSERT INTO users (name, phone, password, role) VALUES 
('Vikram Singh', '9871234560', '$2a$10$1Th9TDz90UzYVVQ5hPxRbe9GhEYVvRUe2.4e15NzPn2eaSDG0.Rti', 'restaurant_owner');

-- Create sample restaurant
INSERT INTO restaurants (name, owner_id, phone, address) VALUES 
('Spicy Hub', 2, '9871234560', '123 Food Street, Mumbai');

-- Create sample menu items
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES 
(1, 'Classic Burger', 'Juicy beef patty with cheese, lettuce, tomato', 250.00, 'Burgers'),
(1, 'Chicken Pizza', 'Delicious chicken pizza with fresh toppings', 450.00, 'Pizza'),
(1, 'French Fries', 'Crispy golden french fries', 120.00, 'Sides'),
(1, 'Coca Cola', 'Refreshing soft drink', 50.00, 'Beverages'),
(1, 'Chocolate Shake', 'Rich chocolate milkshake', 180.00, 'Beverages');

-- Create sample customer (no password for customer, they register via WhatsApp)
INSERT INTO users (name, phone, role) VALUES 
('Priya Sharma', '9898765432', 'customer');

-- Create indexes for better performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX idx_messages_phone ON messages(phone);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Verify data was loaded successfully
SELECT 'Database initialization complete!' as message;
SELECT id, name, phone, role FROM users;
