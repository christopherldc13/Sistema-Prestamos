import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOverdueInfo } from "@/lib/loan-calculator";
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

        // Mora pendiente ANTES de este abono, en base a la próxima cuota vencida
        const settings = await prisma.settings.findUnique({ where: { userId } });
        const lateFeeRules = (settings?.value as any)?.lateFeeRules || [];
        const schedule = (loan as any).paymentSchedule || [];
        const currentOverdueInfo = getOverdueInfo(schedule, loan.totalToPay, loan.remainingBalance, loan.amount, lateFeeRules);
        const pendingLateFee = currentOverdueInfo.isOverdue ? currentOverdueInfo.lateFee : 0;

        // La mora es obligatoria: no se permite un abono que la deje sin cubrir
        if (pendingLateFee > 0) {
            const minRequired = Math.min((loan.installmentAmount || 0) + pendingLateFee, loan.remainingBalance + pendingLateFee);
            if (pAmount + 0.01 < minRequired) {
                return NextResponse.json({
                    error: `Este préstamo tiene una mora pendiente de RD$${pendingLateFee.toFixed(2)}. Debes abonar al menos RD$${minRequired.toFixed(2)} (cuota + mora) para continuar.`
                }, { status: 400 });
            }
        }
        if (pAmount > loan.remainingBalance + pendingLateFee + 0.01) {
            return NextResponse.json({ error: "El monto supera el saldo restante (incluyendo la mora)." }, { status: 400 });
        }

        // La porción de mora cubierta no amortiza capital: solo el resto reduce el saldo del contrato
        const principalPortion = Math.max(0, pAmount - pendingLateFee);
        const newBalance = Math.max(0, Math.round((loan.remainingBalance - principalPortion) * 100) / 100);

        // Determinar nuevo estado en base a la próxima cuota pendiente tras este abono
        let newStatus: string;
        if (newBalance === 0) {
            newStatus = "paid";
        } else {
            const overdueInfo = getOverdueInfo(schedule, loan.totalToPay, newBalance, loan.amount, []);
            newStatus = overdueInfo.isOverdue ? "overdue" : "active";
        }

        const lastPayment = await prisma.payment.findFirst({
            orderBy: { receiptNumber: "desc" },
            select: { receiptNumber: true },
        });
        const nextReceiptNumber = (lastPayment?.receiptNumber ?? 0) + 1;

        const [payment, updatedLoan] = await prisma.$transaction([
            prisma.payment.create({
                data: {
                    loanId,
                    amount: pAmount,
                    lateFeeAmount: pendingLateFee,
                    method,
                    date: new Date(date || Date.now()),
                    receiptNumber: nextReceiptNumber,
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

