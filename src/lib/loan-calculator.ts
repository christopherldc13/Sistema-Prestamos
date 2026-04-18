/**
 * Módulo de cálculo financiero para préstamos.
 *
 * Soporta:
 *  - Interés Simple con cuotas iguales
 *  - Amortización Francesa (cuota fija, interés compuesto) — Sistema PMT
 *  - Normalización de tasa de interés según frecuencia
 *  - Generación de tabla de amortización completa
 */

export type TermUnit = "days" | "weeks" | "months";
export type RateFrequency = "daily" | "monthly" | "annual";
export type InterestType = "simple" | "compound";

export interface LoanParams {
    amount: number;
    annualOrPeriodicRate: number; // en porcentaje, ej: 10 = 10%
    rateFrequency: RateFrequency;
    term: number;
    termUnit: TermUnit;
    interestType: InterestType;
    startDate: Date;
}

export interface AmortizationRow {
    installmentNumber: number;
    dueDate: string;           // ISO date string
    principalPayment: number;  // capital amortizado en esta cuota
    interestPayment: number;   // interés en esta cuota
    totalPayment: number;      // cuota total
    balance: number;           // saldo restante después del pago
}

export interface LoanCalculationResult {
    periodicRate: number;          // tasa periódica decimal (ej: 0.10 = 10%)
    totalInterest: number;
    totalToPay: number;
    installmentAmount: number;     // cuota fija (PMT o cuota simple)
    dueDate: Date;
    schedule: AmortizationRow[];
}

/** Convierte la tasa ingresada a tasa por período según termUnit */
export function getPeriodicRate(
    rate: number,            // en porcentaje
    rateFrequency: RateFrequency,
    termUnit: TermUnit
): number {
    const r = rate / 100;

    // Primero convertimos todo a tasa diaria, luego al período destino
    let dailyRate: number;
    switch (rateFrequency) {
        case "daily":   dailyRate = r; break;
        case "monthly": dailyRate = r / 30; break;
        case "annual":  dailyRate = r / 365; break;
    }

    switch (termUnit) {
        case "days":   return dailyRate;
        case "weeks":  return dailyRate * 7;
        case "months": return dailyRate * 30;
    }
}

/** Calcula la fecha de vencimiento sumando los períodos */
export function calcDueDate(startDate: Date, term: number, termUnit: TermUnit): Date {
    const d = new Date(startDate);
    switch (termUnit) {
        case "days":
            d.setDate(d.getDate() + term);
            break;
        case "weeks":
            d.setDate(d.getDate() + term * 7);
            break;
        case "months":
            d.setMonth(d.getMonth() + term);
            break;
    }
    return d;
}

/** Suma una unidad de tiempo a una fecha (para generar fechas de cuotas) */
function addPeriod(date: Date, termUnit: TermUnit): Date {
    const d = new Date(date);
    switch (termUnit) {
        case "days":   d.setDate(d.getDate() + 1); break;
        case "weeks":  d.setDate(d.getDate() + 7); break;
        case "months": d.setMonth(d.getMonth() + 1); break;
    }
    return d;
}

/**
 * Cuota fija (PMT) para amortización francesa:
 * PMT = P * r * (1+r)^n / ((1+r)^n - 1)
 * Si r = 0: PMT = P / n
 */
function calcPMT(principal: number, periodicRate: number, n: number): number {
    if (periodicRate === 0) return principal / n;
    const factor = Math.pow(1 + periodicRate, n);
    return (principal * periodicRate * factor) / (factor - 1);
}

/** Genera la tabla de amortización completa */
export function calculateLoan(params: LoanParams): LoanCalculationResult {
    const { amount, annualOrPeriodicRate, rateFrequency, term, termUnit, interestType, startDate } = params;
    const r = getPeriodicRate(annualOrPeriodicRate, rateFrequency, termUnit);
    const dueDate = calcDueDate(new Date(startDate), term, termUnit);
    const schedule: AmortizationRow[] = [];

    if (interestType === "simple") {
        // Interés simple: I = P × r × n
        // Cada cuota lleva la misma proporción de capital e interés
        const totalInterest = amount * r * term;
        const totalToPay = amount + totalInterest;
        const installmentAmount = round2(totalToPay / term);

        // Recalc last installment to absorb rounding
        let balance = totalToPay;
        let currentDate = new Date(startDate);

        for (let i = 1; i <= term; i++) {
            currentDate = addPeriod(currentDate, termUnit);
            const isLast = i === term;
            const interestPayment = round2((totalInterest / term));
            const principalPayment = round2(amount / term);
            const payment = isLast ? round2(balance) : installmentAmount;
            balance = round2(balance - payment);

            schedule.push({
                installmentNumber: i,
                dueDate: currentDate.toISOString().split("T")[0],
                principalPayment: isLast ? round2(amount / term + (payment - installmentAmount)) : principalPayment,
                interestPayment,
                totalPayment: payment,
                balance: Math.max(0, balance),
            });
        }

        return {
            periodicRate: r,
            totalInterest: round2(totalInterest),
            totalToPay: round2(totalToPay),
            installmentAmount: round2(installmentAmount),
            dueDate,
            schedule,
        };

    } else {
        // Interés compuesto — Amortización Francesa (cuota fija PMT)
        const installmentAmount = round2(calcPMT(amount, r, term));
        let balance = amount;
        let currentDate = new Date(startDate);

        for (let i = 1; i <= term; i++) {
            currentDate = addPeriod(currentDate, termUnit);
            const interestPayment = round2(balance * r);
            let principalPayment = round2(installmentAmount - interestPayment);

            // Última cuota: saldar el saldo exacto
            if (i === term) {
                principalPayment = round2(balance);
            }

            const totalPayment = round2(principalPayment + interestPayment);
            balance = round2(Math.max(0, balance - principalPayment));

            schedule.push({
                installmentNumber: i,
                dueDate: currentDate.toISOString().split("T")[0],
                principalPayment,
                interestPayment,
                totalPayment,
                balance,
            });
        }

        const totalToPay = schedule.reduce((s, row) => s + row.totalPayment, 0);

        return {
            periodicRate: r,
            totalInterest: round2(totalToPay - amount),
            totalToPay: round2(totalToPay),
            installmentAmount,
            dueDate,
            schedule,
        };
    }
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/** Verifica si un préstamo está vencido según su fecha de vencimiento */
export function isOverdue(dueDate: Date | string | null, status: string): boolean {
    if (status === "paid") return false;
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
}
