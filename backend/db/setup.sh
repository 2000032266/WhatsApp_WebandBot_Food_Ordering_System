#!/bin/bash

echo "=================================="
echo "WhatsApp Food Ordering System Setup"
echo "=================================="
echo

echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed! Please install Node.js first."
  exit 1
fi
node --version

echo
echo "1. Installing dependencies..."
cd ..
npm install
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to install dependencies!"
  exit 1
fi

echo
echo "2. Initializing database..."
node db/initialize-database.js
if [ $? -ne 0 ]; then
  echo "WARNING: Database initialization might have issues."
  
  echo
  echo "3. Attempting to insert test users directly..."
  node db/insert-test-users.js
fi

echo
echo "Setup complete! You can now start the server with 'npm run dev'"
echo
echo "Admin login: 9876543210 / admin123"
echo "Owner login: 9871234560 / owner123"
echo
