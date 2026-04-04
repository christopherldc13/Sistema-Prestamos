import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
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

        return NextResponse.json(loan);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener el préstamo" }, { status: 500 });
    }
}
