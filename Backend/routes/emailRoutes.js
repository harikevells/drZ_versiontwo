const express = require('express');
const router = express.Router();
const { sendBookingEmail, getBookedTimings, getAllAppointments, getPatientAppointments } = require('../controllers/emailController');
const authenticateToken = require('../middleware/authMiddleware');
const optionalAuthenticateToken = authenticateToken.optional;

// Public route to send booking emails
router.post('/book', sendBookingEmail);
router.get('/booked-timings', optionalAuthenticateToken, getBookedTimings);
router.get('/all-appointments', optionalAuthenticateToken, getAllAppointments);
router.get('/patient-appointments/:mobile', optionalAuthenticateToken, getPatientAppointments);

module.exports = router;
