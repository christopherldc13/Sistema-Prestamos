import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isOverdue } from "@/lib/loan-calculator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
