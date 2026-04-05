import { jsPDF } from "jspdf";
import "jspdf-autotable";

// ============================================================
//  COMPANY CONFIGURATION (Centralized)
// ============================================================
export interface CompanyConfig {
    brand:   string;
    name:    string;
    slogan:  string;
    address: string;
    phone:   string;
}

export const DEFAULT_COMPANY: CompanyConfig = {
    brand:   "FACT-PREST",
    name:    "FACT-PREST SRL",
    slogan:  "SOLUCIONES FINANCIERAS",
    address: "AV. PRINCIPAL #1, 1ER NIVEL",
    phone:   "TEL: 809-000-0000",
};

// Receipt width (80 mm ticket) — split at centre
const W = 80;
const MID = W / 2;
const MARGIN_L = 5;
const MARGIN_R = W - 5;

// ── Helper to format currency ────────────────────────────────
const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Helper: draw a thin dashed separator line ─────────────────
const dashedLine = (doc: jsPDF, y: number) => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1, 1], 0); // 1mm dash, 1mm gap
    doc.line(MARGIN_L, y, MARGIN_R, y);
    doc.setLineDashPattern([], 0); // Reset to solid
};

// ── Helper: solid thin line ───────────────────────────────────
const solidLine = (doc: jsPDF, y: number, w = 0.3) => {
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(w);
    doc.line(MARGIN_L, y, MARGIN_R, y);
};

// ── Helper: key-value row ─────────────────────────────────────
const kv = (
    doc: jsPDF,
    label: string,
    value: string,
    y: number,
    opts?: { bold?: boolean; bigValue?: boolean }
) => {
    const bold = opts?.bold ?? false;
    const bigValue = opts?.bigValue ?? false;

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(label, MARGIN_L, y);

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bigValue ? 10 : 7);
    doc.setTextColor(0, 0, 0);
    doc.text(value, MARGIN_R, y, { align: "right" });
};

// ── Generate zero-padded sequential-looking code from timestamp ──
const seqNo = (prefix: string, id: string) => {
    let num = 0;
    for (let i = 0; i < id.length; i++) {
        num = (num * 31 + id.charCodeAt(i)) >>> 0;
    }
    const padded = String(num % 10000000).padStart(7, "0");
    return `${prefix}${padded}`;
};

