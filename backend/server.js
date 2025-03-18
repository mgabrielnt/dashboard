require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-production-domain.com'],
  credentials: true
}));
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || "kafkauser",
  host: process.env.DB_HOST || "172.21.80.1",
  database: process.env.DB_NAME || "staging_dwh",
  password: process.env.DB_PASSWORD || "JsuA2d5sh4bhLAya",
  port: process.env.DB_PORT || 5458,
});

// Authentication middleware
const { authenticate, adminOnly } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const BKIRoutes = require('./routes/BKIRoutes');
const SCIRoutes = require('./routes/SCIRoutes');
const SIRoutes = require('./routes/SIRoutes');
const teamRoutes = require('./routes/teamRoutes');
const piechart = require('./routes/pieRoutes');
const linechart = require('./routes/lineRoutes');
const barchartbki = require('./routes/barbkiRoutes');
const barchartsci = require('./routes/barsciRoutes');
const barchartsi = require('./routes/barsiRoutes');
const calendarRoutes = require('./routes/calenderRoutes');
const profileRoutes = require('./routes/profileRoutes');
// Use authentication routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authenticate, adminOnly, usersRoutes);
app.use('/api/BKI', authenticate,  BKIRoutes);
app.use('/api/SCI', authenticate, SCIRoutes);
app.use('/api/SI', authenticate, SIRoutes);
app.use('/api/team', authenticate, adminOnly, teamRoutes); // Only admin can access
app.use('/api/pie', authenticate, piechart);
app.use('/api/line', authenticate, linechart);
app.use('/api/barbki', authenticate,barchartbki);
app.use('/api/barsci',authenticate, barchartsci);
app.use('/api/barsi',authenticate,  barchartsi);
app.use('/api/calendar', authenticate, calendarRoutes);
app.use('/api/profile', authenticate, profileRoutes);
// Make sure this code is in your server.js
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Server health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = pool;