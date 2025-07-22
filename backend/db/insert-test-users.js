// Insert test users script
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function insertTestUsers() {
  console.log('🌱 Inserting test users...');
  
  try {
    // Create connection to the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'whatsapp_food_ordering'
    });
    
    console.log('✅ Connected to database');
    
    // Delete existing test users first to avoid duplicates
    console.log('🧹 Cleaning up existing test users...');
    await connection.query('DELETE FROM restaurants WHERE owner_id IN (SELECT id FROM users WHERE phone IN (?, ?))', 
      ['9876543210', '9871234560']);
    await connection.query('DELETE FROM users WHERE phone IN (?, ?, ?)', 
      ['9876543210', '9871234560', '9898765432']);
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const ownerPassword = await bcrypt.hash('owner123', 10);
    
    // Insert super admin
    console.log('👤 Creating super admin user...');
    const [adminResult] = await connection.query(
      'INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)',
      ['Rahul Kumar', '9876543210', adminPassword, 'super_admin']
    );
    
    // Insert restaurant owner
    console.log('👤 Creating restaurant owner user...');
    const [ownerResult] = await connection.query(
      'INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)',
      ['Vikram Singh', '9871234560', ownerPassword, 'restaurant_owner']
    );
    
    // Insert restaurant
    console.log('🏪 Creating restaurant...');
    await connection.query(
      'INSERT INTO restaurants (name, owner_id, phone, address) VALUES (?, ?, ?, ?)',
      ['Spicy Hub', ownerResult.insertId, '9871234560', '123 Food Street, Mumbai']
    );
    
    // Insert customer
    console.log('👤 Creating customer user...');
    await connection.query(
      'INSERT INTO users (name, phone, role) VALUES (?, ?, ?)',
      ['Priya Sharma', '9898765432', 'customer']
    );
    
    // Verify the data was loaded
    console.log('🔍 Verifying users were created...');
    const [users] = await connection.query('SELECT id, name, phone, role FROM users');
    
    console.log('👥 User accounts created:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.phone}) - ${user.role}`);
    });
    
    await connection.end();
    console.log('✅ Test users created successfully!');
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Admin: Phone: 9876543210, Password: admin123');
    console.log('   Owner: Phone: 9871234560, Password: owner123');
    console.log('   Customer: Phone: 9898765432 (no password, registers via WhatsApp)');
    
  } catch (error) {
    console.error('❌ Test user creation failed:', error.message);
  }
}

insertTestUsers();
