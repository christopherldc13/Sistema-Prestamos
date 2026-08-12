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

        if (loan.status !== "paid" && loan.status !== "refinanced") {
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

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const existing = await prisma.loan.findUnique({ where: { id: params.id } });
        if (!existing || existing.userId !== userId) {
            return NextResponse.json({ error: "Préstamo no encontrado o inaccesible" }, { status: 404 });
        }

        const body = await req.json();
        const data: any = {};
        if (body.status !== undefined) data.status = body.status;

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
        }

        const loan = await prisma.loan.update({ where: { id: params.id }, data });
        return NextResponse.json(loan);
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar el préstamo" }, { status: 500 });
    }
}
