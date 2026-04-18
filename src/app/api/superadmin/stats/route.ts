import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "superadmin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const [totalAdmins, activeAdmins, totalClients, totalLoans, activeLoans, overdueLoans] = await Promise.all([
            prisma.user.count({ where: { role: "admin" } }),
            prisma.user.count({ where: { role: "admin", isActive: true } }),
            prisma.client.count(),
            prisma.loan.count(),
            prisma.loan.count({ where: { status: "active" } }),
            prisma.loan.count({ where: { status: "overdue" } }),
        ]);

        const loansAgg = await prisma.loan.aggregate({
            _sum: { amount: true, remainingBalance: true },
        });
        const totalPortfolio = loansAgg._sum.amount ?? 0;
        const pendingBalance = loansAgg._sum.remainingBalance ?? 0;

        // Licencias: intentar solo si los campos existen en el cliente (tras prisma generate)
        let expiringCount = 0;
        let expiredCount = 0;
        try {
            const now = new Date();
            expiringCount = await (prisma.user.count as any)({
                where: {
                    role: "admin",
                    isActive: true,
                    licenseExpiresAt: {
                        gte: now,
                        lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    },
                },
            });
            expiredCount = await (prisma.user.count as any)({
                where: { role: "admin", licenseExpiresAt: { lt: now } },
            });
        } catch {
            // licenseExpiresAt no existe aún en el cliente — ignorar
        }

        return NextResponse.json({
            totalAdmins,
            activeAdmins,
            inactiveAdmins: totalAdmins - activeAdmins,
            totalClients,
            totalLoans,
            activeLoans,
            overdueLoans,
            totalPortfolio,
            pendingBalance,
            expiringCount,
            expiredCount,
        });
    } catch (error) {
        console.error("Error superadmin stats:", error);
        return NextResponse.json({ error: "Error obteniendo estadísticas" }, { status: 500 });
    }
}
