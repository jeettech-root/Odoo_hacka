const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { User } = require('../models');

const ROLES = ['Admin', 'ProcurementOfficer', 'Vendor', 'Manager'];

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email' });
    if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (role && !ROLES.includes(role)) return res.status(400).json({ error: `role must be one of: ${ROLES.join(',')}` });

    // Check existing email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Create user (password will be hashed by pre-save hook)
    const user = new User({ name: name.trim(), email: email.toLowerCase().trim(), password, role: role || 'Vendor' });
    await user.save();

    const out = user.toJSON();
    res.status(201).json({ message: 'User registered', user: out });
  } catch (err) {
    // Handle duplicate key error
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    next(err);
  }
};

// Helpful GET - explains how to use the register endpoint
exports.registerInfo = (req, res) => {
  res.json({
    message: 'POST to this endpoint to create a user',
    method: 'POST',
    endpoint: '/api/auth/register',
    sample: { name: 'John', email: 'john@example.com', password: 'password123', role: 'Admin' }
  });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { sub: user._id.toString(), role: user.role };
    const token = jwt.sign(payload, config.JWT_SECRET || 'dev_secret', { expiresIn: config.JWT_EXPIRES_IN });

    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
};

exports.loginInfo = (req, res) => {
  res.json({
    message: 'POST to this endpoint to obtain a JWT',
    method: 'POST',
    endpoint: '/api/auth/login',
    sample: { email: 'john@example.com', password: 'password123' }
  });
};
