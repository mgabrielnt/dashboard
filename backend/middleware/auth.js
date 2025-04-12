// middleware/auth.js
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Tetapkan JWT_SECRET yang konsisten
const JWT_SECRET = 'your_jwt_secret_key_should_be_long_and_complex';

// Initialize PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER || "kafkauser",
  host: process.env.DB_HOST || "172.26.128.1",
  database: process.env.DB_NAME || "staging_dwh",
  password: process.env.DB_PASSWORD || "JsuA2d5sh4bhLAya",
  port: process.env.DB_PORT || 5458,
});

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Bypass authentication for chatbot API
    if (req.path.startsWith('/api/chatbot')) {
      req.user = { id: 1, role: 'admin' }; // Default user for chatbot
      return next();
    }
    
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    // Verify token with hardcoded secret
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session exists and is valid
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
      [decoded.id, token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    // Add user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);    
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Admin role middleware
const adminOnly = (req, res, next) => {
  // Bypass admin check for chatbot API
  if (req.path.startsWith('/api/chatbot')) {
    return next();
  }
  
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
  next();
};

module.exports = { authenticate, adminOnly };