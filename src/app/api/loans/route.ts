import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const loans = await prisma.loan.findMany({
            include: {
                client: true,
                payments: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(loans);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener préstamos" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            clientId,
            amount,
            interestRate,
            term,
            termUnit,
            interestType,
            startDate
        } = body;

        if (!clientId || !amount || !interestRate || !term || !termUnit) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        // Logic for interest calculation
        let totalToPay = 0;
        const p = parseFloat(amount);
        const r = parseFloat(interestRate) / 100;
        const t = parseInt(term);

        if (interestType === "simple") {
            // Simple: I = P * r * t
            const interest = p * r * t;
            totalToPay = p + interest;
        } else {
            // Compound: A = P * (1 + r)^t
            totalToPay = p * Math.pow((1 + r), t);
        }

        const loan = await prisma.loan.create({
            data: {
                amount: p,
                interestRate: parseFloat(interestRate),
                term: t,
                termUnit,
                interestType,
                startDate: new Date(startDate || Date.now()),
                totalToPay: parseFloat(totalToPay.toFixed(2)),
                remainingBalance: parseFloat(totalToPay.toFixed(2)),
                clientId,
            },
        });

        return NextResponse.json(loan, { status: 201 });
    } catch (error) {
        console.error("Error creating loan:", error);
        return NextResponse.json({ error: "Error al crear el préstamo" }, { status: 500 });
    }
}
