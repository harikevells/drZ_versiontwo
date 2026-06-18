const express = require('express');
const router = express.Router();
const { sendBookingEmail } = require('../controllers/emailController');

// Public route to send booking emails
router.post('/book', sendBookingEmail);

module.exports = router;
