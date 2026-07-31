const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

// Connect to database and seed admin
connectDB().then(async () => {
    try {
        const adminEmail = 'admin@drz.com';
        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            await User.create({
                email: adminEmail,
                password: 'Admin@123'
            });
            console.log('Default Admin user seeded');
        }
    } catch (err) {
        console.error('Error seeding admin user:', err);
    }
});

const app = require('./app');

// Initialize dynamic email scheduling jobs
const { initCronJobs } = require('./cron/scheduler');
initCronJobs();

// If running locally, start the listener
if (!process.env.FUNCTIONS_EMULATOR && !process.env.FIREBASE_CONFIG) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Local Server is running on port ${PORT}`);
    });
}

// Export the Express app as a Firebase Cloud Function in asia-south1 region
exports.api = onRequest({ region: 'asia-south1', cors: true, maxInstances: 10 }, app);

// Firebase Scheduled Function: runs daily at 8:00 AM IST for follow-up reminders
exports.dailyFollowupReminders = onSchedule({ schedule: '0 8 * * *', region: 'asia-south1', timeZone: 'Asia/Kolkata' }, async (event) => {
    console.log('Running scheduled follow-up reminders...');
    try {
        await connectDB();
        const Appointment = require('./models/Appointment');
        const { createNotification } = require('./controllers/notificationController');

        const istDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const today = new Date(istDateStr);
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        const followups = await Appointment.find({ followup_date: formattedDate });

        if (followups.length === 0) {
            console.log('No follow-up appointments for today:', formattedDate);
            return;
        }

        for (const appt of followups) {
            // Notify Doctor
            if (appt.doctor_name) {
                const doctorMessage = `Today your patient ${appt.patient_name} has a follow-up appointment. Doctor: Dr. ${appt.doctor_name}, Date: ${formattedDate}.`;
                await createNotification(
                    'doctor',
                    appt.doctor_name,
                    'Follow-up Reminder',
                    doctorMessage,
                    'followup_reminder'
                );
            }

            // Notify Patient
            if (appt.login_mobile) {
                const patientMessage = `Today you need to consult Dr. ${appt.doctor_name}. Patient: ${appt.patient_name}, Date: ${formattedDate}. Please visit the hospital for your follow-up appointment.`;
                await createNotification(
                    'patient',
                    appt.login_mobile,
                    'Follow-up Reminder',
                    patientMessage,
                    'followup_reminder'
                );
            }
        }

        console.log(`Follow-up reminders sent for ${followups.length} appointments on ${formattedDate}.`);
    } catch (error) {
        console.error('Error in scheduled follow-up reminders:', error);
    }
});
