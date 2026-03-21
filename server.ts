import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/send-whatsapp", async (req, res) => {
    const { phone, fullName, tokenId, appUrl } = req.body;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    if (!accountSid || !authToken) {
      console.log("Twilio credentials missing. Mocking WhatsApp send for:", phone);
      return res.json({ success: true, message: "WhatsApp mocked (no Twilio credentials)" });
    }

    const client = twilio(accountSid, authToken);

    try {
      // Ensure phone is in E.164 format for WhatsApp
      // Assuming user enters something like +919876543210
      const toWhatsApp = `whatsapp:${phone.startsWith("+") ? phone : `+${phone}`}`;

      await client.messages.create({
        from: fromWhatsApp,
        to: toWhatsApp,
        body: `Hello ${fullName}! 👋\n\nYour registration for SESWA WB 22nd is successful! 🎉\n\nToken ID: ${tokenId}\nView your digital pass here: ${appUrl}/view-pass/${tokenId}\n\nSee you at the event!`,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("WhatsApp error:", error);
      res.status(500).json({ success: false, error: "Failed to send WhatsApp message" });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    const { email, fullName, tokenId, pdfBase64 } = req.body;

    // NOTE: In a real app, you'd use real SMTP credentials from process.env
    // For this demo, we'll use a mock or a simple log if credentials are missing
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log("SMTP credentials missing. Mocking email send for:", email);
      return res.json({ success: true, message: "Email mocked (no SMTP credentials)" });
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
      res.json({ success: true });
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ success: false, error: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
