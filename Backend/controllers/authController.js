const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (isMatch) {
            if (user.role === 'admin') {
                if (!user.isActive) {
                    return res.status(403).json({ error: 'Your account is deactivated. Contact your Super Admin.' });
                }
                
                if (user.accessStartDate && user.accessStartTime && user.accessEndDate && user.accessEndTime) {
                    const now = new Date();
                    const startDateTime = new Date(`${user.accessStartDate}T${user.accessStartTime}`);
                    const endDateTime = new Date(`${user.accessEndDate}T${user.accessEndTime}`);
                    
                    if (now < startDateTime || now > endDateTime) {
                        return res.status(403).json({ error: 'Your access period has expired. Contact your Super Admin.' });
                    }
                }
            }

            const token = jwt.sign({ id: user._id, email: user.email, uniqueId: user.uniqueId, role: user.role || 'admin' }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '1d' });
            res.json({ token, user: { id: user._id, email: user.email, uniqueId: user.uniqueId, role: user.role || 'admin' } });
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
            if (doctor.adminId) {
                const admin = await User.findOne({ uniqueId: doctor.adminId });
                if (admin) {
                    if (!admin.isActive) {
                        console.log(`[Doctor Login Failed] Associated Admin is deactivated for email: "${email}"`);
                        return res.status(403).json({ error: 'Your Hospital Admin account is deactivated. Contact Super Admin.' });
                    }
                    
                    if (admin.accessStartDate && admin.accessStartTime && admin.accessEndDate && admin.accessEndTime) {
                        const now = new Date();
                        const startDateTime = new Date(`${admin.accessStartDate}T${admin.accessStartTime}`);
                        const endDateTime = new Date(`${admin.accessEndDate}T${admin.accessEndTime}`);
                        
                        if (now < startDateTime || now > endDateTime) {
                            console.log(`[Doctor Login Failed] Associated Admin access expired for email: "${email}"`);
                            return res.status(403).json({ error: 'Your Hospital Admin access period has expired. Contact Super Admin.' });
                        }
                    }
                }
            }

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

const patientRegister = async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const existing = await Patient.findOne({ identifier });
        if (existing) {
            return res.status(400).json({ error: 'Patient already exists with this email/number' });
        }
        const patient = await Patient.create({ identifier, password, role: 'patient' });
        const token = jwt.sign({ id: patient._id, identifier: patient.identifier, role: patient.role }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '7d' });
        res.json({ token, user: { id: patient._id, identifier: patient.identifier, role: patient.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const patientLogin = async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const patient = await Patient.findOne({ identifier });
        if (!patient) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await patient.matchPassword(password);
        if (isMatch) {
            const token = jwt.sign({ id: patient._id, identifier: patient.identifier, role: patient.role }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '7d' });
            res.json({ token, user: { id: patient._id, identifier: patient.identifier, role: patient.role } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateFcmToken = async (req, res) => {
    const { fcmToken, role } = req.body;
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        let updatedUser;
        if (role === 'doctor') {
            updatedUser = await Doctor.findByIdAndUpdate(req.user.id, { fcmToken }, { new: true });
        } else if (role === 'patient') {
            updatedUser = await Patient.findByIdAndUpdate(req.user.id, { fcmToken }, { new: true });
        } else {
            updatedUser = await User.findByIdAndUpdate(req.user.id, { fcmToken }, { new: true });
        }

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'FCM token updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const adminRegister = async (req, res) => {
    const { name, email, password, accessStartDate, accessStartTime, accessEndDate, accessEndTime } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Admin already exists with this email' });
        }

        // Generate a unique ID for the admin
        const uniqueId = `ADMIN-${Date.now().toString().slice(-6)}`;

        const adminUser = await User.create({
            name,
            email,
            password,
            uniqueId,
            role: 'admin',
            accessStartDate,
            accessStartTime,
            accessEndDate,
            accessEndTime,
            isActive: true
        });

        res.json({ message: 'Admin registered successfully', user: { id: adminUser._id, uniqueId: adminUser.uniqueId, email: adminUser.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' });
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateAdminStatus = async (req, res) => {
    const { isActive } = req.body;
    try {
        const admin = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        res.json(admin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateAdmin = async (req, res) => {
    try {
        const { name, email, password, accessStartDate, accessStartTime, accessEndDate, accessEndTime } = req.body;
        const admin = await User.findById(req.params.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        
        if (name) admin.name = name;
        if (email) admin.email = email;
        if (password) admin.password = password;
        if (accessStartDate) admin.accessStartDate = accessStartDate;
        if (accessStartTime) admin.accessStartTime = accessStartTime;
        if (accessEndDate) admin.accessEndDate = accessEndDate;
        if (accessEndTime) admin.accessEndTime = accessEndTime;
        
        await admin.save();
        res.json(admin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteAdmin = async (req, res) => {
    try {
        const admin = await User.findByIdAndDelete(req.params.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const checkAdminStatus = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ locked: true, reason: 'Unauthorized' });
        }
        
        const admin = await User.findById(req.user.id);
        if (!admin) {
            return res.status(404).json({ locked: true, reason: 'Admin not found' });
        }
        
        if (!admin.isActive) {
            return res.json({ locked: true, reason: 'Your account is deactivated. Contact your Super Admin.' });
        }
        
        if (admin.accessStartDate && admin.accessStartTime && admin.accessEndDate && admin.accessEndTime) {
            const now = new Date();
            const startDateTime = new Date(`${admin.accessStartDate}T${admin.accessStartTime}`);
            const endDateTime = new Date(`${admin.accessEndDate}T${admin.accessEndTime}`);
            
            if (now < startDateTime || now > endDateTime) {
                return res.json({ locked: true, reason: 'Your access period has expired. Contact your Super Admin.' });
            }
        }
        
        res.json({ locked: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { login, doctorLogin, patientRegister, patientLogin, updateFcmToken, adminRegister, getAdmins, updateAdminStatus, updateAdmin, deleteAdmin, checkAdminStatus };
