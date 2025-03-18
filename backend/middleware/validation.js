// middleware/validation.js

// Email validation function
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validation middleware for team member creation/update
  const validateTeamMember = (req, res, next) => {
    const { name, email, role } = req.body;
    let errors = [];
  
    // Validate name
    if (!name || name.trim() === '') {
      errors.push('Name is required');
    } else if (name.length < 2 || name.length > 100) {
      errors.push('Name must be between 2 and 100 characters');
    }
  
    // Validate email
    if (!email || email.trim() === '') {
      errors.push('Email is required');
    } else if (!isValidEmail(email)) {
      errors.push('Please provide a valid email address');
    }
  
    // Validate role if provided
    if (role && !['admin', 'manager', 'user'].includes(role)) {
      errors.push('Role must be admin, manager, or user');
    }
  
    // Validate password for new users
    if (req.method === 'POST') {
      const { password } = req.body;
      if (!password) {
        errors.push('Password is required for new users');
      } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }
    }
  
    // Return errors if any
    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors 
      });
    }
  
    next();
  };
  
  module.exports = { validateTeamMember };