const nodemailer = require('nodemailer');
const { getOrderStatusEmailTemplate } = require('./emailTemplates');

const sendOrderStatusEmail = async (order, user) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const template = getOrderStatusEmailTemplate(order, user);
        
        if (!template) {
            console.log('No email template for this status');
            return false;
        }

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: user.email,
            subject: template.subject,
            html: template.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Order status email sent successfully:", info.messageId);
        return true;

    } catch (error) {
        console.error("Error sending order status email:", error);
        return false;
    }
};

module.exports = { 
    sendOrderStatusEmail 
}; 