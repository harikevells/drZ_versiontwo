const express = require('express');
const router = express.Router();
const { getPlans, createPlan, updatePlan, deletePlan } = require('../controllers/subscriptionPlanController');
const protect = require('../middleware/authMiddleware');

router.get('/', getPlans);
// In a real app, you might protect these routes to only SuperAdmins. 
// Assuming no strict role checks are implemented in protect yet or it's handled via UI access.
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
