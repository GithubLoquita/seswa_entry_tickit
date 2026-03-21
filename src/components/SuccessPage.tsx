import React from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, Download, Mail, ArrowLeft } from "lucide-react";
import { downloadPDF, generateCompactTicketPDF } from "../PassGenerator";

export default function SuccessPage() {
  const location = useLocation();
  const { registration, pdfBase64 } = location.state || {};

  const handleDownloadCompact = async () => {
    if (!registration) return;
    const compactBase64 = await generateCompactTicketPDF(registration);
    downloadPDF(compactBase64, `SESWA_Ticket_${registration.tokenId}.pdf`);
  };

  if (!registration) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-slate-600">No registration data found.</p>
        <Link to="/" className="text-indigo-600 hover:underline">Go back to registration</Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"
    >
      <div className="bg-emerald-500 px-8 py-12 text-center text-white">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight">Registration Successful!</h2>
        <p className="mt-2 text-emerald-50">Main Token ID: <span className="font-mono font-bold">{registration.tokenId}</span></p>
      </div>

      <div className="p-8">
        <div className="space-y-6">
          {/* Token Display Portal */}
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
            <h3 className="mb-4 text-lg font-bold text-slate-900">Next Steps</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">1</div>
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">Check your email:</span> We've sent your digital pass to <span className="font-medium text-indigo-600">{registration.email}</span>.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">2</div>
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">Download Pass:</span> You can also download your pass directly using the button below.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">3</div>
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">Entry:</span> Show the QR code on your pass at the event entrance for verification.
                </p>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => downloadPDF(pdfBase64, `SESWA_Pass_${registration.tokenId}.pdf`)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark"
              >
                <Download size={20} />
                Download Full Pass
              </button>
              <button
                onClick={handleDownloadCompact}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700"
              >
                <Download size={20} />
                Compact Ticket
              </button>
            </div>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 py-4 font-bold text-slate-600 transition-all hover:bg-slate-200"
            >
              <ArrowLeft size={20} />
              Register Another
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
