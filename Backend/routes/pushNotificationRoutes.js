const express = require('express');
const router = express.Router();
const {
    createPushNotification,
    getAllPushNotifications,
    getActivePushNotifications,
    updatePushNotification,
    deletePushNotification
} = require('../controllers/pushNotificationController');
const authenticateToken = require('../middleware/authMiddleware');
const optionalAuthenticateToken = authenticateToken.optional;

router.post('/', authenticateToken, createPushNotification);
router.get('/', optionalAuthenticateToken, getAllPushNotifications);
router.get('/active', optionalAuthenticateToken, getActivePushNotifications);
router.put('/:id', authenticateToken, updatePushNotification);
router.delete('/:id', authenticateToken, deletePushNotification);

module.exports = router;
