import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { calcDueDate } from "@/lib/loan-calculator";

// ============================================================
//  PDF PREVIEW & SHARE HANDLER
// ============================================================
const handlePdfOutput = async (doc: any, filename: string) => {
    try {
        const pdfBlob = doc.output('blob');
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile && navigator.share && navigator.canShare) {
            const file = new File([pdfBlob], filename, { type: "application/pdf" });
            if (navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: filename,
                        files: [file]
                    });
                    return; // Si compartió con éxito o canceló el menú nativo, terminamos aquí.
                } catch (err: any) {
                    if (err.name !== 'AbortError') console.error("Error sharing:", err);
                    return; 
                }
            }
        }
        
        // Desktop o dispositivos que no soportan Share API: Abrir Preview en nueva pestaña
        const url = URL.createObjectURL(pdfBlob);
        const newWindow = window.open(url, "_blank");
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
            // Popup bloqueado, forzamos descarga
            doc.save(filename);
        }
    } catch (e) {
        console.error("Error generando PDF:", e);
        doc.save(filename); // Fallback absoluto
    }
};

// ============================================================
//  COMPANY CONFIGURATION
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
    phone:   "809-000-0000",
};

// ─── Ticket dimensions (80 mm) ────────────────────────────────
const W       = 80;
const MID     = W / 2;
const ML      = 5;   // margin left
const MR      = W - 5; // margin right

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (n: number) =>
    n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: Date | string, locale = "es-DO") =>
    new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });

const fmtDateLong = (d: Date | string) =>
    new Date(d).toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" });

/** Hash-based sequential code (7 digits) */
const seqNo = (prefix: string, id: string) => {
    let num = 0;
    for (let i = 0; i < id.length; i++) num = (num * 31 + id.charCodeAt(i)) >>> 0;
    return `${prefix}${String(num % 10_000_000).padStart(7, "0")}`;
};

/** Translate termUnit to Spanish */
const termUnitLabel = (u: string, n: number) => {
    if (u === "months") return n === 1 ? "Mes" : "Meses";
    if (u === "weeks")  return n === 1 ? "Semana" : "Semanas";
    return n === 1 ? "Día" : "Días";
};

const rateFreqLabel = (f: string) => {
    if (f === "annual")  return "Anual";
    if (f === "daily")   return "Diaria";
    return "Mensual";
};

const interestTypeLabel = (t: string) =>
    t === "compound" ? "Amortización Francesa (Cuota Fija)" : "Interés Simple";

// ─── Ticket helpers ───────────────────────────────────────────
const dashedLine = (doc: jsPDF, y: number) => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(ML, y, MR, y);
    doc.setLineDashPattern([], 0);
};

const solidLine = (doc: jsPDF, y: number, lw = 0.3, x1 = ML, x2 = MR) => {
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(lw);
    doc.line(x1, y, x2, y);
};

