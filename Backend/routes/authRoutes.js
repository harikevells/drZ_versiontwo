const express = require('express');
const router = express.Router();
const { login, doctorLogin } = require('../controllers/authController');

router.post('/login', login);
router.post('/doctor/login', doctorLogin);

module.exports = router;
