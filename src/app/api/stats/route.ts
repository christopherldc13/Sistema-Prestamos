import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isOverdue } from "@/lib/loan-calculator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const loans = await prisma.loan.findMany({
            where: { userId },
            include: { payments: true, client: { select: { fullName: true } } },
        });

        const overdueUpdates: Promise<any>[] = [];
        for (const loan of loans) {
            if (loan.status === "active" && isOverdue((loan as any).dueDate, loan.status)) {
                overdueUpdates.push(
                    prisma.loan.update({ where: { id: loan.id }, data: { status: "overdue" } })
                );
                (loan as any).status = "overdue";
            }
        }
        if (overdueUpdates.length > 0) await Promise.all(overdueUpdates);

        const totalLent      = loans.reduce((acc, l) => acc + l.amount, 0);
        const totalToPay     = loans.reduce((acc, l) => acc + l.totalToPay, 0);
        const totalCollected = loans.reduce((acc, l) => acc + l.payments.reduce((s, p) => s + p.amount, 0), 0);

        const activeLoans  = loans.filter(l => l.status === "active").length;
        const paidLoans    = loans.filter(l => l.status === "paid").length;
        const overdueLoans = loans.filter(l => l.status === "overdue").length;

        // Recent activity: last 5 loans created
        const recentLoans = loans
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map(l => ({
                id: l.id,
                clientName: (l as any).client?.fullName || "Cliente",
                amount: l.amount,
                status: l.status,
                createdAt: l.createdAt,
            }));

        // Overdue loans alert list
        const overdueList = loans
            .filter(l => l.status === "overdue")
            .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())
            .slice(0, 5)
            .map(l => ({
                id: l.id,
                clientName: (l as any).client?.fullName || "Cliente",
                amount: l.amount,
                remainingBalance: l.remainingBalance,
                dueDate: l.dueDate,
            }));

        return NextResponse.json({
            totalLent,
            totalCollected,
            totalEarnings: totalToPay - totalLent,
            activeLoans,
            paidLoans,
            overdueLoans,
            pendingBalance: totalToPay - totalCollected,
            recentLoans,
            overdueList,
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
    }
}
