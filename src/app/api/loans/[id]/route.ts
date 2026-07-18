import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOverdueInfo } from "@/lib/loan-calculator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        const userId = (session.user as any).id;

        const loan = await prisma.loan.findUnique({
            where: { id: params.id },
            include: {
                client: true,
                payments: {
                    orderBy: { date: "desc" }
                },
            },
        });

        if (!loan || loan.userId !== userId) {
            return NextResponse.json({ error: "Préstamo no encontrado o inaccesible" }, { status: 404 });
        }

        const loanAny = loan as any;
        loanAny.daysOverdue = 0;
        loanAny.accumulatedLateFee = 0;

        if (loan.status !== "paid") {
            const settings = await prisma.settings.findUnique({ where: { userId } });
            const lateFeeRules = (settings?.value as any)?.lateFeeRules || [];
            const schedule = (loan.paymentSchedule as any[]) || [];
            const overdueInfo = getOverdueInfo(schedule, loan.totalToPay, loan.remainingBalance, loan.amount, lateFeeRules);
            const newStatus = overdueInfo.isOverdue ? "overdue" : "active";

            if (loan.status !== newStatus) {
                await prisma.loan.update({ where: { id: loan.id }, data: { status: newStatus } });
                loanAny.status = newStatus;
            }

            loanAny.daysOverdue = overdueInfo.daysOverdue;
            loanAny.accumulatedLateFee = overdueInfo.isOverdue ? overdueInfo.lateFee : 0;
        }

        return NextResponse.json(loan);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener el préstamo" }, { status: 500 });
    }
}
