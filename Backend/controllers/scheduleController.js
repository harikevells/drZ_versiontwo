const Schedule = require('../models/Schedule');

const getSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find({});
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.create(req.body);
        res.status(201).json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndDelete(req.params.id);
        if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getSchedules, createSchedule, updateSchedule, deleteSchedule };
