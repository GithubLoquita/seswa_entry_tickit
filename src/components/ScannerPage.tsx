import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useLocation } from "react-router-dom";
import { Registration } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { QrCode, CheckCircle2, XCircle, Loader2, User, Utensils, Calendar, ShieldCheck, Keyboard, Search, AlertCircle } from "lucide-react";
import { cn } from "../utils";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ScannerPage() {
  const location = useLocation();
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanType, setScanType] = useState<"entry" | "lunch" | "dinner">("entry");
  const [scannedUser, setScannedUser] = useState<Registration | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lastVerifiedUser, setLastVerifiedUser] = useState<{ name: string; type: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseQRData = (rawText: string): { value: string; isId: boolean; detectedScanType?: "entry" | "lunch" | "dinner" } | null => {
    if (!rawText || rawText === "undefined") return null;
    const trimmedText = rawText.trim();
    if (!trimmedText) return null;

    // Check for prefixes like LUNCH- or DINNER-
    const upperText = trimmedText.toUpperCase();
    if (upperText.startsWith("LUNCH-")) {
      return { value: trimmedText.substring(6).trim(), isId: false, detectedScanType: "lunch" };
    }
    if (upperText.startsWith("DINNER-")) {
      return { value: trimmedText.substring(7).trim(), isId: false, detectedScanType: "dinner" };
    }

    // 1. Try JSON parsing
    try {
      if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
        const parsed = JSON.parse(trimmedText);
        if (parsed.id) return { value: parsed.id, isId: true };
        if (parsed.tokenId) return { value: parsed.tokenId, isId: false };
      }
    } catch (e) {
      // Not valid JSON or missing expected fields, continue to next method
    }

    // 2. Try URL extraction (e.g., https://.../view-pass/TOKEN_ID)
    if (trimmedText.includes("/view-pass/")) {
      try {
        // Handle both full URLs and relative paths
        const urlString = trimmedText.startsWith('http') ? trimmedText : `https://${trimmedText}`;
        const url = new URL(urlString);
        const pathParts = url.pathname.split('/').filter(p => p !== "");
        const tokenId = pathParts[pathParts.length - 1];
        if (tokenId) return { value: tokenId, isId: false };
      } catch (e) {
        // Fallback to simple split if URL parsing fails
        const parts = trimmedText.split("/").filter(p => p !== "");
        const tokenId = parts[parts.length - 1];
        if (tokenId) return { value: tokenId, isId: false };
      }
    }

    // 3. Last resort: treat as raw tokenId
    return { value: trimmedText, isId: false };
  };

  useEffect(() => {
    const state = location.state as { tokenId?: string };
    if (state?.tokenId) {
      setManualToken(state.tokenId);
      setMode("manual");
      // Auto-verify if tokenId is provided from state
      verifyUser(state.tokenId);
    }
  }, [location.state]);

  const verifyUser = async (token: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setScannedUser(null);

    try {
      const response = await fetch(`${API_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Verification failed.");
      }

      const userData = data.registration;
      setScannedUser(userData);

      // Check if already scanned for current type
      const isAlreadyScanned = 
        (scanType === "entry" && userData.entryScanned) ||
        (scanType === "lunch" && userData.lunchScanned) ||
        (scanType === "dinner" && userData.dinnerScanned);

      if (isAlreadyScanned) {
        throw new Error(`This ${scanType} pass has already been used!`);
      }

      setScanResult({ id: userData.id });
    } catch (err: any) {
      setError(err.message || "Failed to process verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (decodedText: string) => {
    if (!loading && !scannedUser && !isProcessing) {
      setIsProcessing(true);
      try {
        const parsed = parseQRData(decodedText);
        if (parsed) {
          await verifyUser(parsed.value);
        }
      } catch (err) {
        console.error("Scan error:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = manualToken.trim();
    if (!token) return;

    try {
      const parsed = parseQRData(token);
      if (!parsed) {
        setError("Please enter a valid Token ID or Pass URL.");
        return;
      }

      if (parsed.detectedScanType) {
        setScanType(parsed.detectedScanType);
      }

      await verifyUser(parsed.value.toUpperCase());
      if (!error) setManualToken("");
    } catch (err: any) {
      setError(err.message || "Failed to process verification.");
    }
  };

  const handleMarkAsUsed = async () => {
    if (!scannedUser || !scannedUser.id) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/mark-used`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scannedUser.id, scanType }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to mark as used.");
      }
      
      // Haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      setLastVerifiedUser({ name: scannedUser.fullName, type: scanType.toUpperCase() });
      setShowSuccessPopup(true);
      setSuccess(`${scanType.toUpperCase()} pass marked as used successfully!`);
      setScanResult(null);
      setScannedUser(null);
      setManualToken("");
    } catch (err: any) {
      setError(err.message || "Failed to mark as used.");
    } finally {
      setLoading(false);
    }
  };

  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [checkingCamera, setCheckingCamera] = useState(true);

  useEffect(() => {
    async function checkCamera() {
      setCheckingCamera(true);
      try {
        const devices = await Html5Qrcode.getCameras();
        setHasCamera(devices && devices.length > 0);
        if (!devices || devices.length === 0) {
          setMode("manual");
        }
      } catch (err) {
        console.error("Error checking camera:", err);
        setHasCamera(false);
        setMode("manual");
      } finally {
        setCheckingCamera(false);
      }
    }
    checkCamera();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const startScanner = async () => {
      if (mode === "scan" && hasCamera && !scannedUser && !scanResult) {
        try {
          // Small delay to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 300));
          if (!isMounted) return;

          const element = document.getElementById("reader");
          if (!element) {
            console.warn("Scanner element #reader not found in DOM");
            return;
          }

          if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode("reader");
          }

          if (scannerRef.current.isScanning) {
            try {
              await scannerRef.current.stop();
            } catch (e) {
              console.warn("Error stopping scanner before restart:", e);
            }
          }

          if (!isMounted) return;

          const config = {
            fps: 15, // Slightly higher FPS for smoother detection
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          await scannerRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              if (isMounted) handleScan(decodedText);
            },
            () => {
              // Silent error for no QR detected in frame
            }
          );
          setCameraPermission(true);
          setError(null);
        } catch (err: any) {
          console.error("Scanner start error:", err);
          const errStr = String(err);
          if (errStr.includes("NotAllowedError") || errStr.includes("PermissionDeniedError")) {
            setCameraPermission(false);
            setError("Camera access denied. Please enable camera permissions.");
            setMode("manual");
          } else if (errStr.includes("NotFoundException")) {
            // This can happen if start is called too quickly
          } else {
            // Only show error if it's not a common initialization hiccup
            if (!errStr.includes("is already scanning")) {
              setError("Failed to start camera: " + errStr);
            }
          }
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Scanner stop error during cleanup:", err));
      }
    };
  }, [mode, hasCamera, scannedUser, scanResult]);

  const toggleFlash = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        const newState = !isFlashOn;
        await scannerRef.current.applyVideoConstraints({
          // @ts-ignore - torch is not in standard types but supported by html5-qrcode
          advanced: [{ torch: newState }]
        });
        setIsFlashOn(newState);
      } catch (err) {
        console.error("Flash toggle error:", err);
      }
    }
  };

  const handleError = (err: any) => {
    console.error("Scanner error:", err);
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      setCameraPermission(false);
      setError("Camera access denied. Please enable camera permissions or use Manual Entry.");
      setMode("manual");
    } else {
      setError("Scanner error: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">QR Scanner</h2>
        <p className="mt-2 text-slate-500">Verify entry passes and food tokens.</p>
      </div>

      {/* Scan Type Selector */}
      <div className="flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
        {(["entry", "lunch", "dinner"] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              setScanType(type);
              setScanResult(null);
              setScannedUser(null);
              setError(null);
              setSuccess(null);
            }}
            className={cn(
              "flex-1 rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition-all",
              scanType === type ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Mode Selector */}
      <div className="flex gap-4">
        <button
          onClick={() => setMode("scan")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all",
            mode === "scan" ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
          )}
        >
          <QrCode size={18} />
          Scan QR
        </button>
        <button
          onClick={() => setMode("manual")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all",
            mode === "manual" ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
          )}
        >
          <Keyboard size={18} />
          Manual Entry
        </button>
      </div>

      {/* Main Portal Container */}
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 min-h-[450px]">
        <AnimatePresence mode="wait">
          {scannedUser && scanResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col h-full"
            >
              <div className="bg-primary p-6 text-white text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold">Verification Portal</h3>
                <p className="text-xs text-white/70 uppercase tracking-widest mt-1">Status: Ready to Verify</p>
              </div>

              <div className="flex-1 p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</p>
                    <p className="text-lg font-bold text-slate-900">{scannedUser.fullName}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</p>
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary uppercase">
                      {scannedUser.category}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Token ID</p>
                    <p className="font-mono font-bold text-primary">{scannedUser.tokenId}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Food Pref</p>
                    <p className="font-bold text-slate-900">{scannedUser.foodPreference}</p>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attending Session</p>
                    <p className="font-bold text-slate-900">{scannedUser.attending}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={handleMarkAsUsed}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (
                      <>
                        <CheckCircle2 size={20} />
                        Confirm & Mark Used
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setScannedUser(null);
                      setError(null);
                    }}
                    className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Cancel / Scan Next
                  </button>
                </div>
              </div>
            </motion.div>
          ) : mode === "scan" ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative aspect-square bg-slate-900 w-full flex flex-col overflow-hidden"
            >
              {checkingCamera ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
                  <Loader2 size={48} className="mb-4 animate-spin text-primary" />
                  <h3 className="text-lg font-bold">Initializing Portal...</h3>
                </div>
              ) : hasCamera === false ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
                  <AlertCircle size={48} className="mb-4 text-amber-500" />
                  <h3 className="text-lg font-bold">No Camera Detected</h3>
                  <p className="mt-2 text-sm text-slate-400">Please use the Manual Verification system below.</p>
                  <button
                    onClick={() => setMode("manual")}
                    className="mt-6 rounded-xl bg-white px-6 py-2 text-sm font-bold text-slate-900"
                  >
                    Switch to Manual
                  </button>
                </div>
              ) : cameraPermission === false ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
                  <AlertCircle size={48} className="mb-4 text-red-500" />
                  <h3 className="text-lg font-bold">Camera Access Denied</h3>
                  <p className="mt-2 text-sm text-slate-400">Please enable camera permissions to use the scanner portal.</p>
                  <button
                    onClick={() => setMode("manual")}
                    className="mt-6 rounded-xl bg-white px-6 py-2 text-sm font-bold text-slate-900"
                  >
                    Use Manual Entry
                  </button>
                </div>
              ) : (
                <>
                  <div id="reader" className="absolute inset-0 h-full w-full bg-black" />
                  
                  {/* Overlay for scanning */}
                  {!scanResult && !loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                        {error && error.includes("Failed to start camera") && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 p-6 text-center pointer-events-auto">
                            <AlertCircle size={48} className="mb-4 text-red-500" />
                            <h3 className="text-lg font-bold text-white">Camera Error</h3>
                            <p className="mt-2 text-sm text-slate-400">{error}</p>
                            <button
                              onClick={() => {
                                setError(null);
                                setMode("manual");
                                setTimeout(() => setMode("scan"), 100);
                              }}
                              className="mt-6 rounded-xl bg-primary px-6 py-2 text-sm font-bold text-white"
                            >
                              Retry Camera
                            </button>
                          </div>
                        )}

                        <div className={cn(
                          "h-64 w-64 rounded-3xl border-4 border-dashed transition-all duration-300",
                          isScanning ? "border-emerald-500 scale-105" : "border-primary/50 animate-pulse"
                        )} />
                        
                        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-primary/80 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                          <QrCode size={12} className={isScanning ? "animate-spin" : ""} />
                          {isScanning ? "PROCESSING..." : `PORTAL ACTIVE: ${scanType.toUpperCase()}`}
                        </div>

                        <div className="absolute top-4 right-4 pointer-events-auto">
                          <button
                            onClick={toggleFlash}
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all",
                              isFlashOn ? "bg-amber-500 text-white shadow-lg shadow-amber-500/40" : "bg-black/40 text-white/80 border border-white/10"
                            )}
                          >
                            <Utensils size={18} className={isFlashOn ? "fill-current" : ""} />
                          </button>
                        </div>
                        
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 pointer-events-none">
                          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Align QR Code within Frame</p>
                        </div>
                        
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-auto">
                        <button
                          onClick={() => setMode("manual")}
                          className="rounded-full bg-black/40 px-4 py-2 text-[10px] font-bold text-white/80 hover:text-white transition-colors backdrop-blur-md border border-white/10"
                        >
                          SWITCH TO MANUAL VERIFY
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
                  <Loader2 className="animate-spin text-white" size={48} />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="mb-6 flex items-center gap-3 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Keyboard size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Manual Verification</h3>
                  <p className="text-xs text-slate-500">Enter Token ID or Pass ID manually</p>
                </div>
              </div>

              <form onSubmit={handleManualVerify} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Token / Pass ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="e.g. SESWA22-ABCD"
                      className="w-full rounded-2xl border-slate-200 bg-slate-50 py-5 pl-14 pr-12 font-mono text-lg font-bold text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-primary"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                    {manualToken && (
                      <button
                        type="button"
                        onClick={() => setManualToken("")}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <XCircle size={24} />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !manualToken.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-5 text-lg font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      <Search size={20} />
                      Verify Now
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("scan")}
                  className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Back to QR Scanner
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feedback Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 ring-1 ring-red-100"
          >
            <XCircle className="shrink-0" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-600 ring-1 ring-emerald-100"
          >
            <CheckCircle2 className="shrink-0" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Popup Overlay */}
      <AnimatePresence>
        {showSuccessPopup && lastVerifiedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="bg-emerald-600 p-8 text-center text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20"
                >
                  <CheckCircle2 size={40} />
                </motion.div>
                <h3 className="text-2xl font-bold">Verification Done!</h3>
                <p className="mt-1 text-emerald-100 uppercase tracking-widest text-xs font-bold">
                  {lastVerifiedUser.type} PASS VALIDATED
                </p>
              </div>
              
              <div className="p-8 text-center">
                <p className="text-slate-500 text-sm">Successfully verified for</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{lastVerifiedUser.name}</p>
                
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="mt-8 w-full rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-black active:scale-95"
                >
                  Done / Next Scan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
