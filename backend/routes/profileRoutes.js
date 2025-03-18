const express = require('express');
const router = express.Router();
const { Pool } = require('pg'); // Add this line to import Pool
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Initialize PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER || "kafkauser",
  host: process.env.DB_HOST || "172.21.80.1",
  database: process.env.DB_NAME || "staging_dwh",
  password: process.env.DB_PASSWORD || "JsuA2d5sh4bhLAya",
  port: process.env.DB_PORT || 5458,
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use user ID and timestamp to make filename unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + extension);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get profile information
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profileQuery = `
      SELECT u.id, u.name, u.email, u.role, u.profile_picture,
             up.phone, up.address, up.department, up.job_title, up.bio
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(profileQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.status(200).json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, department, job_title, bio } = req.body;
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update user's name
      await client.query(
        'UPDATE users SET name = $1 WHERE id = $2',
        [name, userId]
      );
      
      // Check if user_profile exists
      const profileExists = await client.query(
        'SELECT 1 FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      
      if (profileExists.rows.length > 0) {
        // Update existing profile
        await client.query(
          'UPDATE user_profiles SET phone = $1, address = $2, department = $3, job_title = $4, bio = $5, updated_at = NOW() WHERE user_id = $6',
          [phone, address, department, job_title, bio, userId]
        );
      } else {
        // Create new profile
        await client.query(
          'INSERT INTO user_profiles (user_id, phone, address, department, job_title, bio, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
          [userId, phone, address, department, job_title, bio]
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
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile picture
router.post('/picture', upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    
    // Get previous profile picture to delete it later
    const userResult = await pool.query(
      'SELECT profile_picture FROM users WHERE id = $1',
      [userId]
    );
    
    const oldProfilePicture = userResult.rows[0]?.profile_picture;
    
    // Generate path for frontend to access the image
    const filePath = `/uploads/profiles/${path.basename(req.file.path)}`;
    
    // Update the profile_picture field in the users table
    const result = await pool.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING profile_picture',
      [filePath, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete old profile picture if it exists
    if (oldProfilePicture) {
      const oldFilePath = path.join(__dirname, '..', oldProfilePicture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlink(oldFilePath, (err) => {
          if (err) console.error('Error deleting old profile picture:', err);
        });
      }
    }
    
    res.status(200).json({ 
      message: 'Profile picture updated successfully',
      profilePicture: result.rows[0].profile_picture
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update password
router.put('/password', async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;