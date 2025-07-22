const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root'
};

const DB_NAME = process.env.DB_NAME || 'whatsapp_food_ordering';

async function createDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL server...');
    
    // First connect without specifying database
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    console.log(`🗄️  Creating database '${DB_NAME}' if it doesn't exist...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    console.log(`✅ Database '${DB_NAME}' ready`);
    
    // Close connection and reconnect to the specific database
    await connection.end();
    
    // Reconnect with database specified
    connection = await mysql.createConnection({
      ...DB_CONFIG,
      database: DB_NAME
    });
    
    // Read and execute schema
    console.log('📋 Reading schema file...');
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by semicolon and filter out empty lines and USE statements
      const statements = schemaContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)
        .filter(stmt => !stmt.toUpperCase().startsWith('USE'))
        .filter(stmt => !stmt.toUpperCase().startsWith('CREATE DATABASE'));
      
      console.log(`⚙️  Executing ${statements.length} SQL statements...`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.execute(statement);
            console.log('✅ Statement executed');
          } catch (error) {
            console.log(`⚠️  Statement skipped: ${error.message}`);
          }
        }
      }
      
      console.log('✅ Schema created successfully');
    } else {
      console.log('⚠️  Schema file not found, creating basic schema...');
      await createBasicSchema(connection);
    }
    
    // Insert sample data
    console.log('🌱 Creating sample data...');
    await insertSampleData(connection);
    
    console.log('🎉 Database setup completed successfully!');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`🔗 Connection: ${DB_CONFIG.host}:3306`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Install MySQL locally: https://dev.mysql.com/downloads/mysql/');
      console.log('2. Use Docker: docker run --name mysql-food-ordering -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=whatsapp_food_ordering -p 3306:3306 -d mysql:8.0');
      console.log('3. Use online MySQL service (PlanetScale, Railway, Aiven)');
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Database credentials issue:');
      console.log('1. Check your MySQL username and password in .env file');
      console.log('2. Make sure MySQL server is running');
      console.log('3. Verify user permissions');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createBasicSchema(connection) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100),
      email VARCHAR(100),
      password_hash VARCHAR(255),
      role ENUM('customer', 'restaurant_owner', 'super_admin') DEFAULT 'customer',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_phone (phone),
      INDEX idx_role (role)
    )`,
    
    `CREATE TABLE IF NOT EXISTS restaurants (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      phone VARCHAR(20),
      address TEXT,
      owner_id INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_owner (owner_id),
      INDEX idx_active (is_active)
    )`,
    
    `CREATE TABLE IF NOT EXISTS menu_items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      restaurant_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(50),
      image_url VARCHAR(255),
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      INDEX idx_restaurant (restaurant_id),
      INDEX idx_category (category),
      INDEX idx_available (is_available)
    )`,
    
    `CREATE TABLE IF NOT EXISTS orders (
      id INT PRIMARY KEY AUTO_INCREMENT,
      customer_id INT,
      restaurant_id INT NOT NULL,
      status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
      total_amount DECIMAL(10,2) NOT NULL,
      delivery_address TEXT,
      customer_phone VARCHAR(20) NOT NULL,
      customer_name VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      INDEX idx_customer (customer_id),
      INDEX idx_restaurant (restaurant_id),
      INDEX idx_status (status),
      INDEX idx_phone (customer_phone)
    )`,
    
    `CREATE TABLE IF NOT EXISTS order_items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_id INT NOT NULL,
      menu_item_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      price DECIMAL(10,2) NOT NULL,
      item_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
      INDEX idx_order (order_id),
      INDEX idx_menu_item (menu_item_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS messages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      phone VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('incoming', 'outgoing', 'button_reply') NOT NULL,
      message_sid VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user (user_id),
      INDEX idx_phone (phone),
      INDEX idx_type (type),
      INDEX idx_created (created_at)
    )`
  ];
  
  for (const table of tables) {
    await connection.execute(table);
    console.log('✅ Table created');
  }
}

async function insertSampleData(connection) {
  try {
    // Insert super admin user
    await connection.execute(`
      INSERT IGNORE INTO users (phone, name, email, password_hash, role) VALUES 
      ('+1234567890', 'Super Admin', 'admin@foodapp.com', '$2b$10$example_hash', 'super_admin')
    `);

    // Insert sample restaurant owner
    await connection.execute(`
      INSERT IGNORE INTO users (phone, name, email, password_hash, role) VALUES 
      ('+1234567891', 'Restaurant Owner', 'owner@restaurant.com', '$2b$10$example_hash', 'restaurant_owner')
    `);

    // Insert sample customer
    await connection.execute(`
      INSERT IGNORE INTO users (phone, name, email, password_hash, role) VALUES 
      ('+1234567892', 'John Customer', 'customer@example.com', '$2b$10$example_hash', 'customer')
    `);

    // Insert sample restaurant
    await connection.execute(`
      INSERT IGNORE INTO restaurants (name, description, phone, address, owner_id) VALUES 
      ('Pizza Palace', 'Best pizza in town!', '+1234567891', '123 Main Street, City', 2)
    `);

    // Insert sample menu items
    await connection.execute(`
      INSERT IGNORE INTO menu_items (restaurant_id, name, description, price, category) VALUES 
      (1, 'Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 12.99, 'Pizza'),
      (1, 'Pepperoni Pizza', 'Pizza with pepperoni and mozzarella cheese', 14.99, 'Pizza'),
      (1, 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 8.99, 'Salad'),
      (1, 'Garlic Bread', 'Crispy bread with garlic butter', 5.99, 'Appetizer')
    `);

    console.log('✅ Sample data inserted');
  } catch (error) {
    console.log('⚠️  Sample data already exists or error occurred:', error.message);
  }
}

// Load environment variables
require('dotenv').config();

// Run the setup
createDatabase();
