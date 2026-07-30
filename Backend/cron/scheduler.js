const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Schedule = require('../models/Schedule');
const Appointment = require('../models/Appointment');
const { createNotification } = require('../controllers/notificationController');

const initCronJobs = () => {
    // Schedule a job to run every day at 8:00 AM (server time)
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily schedule check...');
        try {
            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            // Find schedules for today that are approved
            const schedules = await Schedule.find({ date: formattedDate, status: 'Approved' });
            
            if (schedules.length === 0) {
                console.log('No approved schedules for today.');
                return;
            }

            // Configure transporter (using environment variables similar to emailController)
            const transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // Iterate over today's schedules and send notifications
            for (const schedule of schedules) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    // Note: sending to EMAIL_USER (admin) as default, but in production this could be the doctor's email
                    to: process.env.EMAIL_USER, 
                    subject: `Daily Schedule Reminder: Dr. ${schedule.doctorName}`,
                    html: `
                        <h2>Daily Schedule Reminder</h2>
                        <p><strong>Doctor:</strong> ${schedule.doctorName}</p>
                        <p><strong>Department:</strong> ${schedule.department}</p>
                        <p><strong>Date:</strong> ${schedule.date}</p>
                        <p><strong>Available Slots:</strong> ${schedule.time.join(', ')}</p>
                        <p>Please ensure you are available for your scheduled slots today.</p>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`Notification sent for Dr. ${schedule.doctorName}'s schedule.`);
            }

        } catch (error) {
            console.error('Error running cron job:', error);
        }
    });

    // Schedule a job to run every day at 8:00 AM for follow-up reminders
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily follow-up check...');
        try {
            // Get today's date in DD/MM/YYYY format
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${day}/${month}/${year}`;
            
            // Find appointments with a follow-up date for today
            const followups = await Appointment.find({ followup_date: formattedDate });
            
            if (followups.length === 0) {
                console.log('No follow-up appointments for today.');
                return;
            }

            // Iterate over today's follow-ups and send notifications
            for (const appt of followups) {
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
                    console.log(`Follow-up notification sent to patient ${appt.patient_name} (Mobile: ${appt.login_mobile}).`);
                }

                // Notify Doctor
                if (appt.doctor_name) {
                    const doctorMessage = `Today your patient ${appt.patient_name} has a follow-up appointment. Doctor: Dr. ${appt.doctor_name}, Patient: ${appt.patient_name}, Date: ${formattedDate}.`;
                    await createNotification(
                        'doctor',
                        appt.doctor_name,
                        'Follow-up Reminder',
                        doctorMessage,
                        'followup_reminder'
                    );
                    console.log(`Follow-up notification sent to Dr. ${appt.doctor_name}.`);
                }
            }
        } catch (error) {
            console.error('Error running follow-up cron job:', error);
        }
    });

    console.log('Cron jobs initialized successfully.');
};

module.exports = { initCronJobs };
