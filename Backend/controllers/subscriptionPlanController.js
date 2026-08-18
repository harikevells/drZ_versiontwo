const SubscriptionPlan = require('../models/SubscriptionPlan');

const getPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({});
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createPlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.create(req.body);
        res.status(201).json(plan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updatePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        res.json(plan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deletePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        res.json({ message: 'Plan deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getPlans, createPlan, updatePlan, deletePlan };
