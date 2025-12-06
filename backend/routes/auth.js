const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST api/auth/register
router.post('/register', async (req, res) => {
  try {
    console.log('Register attempt:', req.body);

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already exists' 
          : 'Username already taken' 
      });
    }

    // ✅ HASH PASSWORD HERE (NOT in model)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with hashed password
    const user = new User({ 
      username: username.trim(), 
      email: email.toLowerCase().trim(), 
      password: hashedPassword 
    });
    
    const savedUser = await user.save();
    console.log('✅ User created:', savedUser._id);

    // Generate JWT
    const payload = { id: savedUser._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      user: { 
        id: savedUser._id, 
        username: savedUser.username, 
        email: savedUser.email 
      } 
    });
  } catch (error) {
    console.error('🚨 REGISTER ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { id: user._id, username: user.username, email: user.email } 
    });
  } catch (error) {
    console.error('🚨 LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
