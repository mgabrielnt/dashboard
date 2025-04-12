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

// Tetapkan JWT_SECRET secara konsisten di seluruh aplikasi
const JWT_SECRET = 'your_jwt_secret_key_should_be_long_and_complex';
console.log('JWT_SECRET loaded and set');

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || "kafkauser",
  host: process.env.DB_HOST || "172.26.128.1",
  database: process.env.DB_NAME || "staging_dwh",
  password: process.env.DB_PASSWORD || "JsuA2d5sh4bhLAya",
  port: process.env.DB_PORT || 5458,
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully. Server time:', res.rows[0].now);
  }
});

// Authentication middleware
const { authenticate, adminOnly } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const BKIRoutes = require('./routes/BKIRoutes');
const SCIRoutes = require('./routes/SCIRoutes');
const SIRoutes = require('./routes/SIRoutes');
const entityRoutes = require('./routes/entityRoutes'); // New entities route
const teamRoutes = require('./routes/teamRoutes');
const piechart = require('./routes/pieRoutes');
const linechart = require('./routes/lineRoutes');
const barchartbki = require('./routes/barbkiRoutes');
const barchartsci = require('./routes/barsciRoutes');
const barchartsi = require('./routes/barsiRoutes');
const calendarRoutes = require('./routes/calenderRoutes');
const profileRoutes = require('./routes/profileRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

// Use authentication routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authenticate, adminOnly, usersRoutes);
app.use('/api/BKI', authenticate, BKIRoutes);
app.use('/api/SCI', authenticate, SCIRoutes);
app.use('/api/SI', authenticate, SIRoutes);
app.use('/api/entities', authenticate, entityRoutes); // New entities API route
app.use('/api/team', authenticate, adminOnly, teamRoutes);
app.use('/api/pie', authenticate, piechart);
app.use('/api/line', authenticate, linechart);
app.use('/api/barbki', authenticate, barchartbki);
app.use('/api/barsci', authenticate, barchartsci);
app.use('/api/barsi', authenticate, barchartsi);
app.use('/api/calendar', authenticate, calendarRoutes);
app.use('/api/profile', authenticate, profileRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Make static uploads available
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Server health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date(),
    jwt_secret_set: true
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = pool;