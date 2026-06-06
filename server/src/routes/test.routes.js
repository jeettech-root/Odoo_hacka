const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');

router.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

module.exports = router;
