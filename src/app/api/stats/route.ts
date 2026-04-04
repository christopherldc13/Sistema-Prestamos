import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const loans = await prisma.loan.findMany({
            include: {
                payments: true,
            },
        });

        const totalLent = loans.reduce((acc, loan) => acc + loan.amount, 0);
        const totalToPay = loans.reduce((acc, loan) => acc + loan.totalToPay, 0);
        const totalCollected = loans.reduce((acc, loan) => {
            const paymentSum = loan.payments.reduce((pAcc, p) => pAcc + p.amount, 0);
            return acc + paymentSum;
        }, 0);

        const activeLoans = loans.filter(l => l.status === 'active').length;
        const paidLoans = loans.filter(l => l.status === 'paid').length;
        const overdueLoans = loans.filter(l => l.status === 'overdue').length;

        const stats = {
            totalLent,
            totalCollected,
            totalEarnings: totalToPay - totalLent,
            activeLoans,
            paidLoans,
            overdueLoans,
            pendingBalance: totalToPay - totalCollected,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
    }
}
