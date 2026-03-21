import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { Registration } from "../types";
import { motion } from "motion/react";
import { Search, Filter, Download, Users, Utensils, Calendar, CheckCircle2, XCircle, Loader2, Printer, ShieldCheck, Mail } from "lucide-react";
import { cn } from "../utils";
import { downloadPDF, generateCompactTicketPDF, generatePassPDF } from "../PassGenerator";

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterFood, setFilterFood] = useState("All");
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<{ id: string, success: boolean, message: string } | null>(null);

  const handlePrintTicket = async (reg: Registration) => {
    const compactBase64 = await generateCompactTicketPDF(reg);
    downloadPDF(compactBase64, `SESWA_Ticket_${reg.tokenId}.pdf`);
  };

  const handleResendEmail = async (reg: Registration) => {
    setResendingEmail(reg.id!);
    setResendStatus(null);
    try {
      const pdfBase64 = await generatePassPDF(reg);
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: reg.email,
          fullName: reg.fullName,
          tokenId: reg.tokenId,
          pdfBase64,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setResendStatus({ id: reg.id!, success: true, message: "Email sent successfully!" });
      } else {
        setResendStatus({ id: reg.id!, success: false, message: result.error || "Failed to send email" });
      }
    } catch (error) {
      console.error("Resend error:", error);
      setResendStatus({ id: reg.id!, success: false, message: "Network error occurred" });
    } finally {
      setResendingEmail(null);
      // Clear status after 3 seconds
      setTimeout(() => setResendStatus(null), 3000);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "registrations"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Registration[];
      setRegistrations(data);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch = reg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reg.tokenId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || reg.category === filterCategory;
    const matchesFood = filterFood === "All" || reg.foodPreference === filterFood;
    return matchesSearch && matchesCategory && matchesFood;
  });

  const stats = {
    total: registrations.length,
    students: registrations.filter(r => r.category === 'Student').length,
    guests: registrations.filter(r => r.category === 'Guest').length,
    vips: registrations.filter(r => r.category === 'VIP').length,
    veg: registrations.filter(r => r.foodPreference === 'Veg').length,
    nonVeg: registrations.filter(r => r.foodPreference === 'Non-Veg').length,
    lunch: registrations.filter(r => r.attending === 'Lunch' || r.attending === 'Both').length,
    dinner: registrations.filter(r => r.attending === 'Dinner' || r.attending === 'Both').length,
    scanned: registrations.filter(r => r.entryScanned).length,
  };

  const downloadCSV = () => {
    const headers = ["Token ID", "Full Name", "Email", "Phone", "Category", "Organization", "Food", "Attending", "Entry Scanned"];
    const rows = filteredRegistrations.map(r => [
      r.tokenId, r.fullName, r.email, r.phone, r.category, r.organization, r.foodPreference, r.attending, r.entryScanned ? "Yes" : "No"
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "SESWA_Registrations.csv";
    link.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h2>
        <button
          onClick={downloadCSV}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark"
        >
          <Download size={18} />
          Download CSV
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Registrations" value={stats.total} color="bg-blue-500" />
        <StatCard icon={Utensils} label="Veg / Non-Veg" value={`${stats.veg} / ${stats.nonVeg}`} color="bg-emerald-500" />
        <StatCard icon={Calendar} label="Lunch / Dinner" value={`${stats.lunch} / ${stats.dinner}`} color="bg-amber-500" />
        <StatCard icon={CheckCircle2} label="Passes Scanned" value={`${stats.scanned} / ${stats.total}`} color="bg-primary" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-primary"
          >
            <option value="All">All Categories</option>
            <option value="Student">Student</option>
            <option value="Guest">Guest</option>
            <option value="VIP">VIP</option>
          </select>
          <select
            value={filterFood}
            onChange={(e) => setFilterFood(e.target.value)}
            className="rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-primary"
          >
            <option value="All">All Food</option>
            <option value="Veg">Veg</option>
            <option value="Non-Veg">Non-Veg</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Token ID</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">User Details</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Food</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Attending</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono font-bold text-primary">{reg.tokenId}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{reg.fullName}</div>
                    <div className="text-xs text-slate-500">{reg.email}</div>
                    <div className="text-xs text-slate-500">{reg.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                      reg.category === 'VIP' ? "bg-purple-100 text-purple-600" : 
                      reg.category === 'Guest' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {reg.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                      reg.foodPreference === 'Veg' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    )}>
                      {reg.foodPreference}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{reg.attending}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {reg.entryScanned ? (
                        <CheckCircle2 className="text-emerald-500" size={18} />
                      ) : (
                        <XCircle className="text-slate-300" size={18} />
                      )}
                      <span className={reg.entryScanned ? "text-emerald-600 font-medium" : "text-slate-400"}>
                        {reg.entryScanned ? "Scanned" : "Not Scanned"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {resendStatus?.id === reg.id && (
                        <span className={cn(
                          "mr-2 text-[10px] font-bold",
                          resendStatus.success ? "text-emerald-600" : "text-red-600"
                        )}>
                          {resendStatus.message}
                        </span>
                      )}
                      <button
                        onClick={() => handleResendEmail(reg)}
                        disabled={resendingEmail === reg.id}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                          resendingEmail === reg.id ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                        )}
                        title="Resend Digital Pass Email"
                      >
                        {resendingEmail === reg.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Mail size={14} />
                        )}
                        Resend
                      </button>
                      <button
                        onClick={() => handlePrintTicket(reg)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-primary hover:text-white"
                        title="Print Compact Ticket"
                      >
                        <Printer size={14} />
                        Print
                      </button>
                      {!reg.entryScanned && (
                        <Link
                          to="/scanner"
                          state={{ tokenId: reg.tokenId }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white"
                        >
                          <ShieldCheck size={14} />
                          Verify
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg", color)}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
