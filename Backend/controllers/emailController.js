const nodemailer = require('nodemailer');
const Appointment = require('../models/Appointment');

const sendBookingEmail = async (req, res) => {
    try {
        const {
            patient_name,
            patient_age,
            patient_gender,
            whatsapp_number,
            login_mobile,
            treatment_category,
            doctor_name,
            appointment_date,
            appointment_time,
            video_call
        } = req.body;

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
        const translatedCategory = departmentTranslations[treatment_category] 
            ? `${treatment_category} / ${departmentTranslations[treatment_category]}`
            : treatment_category;

        // Save appointment to MongoDB
        const newAppointment = new Appointment({
            patient_name,
            patient_age,
            patient_gender,
            whatsapp_number,
            login_mobile,
            treatment_category: translatedCategory,
            doctor_name,
            appointment_date,
            appointment_time,
            video_call
        });
        await newAppointment.save();

        // Configure transporter
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Sending to the same email or change it to admin email
            subject: `New Appointment Booking: ${patient_name}`,
            html: `
                <h2>New Appointment Request</h2>
                <p><strong>Patient Name:</strong> ${patient_name}</p>
                <p><strong>Age:</strong> ${patient_age}</p>
                <p><strong>Gender:</strong> ${patient_gender}</p>
                <p><strong>WhatsApp:</strong> ${whatsapp_number || 'N/A'}</p>
                <p><strong>Login Mobile:</strong> ${login_mobile}</p>
                <p><strong>Category:</strong> ${translatedCategory}</p>
                <p><strong>Doctor:</strong> ${doctor_name}</p>
                <p><strong>Date:</strong> ${appointment_date}</p>
                <p><strong>Time:</strong> ${appointment_time}</p>
                <p><strong>Video Call:</strong> ${video_call}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email. ' + error.message });
    }
};

const getBookedTimings = async (req, res) => {
    try {
        const { doctor_name, appointment_date } = req.query;
        if (!appointment_date) {
            return res.status(400).json({ message: "Date is required" });
        }
        
        const filter = { appointment_date };
        if (doctor_name) {
            filter.doctor_name = doctor_name;
        }
        
        const appointments = await Appointment.find(filter);
        // Return array of objects { doctor_name, booked_timings: [] } or just the raw appointments
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching booked timings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { sendBookingEmail, getBookedTimings };
