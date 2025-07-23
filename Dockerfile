# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy backend dependencies and install
COPY package*.json ./
RUN npm install

# Copy frontend dependencies and install
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy all source code
COPY . .

# Build the frontend
RUN cd frontend && npm run build

# (Optional) If you want to serve the frontend with Express, add this to your backend/app.js:
# const path = require('path');
# app.use(express.static(path.join(__dirname, '../frontend/dist')));
# app.get('*', (req, res) => {
#   res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
# });

# Expose backend port
EXPOSE 5001

# Start backend server
CMD ["node", "backend/app.js"]