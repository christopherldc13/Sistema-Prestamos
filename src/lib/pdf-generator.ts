import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const generateLoanReceipt = (loan: any) => {
    const doc = new jsPDF();
    const date = new Date(loan.startDate).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Fact-Prest", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("CONTRATO OFICIAL DE FINANCIAMIENTO", 20, 32);

    doc.setFontSize(9);
    doc.text(`FECHA: ${date}`, 190, 25, { align: "right" });
    doc.text(`FOLIO: #${loan.id.substring(loan.id.length - 8).toUpperCase()}`, 190, 31, { align: "right" });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DECLARACIONES DEL CRÉDITO", 20, 55);

    (doc as any).autoTable({
        startY: 60,
        head: [["PARÁMETRO", "VALOR ACORDADO"]],
        body: [
            ["Prestatario", loan.client.fullName],
            ["Identificación", loan.client.idNumber],
            ["Monto Capital", `$${loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
            ["Tasa de Intereses", `${loan.interestRate}% (${loan.termUnit === 'months' ? 'Mensual' : 'Periodo'})`],
            ["Plazo Pactado", `${loan.term} ${loan.termUnit === 'months' ? 'Meses' : 'Semanas'}`],
            ["Total a Pagar", `$${loan.totalToPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ],
        theme: "striped",
        headStyles: { fillColor: [71, 85, 105] },
        styles: { cellPadding: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Certificación electrónica Fact-Prest. No requiere firma física para validez en plataforma.", 105, finalY, { align: "center" });

    doc.save(`FactPrest_Contrato_${loan.client.idNumber}.pdf`);
};

export const generatePaymentReceipt = (payment: any, loan: any, processedBy?: string) => {
    const doc = new jsPDF({
        unit: 'mm',
        format: [80, 160]
    });

    const mid = 40;
    const now = new Date();
    const generationDate = now.toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase() + " " + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const methods: any = {
        cash: "EFECTIVO",
        transfer: "TRANSFERENCIA",
        card: "TARJETA"
    };

    const termUnits: any = {
        months: "MESES",
        weeks: "SEMANAS",
        days: "DÍAS"
    };

    // --- Precise Balance Logic ---
    const sortedPayments = [...loan.payments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const paymentIndex = sortedPayments.findIndex(p => p.id === payment.id);

    let amountPaidBefore = 0;
    if (paymentIndex !== -1) {
        amountPaidBefore = sortedPayments.slice(0, paymentIndex).reduce((acc, p) => acc + p.amount, 0);
    }

    const previousBalance = loan.totalToPay - amountPaidBefore;
    const remainingAfter = previousBalance - payment.amount;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Fact-Prest", mid, 12, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO ABONO", mid, 17, { align: "center" });

    doc.setLineWidth(0.4);
    doc.line(10, 21, 70, 21);

    // --- Context Meta ---
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`EMITIDO: ${generationDate}`, 10, 27);
    doc.text(`ID OPERACIÓN: ${payment.id.substring(payment.id.length - 8).toUpperCase()}`, 10, 31);
    doc.text(`ATENDIDO POR: ${processedBy || "CAJERO PRINCIPAL"}`, 10, 35);

    doc.setLineWidth(0.1);
    doc.line(10, 39, 70, 39);

    // --- Cliente Content ---
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", 10, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`${loan.client.fullName.toUpperCase()}`, 10, 50);
    doc.setFontSize(7);
    doc.text(`CÉDULA: ${loan.client.idNumber}`, 10, 54);
    doc.text(`TELÉFONO: ${loan.client.phone}`, 10, 58);

    doc.line(10, 62, 70, 62);

    // --- Contract Terms Section ---
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("PARÁMETROS DEL CRÉDITO", mid, 68, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.text("ESTADO INICIAL:", 10, 74);
    doc.text(`$${loan.amount.toLocaleString('en-US')}`, 70, 74, { align: "right" });

    doc.text("PLAZO CONTRATADO:", 10, 78);
    doc.text(`${loan.term} ${termUnits[loan.termUnit] || loan.termUnit.toUpperCase()}`, 70, 78, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL CON INTERÉS:", 10, 83);
    doc.text(`$${loan.totalToPay.toLocaleString('en-US')}`, 70, 83, { align: "right" });

    doc.line(10, 88, 70, 88);

    // --- Transaction Breakdown ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("ESTADO DE CUENTA", mid, 96, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("SALDO ANTERIOR", 10, 104);
    doc.text(`$${previousBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 70, 104, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("ABONO RECIBIDO", 10, 112);
    doc.text(`$${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 70, 112, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`FORMA DE PAGO: ${methods[payment.method] || payment.method.toUpperCase()}`, 10, 117);

    doc.setLineWidth(0.5);
    doc.line(10, 123, 70, 123);

    // --- Final Results ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SALDO PENDIENTE", 10, 133);
    doc.setTextColor(225, 29, 72); // Rose/Premium highlight
    doc.text(`$${remainingAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 70, 133, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setLineWidth(0.1);
    doc.line(10, 138, 70, 138);

    // --- Institutional Footer ---
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("¡Gracias por su puntualidad!", mid, 147, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text("Generado por Fact-Prest | Finanzas Inteligentes", mid, 153, { align: "center" });
    doc.text("Este ticket respalda su movimiento administrativo", mid, 157, { align: "center" });

    doc.save(`FactPrest_Ticket_${payment.id.substring(payment.id.length - 6).toUpperCase()}.pdf`);
};
