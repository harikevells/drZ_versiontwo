const express = require('express');
const router = express.Router();
const { sendBookingEmail, getBookedTimings, getAllAppointments } = require('../controllers/emailController');

// Public route to send booking emails
router.post('/book', sendBookingEmail);
router.get('/booked-timings', getBookedTimings);
router.get('/all-appointments', getAllAppointments);

module.exports = router;
