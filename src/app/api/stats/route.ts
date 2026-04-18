import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isOverdue } from "@/lib/loan-calculator";

export async function GET() {
    try {
        const loans = await prisma.loan.findMany({
            include: { payments: true },
        });

        // Detectar y actualizar vencidos en tiempo real
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

        const totalLent = loans.reduce((acc, l) => acc + l.amount, 0);
        const totalToPay = loans.reduce((acc, l) => acc + l.totalToPay, 0);
        const totalCollected = loans.reduce((acc, l) => {
            return acc + l.payments.reduce((pAcc, p) => pAcc + p.amount, 0);
        }, 0);

        const activeLoans  = loans.filter(l => l.status === "active").length;
        const paidLoans    = loans.filter(l => l.status === "paid").length;
        const overdueLoans = loans.filter(l => l.status === "overdue").length;

        return NextResponse.json({
            totalLent,
            totalCollected,
            totalEarnings: totalToPay - totalLent,
            activeLoans,
            paidLoans,
            overdueLoans,
            pendingBalance: totalToPay - totalCollected,
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
    }
}
