const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendDonorAlert = async (donorEmail, donorName, requestDetails) => {
    const mailOptions = {
        from: `"Blood Bank Connector" <${process.env.EMAIL_USER}>`,
        to: donorEmail,
        subject: '🚨 Urgent Blood Donation Needed!',
        html: `
            <h2>Emergency Blood Request</h2>
            <p>Hello ${donorName},</p>
            <p>A patient urgently needs your help!</p>
            <ul>
                <li><strong>Blood Group:</strong> ${requestDetails.bloodGroup}</li>
                <li><strong>Hospital:</strong> ${requestDetails.hospitalName}</li>
                <li><strong>Address:</strong> ${requestDetails.hospitalAddress}</li>
                <li><strong>Urgency:</strong> ${requestDetails.urgency}</li>
            </ul>
            <p>Please respond if you can donate.</p>
            <p>Thank you for being a lifesaver! 🩸</p>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${donorEmail}`);
        return true;
    } catch (error) {
        console.log(`❌ Email failed:`, error);
        return false;
    }
};

module.exports = { sendDonorAlert };