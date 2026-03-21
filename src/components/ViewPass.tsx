import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Registration } from "../types";
import { motion } from "motion/react";
import { Loader2, Download, AlertCircle, Home } from "lucide-react";
import { generatePassPDF, downloadPDF } from "../PassGenerator";

export default function ViewPass() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPass = async () => {
      if (!tokenId) return;
      try {
        const q = query(collection(db, "registrations"), where("tokenId", "==", tokenId), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError("Pass not found. Please check your Token ID.");
        } else {
          const doc = querySnapshot.docs[0];
          setRegistration({ id: doc.id, ...doc.data() } as Registration);
        }
      } catch (err) {
        console.error("Error fetching pass:", err);
        setError("Failed to load pass details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPass();
  }, [tokenId]);

  const handleDownload = async () => {
    if (!registration) return;
    const pdfBase64 = await generatePassPDF(registration);
    downloadPDF(pdfBase64, `SESWA_Pass_${registration.tokenId}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-2xl font-bold text-slate-900">Error</h2>
        <p className="mt-2 text-slate-600">{error || "Something went wrong."}</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-primary hover:underline">
          <Home size={18} />
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"
    >
      <div className="bg-primary px-8 py-10 text-white text-center">
        <h2 className="text-3xl font-bold tracking-tight">Digital Entry Pass</h2>
        <p className="mt-2 text-white/80">SESWA WB 22nd Fresher & Cultural Program</p>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</p>
            <p className="text-lg font-bold text-slate-900">{registration.fullName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Main Token ID</p>
            <p className="text-lg font-mono font-bold text-primary">{registration.tokenId}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</p>
            <p className="text-lg font-bold text-slate-900">{registration.category}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Food Preference</p>
            <p className="text-lg font-bold text-slate-900">{registration.foodPreference}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attending</p>
            <p className="text-lg font-bold text-slate-900">{registration.attending}</p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Organization</p>
            <p className="text-lg font-bold text-slate-900">{registration.organization}</p>
          </div>
        </div>

        {/* Token IDs Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-indigo-50 p-4 text-center ring-1 ring-indigo-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Entry Pass ID</p>
            <p className="mt-1 font-mono font-bold text-indigo-700">{registration.entryPassId}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 text-center ring-1 ring-amber-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Lunch Token ID</p>
            <p className="mt-1 font-mono font-bold text-amber-700">{registration.lunchTokenId}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4 text-center ring-1 ring-rose-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Dinner Token ID</p>
            <p className="mt-1 font-mono font-bold text-rose-700">{registration.dinnerTokenId}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <p className="text-center text-sm text-slate-500 mb-4">
            Please download your pass and show the QR code at the entrance.
          </p>
          <button
            onClick={handleDownload}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark"
          >
            <Download size={20} />
            Download PDF Pass
          </button>
        </div>

        <div className="text-center">
          <Link to="/" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">
            Register for another person
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
