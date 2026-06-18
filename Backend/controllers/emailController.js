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

        // Save appointment to MongoDB
        const newAppointment = new Appointment({
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
                <p><strong>Category:</strong> ${treatment_category}</p>
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

module.exports = { sendBookingEmail };
