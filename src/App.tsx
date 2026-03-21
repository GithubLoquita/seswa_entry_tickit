import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import Layout from "./components/Layout";
import RegistrationForm from "./components/RegistrationForm";
import SuccessPage from "./components/SuccessPage";
import AdminDashboard from "./components/AdminDashboard";
import ScannerPage from "./components/ScannerPage";
import ViewPass from "./components/ViewPass";
import { AuthProvider, useAuth } from "./AuthContext";
import { Loader2, ShieldCheck } from "lucide-react";

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, loading, login } = useAuth();
  const adminEmail = "sandiphembram2021@gmail.com";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-sm font-medium text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
          <p className="max-w-xs text-slate-500">Please sign in with your Google account to access the {adminOnly ? "Admin" : "Scanner"} tools.</p>
        </div>
        <button
          onClick={login}
          className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (adminOnly && user.email !== adminEmail) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Unauthorized</h2>
          <p className="max-w-xs text-slate-500">Your account ({user.email}) does not have administrative privileges.</p>
        </div>
        <Link
          to="/"
          className="text-sm font-bold text-primary hover:underline"
        >
          Back to Registration
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<RegistrationForm />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/scanner" element={
              <ProtectedRoute>
                <ScannerPage />
              </ProtectedRoute>
            } />
            <Route path="/view-pass/:tokenId" element={<ViewPass />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