// ============================================================
//  LOAN CONTRACT PDF (Legal Narrative - A4)
// ============================================================
export const generateLoanReceipt = (loan: any, config: CompanyConfig = DEFAULT_COMPANY) => {
    const doc = new jsPDF();
    const dateStamp = new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    // Page Settings (A4 = 210mm x 297mm)
    const L = 25; // Margen izquierdo
    const R = 185; // Margen derecho 
    const CW = R - L; // Ancho efectivo del contenido
    let y = 25;

    // ── Font Setup ───────────────────────────────────────────
    doc.setFont("times", "normal");

    // ── Header (Centered) ────────────────────────────────────
    doc.setFontSize(18);
    doc.setFont("times", "bold");
    doc.text(config.name.toUpperCase(), 105, y, { align: "center" });
    
    y += 8;
    doc.setFontSize(10);
    doc.setFont("times", "italic");
    doc.text(config.slogan.toUpperCase(), 105, y, { align: "center" });

    y += 5;
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text(`${config.address} | ${config.phone}`, 105, y, { align: "center" });

    y += 8;
    doc.setLineWidth(0.5);
    doc.line(L, y, R, y);

    // ── Title ────────────────────────────────────────────────
    y += 18;
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("CONTRATO DE PRÉSTAMO Y RECONOCIMIENTO DE DEUDA", 105, y, { align: "center" });

    y += 15;
    doc.setFontSize(11); 
    doc.setFont("times", "normal");

    // ── Narrative Text ───────────────────────────────────────
    const introText = [
        `ENTRE: De una parte, el Señor/a ${config.name.toUpperCase()}, dominicano/a, mayor de edad, con domicilio en ${config.address}, quien en lo que sigue de este contrato se le denominará LA ACREEDORA.`,
        `Y DE LA OTRA PARTE, el Señor/a ${loan.client.fullName.toUpperCase()}, dominicano/a, mayor de edad, portador/a de la cédula de identidad No. ${loan.client.idNumber}, con domicilio en ${loan.client.address || "Principal"}, quien en adelante se denominará EL DEUDOR.`,
        "SE HA CONVENIDO Y PACTADO LO SIGUIENTE:"
    ];

    doc.setLineHeightFactor(1.4); 

    introText.forEach((p) => {
        doc.text(p, L, y, { 
            align: "justify", 
            maxWidth: CW 
        });
        
        const lines = doc.splitTextToSize(p, CW);
        y += (lines.length * 6.5) + 4;
    });

    // ── Clauses ──────────────────────────────────────────────
    const clauses = [
        {
            title: "PRIMERA: OBJETO DEL CONTRATO.",
            text: `LA ACREEDORA entrega en este acto a favor de EL DEUDOR, quien lo recibe a su entera satisfacción, la suma de RD$${fmt(loan.amount)} (Pesos Dominicanos), en calidad de préstamo de capital.`
        },
        {
            title: "SEGUNDA: INTERESES Y CUOTAS.",
            text: `Las partes convienen que el capital prestado devengará una tasa de interés del ${loan.interestRate}% por periodo de pago. EL DEUDOR pagará cuotas fijas de RD$${fmt(loan.totalToPay / (loan.term || 1))}, incluyendo capital e intereses, sumando un total de RD$${fmt(loan.totalToPay)}.`
        },
        {
            title: "TERCERA: PLAZO.",
            text: `El presente contrato tendrá una duración de ${loan.term} ${loan.termUnit === "months" ? "Meses" : loan.termUnit === "weeks" ? "Semanas" : "Días"}, a partir de la firma del presente instrumento.`
        },
        {
            title: "CUARTA: MORA.",
            text: "En caso de retraso en el pago de las cuotas acordadas, EL DEUDOR pagará un recargo por mora del 5% por cada periodo vencido."
        },
        {
            title: "QUINTA: GARANTÍA.",
            text: "EL DEUDOR garantiza el cumplimiento de sus obligaciones con la totalidad de sus bienes presentes y futuros, renunciando a cualquier fuero legal."
        }
    ];

    clauses.forEach(c => {
        if (y > 255) { doc.addPage(); y = 25; }
        doc.setFont("times", "bold");
        doc.text(c.title, L, y);
        y += 7;
        doc.setFont("times", "normal");
        
        doc.text(c.text, L, y, { 
            align: "justify", 
            maxWidth: CW 
        });
        
        const lines = doc.splitTextToSize(c.text, CW);
        y += (lines.length * 6.5) + 8;
    });

    // ── Footer Date ──────────────────────────────────────────
    if (y > 240) { doc.addPage(); y = 25; }
    y += 5;
    doc.text(`Hecho y firmado en la ciudad de la República Dominicana, a los ${dateStamp}.`, L, y);

    // ── Signatures ───────────────────────────────────────────
    y += 35;
    doc.setLineWidth(0.3);
    
    // Acreedora
    doc.line(L, y, L + 65, y);
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(config.name.toUpperCase(), L + 32.5, y + 5, { align: "center" });
    doc.setFont("times", "normal");
    doc.text("LA ACREEDORA", L + 32.5, y + 10, { align: "center" });

    // Deudor
    doc.line(R - 65, y, R, y);
    doc.setFont("times", "bold");
    doc.text(loan.client.fullName.toUpperCase(), R - 32.5, y + 5, { align: "center" });
    doc.setFont("times", "normal");
    doc.text("EL DEUDOR", R - 32.5, y + 10, { align: "center" });

    // Folio
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`${seqNo("PR", loan.id)} | Facturado por Fact-Prest`, 105, 285, { align: "center" });

    doc.save(`Contrato_${loan.client.fullName.replace(/\s+/g, '_')}.pdf`);
};

