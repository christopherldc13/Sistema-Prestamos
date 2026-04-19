import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateLoan, isOverdue, type RateFrequency, type TermUnit, type InterestType } from "@/lib/loan-calculator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPlan } from "@/lib/plans";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const loans = await prisma.loan.findMany({
            where: { userId },
            include: {
                client: true,
                payments: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const updates: Promise<any>[] = [];
        for (const loan of loans) {
            const loanAny = loan as any;
            if (loan.status === "active" && isOverdue(loanAny.dueDate, loan.status)) {
                updates.push(
                    prisma.loan.update({ where: { id: loan.id }, data: { status: "overdue" } })
                );
                loan.status = "overdue";
            }
        }
        if (updates.length > 0) await Promise.all(updates);

        return NextResponse.json(loans);
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
                select: { subscriptionPlan: true },
            });
            const plan = getPlan(user?.subscriptionPlan ?? "basic");
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
