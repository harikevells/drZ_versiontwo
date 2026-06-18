const jwt = require('jsonwebtoken');
const User = require('../models/User');

const Doctor = require('../models/Doctor');

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '1d' });
            res.json({ token, user: { email: user.email } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const doctorLogin = async (req, res) => {
    const { email, password } = req.body;
    console.log(`\n[Doctor Login Attempt] Email: "${email}", Password: "${password}"`);
    try {
        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            console.log(`[Doctor Login Failed] No doctor found with email: "${email}"`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!doctor.activeStatus) {
            console.log(`[Doctor Login Failed] Account is inactive for email: "${email}"`);
            return res.status(403).json({ error: 'Account is inactive' });
        }

        const isMatch = await doctor.matchPassword(password);
        if (isMatch) {
            console.log(`[Doctor Login Success] Logged in successfully: "${email}"`);
            const token = jwt.sign({ id: doctor._id, email: doctor.email, role: 'doctor' }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '7d' });
            res.json({ token, user: { id: doctor.id, email: doctor.email, doctorName: doctor.doctorName, department: doctor.department } });
        } else {
            console.log(`[Doctor Login Failed] Password mismatch for email: "${email}"`);
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(`[Doctor Login Error] ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { login, doctorLogin };
