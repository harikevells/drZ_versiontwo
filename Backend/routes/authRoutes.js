const express = require('express');
const router = express.Router();
const { login, doctorLogin, patientRegister, patientLogin, updateFcmToken, adminRegister, getAdmins, updateAdminStatus, updateAdmin, deleteAdmin, checkAdminStatus } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/doctor/login', doctorLogin);
router.post('/patient/register', patientRegister);
router.post('/patient/login', patientLogin);
router.post('/admin/register', adminRegister);
router.get('/admins', getAdmins);
router.get('/admin/status', protect, checkAdminStatus);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);
router.put('/admins/:id/status', updateAdminStatus);
router.put('/fcm-token', protect, updateFcmToken);

module.exports = router;
