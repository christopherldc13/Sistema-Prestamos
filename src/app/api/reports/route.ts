import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const loans = await prisma.loan.findMany({
            include: { payments: true }
        });

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let totalLent = 0;
        let totalCollected = 0;
        let collectedToday = 0;
        let pendingBalance = 0;

        loans.forEach((loan: any) => {
            totalLent += loan.amount;
            pendingBalance += loan.remainingBalance;

            loan.payments.forEach((p: any) => {
                totalCollected += p.amount;
                if (new Date(p.date) >= startOfToday) {
                    collectedToday += p.amount;
                }
            });
        });

        const activeLoans = loans.filter((l: any) => l.status === 'active').length;
        const paidLoans = loans.filter((l: any) => l.status === 'paid').length;

        // Recently processed payments
        const recentPayments = await prisma.payment.findMany({
            take: 10,
            orderBy: { date: 'desc' },
            include: {
                loan: {
                    include: { client: true }
                }
            }
        });

        return NextResponse.json({
            stats: {
                totalLent,
                totalCollected,
                collectedToday,
                pendingBalance,
                activeLoans,
                paidLoans
            },
            recentPayments
        });
    } catch (error) {
        console.error("Reports API error:", error);
        return NextResponse.json({ error: "No se pudieron cargar los reportes" }, { status: 500 });
    }
}