const kv = (
    doc: jsPDF,
    label: string,
    value: string,
    y: number,
    opts?: { labelBold?: boolean; valueBold?: boolean; valueSize?: number; valueColor?: [number,number,number] }
) => {
    doc.setFont("helvetica", opts?.labelBold ? "bold" : "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(label, ML, y);

    if (opts?.valueColor) doc.setTextColor(...opts.valueColor);
    doc.setFont("helvetica", opts?.valueBold ? "bold" : "normal");
    doc.setFontSize(opts?.valueSize ?? 7.5);
    doc.text(value, MR, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
};

// ─── A4 helpers ───────────────────────────────────────────────
const A4_L = 22;   // left margin
const A4_R = 188;  // right margin
const A4_CW = A4_R - A4_L;

const a4ColorLine = (doc: jsPDF, y: number, r: number, g: number, b: number, lw = 0.8) => {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(lw);
    doc.line(A4_L, y, A4_R, y);
    doc.setDrawColor(40, 40, 40);
};

// ============================================================
//  1. LOAN CONTRACT (A4 — Legal Document)
// ============================================================
export const generateLoanReceipt = (loan: any, config: CompanyConfig = DEFAULT_COMPANY) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const today = new Date();
    const loanNo  = seqNo("PR", loan.id);
    const dueDate: Date = loan.dueDate
        ? new Date(loan.dueDate)
        : calcDueDate(new Date(loan.startDate), loan.term, loan.termUnit);

    let y = 20;

    // ── Accent bar (top) ─────────────────────────────────────
    doc.setFillColor(30, 41, 82);
    doc.rect(0, 0, 210, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(config.brand.toUpperCase(), 105, 7.5, { align: "center" });
    doc.setTextColor(0, 0, 0);

    y = 22;

    // ── Company Header ───────────────────────────────────────
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 82);
    doc.text(config.name.toUpperCase(), 105, y, { align: "center" });

    y += 7;
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 100);
    doc.text(config.slogan, 105, y, { align: "center" });

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`${config.address}  ·  Tel. ${config.phone}`, 105, y, { align: "center" });

    y += 6;
    a4ColorLine(doc, y, 30, 41, 82, 1.2);
    y += 2;
    a4ColorLine(doc, y, 200, 170, 80, 0.4);

    // ── Document Title ───────────────────────────────────────
    y += 12;
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.setTextColor(20, 20, 20);
    doc.text("CONTRATO DE PRÉSTAMO Y RECONOCIMIENTO DE DEUDA", 105, y, { align: "center" });

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`No. ${loanNo}  ·  Emitido: ${fmtDateLong(today)}`, 105, y, { align: "center" });

    // ── Summary Box ──────────────────────────────────────────
    y += 10;
    const boxX = A4_L;
    const boxH = 42;
    doc.setFillColor(245, 247, 255);
    doc.setDrawColor(190, 200, 230);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, y, A4_CW, boxH, 3, 3, "FD");

    // Box title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 82);
    doc.text("RESUMEN DEL CRÉDITO", boxX + 5, y + 6);

    // Two columns inside the box
    const col1X = boxX + 5;
    const col2X = boxX + A4_CW / 2 + 3;
    const rowH = 6.5;
    let by = y + 13;

    const boxRow = (lbl: string, val: string, cx: number, cyRef: number, highlight = false) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(lbl, cx, cyRef);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(highlight ? 9.5 : 8.5);
        doc.setTextColor(highlight ? 30 : 20, highlight ? 41 : 20, highlight ? 82 : 20);
        doc.text(val, cx + 55, cyRef, { align: "right" });
    };

    // Left column
    boxRow("Capital Prestado:",   `RD$ ${fmt(loan.amount)}`,            col1X, by, true);
    by += rowH;
    boxRow("Tasa de Interés:",    `${loan.interestRate}% ${rateFreqLabel(loan.rateFrequency || "monthly")}`, col1X, by);
    by += rowH;
    boxRow("Interés Total:",      `RD$ ${fmt(loan.totalToPay - loan.amount)}`, col1X, by);
    by += rowH;
    boxRow("Total a Pagar:",      `RD$ ${fmt(loan.totalToPay)}`,         col1X, by, true);

    // Right column
    by = y + 13;
    const installmentAmt = loan.installmentAmount ?? (loan.totalToPay / loan.term);
    boxRow("Cuota Fija:",         `RD$ ${fmt(installmentAmt)}`,          col2X, by, true);
    by += rowH;
    boxRow("Plazo:",              `${loan.term} ${termUnitLabel(loan.termUnit, loan.term)}`, col2X, by);
    by += rowH;
    boxRow("Fecha Desembolso:",   fmtDate(loan.startDate),               col2X, by);
    by += rowH;
    boxRow("Fecha Vencimiento:",  fmtDate(dueDate),                      col2X, by);

    y += boxH + 4;

    // Type badge
    doc.setFillColor(30, 41, 82);
    doc.roundedRect(A4_L, y, 60, 6.5, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(interestTypeLabel(loan.interestType).toUpperCase(), A4_L + 30, y + 4.2, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // ── Narrative intro ──────────────────────────────────────
    y += 14;
    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 30);
    doc.setLineHeightFactor(1.5);

    const fnDateLongTexts = (d: Date) => {
        const unidades = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiún', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta', 'treinta y un'];
        const num2text = (num: number) => {
            if (num <= 31) return unidades[num];
            const yrs: Record<number, string> = { 2024: "dos mil veinticuatro", 2025: "dos mil veinticinco", 2026: "dos mil veintiséis", 2027: "dos mil veintisiete", 2028: "dos mil veintiocho", 2029: "dos mil veintinueve", 2030: "dos mil treinta" };
            return yrs[num] || num.toString();
        };
        return `a los ${num2text(d.getDate())} (${d.getDate()}) días del mes de ${d.toLocaleDateString("es-DO", {month: "long"})} del año ${num2text(d.getFullYear())} (${d.getFullYear()})`;
    };

    const parts = [
        `En la ciudad de La Vega, República Dominicana, ${fnDateLongTexts(today)}, comparecen ante este instrumento:`,
        `De una parte, el/la señor/a ${config.name.toUpperCase()}, mayor de edad, con domicilio en ${config.address}, quien en lo sucesivo se denominará EL/LA ACREEDOR/A.`,
        `De otra parte, el/la Señor/a ${loan.client.fullName.toUpperCase()}, dominicano/a, mayor de edad, portador/a de la cédula de identidad No. ${loan.client.idNumber}, con domicilio en ${loan.client.address || "dirección indicada"}, quien en adelante se denominará EL/LA DEUDOR/A.`,
        `Ambas partes, libre y voluntariamente, convienen en celebrar el presente CONTRATO DE PRÉSTAMO, el cual se regirá por las estipulaciones siguientes:`,
    ];

    for (const para of parts) {
        if (y > 260) { doc.addPage(); y = 25; }
        const lines = doc.splitTextToSize(para, A4_CW);
        // Pasamos el string original (para) y proporcionamos maxWidth. 
        // jsPDF se encarga de separar y justificar sin forzar la justificación en la última línea.
        doc.text(para, A4_L, y, { align: "justify", maxWidth: A4_CW });
        y += lines.length * 5.8 + 4;
    }

    // ── Clauses ──────────────────────────────────────────────
    const clauses = [
        {
            title: "PRIMERA: OBJETO DEL CONTRATO.",
            text: `EL/LA ACREEDOR/A entrega en este acto, en calidad de préstamo y en moneda de curso legal, a favor de EL/LA DEUDOR/A, la suma de RD$ ${fmt(loan.amount)} (Pesos Dominicanos). EL/LA DEUDOR/A declara expresamente haber recibido dicho monto a su entera satisfacción mediante los medios acordados, otorgando por la presente la más formal, eficaz y completa carta de pago y descargo por dicha suma.`,
        },
        {
            title: "SEGUNDA: INTERESES Y SISTEMA DE AMORTIZACIÓN.",
            text: `El capital prestado devengará una tasa de interés del ${loan.interestRate}% ${rateFreqLabel(loan.rateFrequency || "monthly").toLowerCase()} bajo la modalidad comercial de ${interestTypeLabel(loan.interestType)}. En virtud de ello, las partes acuerdan una cuota fija periódica de RD$ ${fmt(installmentAmt)}. El monto global a devolver al culminar el préstamo asciende a la suma de RD$ ${fmt(loan.totalToPay)}, lo cual incluye el capital principal y los márgenes de interés pactados.`,
        },
        {
            title: "TERCERA: PLAZO Y VENCIMIENTO.",
            text: `El presente contrato tendrá una duración de ${loan.term} ${termUnitLabel(loan.termUnit, loan.term).toLowerCase()}, comenzando a correr el referido plazo a partir del ${fmtDateLong(loan.startDate)}, y concluyendo irrevocablemente en fecha ${fmtDateLong(dueDate)}. EL/LA DEUDOR/A se obliga tajantemente a realizar los pagos o abonos correspondientes de manera puntual e ininterrumpida dentro de las fechas calendarizadas.`,
        },
        {
            title: "CUARTA: LUGAR Y FORMAS DE PAGO.",
            text: `Todos los pagos deberán realizarse en las oficinas o cuentas bancarias designadas por EL/LA ACREEDOR/A, sin necesidad de cobro, requerimiento ni intimación previa. El comprobante o recibo de pago, debidamente expedido por EL/LA ACREEDOR/A, servirá como única prueba fehaciente de abono a las cuotas convenidas.`,
        },
        {
            title: "QUINTA: MORA, PENALIDADES Y GASTOS LEGALES.",
            text: `En caso de retraso en el cumplimiento de cualquiera de las obligaciones de pago establecidas, EL/LA DEUDOR/A será puesto en estado de mora de pleno derecho por el simple vencimiento del término fijado, sin necesidad de acto de alguacil y/o cualquier otra formalidad jurídica. El saldo retrasado devengará un cargo moratorio fijo del cinco por ciento (5%) por cada período vencido. Asimismo, si la deuda pasare a una fase de cobro compulsivo, EL/LA DEUDOR/A asumirá sin reservas todos los honorarios legales ascendentes al 30% del monto adeudado, así como el pago íntegro de costas judiciales.`,
        },
        {
            title: "SEXTA: GARANTÍA UNIVERSAL Y PRIVILEGIOS.",
            text: `Para afianzar el complimiento incondicional del presente contrato, EL/LA DEUDOR/A compromete en garantía incondicional la totalidad de sus bienes muebles e inmuebles, derechos, acciones, dineros depositados, certificados financieros y salarios, que posea en el presente o pudiere adquirir en el futuro. EL/LA DEUDOR/A renuncia formalmente de los beneficios que le otorga la inembargabilidad temporal de bienes según dicta el régimen civil, priorizando el crédito que por medio de este acto confiere EL/LA ACREEDOR/A.`,
        },
        {
            title: "SÉPTIMA: PÉRDIDA DEL BENEFICIO DEL TÉRMINO Y EXIGIBILIDAD ANTICIPADA.",
            text: `EL/LA ACREEDOR/A podrá dar por vencido el presente acuerdo anticipadamente y exigir a titulo de urgencia el pago total del saldo deudor en las siguientes eventualidades: a) Por la falta de pago de dos (2) cuotas sucesivas; b) En caso de distracción, traslado, u ocultación de los bienes de EL/LA DEUDOR/A; c) Ante el inicio de cualquier proceso concursal de quiebra, embargos o demandas incoadas por terceros contra EL/LA DEUDOR/A.`,
        },
        {
            title: "OCTAVA: ELECCIÓN DE DOMICILIO Y JURISDICCIÓN COMPETENTE.",
            text: `Para cualquier asunto no expresamente contemplado en el presente acto ni su posible ejecución, se requerirá de manera absoluta al derecho común de la República Dominicana. A su vez, hacen elección de domicilio legal en los referidos en sus generales; atribuyendo estricta competencia territorial a los juzgados de Primera Instancia, sala civil y de índole comercial correspondientes a la provincia de La Vega, sin importar cambio de residencia futuro.`,
        },
        {
            title: "NOVENA: ACEPTACIÓN Y RECONOCIMIENTO.",
            text: `Leído que les ha sido a las partes, el presente contrato de financiamiento civil ha sido concebido en su integridad, aprobado libre de toda coacción y engaño. Ambas partes afirman estar en pleno entendimiento y de perfecto acuerdo, comprometiéndose sin limitación a todos los deberes aquí estipulados y otorgando mediante su firma validez insustituible a lo pactado.`,
        },
    ];

    for (const clause of clauses) {
        if (y > 255) { doc.addPage(); y = 25; }
        doc.setFont("times", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(30, 41, 82);
        doc.text(clause.title, A4_L, y);
        y += 6;

        doc.setFont("times", "normal");
        doc.setTextColor(30, 30, 30);
        const lines = doc.splitTextToSize(clause.text, A4_CW);
        doc.text(clause.text, A4_L, y, { align: "justify", maxWidth: A4_CW });
        y += lines.length * 5.8 + 8;
    }

    // ── Signature Block ──────────────────────────────────────
    if (y > 240) { doc.addPage(); y = 25; }
    y += 8;

    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 30);
    doc.text(
        `En fe de lo cual, se firma en la ciudad indicada, ${fnDateLongTexts(today)}.`,
        A4_L, y
    );

    y += 30;
    const sigLW = 70;

    // Left signature
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.4);
    doc.line(A4_L, y, A4_L + sigLW, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 82);
    doc.text(config.name.toUpperCase(), A4_L + sigLW / 2, y + 5.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("EL/LA ACREEDOR/A", A4_L + sigLW / 2, y + 10, { align: "center" });

    // Right signature
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.4);
    doc.line(A4_R - sigLW, y, A4_R, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 82);
    doc.text(loan.client.fullName.toUpperCase(), A4_R - sigLW / 2, y + 5.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`EL/LA DEUDOR/A — Cédula: ${loan.client.idNumber}`, A4_R - sigLW / 2, y + 10, { align: "center" });

    // ── Footer ───────────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(245, 247, 255);
        doc.rect(0, 285, 210, 12, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 150);
        doc.text(`${config.name} · ${config.address} · Tel. ${config.phone}`, 105, 290, { align: "center" });
        doc.text(`Contrato No. ${loanNo} · Página ${i} de ${pageCount}`, 105, 294, { align: "center" });
    }

    handlePdfOutput(doc, `Contrato_${loan.client.fullName.replace(/\s+/g, "_")}_${loanNo}.pdf`);
};


