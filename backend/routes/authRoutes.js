const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();

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

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email validation function
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email already exists
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'user']
    );

    // Create profile for the user
    await pool.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1)',
      [newUser.rows[0].id]
    );

    // Generate JWT token with hardcoded secret
    const token = jwt.sign(
      { id: newUser.rows[0].id, role: newUser.rows[0].role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Save session
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [newUser.rows[0].id, token, new Date(Date.now() + 86400000)] // 24 hours
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.rows[0].id,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
        role: newUser.rows[0].role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login with email and password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Find user by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check if user has a password (might be Google-only account)
    if (!user.password) {
      return res.status(401).json({ message: 'Please login with Google' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token with hardcoded secret
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Save session
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, new Date(Date.now() + 86400000)] // 24 hours
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Google authentication
router.post('/google-auth', async (req, res) => {
    const { credential, googleData } = req.body;
    
    try {
      console.time('googleAuth'); // Add timing for debugging
      
      // Use the googleData directly if provided (faster)
      if (googleData && googleData.email) {
        const { email, name, sub, picture } = googleData;
        
        // Check if user exists with a simple query
        const userResult = await pool.query('SELECT id, name, email, role, profile_picture, google_id FROM users WHERE email = $1', [email]);
        let user;
  
        if (userResult.rows.length === 0) {
          // Create new user
          const newUserResult = await pool.query(
            'INSERT INTO users (name, email, google_id, profile_picture, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, profile_picture',
            [name, email, sub, picture, 'user']
          );
          
          user = newUserResult.rows[0];
          
          // Create profile for the user
          await pool.query(
            'INSERT INTO user_profiles (user_id) VALUES ($1)',
            [user.id]
          );
        } else {
          user = userResult.rows[0];
          
          // Update Google ID if necessary
          if (!user.google_id) {
            pool.query(
              'UPDATE users SET google_id = $1 WHERE id = $2',
              [sub, user.id]
            ).catch(err => console.error('Failed to update Google ID:', err));
          }
          
          // Only set profile picture if user doesn't have one
          if (!user.profile_picture) {
            pool.query(
              'UPDATE users SET profile_picture = $1 WHERE id = $2 AND profile_picture IS NULL',
              [picture, user.id]
            ).catch(err => console.error('Failed to update profile picture:', err));
          }
          
          // Don't overwrite existing custom profile pictures
        }
  
        // Generate JWT token with hardcoded secret
        const jwtToken = jwt.sign(
          { id: user.id, role: user.role },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
  
        // Save session in the background
        pool.query(
          'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
          [user.id, jwtToken, new Date(Date.now() + 86400000)]
        ).catch(err => console.error('Failed to save session:', err));
  
        console.timeEnd('googleAuth');
        return res.status(200).json({
          message: 'Google authentication successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile_picture: user.profile_picture
          },
          token: jwtToken
        });
      }
      
      // Fall back to token verification if needed
      if (credential) {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const { email, name, sub, picture } = payload;
        
        // Check if user exists
        const userResult = await pool.query('SELECT id, name, email, role, profile_picture, google_id FROM users WHERE email = $1', [email]);
        let user;
        
        if (userResult.rows.length === 0) {
          // Create new user
          const newUserResult = await pool.query(
            'INSERT INTO users (name, email, google_id, profile_picture, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, profile_picture',
            [name, email, sub, picture, 'user']
          );
          
          user = newUserResult.rows[0];
          
          // Create profile for the user
          await pool.query(
            'INSERT INTO user_profiles (user_id) VALUES ($1)',
            [user.id]
          );
        } else {
          user = userResult.rows[0];
          
          // Update Google ID if necessary
          if (!user.google_id) {
            pool.query(
              'UPDATE users SET google_id = $1 WHERE id = $2',
              [sub, user.id]
            ).catch(err => console.error('Failed to update Google ID:', err));
          }
          
          // Only set profile picture if user doesn't have one
          if (!user.profile_picture) {
            pool.query(
              'UPDATE users SET profile_picture = $1 WHERE id = $2 AND profile_picture IS NULL',
              [picture, user.id]
            ).catch(err => console.error('Failed to update profile picture:', err));
          }
          
          // Don't overwrite existing custom profile pictures
        }
        
        // Generate JWT token with hardcoded secret
        const jwtToken = jwt.sign(
          { id: user.id, role: user.role },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        
        // Save session
        await pool.query(
          'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
          [user.id, jwtToken, new Date(Date.now() + 86400000)]
        );
        
        console.timeEnd('googleAuth');
        return res.status(200).json({
          message: 'Google authentication successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile_picture: user.profile_picture
          },
          token: jwtToken
        });
      }
      
      return res.status(400).json({ message: 'Invalid Google authentication data' });
      
    } catch (error) {
      console.timeEnd('googleAuth');
      console.error('Google auth error:', error);
      res.status(500).json({ message: 'Server error during Google authentication' });
    }
  });

// Logout
router.post('/logout', async (req, res) => {
  const { token } = req.body;

  try {
    // Remove session
    await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
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

    // Get user info
    const userResult = await pool.query(
      'SELECT u.*, up.* FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
        phone: user.phone,
        address: user.address,
        department: user.department,
        job_title: user.job_title,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { name, phone, address, department, job_title, bio } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    // Verify token with hardcoded secret
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update user
      await client.query(
        'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
        [name, decoded.id]
      );

      // Update or create profile
      const profileResult = await client.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [decoded.id]
      );

      if (profileResult.rows.length === 0) {
        await client.query(
          'INSERT INTO user_profiles (user_id, phone, address, department, job_title, bio) VALUES ($1, $2, $3, $4, $5, $6)',
          [decoded.id, phone, address, department, job_title, bio]
        );
      } else {
        await client.query(
          'UPDATE user_profiles SET phone = $1, address = $2, department = $3, job_title = $4, bio = $5, updated_at = NOW() WHERE user_id = $6',
          [phone, address, department, job_title, bio, decoded.id]
        );
      }

      await client.query('COMMIT');

      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;