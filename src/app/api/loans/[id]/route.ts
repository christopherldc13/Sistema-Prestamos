import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isOverdue } from "@/lib/loan-calculator";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const loan = await prisma.loan.findUnique({
            where: { id: params.id },
            include: {
                client: true,
                payments: {
                    orderBy: { date: "desc" }
                },
            },
        });

        if (!loan) {
            return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 });
        }

        // Auto-actualizar status a overdue si la fecha de vencimiento ya pasó
        const loanAny = loan as any;
        if (loan.status === "active" && isOverdue(loanAny.dueDate, loan.status)) {
            await prisma.loan.update({ where: { id: loan.id }, data: { status: "overdue" } });
            loanAny.status = "overdue";
        }

        return NextResponse.json(loan);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener el préstamo" }, { status: 500 });
    }
}
