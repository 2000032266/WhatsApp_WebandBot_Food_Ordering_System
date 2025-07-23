@echo off
echo ==================================
echo WhatsApp Food Ordering System Setup
echo ==================================
echo.

echo Checking Node.js installation...
node --version
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js is not installed! Please install Node.js first.
  exit /b 1
)

echo.
echo 1. Installing dependencies...
cd ..
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Failed to install dependencies!
  exit /b 1
)

echo.
echo 2. Initializing database...
node db/initialize-database.js
if %ERRORLEVEL% NEQ 0 (
  echo WARNING: Database initialization might have issues.
  
  echo.
  echo 3. Attempting to insert test users directly...
  node db/insert-test-users.js
)

echo.
echo Setup complete! You can now start the server with 'npm run dev'
echo.
echo Admin login: 9876543210 / admin123
echo Owner login: 9871234560 / owner123
echo.
pause
