import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateLoan, isOverdue, type RateFrequency, type TermUnit, type InterestType } from "@/lib/loan-calculator";

export async function GET() {
    try {
        const loans = await prisma.loan.findMany({
            include: {
                client: true,
                payments: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Auto-actualizar status overdue en tiempo real
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
            },
        });

        return NextResponse.json(loan, { status: 201 });
    } catch (error) {
        console.error("Error creating loan:", error);
        return NextResponse.json({ error: "Error al crear el préstamo" }, { status: 500 });
    }
}
