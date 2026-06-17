const express = require('express');
const router = express.Router();
const { getSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.route('/')
    .get(getSchedules)
    .post(createSchedule);

router.route('/:id')
    .put(updateSchedule)
    .delete(deleteSchedule);

module.exports = router;
