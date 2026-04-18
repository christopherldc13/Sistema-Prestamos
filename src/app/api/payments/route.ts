import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isOverdue } from "@/lib/loan-calculator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        const userId = (session.user as any).id;

        const body = await req.json();
        const { loanId, amount, method, date } = body;

        if (!loanId || !amount || !method) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        const pAmount = parseFloat(amount);

        const loan = await prisma.loan.findUnique({ where: { id: loanId } });

        if (!loan || loan.userId !== userId) {
            return NextResponse.json({ error: "Préstamo no encontrado o inaccesible" }, { status: 404 });
        }

        if (loan.status === "paid") {
            return NextResponse.json({ error: "Este préstamo ya está saldado" }, { status: 400 });
        }

        const newBalance = Math.max(0, Math.round((loan.remainingBalance - pAmount) * 100) / 100);

        // Determinar nuevo estado
        let newStatus: string;
        if (newBalance === 0) {
            newStatus = "paid";
        } else if (isOverdue((loan as any).dueDate, loan.status)) {
            newStatus = "overdue";
        } else {
            newStatus = loan.status === "overdue" ? "overdue" : "active";
        }

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