// ============================================================
//  2. PAYMENT RECEIPT — Ticket Térmico 80 mm
// ============================================================
export const generatePaymentReceipt = (
    payment: any,
    loan: any,
    processedBy = "ADMIN",
    config: CompanyConfig = DEFAULT_COMPANY
) => {
    // ── Derive installment info from schedule ─────────────────
    const schedule: any[] = Array.isArray(loan.paymentSchedule) ? loan.paymentSchedule : [];

    // Calculate total paid BEFORE this payment (using sorted list)
    const sortedPayments: any[] = [...(loan.payments ?? [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const paymentIdx = sortedPayments.findIndex((p: any) => p.id === payment.id);
    let paidBefore = 0;
    if (paymentIdx > 0) {
        paidBefore = sortedPayments
            .slice(0, paymentIdx)
            .reduce((s: number, p: any) => s + p.amount, 0);
    }

    // Find which installment row this payment corresponds to
    let installmentNumber = 1;
    let nextInstallment: any = null;
    let capitalPart = 0;
    let interestPart = 0;

    if (schedule.length > 0) {
        let accumulated = 0;
        for (let i = 0; i < schedule.length; i++) {
            const row = schedule[i];
            if (accumulated + row.totalPayment > paidBefore + 0.01) {
                installmentNumber = row.installmentNumber;
                capitalPart  = row.principalPayment;
                interestPart = row.interestPayment;
                if (i + 1 < schedule.length) nextInstallment = schedule[i + 1];
                break;
            }
            accumulated += row.totalPayment;
        }
    } else {
        // Fallback: proportional breakdown
        const principalRatio = loan.amount / loan.totalToPay;
        capitalPart  = parseFloat((payment.amount * principalRatio).toFixed(2));
        interestPart = parseFloat((payment.amount - capitalPart).toFixed(2));
        installmentNumber = sortedPayments.length;
    }

    const totalInstallments = schedule.length || loan.term;

    // ── Balances ──────────────────────────────────────────────
    const prevBalance  = loan.totalToPay - paidBefore;
    const afterBalance = Math.max(0, prevBalance - payment.amount);

    // ── Times ─────────────────────────────────────────────────
    const now = new Date(payment.date || Date.now());
    const pad = (n: number) => String(n).padStart(2, "0");
    const hours12 = now.getHours() % 12 || 12;
    const ampm    = now.getHours() >= 12 ? "PM" : "AM";
    const receiptDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}  ${pad(hours12)}:${pad(now.getMinutes())} ${ampm}`;

    const dueDateObj: Date = loan.dueDate
        ? new Date(loan.dueDate)
        : calcDueDate(new Date(loan.startDate), loan.term, loan.termUnit);
    const dueDate = fmtDate(dueDateObj);

    const receiptNo = seqNo("IN", payment.id);
    const loanNo    = seqNo("PR", loan.id);

    const methodMap: Record<string, string> = {
        cash: "Efectivo",
        transfer: "Transferencia",
        card: "Tarjeta",
    };
    const methodLabel = methodMap[payment.method] ?? payment.method.toUpperCase();

    // ── Estimate height ───────────────────────────────────────
    let estimatedH = 195;
    if (loan.client.phone) estimatedH += 3.5;
    if (afterBalance === 0) estimatedH += 13;
    if (nextInstallment && afterBalance > 0) estimatedH += 9;
    
    const doc = new jsPDF({ unit: "mm", format: [W, estimatedH] });

    let y = 10;

    // ════════════════════════════════════════════════════════
    //  HEADER BAND
    // ════════════════════════════════════════════════════════
    doc.setFillColor(30, 41, 82);
    doc.rect(0, 0, W, 22, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(config.brand.length > 12 ? 13 : 18);
    doc.setTextColor(255, 255, 255);
    doc.text(config.brand.toUpperCase(), MID, 9, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 195, 230);
    doc.text(config.name.toUpperCase(), MID, 14.5, { align: "center" });
    doc.text(config.slogan.toUpperCase(), MID, 19, { align: "center" });

    doc.setTextColor(0, 0, 0);
    y = 28;

    // ── Subheader info ────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 90);
    doc.text(config.address, MID, y, { align: "center" });
    y += 3.5;
    doc.text(`Tel. ${config.phone}`, MID, y, { align: "center" });
    y += 2;
    solidLine(doc, y, 0.15);

    // ════════════════════════════════════════════════════════
    //  RECEIPT META
    // ════════════════════════════════════════════════════════
    y += 5;
    doc.setTextColor(0, 0, 0);
    kv(doc, "Recibo No.:", receiptNo, y, { valueBold: true });
    y += 4;
    kv(doc, "Fecha / Hora:", receiptDate, y);
    y += 4;
    kv(doc, "No. Préstamo:", loanNo, y);
    y += 4;
    kv(doc, "Vencimiento:", dueDate, y);
    y += 4;
    kv(doc, "Atendió:", processedBy.toUpperCase(), y);

    y += 3;
    solidLine(doc, y, 0.15);

    // ════════════════════════════════════════════════════════
    //  CLIENT
    // ════════════════════════════════════════════════════════
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text(loan.client.fullName.toUpperCase(), ML, y);

    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`Cédula: ${loan.client.idNumber}`, ML, y);

    if (loan.client.phone) {
        y += 3.5;
        doc.text(`Tel: ${loan.client.phone}`, ML, y);
    }

    y += 4;
    dashedLine(doc, y);

    // ════════════════════════════════════════════════════════
    //  INSTALLMENT TITLE
    // ════════════════════════════════════════════════════════
    y += 5;
    doc.setFillColor(245, 247, 255);
    doc.rect(ML - 1, y - 3.5, MR - ML + 2, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 82);
    doc.text("PAGO DE CUOTA", MID, y + 1.5, { align: "center" });

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
        `Cuota ${installmentNumber} de ${totalInstallments}  ·  ${interestTypeLabel(loan.interestType || "simple")}`,
        MID, y, { align: "center" }
    );

    y += 3;
    dashedLine(doc, y);

    // ════════════════════════════════════════════════════════
    //  BREAKDOWN
    // ════════════════════════════════════════════════════════
    y += 6;
    doc.setTextColor(0, 0, 0);
    kv(doc, "Capital amortizado:", `RD$ ${fmt(capitalPart)}`, y);
    y += 5;
    kv(doc, "Interés del período:", `RD$ ${fmt(interestPart)}`, y);
    y += 5;
    kv(doc, "Mora:", "RD$ 0.00", y);
    y += 5;
    kv(doc, "Otros cargos:", "RD$ 0.00", y);

    y += 4;
    solidLine(doc, y, 0.3);

    // ── TOTAL (big) ───────────────────────────────────────────
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text("TOTAL RECIBIDO  RD$", ML, y);

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 82);
    const totalStr = fmt(payment.amount);
    doc.text(totalStr, MR, y, { align: "right" });

    const tw = doc.getTextWidth(totalStr);
    y += 1.8;
    doc.setDrawColor(30, 41, 82);
    doc.setLineWidth(0.5);
    doc.line(MR - tw, y, MR, y);
    y += 0.9;
    doc.line(MR - tw, y, MR, y);
    doc.setDrawColor(40, 40, 40);

    // ── Payment method ────────────────────────────────────────
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    kv(doc, "Forma de pago:", methodLabel.toUpperCase(), y);

    y += 5;
    solidLine(doc, y, 0.15);

    // ════════════════════════════════════════════════════════
    //  LOAN BALANCE SUMMARY
    // ════════════════════════════════════════════════════════
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 82);
    doc.text("RESUMEN DE CUENTA", ML, y);

    y += 5;
    doc.setTextColor(0, 0, 0);
    kv(doc, "Saldo anterior:", `RD$ ${fmt(prevBalance)}`, y);
    y += 4.5;
    kv(doc, "Pago aplicado:", `- RD$ ${fmt(payment.amount)}`, y);
    y += 4.5;

    // Saldo actual con color
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text("Saldo pendiente:", ML, y);
    doc.setTextColor(afterBalance === 0 ? 16 : 200, afterBalance === 0 ? 150 : 60, afterBalance === 0 ? 80 : 60);
    doc.text(`RD$ ${fmt(afterBalance)}`, MR, y, { align: "right" });
    doc.setTextColor(0, 0, 0);

    if (afterBalance === 0) {
        y += 5;
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(ML - 1, y - 3, MR - ML + 2, 8, 1.5, 1.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(22, 101, 52);
        doc.text("PRÉSTAMO PAGADO — GRACIAS", MID, y + 1.5, { align: "center" });
        doc.setTextColor(0, 0, 0);
        y += 8;
    }

    // ── Next installment ──────────────────────────────────────
    if (nextInstallment && afterBalance > 0) {
        y += 4;
        solidLine(doc, y, 0.15);
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 82);
        doc.text("PRÓXIMA CUOTA:", ML, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(
            `${fmtDate(nextInstallment.dueDate + "T12:00:00")}  ·  RD$ ${fmt(nextInstallment.totalPayment)}`,
            MR, y, { align: "right" }
        );
    }

    y += 6;
    solidLine(doc, y, 0.15);

    // ════════════════════════════════════════════════════════
    //  FOOTER
    // ════════════════════════════════════════════════════════
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(40, 41, 82);
    doc.text("¡Gracias por su puntualidad!", MID, y, { align: "center" });

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text("Este ticket es un comprobante de pago válido.", MID, y, { align: "center" });
    y += 3.5;
    doc.text(`Generado por ${config.brand}`, MID, y, { align: "center" });

    handlePdfOutput(doc, `Recibo_${receiptNo}.pdf`);
};


// ============================================================
//  3. ACCOUNT STATEMENT — Estado de Cuenta (A4)
// ============================================================
export const generateAccountStatement = (loan: any, config: CompanyConfig = DEFAULT_COMPANY) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const today  = new Date();
    const loanNo = seqNo("PR", loan.id);
    const schedule: any[] = Array.isArray(loan.paymentSchedule) ? loan.paymentSchedule : [];
    const payments: any[] = [...(loan.payments ?? [])].sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const installmentAmt = loan.installmentAmount ?? (loan.totalToPay / loan.term);
    const paidTotal = payments.reduce((s: number, p: any) => s + p.amount, 0);
    const statusLabel = loan.status === "paid" ? "PAGO COMPLETO" : loan.status === "overdue" ? "EN MORA" : "ACTIVO";
    const statusColor: [number, number, number] =
        loan.status === "paid"    ? [22, 101, 52] :
        loan.status === "overdue" ? [153, 27, 27] :
        [30, 41, 82];

    let y = 20;

    // ── Header band ──────────────────────────────────────────
    doc.setFillColor(30, 41, 82);
    doc.rect(0, 0, 210, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`${config.brand.toUpperCase()}  ·  ESTADO DE CUENTA`, 105, 9, { align: "center" });
    doc.setTextColor(0, 0, 0);

    y = 22;
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 82);
    doc.text(config.name.toUpperCase(), 105, y, { align: "center" });
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`${config.address}  ·  Tel. ${config.phone}`, 105, y, { align: "center" });
    y += 6;
    a4ColorLine(doc, y, 30, 41, 82, 1.2);
    y += 2;
    a4ColorLine(doc, y, 200, 170, 80, 0.4);

    // ── Title ────────────────────────────────────────────────
    y += 10;
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text("ESTADO DE CUENTA — PRÉSTAMO", 105, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`No. ${loanNo}  ·  Generado: ${fmtDateLong(today)}`, 105, y, { align: "center" });

    // ── Status badge ─────────────────────────────────────────
    y += 8;
    doc.setFillColor(...statusColor);
    doc.roundedRect(A4_R - 42, y - 5, 42, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(statusLabel, A4_R - 21, y - 0.5, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // ── Client + Loan info (two-column) ──────────────────────
    const infoBoxH = 46;
    doc.setFillColor(248, 249, 255);
    doc.setDrawColor(200, 210, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(A4_L, y, A4_CW, infoBoxH, 2, 2, "FD");

    const ib1 = A4_L + 5;
    const ib2 = A4_L + A4_CW / 2 + 5;
    const ibRowH = 5.5;
    let iby = y + 7;

    const infoRow = (lbl: string, val: string, cx: number, cyRef: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text(lbl, cx, cyRef);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        // Usamos cx + 72 para dar más espacio a la columna (la caja lo permite)
        doc.text(val, cx + 72, cyRef, { align: "right" });
    };

    infoRow("Cliente:",      loan.client.fullName,   ib1, iby);
    iby += ibRowH;
    infoRow("Cédula:",       loan.client.idNumber,   ib1, iby);
    iby += ibRowH;
    infoRow("Teléfono:",     loan.client.phone || "—", ib1, iby);
    iby += ibRowH;
    
    // Dirección manejada de forma especial para múltiples líneas
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text("Dirección:", ib1, iby);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    
    // Permitimos hasta 62 unidades de ancho para la dirección
    const addrLines = doc.splitTextToSize(loan.client.address || "—", 62);
    for (let i = 0; i < addrLines.length; i++) {
        doc.text(addrLines[i], ib1 + 72, iby + (i * 3.5), { align: "right" });
    }

    iby = y + 7;
    infoRow("Capital:",     `RD$ ${fmt(loan.amount)}`,       ib2, iby);
    iby += ibRowH;
    infoRow("Tasa:",        `${loan.interestRate}% ${rateFreqLabel(loan.rateFrequency || "monthly")}`, ib2, iby);
    iby += ibRowH;
    infoRow("Cuota Fija:",  `RD$ ${fmt(installmentAmt)}`,   ib2, iby);
    iby += ibRowH;
    infoRow("Plazo:",       `${loan.term} ${termUnitLabel(loan.termUnit, loan.term)}`, ib2, iby);
    iby += ibRowH;
    
    const tipoInteres = loan.interestType === "compound" ? "Amort. Francesa" : "Interés Simple";
    infoRow("Modalidad:",   tipoInteres, ib2, iby);
    iby += ibRowH;
    infoRow("Desembolso:",  fmtDate(loan.startDate), ib2, iby);
    iby += ibRowH;

    const stmtDueDate = loan.dueDate
        ? new Date(loan.dueDate)
        : calcDueDate(new Date(loan.startDate), loan.term, loan.termUnit);
    infoRow("Vencimiento:", fmtDate(stmtDueDate), ib2, iby);

    y += infoBoxH + 6;

    // ── KPI Row ──────────────────────────────────────────────
    const kpiW = A4_CW / 3 - 2;
    const kpis = [
        { label: "Total Pactado",     value: `RD$ ${fmt(loan.totalToPay)}`, color: [30, 41, 82] as [number,number,number] },
        { label: "Total Pagado",      value: `RD$ ${fmt(paidTotal)}`,       color: [22, 101, 52] as [number,number,number] },
        { label: "Saldo Pendiente",   value: `RD$ ${fmt(loan.remainingBalance)}`, color: loan.remainingBalance > 0 ? [180, 60, 60] as [number,number,number] : [22, 101, 52] as [number,number,number] },
    ];

    kpis.forEach((kpi, idx) => {
        const kx = A4_L + idx * (kpiW + 3);
        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.roundedRect(kx, y, kpiW, 18, 2, 2, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(200, 220, 255);
        doc.text(kpi.label.toUpperCase(), kx + kpiW / 2, y + 5.5, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        doc.text(kpi.value, kx + kpiW / 2, y + 13, { align: "center" });
    });
    doc.setTextColor(0, 0, 0);

    y += 24;

    // ── Payment History Table ─────────────────────────────────
    if (payments.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 82);
        doc.text("HISTORIAL DE PAGOS", A4_L, y);
        y += 6;

        (doc as any).autoTable({
            startY: y,
            head: [["#", "Fecha", "Monto Pagado", "Método", "Saldo Después"]],
            body: (() => {
                let running = loan.totalToPay;
                return payments.map((p: any, i: number) => {
                    running = Math.max(0, running - p.amount);
                    return [
                        i + 1,
                        fmtDate(p.date),
                        `RD$ ${fmt(p.amount)}`,
                        (p.method === "cash" ? "Efectivo" : p.method === "transfer" ? "Transferencia" : "Tarjeta"),
                        `RD$ ${fmt(running)}`,
                    ];
                });
            })(),
            styles: { fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: [30, 41, 82], textColor: 255, fontStyle: "bold", fontSize: 8 },
            alternateRowStyles: { fillColor: [248, 250, 255] },
            columnStyles: {
                0: { halign: "center", cellWidth: 10 },
                2: { halign: "right" },
                4: { halign: "right" },
            },
            margin: { left: A4_L, right: 210 - A4_R },
        });

        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Amortization Schedule ─────────────────────────────────
    if (schedule.length > 0) {
        if (y > 220) { doc.addPage(); y = 25; }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 82);
        doc.text("TABLA DE AMORTIZACIÓN", A4_L, y);
        y += 6;

        // Determine which installments are paid
        let accPaid = 0;
        const tableBody = schedule.map((row: any) => {
            const isPaid = accPaid + row.totalPayment <= paidTotal + 0.01;
            accPaid += row.totalPayment;
            return [
                row.installmentNumber,
                fmtDate(row.dueDate + "T12:00:00"),
                `RD$ ${fmt(row.principalPayment)}`,
                `RD$ ${fmt(row.interestPayment)}`,
                `RD$ ${fmt(row.totalPayment)}`,
                `RD$ ${fmt(row.balance)}`,
                isPaid ? "✓" : "—",
            ];
        });

        (doc as any).autoTable({
            startY: y,
            head: [["#", "Fecha", "Capital", "Interés", "Cuota", "Saldo", "Pagado"]],
            body: tableBody,
            styles: { fontSize: 7.5, cellPadding: 2 },
            headStyles: { fillColor: [30, 41, 82], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
            alternateRowStyles: { fillColor: [248, 250, 255] },
            bodyStyles: { textColor: [40, 40, 40] },
            columnStyles: {
                0: { halign: "center", cellWidth: 8 },
                2: { halign: "right" },
                3: { halign: "right" },
                4: { halign: "right", fontStyle: "bold" },
                5: { halign: "right", textColor: [80, 80, 80] },
                6: { halign: "center", cellWidth: 14, textColor: [22, 101, 52] },
            },
            didParseCell: (data: any) => {
                if (data.section === "body" && data.column.index === 6 && data.cell.raw === "✓") {
                    data.cell.styles.fillColor = [220, 252, 231];
                    data.cell.styles.fontStyle = "bold";
                }
            },
            margin: { left: A4_L, right: 210 - A4_R },
        });

        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Footers on all pages ──────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(245, 247, 255);
        doc.rect(0, 285, 210, 12, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 150);
        doc.text(`${config.name} · ${config.address} · Tel. ${config.phone}`, 105, 290, { align: "center" });
        doc.text(`Estado de Cuenta No. ${loanNo} · Página ${i} de ${pageCount}`, 105, 294, { align: "center" });
    }

    handlePdfOutput(doc, `EstadoCuenta_${loan.client.fullName.replace(/\s+/g, "_")}_${loanNo}.pdf`);
};
