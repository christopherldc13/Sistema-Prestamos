import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPlan } from "@/lib/plans";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const clients = await prisma.client.findMany({
            where: { userId },
            include: {
                loans: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(clients);
    } catch (error) {
        console.error("Error fetching clients:", error);
        return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Verificar límite de clientes según plan
        try {
            const user = await (prisma.user.findUnique as any)({
                where: { id: userId },
                select: { subscriptionPlan: true },
            });
            const plan = getPlan(user?.subscriptionPlan ?? "basic");
            if (plan.maxClients !== -1) {
                const clientCount = await prisma.client.count({ where: { userId } });
                if (clientCount >= plan.maxClients) {
                    return NextResponse.json({
                        error: `Tu plan ${plan.name} permite máximo ${plan.maxClients} clientes. Actualiza tu plan para agregar más.`,
                        limitReached: true,
                        currentPlan: plan.id,
                    }, { status: 403 });
                }
            }
        } catch {
            // Si el campo no existe aún, continuar sin restricción
        }

        const body = await req.json();
        const { fullName, idNumber, phone, address, email } = body;

        if (!fullName || !idNumber || !phone || !address) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        const client = await prisma.client.create({
            data: {
                fullName,
                idNumber,
                phone,
                address,
                email,
                userId,
            },
        });

        return NextResponse.json(client, { status: 201 });
    } catch (error: any) {
        console.error("Error creating client:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ya existe un cliente con esta identificación o email en su cuenta" }, { status: 400 });
        }
        return NextResponse.json({ error: "Error al registrar cliente" }, { status: 500 });
    }
}
