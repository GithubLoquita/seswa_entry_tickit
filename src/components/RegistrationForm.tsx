import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, query, where, getDocs, serverTimestamp, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Registration, Category, FoodPreference, Attending } from "../types";
import { generatePassPDF } from "../PassGenerator";
import { motion } from "motion/react";
import { User, Mail, Phone, Building2, Users, Utensils, Calendar, Send, Loader2 } from "lucide-react";
import { auth } from "../firebase";
import EventDetails from "./EventDetails";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function RegistrationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    category: "Student" as Category,
    organization: "",
    numPersons: 1,
    foodPreference: "Veg" as FoodPreference,
    attending: "Both" as Attending,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "numPersons" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check for duplicate email
      const path = "registrations";
      let querySnapshot;
      try {
        const q = query(collection(db, path), where("email", "==", formData.email), limit(1));
        querySnapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }

      if (querySnapshot && !querySnapshot.empty) {
        throw new Error("This email is already registered.");
      }

      // Generate unique token
      const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      const tokenId = `SESWA22-${randomId}`;
      const entryPassId = `PASS-${randomId}`;
      const lunchTokenId = `LUNCH-${randomId}`;
      const dinnerTokenId = `DINNER-${randomId}`;

      const registration: Registration = {
        ...formData,
        tokenId,
        entryPassId,
        lunchTokenId,
        dinnerTokenId,
        entryScanned: false,
        lunchScanned: false,
        dinnerScanned: false,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore
      let docRef;
      try {
        docRef = await addDoc(collection(db, path), {
          ...registration,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }

      if (!docRef) throw new Error("Failed to save registration.");

      // Generate PDF
      const pdfBase64 = await generatePassPDF({ ...registration, id: docRef.id });

      // Send email via API
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: registration.email,
            fullName: registration.fullName,
            tokenId: registration.tokenId,
            pdfBase64,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send email:", emailErr);
        // We don't block the user if email fails, but we should log it
      }

      // Send WhatsApp via API
      try {
        await fetch("/api/send-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: registration.phone,
            fullName: registration.fullName,
            tokenId: registration.tokenId,
            appUrl: window.location.origin,
          }),
        });
      } catch (waErr) {
        console.error("Failed to send WhatsApp:", waErr);
      }

      // Navigate to success page
      navigate("/success", { state: { registration: { ...registration, id: docRef.id }, pdfBase64 } });
    } catch (err: any) {
      let displayError = err.message || "An error occurred during registration.";
      try {
        if (err.message && typeof err.message === 'string' && err.message.startsWith('{')) {
          const parsed = JSON.parse(err.message);
          if (parsed.error && parsed.error.includes("Missing or insufficient permissions")) {
            displayError = "Registration error: Missing or insufficient permissions. Please contact the administrator.";
          }
        }
      } catch (e) {
        // Not a JSON error
      }
      setError(displayError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <EventDetails />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"
      >
      <div className="bg-primary px-8 py-10 text-white">
        <h2 className="text-3xl font-bold tracking-tight">Event Registration</h2>
        <p className="mt-2 text-white/80">Join us for the SESWA WB 22nd Fresher & Cultural Program.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-8">
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 ring-1 ring-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User size={16} className="text-primary" />
              Full Name
            </label>
            <input
              required
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-primary"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Mail size={16} className="text-primary" />
              Email ID
            </label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-primary"
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Phone size={16} className="text-primary" />
              Phone Number
            </label>
            <input
              required
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-primary"
              placeholder="+91 9876543210"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Users size={16} className="text-primary" />
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-primary"
            >
              <option value="Student">Student</option>
              <option value="Guest">Guest</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          {/* Organization */}
          <div className="space-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Building2 size={16} className="text-primary" />
              College / Organization Name
            </label>
            <input
              required
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-primary"
              placeholder="University of West Bengal"
            />
          </div>

          {/* Number of Persons */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Users size={16} className="text-primary" />
              Number of Persons
            </label>
            <input
              required
              type="number"
              min="1"
              name="numPersons"
              value={formData.numPersons}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Food Preference */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Utensils size={16} className="text-primary" />
              Food Preference
            </label>
            <select
              name="foodPreference"
              value={formData.foodPreference}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-primary"
            >
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
            </select>
          </div>

          {/* Attending */}
          <div className="space-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Calendar size={16} className="text-primary" />
              Attending
            </label>
            <select
              name="attending"
              value={formData.attending}
              onChange={handleChange}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-primary"
            >
              <option value="Lunch">Lunch Only</option>
              <option value="Dinner">Dinner Only</option>
              <option value="Both">Both (Lunch & Dinner)</option>
            </select>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Send size={20} />
              Register Now
            </>
          )}
        </button>
      </form>
      </motion.div>
    </div>
  );
}
