import React from "react";
import { Link, useLocation } from "react-router-dom";
import { User, ShieldCheck, QrCode, LayoutDashboard, LogOut, LogIn } from "lucide-react";
import { cn } from "../utils";
import { useAuth } from "../AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, login, logout } = useAuth();

  const navItems = [
    { path: "/", label: "Register", icon: User },
    { path: "/scanner", label: "Scanner", icon: QrCode },
    { path: "/admin", label: "Admin", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
              {/* SESWA Logo Placeholder */}
              <img 
                src="images (2)-ClRCJwfd.png" 
                alt="SESWA Logo" 
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-primary">SESWA WB 22nd</h1>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Fresher & Cultural Program</p>
            </div>
          </div>
          <nav className="hidden md:flex md:items-center md:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === item.path ? "text-primary" : "text-slate-600"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
            
            <div className="h-6 w-px bg-slate-200" />
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-900">{user.displayName}</span>
                  <button 
                    onClick={logout}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500"
                  >
                    Logout
                  </button>
                </div>
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt={user.displayName || "User"} 
                  className="h-8 w-8 rounded-full ring-1 ring-slate-200"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-primary hover:text-white"
              >
                <LogIn size={16} />
                Sign In
              </button>
            )}
          </nav>
          <div className="flex md:hidden">
             {/* Mobile nav could be added here if needed */}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full border-t border-slate-200 bg-white/90 px-2 py-3 backdrop-blur-lg md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
              location.pathname === item.path ? "text-primary" : "text-slate-400"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
        
        <button
          onClick={user ? logout : login}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400 transition-colors"
        >
          {user ? (
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="User" 
              className="h-5 w-5 rounded-full ring-1 ring-slate-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <LogIn size={20} />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {user ? "Logout" : "Login"}
          </span>
        </button>
      </nav>

      <footer className="mt-auto hidden border-t border-slate-200 bg-white py-8 md:block">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">
            © 2026 SESWA WB. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
