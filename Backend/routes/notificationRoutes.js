const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const authenticateToken = require('../middleware/authMiddleware');
const optionalAuthenticateToken = authenticateToken.optional;

router.get('/:role/:identifier', optionalAuthenticateToken, getNotifications);
router.put('/:id/read', authenticateToken, markAsRead);
router.put('/readAll/:role/:identifier', authenticateToken, markAllAsRead);

module.exports = router;
