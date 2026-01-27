import nodemailer from "nodemailer";

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async (email, otp, purpose = "Verification") => {
  const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const expiryMinutes = purpose === "Password Reset" ? 10 : 5;
  
  const mailOptions = {
    from: `"Plast India Corporation" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `${purpose} - OTP Code`,
    text: `Your OTP code for ${purpose.toLowerCase()} is ${otp}. It will expire in ${expiryMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Plast India Corporation</h2>
        <h3 style="color: #555;">${purpose}</h3>
        <p>Your OTP code is:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666;">This code will expire in ${expiryMinutes} minutes.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
