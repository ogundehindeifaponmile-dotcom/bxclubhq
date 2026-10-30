const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // App Password, NOT regular password
    }
});

// Send order notification to company
const sendOrderNotification = async (order) => {
    const itemsList = order.items
        .map(i => `• ${i.name} × ${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`)
        .join('<br>');

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee;">
            <h1 style="font-size: 1.5rem; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px;">BXCLUB</h1>
            <p style="color: #888; font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase;">New Order Received</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            
            <h2 style="font-size: 1.1rem; margin-bottom: 16px;">Customer Details</h2>
            <p><strong>Name:</strong> ${order.customer.name}</p>
            <p><strong>Email:</strong> ${order.customer.email}</p>
            <p><strong>Phone:</strong> ${order.customer.phone || 'N/A'}</p>
            <p><strong>Address:</strong> ${order.customer.address}</p>
            <p><strong>City:</strong> ${order.customer.city}, ${order.customer.zip}</p>
            <p><strong>Country:</strong> ${order.customer.country}</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            
            <h2 style="font-size: 1.1rem; margin-bottom: 16px;">Order Items</h2>
            <div style="line-height: 1.8;">${itemsList}</div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            
            <p style="font-size: 1.2rem;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
            <p style="font-size: 0.8rem; color: #888;">Stripe Session: ${order.stripeSessionId}</p>
            <p style="font-size: 0.8rem; color: #888;">Order ID: ${order._id}</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"BXCLUB Orders" <${process.env.GMAIL_USER}>`,
            to: process.env.NOTIFICATION_EMAIL,
            subject: `🖤 New BXCLUB Order — $${order.total.toFixed(2)}`,
            html
        });
        console.log(`📧 Notification sent for order ${order._id}`);
    } catch (err) {
        console.error(`❌ Email failed: ${err.message}`);
    }
};

// Send confirmation to customer
const sendCustomerConfirmation = async (order) => {
    const itemsList = order.items
        .map(i => `• ${i.name} × ${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`)
        .join('<br>');

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h1 style="font-size: 1.5rem; letter-spacing: 0.2em; text-transform: uppercase; text-align: center;">BXCLUB</h1>
            <p style="text-align: center; color: #888; font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase;">Thank you for your order</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            
            <p>Dear ${order.customer.name},</p>
            <p>We've received your order and it's being prepared with care.</p>
            
            <h2 style="font-size: 1rem; margin-top: 32px;">Order Summary</h2>
            <div style="line-height: 1.8; margin-bottom: 24px;">${itemsList}</div>
            <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            <p style="font-size: 0.85rem; color: #888; text-align: center;">
                Shipping to: ${order.customer.address}, ${order.customer.city}<br>
                Order ID: ${order._id}
            </p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"BXCLUB" <${process.env.GMAIL_USER}>`,
            to: order.customer.email,
            subject: `Your BXCLUB Order Confirmation`,
            html
        });
    } catch (err) {
        console.error(`❌ Customer email failed: ${err.message}`);
    }
};

module.exports = { sendOrderNotification, sendCustomerConfirmation };