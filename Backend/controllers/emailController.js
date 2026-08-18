const nodemailer = require('nodemailer');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { createNotification } = require('./notificationController');
const fs = require('fs');
const path = require('path');
const html_to_pdf = require('html-pdf-node');

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

        // Removed inline translation so it saves as English in the DB
        // Lookup Doctor to inherit adminId
        const doctorObj = await Doctor.findOne({ doctorName: doctor_name });
        const assignedAdminId = doctorObj && doctorObj.adminId ? doctorObj.adminId : null;

        // Save appointment to MongoDB
        const newAppointment = new Appointment({
            patient_name,
            patient_age,
            patient_gender,
            whatsapp_number,
            login_mobile,
            treatment_category: treatment_category,
            doctor_name,
            appointment_date,
            appointment_time,
            video_call,
            status: 'Pending',
            adminId: assignedAdminId
        });
        await newAppointment.save();

        // Notify Admin
        await createNotification(
            'admin',
            'admin',
            'New Appointment Booked',
            `A new appointment has been booked by Patient ${patient_name} with Dr. ${doctor_name} on ${appointment_date} at ${appointment_time}.`,
            'appointment',
            assignedAdminId
        );

        // Notify Doctor
        await createNotification(
            'doctor',
            doctor_name,
            'New Appointment Booked',
            `Patient ${patient_name} has booked a new appointment with you on ${appointment_date} at ${appointment_time}.`,
            'appointment'
        );

        // Notify Patient
        await createNotification(
            'patient',
            login_mobile, // Identifier for patient is their login mobile
            'Appointment Request Submitted',
            `Your appointment request with Dr. ${doctor_name} for ${appointment_date} at ${appointment_time} has been submitted successfully.`,
            'appointment'
        );

        // Configure transporter and send email if credentials are present
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // Send email in the background to prevent request blocking or timeouts
            const sendEmailInBackground = async () => {
                try {
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
                    console.log("Booking notification email sent successfully in the background");
                } catch (mailErr) {
                    console.error("Failed to send booking email in background:", mailErr.message);
                }
            };

            // Run in background
            sendEmailInBackground();
        } else {
            console.log("Email credentials not configured. Skipping email notifications.");
        }
        
        res.status(200).json({ message: 'Appointment created successfully' });
    } catch (error) {
        console.error('Error in sendBookingEmail controller:', error);
        res.status(500).json({ error: 'Failed to create appointment. ' + error.message });
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

        if (req.user && req.user.role === 'admin' && req.user.uniqueId) {
            filter.adminId = req.user.uniqueId;
        }
        
        const appointments = await Appointment.find(filter);
        // Return array of objects { doctor_name, booked_timings: [] } or just the raw appointments
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching booked timings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllAppointments = async (req, res) => {
    try {
        const filter = {};
        if (req.user && req.user.role === 'admin' && req.user.uniqueId) {
            filter.adminId = req.user.uniqueId;
        }
        const appointments = await Appointment.find(filter).sort({ createdAt: -1 }); // Sorting by newest first if createdAt exists, else default sort
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching all appointments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getPatientAppointments = async (req, res) => {
    try {
        const { mobile } = req.params;
        if (!mobile) return res.status(400).json({ message: "Mobile number is required" });
        
        const appointments = await Appointment.find({ login_mobile: mobile }).sort({ updatedAt: -1 });
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching patient appointments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const sendInvoiceEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await User.findById(id);
        
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (!admin.isActive) {
            return res.status(400).json({ error: 'Cannot send invoice for an inactive admin' });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ error: 'Email configuration is missing on the server' });
        }

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        const today = new Date();
        const invoiceDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
        const amount = "1499"; 

        // Read Logo as Base64
        let logoHtml = '<div style="background-color: #372332; color: white; display: inline-block; padding: 15px; border-radius: 5px; font-weight: bold; font-size: 24px; font-family: serif;">KEVELL<br/>CORP</div>';
        try {
            const logoPath = path.join(__dirname, '../../Admin/src/assets/Adminlogo.svg');
            const logoBuffer = fs.readFileSync(logoPath);
            const logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`;
            logoHtml = `<img src="${logoBase64}" alt="DrZ" style="height: 60px; background-color: #372332; padding: 10px; border-radius: 8px;" />`;
        } catch (e) {
            console.error('Logo not found', e);
        }

        const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div>
                        ${logoHtml}
                    </div>
                </div>

                <div style="display: flex; width: 100%;">
                    <div style="width: 50%; background: #e2e8f0; padding: 20px; box-sizing: border-box;">
                        <h1 style="margin: 0 0 10px 0; color: #64748b; font-size: 32px; letter-spacing: 2px;">INVOICE</h1>
                        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">DrZ</p>
                        <p style="margin: 0; font-size: 11px; color: #64748b;">An ISO 9001:2015 Certified Company</p>
                        <p style="margin: 0; font-size: 11px; color: #64748b;">Government Tax ID : 33AYHPK8929M1ZT</p>
                        <p style="margin: 0; font-size: 11px; color: #64748b;">4A, Kamala 2nd street,Chinnachokkikulam, Madurai,</p>
                        <p style="margin: 0; font-size: 11px; color: #64748b;">Tamil Nadu - 625002.</p>
                    </div>
                    <div style="width: 50%; background: #94a3b8; padding: 20px; box-sizing: border-box; text-align: right; color: white;">
                        <p style="margin: 0; font-size: 11px;">Invoice Number:INV-DRZ-${Date.now().toString().slice(-6)}</p>
                        <p style="margin: 0; font-size: 11px;">Invoice Date:${invoiceDate}</p>
                        <p style="margin: 0; font-size: 11px;">Quotation Number:QTN-DRZ-${Date.now().toString().slice(-6)}</p>
                        <p style="margin: 0; font-size: 11px;">Quotation Date:${invoiceDate}</p>
                        <p style="margin: 0; font-size: 11px;">Dispatch Mode: Manual</p>
                    </div>
                </div>

                <div style="display: flex; width: 100%; border: 1px solid #000; margin-top: 10px;">
                    <div style="width: 50%; border-right: 1px solid #000; padding: 10px; box-sizing: border-box;">
                        <p style="margin: 0; font-weight: bold; font-size: 12px;">Bill To</p>
                        <p style="margin: 0; font-weight: bold; font-size: 12px; margin-top: 5px;">${admin.name}</p>
                        <p style="margin: 0; font-size: 12px;">${admin.mobileNumber || 'N/A'}</p>
                        <p style="margin: 0; font-size: 12px;">${admin.address || 'Address not provided'}</p>
                        <p style="margin: 0; font-size: 12px; margin-top: 5px;">GSTIN/UIN: Unregistered</p>
                    </div>
                    <div style="width: 50%; padding: 10px; box-sizing: border-box;">
                        <p style="margin: 0; font-weight: bold; font-size: 12px;">Ship To</p>
                        <p style="margin: 0; font-weight: bold; font-size: 12px; margin-top: 5px;">${admin.name}</p>
                        <p style="margin: 0; font-size: 12px;">${admin.mobileNumber || 'N/A'}</p>
                        <p style="margin: 0; font-size: 12px;">${admin.address || 'Address not provided'}</p>
                        <p style="margin: 0; font-size: 12px; margin-top: 5px;">GSTIN/UIN: Unregistered</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #f1f5f9;">
                            <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: left;">DESCRIPTION OF WORK</th>
                            <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">Qty</th>
                            <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">Unit Price<br/>(INR)</th>
                            <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">GST<br/>(INR)</th>
                            <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">Sub Total<br/>(INR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: left;">1. Subscription Plan (Active) - Paid</td>
                            <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">1</td>
                            <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">${amount}</td>
                            <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">0</td>
                            <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">${amount}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #e2e8f0; padding: 10px;"></td>
                            <td style="border: 1px solid #e2e8f0; padding: 10px;"></td>
                            <td style="border: 1px solid #e2e8f0; padding: 10px;"></td>
                            <td style="border: 1px solid #e2e8f0; padding: 10px; background-color: #e2e8f0; font-weight: bold; text-align: center;">GRAND<br/>TOTAL</td>
                            <td style="border: 1px solid #e2e8f0; padding: 10px; background-color: #e2e8f0; font-weight: bold; text-align: center;">${amount}</td>
                        </tr>
                    </tbody>
                </table>

                <p style="font-weight: bold; font-size: 12px; margin-top: 10px;">(Rupees One Thousand Four Hundred Ninety Nine Only)</p>

                <div style="border: 1px solid #e2e8f0; padding: 10px; font-size: 12px; margin-top: 10px; background-color: #f8fafc;">
                    <p style="margin: 0; font-weight: bold;">PAYMENT TERMS & BANKING DETAILS</p>
                    <table style="margin-top: 5px;">
                        <tr><td style="padding-right: 10px;">Acc Name</td><td>: DrZ CORP</td></tr>
                        <tr><td style="padding-right: 10px;">Acc Number</td><td>: 7642668853</td></tr>
                        <tr><td style="padding-right: 10px;">SWIFT Code</td><td>: IDIBINBBMDM</td></tr>
                        <tr><td style="padding-right: 10px;">IFSC Code</td><td>: IDIB000T003</td></tr>
                        <tr><td style="padding-right: 10px;">Bank Name</td><td>: IndianBank</td></tr>
                    </table>
                </div>

                <div style="text-align: center; margin-top: 50px; font-size: 12px;">
                    <p>4A, Kamala 2nd street, Chinna chokkikulam, Madurai - 625022.</p>
                </div>
            </div>
        </div>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: admin.email,
            subject: 'Your DrZ Subscription Invoice',
            html: htmlContent
        };

        const options = { format: 'A4' };
        const file = { content: htmlContent };
        
        try {
            const pdfBuffer = await html_to_pdf.generatePdf(file, options);
            mailOptions.attachments = [
                {
                    filename: `Invoice-INV-DRZ-${Date.now().toString().slice(-6)}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ];
            // Optional: send generic text if attachment is present
            mailOptions.text = "Please find your attached invoice.";
        } catch (pdfErr) {
            console.error('Error generating PDF:', pdfErr);
        }

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Invoice sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send invoice' });
    }
};

module.exports = { sendBookingEmail, getBookedTimings, getAllAppointments, getPatientAppointments, sendInvoiceEmail };
