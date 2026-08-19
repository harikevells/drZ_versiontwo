const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const generateBillingPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // We might need hospital name/logo. Let's find admin details if possible.
        let admin = null;
        if (appointment.adminId) {
            admin = await User.findOne({ uniqueId: appointment.adminId });
        }

        // Read Logo as Base64
        let logoHtml = '<div style="color: #000; display: inline-block; padding: 15px; border-radius: 5px; font-weight: bold; font-size: 24px; font-family: serif;">DrZ</div>';
        try {
            const logoPath = path.join(__dirname, '../../DoctorApp/src/assets/Adminlogo.svg');
            const logoBuffer = fs.readFileSync(logoPath);
            const logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`;
            logoHtml = `<img src="${logoBase64}" alt="DrZ" style="height: 60px; padding: 10px;" />`;
        } catch (e) {
            console.error('Logo not found', e);
        }

        const amount = appointment.consultingFee || 0;
        const doctorName = appointment.doctor_name || 'N/A';
        const patientName = appointment.patient_name || 'N/A';
        const ageGender = `${appointment.patient_age || '--'} / ${appointment.patient_gender || '--'}`;
        const treatment = appointment.treatment_category || 'N/A';
        const date = appointment.appointment_date || 'N/A';
        const time = appointment.appointment_time || 'N/A';
        const followupDate = appointment.followupDate || appointment.followup_date || 'N/A';
        const bookingId = appointment.booking_id || `#Appmt${id.substring(id.length - 4)}`;

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                .header-title {
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    letter-spacing: 2px;
                    color: #0d6c7e;
                    text-transform: uppercase;
                    margin-bottom: 20px;
                }
                .header-title span {
                    border-bottom: 2px solid #0d6c7e;
                    padding-bottom: 5px;
                }
                .header-container {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .logo-section {
                    width: 50%;
                }
                .address-text {
                    font-size: 10px;
                    color: #666;
                    margin-top: 10px;
                    line-height: 1.4;
                }
                .info-section {
                    width: 45%;
                    text-align: right;
                    font-size: 11px;
                }
                .booking-badge {
                    background-color: #e6f7fa;
                    color: #0d6c7e;
                    padding: 5px 10px;
                    border-radius: 15px;
                    display: inline-block;
                    font-weight: bold;
                    margin-bottom: 15px;
                }
                .info-row {
                    margin-bottom: 5px;
                }
                .info-label {
                    color: #888;
                }
                .info-value {
                    font-weight: bold;
                }
                .consulting-doctor {
                    margin-top: 20px;
                    font-size: 11px;
                }
                .icon-circle {
                    background-color: #0d6c7e;
                    color: white;
                    border-radius: 50%;
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    text-align: center;
                    line-height: 16px;
                    margin-right: 5px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 30px;
                    font-size: 12px;
                }
                th {
                    background-color: #f1f5f9;
                    border-bottom: 2px solid #cbd5e1;
                    padding: 10px;
                    text-align: left;
                    color: #475569;
                }
                td {
                    border-bottom: 1px solid #e2e8f0;
                    padding: 10px;
                }
                .text-right {
                    text-align: right;
                }
                .text-center {
                    text-align: center;
                }
                .footer-container {
                    margin-top: 40px;
                    display: table;
                    width: 100%;
                }
                .footer-left {
                    display: table-cell;
                    width: 50%;
                    font-size: 11px;
                }
                .footer-right {
                    display: table-cell;
                    width: 50%;
                    text-align: right;
                    font-size: 11px;
                    font-weight: bold;
                }
                .received-amount {
                    margin-top: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    color: #0d6c7e;
                }
            </style>
        </head>
        <body>
            <div class="header-title">
                <span>BILLING</span>
            </div>
            <div class="header-container" style="display: table; width: 100%;">
                <div class="logo-section" style="display: table-cell; width: 50%; vertical-align: top;">
                    ${logoHtml}
                    <div class="address-text">
                        1ST FLOOR, HAKEEM AJMAL, 22, MADHAVAN ENCLAVE,<br/>
                        Hakim Ajmal Khan Rd, near Seventhday School,<br/>
                        Chinna Chokkikulam, Madurai, Tamil Nadu 625002<br/><br/>
                        Ph : 97891 51180
                    </div>
                </div>
                <div class="info-section" style="display: table-cell; width: 50%; vertical-align: top; text-align: right;">
                    <div class="booking-badge">Booking ID: ${bookingId}</div>
                    <div class="info-row"><span class="info-label">Patient:</span> <span class="info-value">${patientName}</span></div>
                    <div class="info-row"><span class="info-label">Age/Gender:</span> <span class="info-value">${ageGender}</span></div>
                    <div class="info-row"><span class="info-label">Treatment:</span> <span class="info-value">${treatment}</span></div>
                    <div class="info-row"><span class="info-label">Date:</span> <span class="info-value">${date}</span></div>
                    <div class="info-row"><span class="info-label">Time:</span> <span class="info-value">${time}</span></div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Consulting Doctor Name</th>
                        <th class="text-right">Amount (INR)</th>
                        <th class="text-center">GST : CGST 0, SGST 0</th>
                        <th class="text-right">Sub Total (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Dr. ${doctorName}</td>
                        <td class="text-right">${amount}</td>
                        <td class="text-center">0</td>
                        <td class="text-right">${amount}</td>
                    </tr>
                </tbody>
            </table>

            <div class="received-amount">
                Received amount : INR ${amount}
            </div>

            <div class="footer-container">
                <div class="footer-left">
                    <span class="icon-circle" style="background-color: transparent; color: #333; border: 1px solid #333;">📅</span> Followup : <strong>${followupDate}</strong>
                </div>
                <div class="footer-right">
                    Consulting Doctor: Dr. ${doctorName}
                </div>
            </div>
        </body>
        </html>
        `;

        const options = { format: 'A4', border: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' } };
        
        pdf.create(htmlContent, options).toBuffer((err, buffer) => {
            if (err) {
                console.error("PDF generation error:", err);
                return res.status(500).json({ error: 'Failed to generate PDF' });
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Billing-${id}.pdf`);
            res.send(buffer);
        });

    } catch (err) {
        console.error("Error in generateBillingPDF:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { generateBillingPDF };
