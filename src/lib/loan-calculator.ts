export type TermUnit = "days" | "weeks" | "biweekly" | "months";
export type RateFrequency = "daily" | "biweekly" | "monthly" | "annual";
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

export type LateFeeType = "percentage" | "fixed";

export interface LateFeeRule {
    id: string;
    minDays: number;
    maxDays: number | null; // null significa "en adelante"
    minAmount: number;
    maxAmount: number | null; // null significa "en adelante"
    type: LateFeeType;
    value: number; // Porcentaje o Monto Fijo
}

export interface LoanCalculationResult {
    periodicRate: number;          // tasa periódica decimal (ej: 0.10 = 10%)
    totalInterest: number;
    totalToPay: number;
    installmentAmount: number;     // cuota fija (número entero)
    dueDate: Date;
    schedule: AmortizationRow[];
}

/** Convierte la tasa ingresada a tasa por período según termUnit */
export function getPeriodicRate(
    rate: number,
    rateFrequency: RateFrequency,
    termUnit: TermUnit
): number {
    const r = rate / 100;
    let dailyRate: number;
    switch (rateFrequency) {
        case "daily":   dailyRate = r; break;
        case "biweekly": dailyRate = r / 15; break;
        case "monthly": dailyRate = r / 30; break;
        case "annual":  dailyRate = r / 365; break;
    }
    switch (termUnit) {
        case "days":   return dailyRate;
        case "weeks":  return dailyRate * 7;
        case "biweekly": return dailyRate * 15;
        case "months": return dailyRate * 30;
    }
}

/** Calcula la fecha de vencimiento sumando los períodos */
export function calcDueDate(startDate: Date, term: number, termUnit: TermUnit): Date {
    const d = new Date(startDate);
    switch (termUnit) {
        case "days":   d.setDate(d.getDate() + term); break;
        case "weeks":  d.setDate(d.getDate() + term * 7); break;
        case "biweekly": d.setDate(d.getDate() + term * 15); break;
        case "months": d.setMonth(d.getMonth() + term); break;
    }
    return d;
}

function addPeriod(date: Date, termUnit: TermUnit): Date {
    const d = new Date(date);
    switch (termUnit) {
        case "days":   d.setDate(d.getDate() + 1); break;
        case "weeks":  d.setDate(d.getDate() + 7); break;
        case "biweekly": d.setDate(d.getDate() + 15); break;
        case "months": d.setMonth(d.getMonth() + 1); break;
    }
    return d;
}

function calcPMT(principal: number, periodicRate: number, n: number): number {
    if (periodicRate === 0) return principal / n;
    const factor = Math.pow(1 + periodicRate, n);
    return (principal * periodicRate * factor) / (factor - 1);
}

/** Redondea a 2 decimales (para cálculos intermedios) */
function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/** Redondea al múltiplo de 5 más cercano (ej: 8333 → 8335, 8332 → 8330) */
function roundPeso(n: number): number {
    return Math.round(n / 5) * 5;
}

export function calculateLoan(params: LoanParams): LoanCalculationResult {
    const { amount, annualOrPeriodicRate, rateFrequency, term, termUnit, interestType, startDate } = params;
    const r = getPeriodicRate(annualOrPeriodicRate, rateFrequency, termUnit);
    const dueDate = calcDueDate(new Date(startDate), term, termUnit);
    const schedule: AmortizationRow[] = [];

    if (interestType === "simple") {
        const totalInterest = round2(amount * r * term);
        const totalToPay = round2(amount + totalInterest);

        // Cuota regular redondeada al peso entero
        const regularInstallment = roundPeso(totalToPay / term);
        // Interés regular por período redondeado al peso entero
        const regularInterest = roundPeso(totalInterest / term);
        // Capital regular = cuota - interés
        const regularPrincipal = regularInstallment - regularInterest;

        // Rastrear exactos para la última cuota
        let paidTotal = 0;
        let paidInterest = 0;
        let paidPrincipal = 0;
        let currentDate = new Date(startDate);

        for (let i = 1; i <= term; i++) {
            currentDate = addPeriod(currentDate, termUnit);
            const isLast = i === term;

            let interestPayment: number;
            let totalPayment: number;
            let principalPayment: number;

            if (isLast) {
                // Última cuota: absorbe cualquier diferencia por redondeo
                totalPayment = roundPeso(totalToPay) - paidTotal;
                interestPayment = roundPeso(totalInterest) - paidInterest;
                principalPayment = roundPeso(amount) - paidPrincipal;
            } else {
                interestPayment = regularInterest;
                principalPayment = regularPrincipal;
                totalPayment = regularInstallment;
            }

            paidTotal += totalPayment;
            paidInterest += interestPayment;
            paidPrincipal += principalPayment;

            schedule.push({
                installmentNumber: i,
                dueDate: currentDate.toISOString().split("T")[0],
                principalPayment,
                interestPayment,
                totalPayment,
                balance: Math.max(0, roundPeso(amount) - paidPrincipal),
            });
        }

        return {
            periodicRate: r,
            totalInterest: round2(totalInterest),
            totalToPay: round2(totalToPay),
            installmentAmount: regularInstallment,
            dueDate,
            schedule,
        };

    } else {
        // Amortización Francesa — cuota fija PMT redondeada al peso entero
        const rawPMT = calcPMT(amount, r, term);
        const regularInstallment = roundPeso(rawPMT);
        let balance = amount;
        let currentDate = new Date(startDate);

        for (let i = 1; i <= term; i++) {
            currentDate = addPeriod(currentDate, termUnit);
            const isLast = i === term;

            const interestPayment = roundPeso(balance * r);

            let principalPayment: number;
            let totalPayment: number;

            if (isLast) {
                // Última cuota: salda el saldo exacto
                principalPayment = roundPeso(balance);
                totalPayment = principalPayment + interestPayment;
            } else {
                principalPayment = roundPeso(regularInstallment - interestPayment);
                totalPayment = regularInstallment;
            }

            balance = Math.max(0, roundPeso(balance - principalPayment));

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
            installmentAmount: regularInstallment,
            dueDate,
            schedule,
        };
    }
}

