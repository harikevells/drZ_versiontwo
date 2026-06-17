const Doctor = require('../models/Doctor');

const getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({});
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.create(req.body);
        res.status(201).json(doctor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        doctor.doctorName = req.body.doctorName;
        doctor.gender = req.body.gender;
        doctor.department = req.body.department;
        doctor.experience = req.body.experience;
        doctor.email = req.body.email;
        doctor.mobile = req.body.mobile;
        doctor.activeStatus = req.body.activeStatus;

        // Only update password if a new one is provided
        if (req.body.password && req.body.password.trim() !== '') {
            doctor.password = req.body.password;
        }

        await doctor.save();
        res.json(doctor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getDoctors, createDoctor, updateDoctor, deleteDoctor };