// ============================================================
//  PAYMENT RECEIPT — Bauche / Ticket Térmico Style (80mm)
// ============================================================
export const generatePaymentReceipt = (payment: any, loan: any, processedBy?: string, config: CompanyConfig = DEFAULT_COMPANY) => {
    // Estimate dynamic height: base ~200 mm
    const doc = new jsPDF({ unit: "mm", format: [W, 220] });

    // ── Date Formatting ─────────────────────────────────────
    const now = new Date();
    const hours12 = now.getHours() % 12 || 12;
    const ampm = now.getHours() >= 12 ? "PM" : "AM";
    const receiptDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${String(hours12).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} ${ampm}`;

    const loanOpenDate = new Date(loan.startDate).toLocaleDateString("es-ES");

    // Calculate due date (startDate + term)
    const dueDate = (() => {
        const d = new Date(loan.startDate);
        if (loan.termUnit === "months") d.setMonth(d.getMonth() + loan.term);
        else if (loan.termUnit === "weeks") d.setDate(d.getDate() + loan.term * 7);
        else d.setDate(d.getDate() + loan.term);
        return d.toLocaleDateString("es-ES");
    })();

    // ── Balance Logic ────────────────────────────────────────
    const sortedPayments = [...loan.payments].sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const paymentIndex = sortedPayments.findIndex((p: any) => p.id === payment.id);

    let amountPaidBefore = 0;
    if (paymentIndex !== -1) {
        amountPaidBefore = sortedPayments
            .slice(0, paymentIndex)
            .reduce((acc: number, p: any) => acc + p.amount, 0);
    }

    const prevCapitalBalance = loan.totalToPay - amountPaidBefore;
    const balanceAfter = Math.max(0, prevCapitalBalance - payment.amount);

    // ── Breakdown: distribute payment proportionally using real DB values ──
    const principalDB = loan.amount;                        
    const interestDB  = loan.totalToPay - loan.amount;      
    const totalDB     = loan.totalToPay;                    

    const capitalPart  = parseFloat((payment.amount * (principalDB / totalDB)).toFixed(2));
    const interestPart = parseFloat((payment.amount - capitalPart).toFixed(2));  

    // ── Sequential-style receipt & loan numbers ───────────────
    const receiptNo = seqNo("IN", payment.id);
    const loanNo    = seqNo("PR", loan.id);

    // Method label
    const methodLabel: Record<string, string> = {
        cash: "Efectivo",
        transfer: "Transferencia",
        card: "Tarjeta",
        alaver: "Alaver",
    };
    const methodDisplay = methodLabel[payment.method] || payment.method.toUpperCase();

    let y = 12;

    // ═══════════════════════════════════════════════════════
    //  LOGO / HEADER
    // ═══════════════════════════════════════════════════════
    doc.setFont("helvetica", "bold");
    
    const brandText = config.brand.toUpperCase();
    const brandFontSize = brandText.length > 15 ? 14 : 22;
    
    doc.setFontSize(brandFontSize);
    doc.setTextColor(40, 20, 100); 
    doc.text(brandText, MID, y, { align: "center" });

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(config.name.toUpperCase(), MID, y, { align: "center" });

    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(config.slogan.toUpperCase(), MID, y, { align: "center" });

    y += 4;
    doc.text(config.address.toUpperCase(), MID, y, { align: "center" });

    y += 4;
    doc.text(`TELEFONO: ${config.phone.toUpperCase()}`, MID, y, { align: "center" });

    y += 3;
    solidLine(doc, y, 0.1);

    // ═══════════════════════════════════════════════════════
    //  META INFO
    // ═══════════════════════════════════════════════════════
    y += 5;
    doc.setFontSize(8);
    kv(doc, "Recibo No.:", receiptNo, y);
    y += 4;
    kv(doc, "Fecha:", receiptDate, y);
    y += 4;
    kv(doc, "Préstamo:", loanNo, y);
    y += 4;
    kv(doc, "Fecha Apertura:", loanOpenDate, y);
    y += 4;
    kv(doc, "Fecha Vencimiento:", dueDate, y);
    y += 4;
    kv(doc, "Atendió:", (processedBy || "ADMIN").toUpperCase(), y);

    y += 3;
    solidLine(doc, y, 0.1);

    // ═══════════════════════════════════════════════════════
    //  CLIENT INFO
    // ═══════════════════════════════════════════════════════
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(loan.client.idNumber || "0000000000", MARGIN_L, y);

    y += 4.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(loan.client.fullName.toUpperCase(), MARGIN_L, y);

    if (loan.client.address) {
        const addrWords = loan.client.address.toUpperCase();
        const addrLines = doc.splitTextToSize(addrWords, MARGIN_R - MARGIN_L);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(addrLines, MARGIN_L, y);
        y += (addrLines.length - 1) * 3.5;
    }

    y += 6;
    dashedLine(doc, y);

    // ═══════════════════════════════════════════════════════
    //  PAGO DE CUOTA
    // ═══════════════════════════════════════════════════════
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("P   A   G   O      D   E      C   U   O   T   A", MID, y, { align: "center" });

    y += 3;
    dashedLine(doc, y);

    // ═══════════════════════════════════════════════════════
    //  BREAKDOWN
    // ═══════════════════════════════════════════════════════
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    kv(doc, "Capital:", fmt(capitalPart), y);
    y += 5;
    kv(doc, "Interés:", fmt(interestPart), y);
    y += 5;
    kv(doc, "Mora:", "0.00", y);
    y += 5;
    kv(doc, "Otros:", "0.00", y);

    y += 3;
    solidLine(doc, y, 0.2);

    // ── TOTAL PAGADO WITH DOUBLE UNDERLINE
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("TOTAL PAGADO RD $:", MARGIN_L, y);

    doc.setFontSize(13);
    const totalStr = fmt(payment.amount);
    doc.text(totalStr, MARGIN_R, y, { align: "right" });

    const textWidth = doc.getTextWidth(totalStr);
    y += 1.5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(MARGIN_R - textWidth, y, MARGIN_R, y);
    y += 0.8;
    doc.line(MARGIN_R - textWidth, y, MARGIN_R, y);

    // ── Forma de Pago
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Forma de Pago:", MARGIN_L, y);
    const fpWidth = doc.getTextWidth("Forma de Pago:");
    doc.line(MARGIN_L, y + 0.8, MARGIN_L + fpWidth + 20, y + 0.8);

    y += 6;
    kv(doc, `${methodDisplay}:`, fmt(payment.amount), y);

    y += 5;
    solidLine(doc, y, 0.1);

    // ═══════════════════════════════════════════════════════
    //  BALANCES
    // ═══════════════════════════════════════════════════════
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Balance de capital anterior:", MARGIN_L, y);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(prevCapitalBalance), MARGIN_R, y, { align: "right" });

    y += 5;
    doc.setFont("helvetica", "normal");
    kv(doc, "Monto Vencido:", "0.00", y);

    y += 5;
    kv(doc, "Cargos Pendientes:", "0.00", y);

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Balance de capital a la fecha:", MARGIN_L, y);
    doc.text(fmt(balanceAfter), MARGIN_R, y, { align: "right" });

    y += 4;
    solidLine(doc, y, 0.2);

    // ═══════════════════════════════════════════════════════
    //  FOOTER
    // ═══════════════════════════════════════════════════════
    y += 8;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("¡Gracias por su puntualidad!", MID, y, { align: "center" });

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Generado por Fact-Prest", MID, y, { align: "center" });

    y += 4;
    doc.text("Este ticket respalda su movimiento administrativo.", MID, y, { align: "center" });

    doc.save(`FactPrest_Recibo_${receiptNo}.pdf`);
};
