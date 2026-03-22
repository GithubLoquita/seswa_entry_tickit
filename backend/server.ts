import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import twilio from "twilio";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ["https://seswa-entry-tickit.vercel.app", process.env.FRONTEND_URL || "*"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json({ limit: "10mb" })); // Increased limit for PDF base64

// Initialize Firebase Admin
let db: admin.firestore.Firestore | null = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    console.warn("Falling back to mock mode for Firestore.");
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT missing. Running in mock mode for Firestore.");
}

// --- Endpoints ---

// Root route for health check
app.get("/", (req, res) => {
  res.json({ success: true, status: "API is running", timestamp: new Date().toISOString() });
});

// Alias for health check
app.get("/api", (req, res) => {
  res.json({ success: true, status: "API is running", version: "1.0.0" });
});

// 1. POST /register (and /api/register)
const handleRegister = async (req, res) => {
  const { fullName, email, phone, category, organization, numPersons, foodPreference, attending } = req.body;

  try {
    // Generate unique tokens
    const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const tokenId = `SESWA22-${randomId}`;
    const entryPassId = `PASS-${randomId}`;
    const lunchTokenId = `LUNCH-${randomId}`;
    const dinnerTokenId = `DINNER-${randomId}`;

    const registrationData: any = {
      fullName,
      email,
      phone,
      category,
      organization,
      numPersons,
      foodPreference,
      attending,
      tokenId,
      entryPassId,
      lunchTokenId,
      dinnerTokenId,
      entryScanned: false,
      lunchScanned: false,
      dinnerScanned: false,
    };

    let id = `mock-${Date.now()}`;

    if (db) {
      // Check for duplicate email
      const registrationsRef = db.collection("registrations");
      const snapshot = await registrationsRef.where("email", "==", email).limit(1).get();

      if (!snapshot.empty) {
        return res.status(400).json({ success: false, error: "This email is already registered." });
      }

      // Save to Firestore
      registrationData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      const docRef = await registrationsRef.add(registrationData);
      id = docRef.id;
    } else {
      console.log("Mocking registration for:", email);
      registrationData.createdAt = new Date().toISOString();
    }

    res.json({ 
      success: true, 
      registration: { 
        id, 
        ...registrationData,
        createdAt: registrationData.createdAt instanceof admin.firestore.FieldValue 
          ? new Date().toISOString() 
          : registrationData.createdAt
      } 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: "Failed to process registration." });
  }
};

app.post("/register", handleRegister);
app.post("/api/register", handleRegister);

// 2. POST /send-whatsapp (and /api/send-whatsapp)
const handleWhatsApp = async (req, res) => {
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
};

// 3. POST /send-email (and /api/send-email)
const handleEmail = async (req, res) => {
  const { email, fullName, tokenId, pdfBase64 } = req.body;

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
};

app.post("/send-email", handleEmail);
app.post("/api/send-email", handleEmail);

// 4. POST /verify (and /api/verify)
const handleVerify = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: "Token is required." });
  }

  try {
    if (db) {
      const registrationsRef = db.collection("registrations");
      const snapshot = await registrationsRef.where("tokenId", "==", token).limit(1).get();

      if (snapshot.empty) {
        return res.status(404).json({ success: false, error: "Registration not found." });
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      res.json({
        success: true,
        registration: {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }
      });
    } else {
      // Mock mode
      console.log("Mocking verification for token:", token);
      res.json({
        success: true,
        registration: {
          id: `mock-${Date.now()}`,
          fullName: "Mock User",
          email: "mock@example.com",
          phone: "1234567890",
          category: "Student",
          tokenId: token,
          entryScanned: false,
          lunchScanned: false,
          dinnerScanned: false,
          createdAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, error: "Failed to verify token." });
  }
};

app.post("/verify", handleVerify);
app.post("/api/verify", handleVerify);

// 5. POST /mark-used (and /api/mark-used)
const handleMarkUsed = async (req, res) => {
  const { id, scanType } = req.body;

  if (!id || !scanType) {
    return res.status(400).json({ success: false, error: "ID and scanType are required." });
  }

  try {
    if (db) {
      const docRef = db.collection("registrations").doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ success: false, error: "Registration not found." });
      }

      const updateData: any = {};
      if (scanType === "entry") updateData.entryScanned = true;
      if (scanType === "lunch") updateData.lunchScanned = true;
      if (scanType === "dinner") updateData.dinnerScanned = true;

      await docRef.update(updateData);
      res.json({ success: true });
    } else {
      // Mock mode
      console.log(`Mocking mark-used for ID: ${id}, type: ${scanType}`);
      res.json({ success: true });
    }
  } catch (error) {
    console.error("Mark-used error:", error);
    res.status(500).json({ success: false, error: "Failed to mark as used." });
  }
};

app.post("/mark-used", handleMarkUsed);
app.post("/api/mark-used", handleMarkUsed);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
