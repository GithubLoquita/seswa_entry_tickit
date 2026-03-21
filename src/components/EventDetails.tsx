import React from "react";
import { Calendar, Clock, MapPin, Info } from "lucide-react";
import { motion } from "motion/react";

export default function EventDetails() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl mb-8 overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"
    >
      <div className="bg-emerald-800 px-8 py-10 text-white relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-700/50 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-900/50 blur-3xl" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-700/50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-100 ring-1 ring-emerald-500/30">
            <Info size={14} />
            Official Announcement
          </div>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            22nd Annual Cultural Programme & Freshers' Welcome (2025-26)
          </h2>
          <p className="mt-4 text-lg text-emerald-100/90 font-serif italic">
            "On behalf of the Governing Body of the Santal Engineering Students’ Welfare Association (W.B.), we are delighted to announce the 22nd Annual Cultural Programme & Freshers' Welcome."
          </p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 leading-relaxed">
            This year, the celebration is being organized by <strong className="text-slate-900">Kalyani Government Engineering College</strong>. We cordially invite all students, alumni, and esteemed guests of SESWA (W.B.) to join us for a day dedicated to our heritage, academic community, and the welcoming of our newest members.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Your presence is vital in making this milestone event a truly memorable success.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Calendar size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</p>
            <p className="mt-1 font-bold text-slate-900">12th April, 2026</p>
            <p className="text-xs text-slate-500">(Sunday)</p>
          </div>

          <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Clock size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time</p>
            <p className="mt-1 font-bold text-slate-900">10:00 AM</p>
            <p className="text-xs text-slate-500">Onwards</p>
          </div>

          <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MapPin size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Venue</p>
            <p className="mt-1 font-bold text-slate-900">A.P.J. Auditorium</p>
            <p className="text-xs text-slate-500">University of Kalyani</p>
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-100">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-800">
              <MapPin size={16} />
            </div>
            <div>
              <p className="font-bold text-emerald-900">Full Venue Address</p>
              <p className="text-sm text-emerald-800/80">
                A.P.J. Abdul Kalam Auditorium, University of Kalyani, Kalyani - 741235
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            We look forward to welcoming you to Kalyani for a day of cultural excellence and reunion.
          </p>
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sincerely,</p>
            <p className="mt-1 font-bold text-slate-900">Santal Engineering Students' Welfare Association</p>
            <p className="text-xs font-medium text-slate-500">SESWA(W.B.)</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
