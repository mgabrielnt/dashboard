// routes/teamRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { Pool } = require('pg'); // Added PostgreSQL Pool import
const { validateTeamMember } = require('../middleware/validation');

const pool = new Pool({
    user: process.env.DB_USER || "kafkauser",
    host: process.env.DB_HOST || "172.21.80.1",
    database: process.env.DB_NAME || "staging_dwh",
    password: process.env.DB_PASSWORD || "JsuA2d5sh4bhLAya",
    port: process.env.DB_PORT || 5458,
});

// Get all team members (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT u.id, u.name, u.email, u.role, u.profile_picture, u.created_at, 
             up.phone, up.address, up.department, up.job_title, up.bio
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY u.name
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = 'SELECT COUNT(*) FROM users';
    
    const [teamResult, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);
    
    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limit);
    
    res.status(200).json({
      data: teamResult.rows,
      pagination: {
        total: totalUsers,
        pages: totalPages,
        page: page,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Failed to fetch team members' });
  }
});

// Get single team member
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT u.id, u.name, u.email, u.role, u.profile_picture, u.created_at, 
             up.phone, up.address, up.department, up.job_title, up.bio
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching team member:', error);
    res.status(500).json({ message: 'Failed to fetch team member' });
  }
});

// Create new team member
router.post('/', validateTeamMember, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      name, email, password, role, profile_picture,
      phone, address, department, job_title, bio
    } = req.body;
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if email already exists
    const emailCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Hash password if provided using bcryptjs
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    
    // Insert user
    const insertUserQuery = `
      INSERT INTO users (name, email, password, role, profile_picture, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id
    `;
    
    const userResult = await client.query(insertUserQuery, [
      name, 
      email, 
      hashedPassword, 
      role || 'user', 
      profile_picture || null
    ]);
    
    const userId = userResult.rows[0].id;
    
    // Insert user profile
    const insertProfileQuery = `
      INSERT INTO user_profiles (user_id, phone, address, department, job_title, bio, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `;
    
    await client.query(insertProfileQuery, [
      userId,
      phone || null,
      address || null,
      department || null,
      job_title || null,
      bio || null
    ]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Team member created successfully',
      id: userId
    });
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error creating team member:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ message: 'Failed to create team member' });
  } finally {
    client.release();
  }
});

// Update team member
router.put('/:id', validateTeamMember, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { 
      name, email, password, role, profile_picture,
      phone, address, department, job_title, bio
    } = req.body;
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if user exists
    const checkUserQuery = 'SELECT id FROM users WHERE id = $1';
    const userCheck = await client.query(checkUserQuery, [id]);
    
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    // Check email uniqueness if changing email
    if (email) {
      const emailCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2', 
        [email, id]
      );
      
      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Email already in use by another user' });
      }
    }
    
    // Update user
    let updateUserQuery = `
      UPDATE users 
      SET name = $1, email = $2, role = $3, profile_picture = $4, updated_at = NOW()
    `;
    
    let params = [name, email, role, profile_picture];
    
    // Hash and include password only if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateUserQuery += `, password = $${params.length + 1}`;
      params.push(hashedPassword);
    }
    
    updateUserQuery += ` WHERE id = $${params.length + 1}`;
    params.push(id);
    
    await client.query(updateUserQuery, params);
    
    // Check if profile exists
    const checkProfileQuery = 'SELECT user_id FROM user_profiles WHERE user_id = $1';
    const profileCheck = await client.query(checkProfileQuery, [id]);
    
    if (profileCheck.rows.length === 0) {
      // Insert new profile if doesn't exist
      const insertProfileQuery = `
        INSERT INTO user_profiles (user_id, phone, address, department, job_title, bio, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `;
      
      await client.query(insertProfileQuery, [
        id, phone, address, department, job_title, bio
      ]);
    } else {
      // Update existing profile
      const updateProfileQuery = `
        UPDATE user_profiles
        SET phone = $1, address = $2, department = $3, job_title = $4, bio = $5, updated_at = NOW()
        WHERE user_id = $6
      `;
      
      await client.query(updateProfileQuery, [
        phone, address, department, job_title, bio, id
      ]);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(200).json({ message: 'Team member updated successfully' });
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating team member:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ message: 'Failed to update team member' });
  } finally {
    client.release();
  }
});

// Delete team member
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Start transaction
    await client.query('BEGIN');
    
    // Delete user profile first (foreign key constraint)
    await client.query('DELETE FROM user_profiles WHERE user_id = $1', [id]);
    
    // Delete any sessions
    await client.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    
    // Delete user
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(200).json({ message: 'Team member deleted successfully' });
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error deleting team member:', error);
    res.status(500).json({ message: 'Failed to delete team member' });
  } finally {
    client.release();
  }
});

module.exports = router;