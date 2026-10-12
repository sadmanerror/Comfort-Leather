const nodemailer = require('nodemailer');
const env = require('../config/env');
const { formatBDT } = require('./pricingService');

let transporter = null;

if (env.SMTP.IS_CONFIGURED) {
  transporter = nodemailer.createTransport({
    host: env.SMTP.HOST,
    port: env.SMTP.PORT,
    secure: env.SMTP.PORT === 465,
    auth: {
      user: env.SMTP.USER,
      pass: env.SMTP.PASS
    }
  });
}

const sendMail = async ({ to, subject, html, text }) => {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: env.SMTP.FROM,
        to,
        subject,
        text: text || html.replace(/<[^>]+>/g, ''),
        html
      });
      console.log(`[Email] Sent to ${to}: ${info.messageId}`);
      return info;
    } catch (err) {
      console.error(`[Email] Failed to send to ${to}:`, err.message);
    }
  } else {
    // Development / non-configured logging
    console.log(`\n================== [EMAIL SIMULATION] ==================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Preview: ${text || html.slice(0, 150)}...`);
    console.log(`========================================================\n`);
    return { simulated: true };
  }
};

const sendOrderConfirmation = async (order) => {
  const recipientEmail = order.guestInfo?.email || (order.user && order.user.email);
  if (!recipientEmail) return;

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br>
        <small style="color: #666;">Color: ${item.color} | Size: ${item.size}</small>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatBDT(item.price * item.qty)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px;">
      <div style="text-align: center; border-bottom: 2px solid #D6001C; padding-bottom: 15px;">
        <h2 style="color: #D6001C; margin: 0;">StepUp Shoes</h2>
        <p style="margin: 5px 0 0; color: #555;">Thank you for your order!</p>
      </div>

      <p>Dear <strong>${order.address.fullName}</strong>,</p>
      <p>Your order <strong>#${order.orderNo}</strong> has been received and is currently being processed.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right;"><strong>Subtotal:</strong></td>
            <td style="padding: 8px; text-align: right;">${formatBDT(order.subtotal)}</td>
          </tr>
          ${order.discount ? `
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; color: #28a745;"><strong>Discount:</strong></td>
            <td style="padding: 8px; text-align: right; color: #28a745;">-${formatBDT(order.discount)}</td>
          </tr>` : ''}
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right;"><strong>Shipping:</strong></td>
            <td style="padding: 8px; text-align: right;">${formatBDT(order.shipping)}</td>
          </tr>
          <tr style="font-size: 16px;">
            <td colspan="2" style="padding: 8px; text-align: right; border-top: 2px solid #333;"><strong>Total:</strong></td>
            <td style="padding: 8px; text-align: right; border-top: 2px solid #333; color: #D6001C;"><strong>${formatBDT(order.total)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px;">Delivery Address:</h4>
        <p style="margin: 0; color: #555;">
          ${order.address.addressDetails}, ${order.address.area}, ${order.address.district}, ${order.address.division}<br>
          Phone: ${order.address.phone}
        </p>
      </div>

      <p style="color: #666; font-size: 13px;">
        Track your order anytime at: <a href="${env.BASE_URL}/track-order?orderNo=${order.orderNo}&phone=${order.address.phone}">${env.BASE_URL}/track-order</a>
      </p>
    </div>
  `;

  return sendMail({
    to: recipientEmail,
    subject: `Order Confirmation #${order.orderNo} - StepUp Shoes`,
    html
  });
};

const sendPasswordReset = async (user, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px;">
      <h2 style="color: #D6001C;">Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new password. This link is valid for 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #D6001C; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset My Password
        </a>
      </div>
      <p style="color: #777; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: 'Password Reset Request - StepUp Shoes',
    html
  });
};

module.exports = {
  sendMail,
  sendOrderConfirmation,
  sendPasswordReset
};
