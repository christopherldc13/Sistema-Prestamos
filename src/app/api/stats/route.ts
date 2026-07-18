import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOverdueInfo } from "@/lib/loan-calculator";
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

        const settings = await prisma.settings.findUnique({ where: { userId } });
        const lateFeeRules = (settings?.value as any)?.lateFeeRules || [];

        const overdueUpdates: Promise<any>[] = [];
        let totalAccumulatedLateFees = 0;

        for (const loan of loans) {
            (loan as any).accumulatedLateFee = 0;
            if (loan.status === "paid") continue;

            const schedule = (loan as any).paymentSchedule || [];
            const overdueInfo = getOverdueInfo(schedule, loan.totalToPay, loan.remainingBalance, loan.amount, lateFeeRules);
            const newStatus = overdueInfo.isOverdue ? "overdue" : "active";

            if (loan.status !== newStatus) {
                overdueUpdates.push(
                    prisma.loan.update({ where: { id: loan.id }, data: { status: newStatus } })
                );
                (loan as any).status = newStatus;
            }

            if (overdueInfo.isOverdue) {
                (loan as any).accumulatedLateFee = overdueInfo.lateFee;
                totalAccumulatedLateFees += overdueInfo.lateFee;
            }
        }
        if (overdueUpdates.length > 0) await Promise.all(overdueUpdates);

        const totalLent      = loans.reduce((acc, l) => acc + l.amount, 0);
        const totalToPay     = loans.reduce((acc, l) => acc + l.totalToPay, 0);
        const totalCollected = loans.reduce((acc, l) => acc + l.payments.reduce((s, p) => s + p.amount, 0), 0);
        // Mora ya cobrada históricamente en TODOS los préstamos (pagada, no solo la pendiente actual)
        const totalMoraCollected = loans.reduce((acc, l) => acc + l.payments.reduce((s, p) => s + ((p as any).lateFeeAmount || 0), 0), 0);
        // Saldo pendiente real = suma del saldo de cada préstamo (ya excluye mora) + mora actualmente sin cobrar
        const totalRemainingBalance = loans.reduce((acc, l) => acc + l.remainingBalance, 0);

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
                remainingBalance: l.remainingBalance + (l as any).accumulatedLateFee,
                accumulatedLateFee: (l as any).accumulatedLateFee,
                dueDate: l.dueDate,
            }));

        return NextResponse.json({
            totalLent,
            totalCollected,
            totalEarnings: (totalToPay - totalLent) + totalMoraCollected,
            totalMoraCollected,
            activeLoans,
            paidLoans,
            overdueLoans,
            pendingBalance: totalRemainingBalance + totalAccumulatedLateFees,
            totalAccumulatedLateFees,
            recentLoans,
            overdueList,
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
    }
}
