// Database initialization script
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initializeDatabase() {
  console.log('🌱 Initializing database...');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = schemaSQL
      .replace(/--.*\n/g, '') // Remove comments
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Create connection to MySQL server
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Execute CREATE DATABASE and USE statements first
    const createDbStatement = statements.find(stmt => stmt.toLowerCase().includes('create database'));
    const useDbStatement = statements.find(stmt => stmt.toLowerCase().includes('use '));
    
    if (createDbStatement) {
      console.log('📊 Creating database if it doesn\'t exist...');
      await connection.query(createDbStatement);
    }
    
    if (useDbStatement) {
      console.log('📊 Selecting database...');
      await connection.query(useDbStatement);
    }
    
    // Execute the rest of the statements
    for (const statement of statements) {
      if (statement !== createDbStatement && statement !== useDbStatement) {
        try {
          await connection.query(statement);
        } catch (err) {
          console.error(`❌ Error executing statement: ${statement.substr(0, 50)}...`);
          console.error(err.message);
        }
      }
    }
    
    // Verify the data was loaded
    console.log('🔍 Verifying data was loaded...');
    const [users] = await connection.query('SELECT id, name, phone, role FROM users');
    
    console.log('👥 User accounts created:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.phone}) - ${user.role}`);
    });
    
    await connection.end();
    console.log('✅ Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
}

initializeDatabase();
