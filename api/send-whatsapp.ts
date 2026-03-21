import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, fullName, tokenId, appUrl } = req.body;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    console.log("Twilio credentials missing. Mocking WhatsApp send for:", phone);
    return res.status(200).json({ success: true, message: "WhatsApp mocked (no Twilio credentials)" });
  }

  const client = twilio(accountSid, authToken);

  try {
    const toWhatsApp = `whatsapp:${phone.startsWith("+") ? phone : `+${phone}`}`;

    await client.messages.create({
      from: fromWhatsApp,
      to: toWhatsApp,
      body: `Hello ${fullName}! 👋\n\nYour registration for SESWA WB 22nd is successful! 🎉\n\nToken ID: ${tokenId}\nView your digital pass here: ${appUrl}/view-pass/${tokenId}\n\nSee you at the event!`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("WhatsApp error:", error);
    return res.status(500).json({ success: false, error: "Failed to send WhatsApp message" });
  }
}
