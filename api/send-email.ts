import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, fullName, tokenId, pdfBase64 } = req.body;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("SMTP credentials missing. Mocking email send for:", email);
    return res.status(200).json({ success: true, message: "Email mocked (no SMTP credentials)" });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"SESWA WB 22nd" <${smtpUser}>`,
      to: email,
      subject: "Your Event Pass - SESWA WB 22nd Fresher & Cultural Program",
      text: `Hello ${fullName},\n\nYour registration is successful. Your Token ID is ${tokenId}.\nPlease find your digital pass attached.`,
      attachments: [
        {
          filename: `SESWA_Pass_${tokenId}.pdf`,
          content: pdfBase64,
          encoding: "base64",
        },
      ],
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ success: false, error: "Failed to send email" });
  }
}
