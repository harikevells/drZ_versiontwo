const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const tamilTranslations = {
  'General': 'பொது மருத்துவம்',
  'General Care': 'பொது நலம்',
  'Cardiology': 'இருதயவியல்',
  'Neurology': 'நரம்பியல்',
  'Orthopedics': 'எலும்பியல்',
  'Pediatrics': 'குழந்தை மருத்துவம்',
  'Dermatology': 'தோல் மருத்துவம்',
  'General Surgery': 'பொது அறுவை சிகிச்சை',
  'Psychiatry': 'மனநல மருத்துவம்',
  'Gynecology': 'மகளிர் மருத்துவம்',
  'Oncology': 'புற்றுநோயியல்',
  'Ophthalmology': 'கண் மருத்துவம்',
  'Urology': 'சிறுநீரகவியல்',
  'ENT': 'காது மூக்கு தொண்டை',
  'Dentistry': 'பல் மருத்துவம்',
  'Radiology': 'கதிரியக்கவியல்',
  'General Physician': 'பொது மருத்துவர்',
  'Physiotherapy': 'இயன்முறை மருத்துவம்',
  'Multi Speciality': 'பல்துறை சிறப்பு'
};

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
        
        let rawTreatment = appointment.treatment_category || 'N/A';
        let treatment = rawTreatment;
        if (rawTreatment && !rawTreatment.includes('/')) {
            const translation = tamilTranslations[rawTreatment.trim()];
            if (translation) {
                treatment = `${rawTreatment} / ${translation}`;
            }
        }
        
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
                    padding: 15px; /* Reduced padding */
                }
                .color-blue { color: #0d47a1; }
                .color-light-blue { color: #1565c0; }
                .color-grey { color: #666; }
                .bg-light { background-color: #f8fafc; }
                
                table { width: 100%; border-collapse: collapse; }
                
                .layout-table { border: none; margin-bottom: 10px; }
                .layout-table td { border: none; vertical-align: top; padding: 0; }
                
                .header-title-container {
                    text-align: center;
                    margin-bottom: 10px;
                }
                .header-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1a237e;
                    letter-spacing: 4px;
                    display: inline-block;
                }
                .booking-id-box {
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 8px;
                    text-align: center;
                    display: inline-block;
                }
                .patient-info-table td {
                    padding: 3px 0;
                    font-size: 10px;
                }
                .patient-info-table .label {
                    color: #333;
                    width: 100px;
                }
                .summary-box {
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    margin-bottom: 10px;
                    overflow: hidden;
                }
                .summary-table td {
                    padding: 8px 12px;
                    width: 50%;
                    vertical-align: middle;
                }
                .summary-left { border-right: 1px solid #e2e8f0; }
                .amount-large {
                    font-size: 20px;
                    font-weight: bold;
                    color: #1565c0;
                }
                .circle-icon, .circle-icon-light {
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: inline-block;
                    text-align: center;
                    line-height: 32px;
                    vertical-align: middle;
                }
                .circle-icon {
                    background-color: #1565c0;
                    color: white;
                }
                .circle-icon-light {
                    background-color: #eef2ff;
                    color: #1565c0;
                }
                .thank-you-section {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #333;
                    position: relative;
                }
                .thank-you-line {
                    border-top: 1px dashed #cbd5e1;
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    z-index: 1;
                }
                .thank-you-content {
                    background-color: white;
                    display: inline-block;
                    padding: 0 10px;
                    position: relative;
                    z-index: 2;
                    font-weight: 500;
                }
                .heart-icon {
                    color: white;
                    background-color: #1565c0;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: inline-block;
                    text-align: center;
                    line-height: 20px;
                    margin: 0 8px;
                }
                .footer-bottom {
                    background-color: #f8fafc;
                    border-radius: 4px;
                    margin-top: 15px;
                    padding: 10px;
                }
                .footer-table td {
                    width: 50%;
                    text-align: center;
                    font-size: 12px;
                    color: #1a237e;
                    font-weight: 600;
                }
                .footer-left-td {
                    border-right: 1px solid #cbd5e1;
                }
            </style>
        </head>
        <body>
            <!-- BILLING Header at the very top -->
            <div class="header-title-container">
                <div class="header-title">BILLING</div>
                <div>
                    <svg width="80" height="12" viewBox="0 0 100 15" fill="none" stroke="#1565c0" stroke-width="1.5">
                        <path d="M 0 10 L 40 10 L 45 2 L 55 14 L 60 10 L 100 10" />
                    </svg>
                </div>
            </div>

            <!-- Logo and Booking ID below header -->
            <table class="layout-table">
                <tr>
                    <td style="width: 50%; vertical-align: middle;">
                        ${logoHtml}
                    </td>
                    <td style="width: 50%; text-align: right; vertical-align: middle;">
                        <div class="booking-id-box">
                            <div style="font-size: 10px; color: #666; margin-bottom: 3px;">Booking ID</div>
                            <div style="font-size: 14px; font-weight: bold; color: #1565c0;">${bookingId}</div>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Address and Patient Info -->
            <table class="layout-table" style="margin-top: 15px; margin-bottom: 15px;">
                <tr>
                    <td style="width: 48%; padding-right: 15px; border-right: 1px solid #e2e8f0;">
                        <table class="layout-table">
                            <tr>
                                <td style="width: 24px; padding-top: 2px;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                </td>
                                <td style="font-size: 10px; color: #333; line-height: 1.4;">
                                    1ST FLOOR, HAKEEM AJMAL, 22, MADHAVAN<br/>
                                    ENCLAVE,<br/>
                                    Hakim Ajmal Khan Rd, near Seventhday School,<br/>
                                    Chinna Chokkikulam, Madurai, Tamil Nadu 625002
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 8px;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                </td>
                                <td style="font-size: 11px; padding-top: 8px; font-weight: 500;">
                                    Ph : 97891 51180
                                </td>
                            </tr>
                        </table>
                    </td>
                    
                    <td style="width: 4%;">&nbsp;</td>
                    <td style="width: 48%;">
                        <table class="layout-table patient-info-table">
                            <tr>
                                <td style="width: 24px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></td>
                                <td class="label">Patient Name</td>
                                <td style="width: 10px;">:</td>
                                <td style="font-weight: bold; color: #111;">${patientName}</td>
                            </tr>
                            <tr>
                                <td><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="14" r="5"></circle><line x1="13.5" y1="10.5" x2="19" y2="5"></line><polyline points="15 5 19 5 19 9"></polyline></svg></td>
                                <td class="label">Age / Gender</td>
                                <td>:</td>
                                <td style="font-weight: bold; color: #111;">${ageGender}</td>
                            </tr>
                            <tr>
                                <td><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></td>
                                <td class="label">Treatment</td>
                                <td>:</td>
                                <td style="font-weight: bold; color: #111;">${treatment}</td>
                            </tr>
                            <tr>
                                <td><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></td>
                                <td class="label">Date</td>
                                <td>:</td>
                                <td style="font-weight: bold; color: #111;">${date}</td>
                            </tr>
                            <tr>
                                <td><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></td>
                                <td class="label">Time</td>
                                <td>:</td>
                                <td style="font-weight: bold; color: #111;">${time}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Billing Table -->
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 15px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th style="background-color: #eef2ff; color: #1a237e; padding: 12px 15px; text-align: left; font-size: 12px;">Consulting Doctor</th>
                        <th style="background-color: #eef2ff; color: #1a237e; padding: 12px 15px; text-align: center; font-size: 12px;">Amount (INR)</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px 15px; font-weight: 600; font-size: 13px; border-bottom: none; color: #111;">Dr. ${doctorName}</td>
                        <td style="padding: 10px 15px; font-weight: 600; font-size: 13px; text-align: center; border-bottom: none; color: #111;">${amount}</td>
                    </tr>
                </table>
            </div>

            <!-- Received Amount / Total Amount -->
            <div class="summary-box">
                <table class="layout-table summary-table" style="margin-bottom: 0;">
                    <tr>
                        <td class="summary-left">
                            <table class="layout-table" style="margin-bottom: 0;">
                                <tr>
                                    <td style="width: 40px; vertical-align: middle;">
                                        <div class="circle-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -3px;"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5H5v-4h16V7"></path></svg>
                                        </div>
                                    </td>
                                    <td style="vertical-align: middle; text-align: left; padding-left: 5px;">
                                        <div style="font-size: 10px; color: #1a237e; font-weight: 600; margin-bottom: 2px;">Received Amount</div>
                                        <div class="amount-large">₹${amount}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td style="text-align: center;">
                            <div style="font-size: 12px; font-weight: bold; display: inline-block; margin-right: 15px; vertical-align: middle;">Total Amount (INR)</div>
                            <div class="amount-large" style="display: inline-block; vertical-align: middle;">₹${amount}</div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Follow up Box -->
            <div class="summary-box">
                <table class="layout-table summary-table" style="margin-bottom: 0;">
                    <tr>
                        <td class="summary-left">
                            <table class="layout-table" style="margin-bottom: 0;">
                                <tr>
                                    <td style="width: 40px; vertical-align: middle;">
                                        <div class="circle-icon-light">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        </div>
                                    </td>
                                    <td style="vertical-align: middle; text-align: left; padding-left: 5px;">
                                        <div style="font-size: 10px; color: #475569; margin-bottom: 2px;">Follow up Date</div>
                                        <div style="font-size: 13px; font-weight: 600; color: #111;">${followupDate}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td>
                            <table class="layout-table" style="margin-bottom: 0;">
                                <tr>
                                    <td style="width: 40px; vertical-align: middle;">
                                        <div class="circle-icon-light">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: -3px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        </div>
                                    </td>
                                    <td style="vertical-align: middle; text-align: left; padding-left: 5px;">
                                        <div style="font-size: 10px; color: #475569; margin-bottom: 2px;">Consulting Doctor</div>
                                        <div style="font-size: 13px; font-weight: 600; color: #111;">Dr. ${doctorName}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Thank you -->
            <div class="thank-you-section">
                <div class="thank-you-line"></div>
                <div class="thank-you-content">
                    Thank you for choosing DrZ. 
                    <div class="heart-icon">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align: middle; margin-top: -2px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </div>
                    Your health is our priority.
                </div>
            </div>

            <!-- Footer Bottom -->
            <div class="footer-bottom">
                <table class="layout-table footer-table" style="margin-bottom: 0;">
                    <tr>
                        <td class="footer-left-td">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 5px; margin-top: -2px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            97891 51180
                        </td>
                        <td>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 5px; margin-top: -2px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            www.drzhealth.com
                        </td>
                    </tr>
                </table>
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
