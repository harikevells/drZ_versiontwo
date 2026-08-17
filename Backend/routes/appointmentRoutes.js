const express = require('express');
const router = express.Router();
const { getDoctorDashboard, updateAppointmentStatus, getAllDoctorAppointments, getBookedTimingsByDate, exportDoctorAppointments, processFollowupReminders } = require('../controllers/appointmentController');
const authenticateToken = require('../middleware/authMiddleware');
const optionalAuthenticateToken = authenticateToken.optional;

router.get('/dashboard/:doctorName', optionalAuthenticateToken, getDoctorDashboard);
router.get('/all/:doctorName', optionalAuthenticateToken, getAllDoctorAppointments);
router.get('/export/:doctorName', optionalAuthenticateToken, exportDoctorAppointments);
router.get('/booked/:doctorName/:date', optionalAuthenticateToken, getBookedTimingsByDate);
router.get('/followup-reminders', optionalAuthenticateToken, processFollowupReminders);
router.put('/:id/status', authenticateToken, updateAppointmentStatus);

module.exports = router;
