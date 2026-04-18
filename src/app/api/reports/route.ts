import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const userId = (session.user as any).id;

        const loans = await prisma.loan.findMany({
            where: { userId },
            include: { payments: true },
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
                if (new Date(p.date) >= startOfToday) collectedToday += p.amount;
            });
        });

        const activeLoans = loans.filter((l: any) => l.status === "active").length;
        const paidLoans   = loans.filter((l: any) => l.status === "paid").length;
        const overdueLoans = loans.filter((l: any) => l.status === "overdue").length;

        const recentPayments = await prisma.payment.findMany({
            where: { loan: { userId } },
            take: 15,
            orderBy: { date: "desc" },
            include: { loan: { include: { client: true } } },
        });

        return NextResponse.json({
            stats: {
                totalLent,
                totalCollected,
                collectedToday,
                pendingBalance,
                activeLoans,
                paidLoans,
                overdueLoans,
            },
            recentPayments,
        });
    } catch (error) {
        console.error("Reports API error:", error);
        return NextResponse.json({ error: "No se pudieron cargar los reportes" }, { status: 500 });
    }
}
