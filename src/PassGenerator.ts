import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Registration } from "./types";

const getLogoBase64 = async (): Promise<string | null> => {
  try {
    // Attempt to fetch the local logo file
    const response = await fetch("/logo.png");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Logo not found or could not be loaded:", e);
    return null;
  }
};

export const generatePassPDF = async (registration: Registration): Promise<string> => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const logoBase64 = await getLogoBase64();

  // Background / Border
  doc.setFillColor(245, 250, 245); // Very light emerald background
  doc.rect(0, 0, width, height, "F");
  
  doc.setDrawColor(5, 150, 105); // Emerald-600
  doc.setLineWidth(2);
  doc.rect(5, 5, width - 10, height - 10);
  
  doc.setLineWidth(0.5);
  doc.rect(7, 7, width - 14, height - 14);

  // Left Section (Event Info)
  doc.setFillColor(6, 78, 59); // Emerald-900
  doc.rect(5, 5, 80, height - 10, "F");

  // Logo in Left Section
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 25, 15, 40, 40);
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
    }
  } else {
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("SESWA", 45, 35, { align: "center" });
  }

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("WB 22nd", 45, 60, { align: "center" });
  
  doc.setDrawColor(255, 255, 255, 0.3);
  doc.line(15, 65, 75, 65);

  // Event Details in Left Section
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DATE:", 15, 80);
  doc.setFont("helvetica", "normal");
  doc.text("12th April, 2026", 15, 85);
  doc.text("(Sunday)", 15, 90);

  doc.setFont("helvetica", "bold");
  doc.text("TIME:", 15, 105);
  doc.setFont("helvetica", "normal");
  doc.text("10:00 AM Onwards", 15, 110);

  doc.setFont("helvetica", "bold");
  doc.text("VENUE:", 15, 125);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const venueLines = doc.splitTextToSize("A.P.J. Abdul Kalam Auditorium, University of Kalyani, Kalyani - 741235", 60);
  doc.text(venueLines, 15, 130);

  // Right Section (User Info)
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("OFFICIAL ENTRY PASS", 100, 30);
  
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(1);
  doc.line(100, 35, 280, 35);

  // User Details Grid
  doc.setFontSize(11);
  let y = 55;
  const drawField = (label: string, value: string, x: number) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(value, x, y + 6);
  };

  drawField("Full Name", registration.fullName, 100);
  drawField("Category", registration.category, 160);
  drawField("Organization", registration.organization, 220);
  
  y += 25;
  drawField("Token ID", registration.tokenId, 100);
  drawField("Phone", registration.phone, 160);
  drawField("Email", registration.email, 220);

  y += 25;
  drawField("Entry ID", registration.entryPassId, 100);
  drawField("Lunch ID", registration.lunchTokenId, 160);
  drawField("Dinner ID", registration.dinnerTokenId, 220);

  y += 25;
  drawField("Food Preference", registration.foodPreference, 100);
  drawField("Attending", registration.attending, 160);

  // QR Code
  const qrData = registration.tokenId;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    margin: 1,
    width: 200,
    color: { dark: '#064e3b', light: '#f5faf5' },
  });

  doc.addImage(qrCodeDataUrl, "PNG", 220, 140, 50, 50);
  
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Scan for Entry & Food Verification", 245, 195, { align: "center" });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("This is a digitally generated pass. Please carry a printed copy or show on your mobile.", width / 2 + 40, 205, { align: "center" });

  const base64 = doc.output("datauristring").split(",")[1];
  return base64;
};

export const generateCompactTicketPDF = async (registration: Registration): Promise<string> => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [120, 80], // Landscape compact
  });

  const width = 120;
  const height = 80;
  const logoBase64 = await getLogoBase64();

  // Background
  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, 35, height, "F");
  
  doc.setFillColor(255, 255, 255);
  doc.rect(35, 0, width - 35, height, "F");

  // Left Sidebar (Event Info)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 7.5, 5, 20, 20);
    } catch (e) {
      console.error("Error adding logo to compact PDF:", e);
    }
  } else {
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SESWA", 17.5, 15, { align: "center" });
  }

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("WB 22nd", 17.5, 30, { align: "center" });
  
  doc.setFontSize(6);
  doc.text("12 APR 2026", 17.5, 45, { align: "center" });
  doc.text("KALYANI", 17.5, 50, { align: "center" });

  // Main Content
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text("ENTRY TICKET", 40, 15);
  
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.5);
  doc.line(40, 18, 110, 18);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("NAME:", 40, 28);
  doc.setFont("helvetica", "normal");
  doc.text(registration.fullName, 55, 28);

  doc.setFont("helvetica", "bold");
  doc.text("TOKEN:", 40, 35);
  doc.setFont("helvetica", "normal");
  doc.text(registration.tokenId, 55, 35);

  doc.setFont("helvetica", "bold");
  doc.text("CAT:", 40, 42);
  doc.setFont("helvetica", "normal");
  doc.text(registration.category, 55, 42);

  doc.setFont("helvetica", "bold");
  doc.text("FOOD:", 40, 49);
  doc.setFont("helvetica", "normal");
  doc.text(registration.foodPreference, 55, 49);

  // IDs
  doc.setFontSize(6);
  doc.setTextColor(100);
  doc.text(`E: ${registration.entryPassId} | L: ${registration.lunchTokenId} | D: ${registration.dinnerTokenId}`, 40, 75);

  // QR Code
  const qrData = registration.tokenId;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    margin: 1,
    width: 150,
  });

  doc.addImage(qrCodeDataUrl, "PNG", 85, 25, 30, 30);
  doc.setFontSize(5);
  doc.text("SCAN FOR ACCESS", 100, 58, { align: "center" });

  const base64 = doc.output("datauristring").split(",")[1];
  return base64;
};

export const downloadPDF = (base64: string, filename: string) => {
  const link = document.createElement("a");
  link.href = `data:application/pdf;base64,${base64}`;
  link.download = filename;
  link.click();
};
