import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateLoan, getOverdueInfo, type RateFrequency, type TermUnit, type InterestType } from "@/lib/loan-calculator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveUserPlan } from "@/lib/plans";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // select en vez de include: solo se traen los campos que el listado realmente
        // muestra + lo mínimo necesario para calcular la mora (evita mandar al cliente
        // el cronograma completo y el historial de pagos de cada préstamo)
        const loans = await prisma.loan.findMany({
            where: { userId },
            select: {
                id: true,
                amount: true,
                term: true,
                termUnit: true,
                status: true,
                totalToPay: true,
                remainingBalance: true,
                installmentAmount: true,
                dueDate: true,
                createdAt: true,
                paymentSchedule: true,
                client: { select: { id: true, fullName: true } },
                payments: { select: { amount: true, lateFeeAmount: true } },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const settings = await prisma.settings.findUnique({ where: { userId } });
        const lateFeeRules = (settings?.value as any)?.lateFeeRules || [];

        const updates: Promise<any>[] = [];
        const result = loans.map((loan) => {
            const { paymentSchedule, payments, ...rest } = loan as any;
            let status = loan.status;
            let accumulatedLateFee = 0;
            let daysOverdue = 0;

            if (status !== "paid") {
                const schedule = (paymentSchedule as any[]) || [];
                const overdueInfo = getOverdueInfo(schedule, loan.totalToPay, loan.remainingBalance, loan.amount, lateFeeRules);
                const newStatus = overdueInfo.isOverdue ? "overdue" : "active";

                if (status !== newStatus) {
                    updates.push(
                        prisma.loan.update({ where: { id: loan.id }, data: { status: newStatus } })
                    );
                    status = newStatus;
                }

                daysOverdue = overdueInfo.daysOverdue;
                accumulatedLateFee = overdueInfo.isOverdue ? overdueInfo.lateFee : 0;
            }

            return { ...rest, status, daysOverdue, accumulatedLateFee };
        });
        if (updates.length > 0) await Promise.all(updates);

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener préstamos" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Verificar límite de préstamos activos según plan
        try {
            const user = await (prisma.user.findUnique as any)({
                where: { id: userId },
                select: {
                    subscriptionPlan: true, maxClients: true, maxActiveLoans: true,
                    maxPaymentHistory: true, hasContractPDF: true, hasStatementPDF: true,
                    hasFrenchAmortization: true, hasAmortizationTable: true,
                    hasAdvancedReports: true, hasExport: true, hasCustomBranding: true,
                },
            });
            const plan = resolveUserPlan(user ?? { subscriptionPlan: "basic" });
            if (plan.maxActiveLoans !== -1) {
                const activeLoans = await prisma.loan.count({
                    where: { userId, status: { in: ["active", "overdue"] } },
                });
                if (activeLoans >= plan.maxActiveLoans) {
                    return NextResponse.json({
                        error: `Tu plan ${plan.name} permite máximo ${plan.maxActiveLoans} préstamos activos. Actualiza tu plan para crear más.`,
                        limitReached: true,
                        currentPlan: plan.id,
                    }, { status: 403 });
                }
            }
        } catch {
            // Si el campo no existe aún, continuar sin restricción
        }

        const body = await req.json();
        const {
            clientId,
            amount,
            interestRate,
            rateFrequency = "monthly",
            term,
            termUnit,
            interestType,
            startDate
        } = body;

        if (!clientId || !amount || !interestRate || !term || !termUnit) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        const result = calculateLoan({
            amount: parseFloat(amount),
            annualOrPeriodicRate: parseFloat(interestRate),
            rateFrequency: rateFrequency as RateFrequency,
            term: parseInt(term),
            termUnit: termUnit as TermUnit,
            interestType: (interestType || "simple") as InterestType,
            startDate: new Date(startDate || Date.now()),
        });

        const loan = await prisma.loan.create({
            data: {
                amount: parseFloat(amount),
                interestRate: parseFloat(interestRate),
                rateFrequency,
                term: parseInt(term),
                termUnit,
                interestType: interestType || "simple",
                startDate: new Date(startDate || Date.now()),
                dueDate: result.dueDate,
                totalToPay: result.totalToPay,
                installmentAmount: result.installmentAmount,
                remainingBalance: result.totalToPay,
                paymentSchedule: result.schedule as any,
                clientId,
                userId,
            },
        });

        return NextResponse.json(loan, { status: 201 });
    } catch (error) {
        console.error("Error creating loan:", error);
        return NextResponse.json({ error: "Error al crear el préstamo" }, { status: 500 });
    }
}
