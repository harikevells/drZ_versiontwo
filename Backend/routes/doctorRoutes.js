const express = require('express');
const router = express.Router();
const { getDoctors, createDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctorController');
const authenticateToken = require('../middleware/authMiddleware');
const optionalAuthenticateToken = authenticateToken.optional;

// Public route to get doctors, but optionally checks auth to apply admin filters
router.get('/', optionalAuthenticateToken, getDoctors);

// Protect the following routes
router.use(authenticateToken);

router.post('/', createDoctor);

router.route('/:id')
    .put(updateDoctor)
    .delete(deleteDoctor);

module.exports = router;
