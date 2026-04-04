import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { loanId, amount, method, date } = body;

        if (!loanId || !amount || !method) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        const pAmount = parseFloat(amount);

        // Update loan balance
        const loan = await prisma.loan.findUnique({
            where: { id: loanId }
        });

        if (!loan) {
            return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 });
        }

        const newBalance = Math.max(0, loan.remainingBalance - pAmount);
        const newStatus = newBalance === 0 ? "paid" : loan.status;

        // Create payment and update loan in a transaction
        const [payment, updatedLoan] = await prisma.$transaction([
            prisma.payment.create({
                data: {
                    loanId,
                    amount: pAmount,
                    method,
                    date: new Date(date || Date.now()),
                },
            }),
            prisma.loan.update({
                where: { id: loanId },
                data: {
                    remainingBalance: newBalance,
                    status: newStatus,
                },
            }),
        ]);

        return NextResponse.json({ payment, updatedLoan }, { status: 201 });
    } catch (error) {
        console.error("Error creating payment:", error);
        return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 });
    }
}
