const express = require('express');
const router = express.Router();
const { getSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const authenticateToken = require('../middleware/authMiddleware');
const optionalAuthenticateToken = authenticateToken.optional;

// Public route to get schedules, but optionally checks auth to apply admin filters
router.get('/', optionalAuthenticateToken, getSchedules);

router.use(authenticateToken);

router.post('/', createSchedule);

router.route('/:id')
    .put(updateSchedule)
    .delete(deleteSchedule);

module.exports = router;
