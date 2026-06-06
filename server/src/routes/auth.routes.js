const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Info endpoints for browser users
router.get('/register', authController.registerInfo);
router.post('/register', authController.register);

router.get('/login', authController.loginInfo);
router.post('/login', authController.login);

module.exports = router;
