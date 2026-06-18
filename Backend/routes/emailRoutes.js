const express = require('express');
const router = express.Router();
const { sendBookingEmail, getBookedTimings } = require('../controllers/emailController');

// Public route to send booking emails
router.post('/book', sendBookingEmail);
router.get('/booked-timings', getBookedTimings);

module.exports = router;