export function isOverdue(dueDate: Date | string | null, status: string): boolean {
    if (status === "paid") return false;
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
}

/** Calcula los días de atraso dado un dueDate, comparando solo el calendario (sin desfases de zona horaria) */
export function calculateDaysOverdue(dueDate: string | Date | null): number {
    if (!dueDate) return 0;

    const dateStr = typeof dueDate === "string" ? dueDate : dueDate.toISOString();
    const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
    const dueUTC = Date.UTC(y, m - 1, d);

    const now = new Date();
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    const diffDays = Math.floor((nowUTC - dueUTC) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

/** Calcula la mora en base al monto de la cuota, los días de atraso y el monto del préstamo */
export function calculateLateFee(
    installmentAmount: number,
    daysOverdue: number,
    loanAmount: number,
    rules: LateFeeRule[]
): number {
    if (daysOverdue <= 0 || !rules || rules.length === 0) return 0;
    
    // Buscar la regla que aplique a los días de atraso y al monto prestado
    let applicableRule: LateFeeRule | null = null;
    
    for (const rule of rules) {
        // Verificar días
        const matchesDays = daysOverdue >= rule.minDays && (rule.maxDays === null || daysOverdue <= rule.maxDays);
        // Verificar montos (si la regla no tiene montos definidos asumimos que aplica para todos para retrocompatibilidad, pero si tiene los respetamos)
        const minAmt = rule.minAmount ?? 0;
        const matchesAmount = loanAmount >= minAmt && (rule.maxAmount === null || rule.maxAmount === undefined || loanAmount <= rule.maxAmount);
        
        if (matchesDays && matchesAmount) {
            applicableRule = rule;
            break; // Encontramos la regla
        }
    }
    
    if (!applicableRule) return 0;
    
    if (applicableRule.type === "fixed") {
        return applicableRule.value;
    } else {
        // percentage
        return round2((installmentAmount * applicableRule.value) / 100);
    }
}

/** Encuentra la próxima cuota pendiente de pago dado el monto ya abonado */
export function findNextInstallment(
    schedule: AmortizationRow[],
    paidAmount: number
): AmortizationRow | null {
    let accumulated = 0;
    for (const row of schedule) {
        if (accumulated + row.totalPayment > paidAmount + 0.01) return row;
        accumulated += row.totalPayment;
    }
    return null;
}

export interface OverdueInfo {
    isOverdue: boolean;
    daysOverdue: number;
    lateFee: number;
    nextInstallment: AmortizationRow | null;
}

/**
 * Evalúa el estado de mora de un préstamo en base a la cuota pendiente MÁS PRÓXIMA
 * (no la fecha final del préstamo). Un préstamo está en mora tan pronto como
 * alguna cuota vencida no ha sido cubierta, sin importar cuántas cuotas falten.
 */
export function getOverdueInfo(
    schedule: AmortizationRow[],
    totalToPay: number,
    remainingBalance: number,
    loanAmount: number,
    rules: LateFeeRule[]
): OverdueInfo {
    const paidAmount = totalToPay - remainingBalance;
    const nextInstallment = findNextInstallment(schedule || [], paidAmount);
    if (!nextInstallment) return { isOverdue: false, daysOverdue: 0, lateFee: 0, nextInstallment: null };

    const daysOverdue = calculateDaysOverdue(nextInstallment.dueDate);
    const lateFee = daysOverdue > 0 ? calculateLateFee(nextInstallment.totalPayment, daysOverdue, loanAmount, rules) : 0;

    return { isOverdue: daysOverdue > 0, daysOverdue, lateFee, nextInstallment };
}
