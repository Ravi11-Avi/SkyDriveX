/**
 * Email dispatch service
 * Supports development console output and optional production SMTP
 */
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const isProd = process.env.NODE_ENV === "production" && process.env.SMTP_HOST;

  if (!isProd) {
    // Development output: formatted console notification
    console.log("\n================ [PASSWORD RESET EMAIL] ================");
    console.log(`To: ${name} <${to}>`);
    console.log(`Subject: Password Reset Request - SkyDriveX`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log(`(This link expires in 10 minutes)`);
    console.log("========================================================\n");
    return { success: true, mode: "development_console" };
  }

  // Production SMTP transport (optional configuration)
  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5;">SkyDriveX Password Reset</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. This link will expire in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} SkyDriveX. All rights reserved.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"SkyDriveX Support" <noreply@skydrivex.com>',
      to,
      subject: "Password Reset Request - SkyDriveX",
      html: htmlContent,
    });

    return { success: true, mode: "smtp" };
  } catch (error) {
    console.error("Failed to send password reset email:", error.message);
    throw new Error("There was an error sending the reset email. Please try again later.");
  }
};

module.exports = {
  sendPasswordResetEmail,
};
