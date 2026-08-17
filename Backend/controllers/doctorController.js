const Doctor = require('../models/Doctor');

const departmentTranslations = {
    "General": "பொது",
    "Cardiology": "கார்டியாலஜி",
    "Pediatrics": "குழந்தைகள் மருத்துவம்",
    "Neurology": "நரம்பியல்",
    "Dermatology": "தோல் மருத்துவம்",
    "Orthopedics": "எலும்பியல்",
    "Gynecology": "மகப்பேறு மருத்துவம்",
    "Dental": "பல் மருத்துவம்",
    "ENT": "காது மூக்கு தொண்டை",
    "Ophthalmology": "கண் மருத்துவம்",
    "Psychiatry": "மனநல மருத்துவம்",
    "Others": "மற்றவை"
};

const translateDepartment = (deptString) => {
    if (!deptString) return deptString;
    return deptString.split(',').map(d => {
        const trimmed = d.trim();
        if (trimmed.includes('/')) return trimmed; // Already translated
        return departmentTranslations[trimmed] ? `${trimmed} / ${departmentTranslations[trimmed]}` : trimmed;
    }).join(', ');
};

const getDoctors = async (req, res) => {
    try {
        let query = {};
        if (req.user && req.user.role === 'admin' && req.user.uniqueId) {
            query.adminId = req.user.uniqueId;
        }
        const doctors = await Doctor.find(query);
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createDoctor = async (req, res) => {
    try {
        console.log("Creating new doctor:", req.body.doctorName);
        const doctorData = { ...req.body };
        if (req.user && req.user.role === 'admin' && req.user.uniqueId) {
            doctorData.adminId = req.user.uniqueId;
        }
        if (doctorData.department) {
            doctorData.department = translateDepartment(doctorData.department);
        }
        const doctor = await Doctor.create(doctorData);
        console.log("Successfully created doctor:", doctor.doctorName);
        res.status(201).json(doctor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateDoctor = async (req, res) => {
    try {
        console.log(`Updating doctor ID ${req.params.id} with data:`, req.body);
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            console.error("Doctor not found for update");
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (req.user && req.user.role === 'admin' && req.user.uniqueId) {
            if (doctor.adminId && doctor.adminId !== req.user.uniqueId) {
                return res.status(403).json({ error: 'Forbidden: You cannot modify this doctor' });
            }
        }

        doctor.doctorName = req.body.doctorName;
        doctor.gender = req.body.gender;
        doctor.department = req.body.department ? translateDepartment(req.body.department) : doctor.department;
        doctor.experience = req.body.experience;
        doctor.email = req.body.email;
        doctor.mobile = req.body.mobile;
        doctor.activeStatus = req.body.activeStatus;

        // Only update password if a new one is provided
        if (req.body.password && req.body.password.trim() !== '') {
            doctor.password = req.body.password;
        }

        await doctor.save();
        console.log("Successfully updated doctor:", doctor.doctorName);
        res.json(doctor);
    } catch (err) {
        console.error("Error updating doctor:", err.message);
        res.status(500).json({ error: err.message });
    }
};

const deleteDoctor = async (req, res) => {
    try {
        console.log(`Deleting doctor ID ${req.params.id}`);
        const doctorCheck = await Doctor.findById(req.params.id);
        if (!doctorCheck) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (req.user && req.user.role === 'admin' && req.user.uniqueId) {
            if (doctorCheck.adminId && doctorCheck.adminId !== req.user.uniqueId) {
                return res.status(403).json({ error: 'Forbidden: You cannot delete this doctor' });
            }
        }

        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) {
            console.error("Doctor not found for delete");
            return res.status(404).json({ error: 'Doctor not found' });
        }
        console.log("Successfully deleted doctor");
        res.json({ deleted: true });
    } catch (err) {
        console.error("Error deleting doctor:", err.message);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getDoctors, createDoctor, updateDoctor, deleteDoctor };
