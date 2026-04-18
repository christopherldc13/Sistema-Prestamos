import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "superadmin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        // Usar solo campos que existen en el schema actual del cliente Prisma
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: { clients: true, loans: true },
                },
            },
        });

        // Agregar stats de portfolio por admin
        const usersWithStats = await Promise.all(
            users.map(async (u) => {
                const loanAgg = await prisma.loan.aggregate({
                    where: { userId: u.id },
                    _sum: { amount: true, remainingBalance: true },
                });
                const activeLoans = await prisma.loan.count({
                    where: { userId: u.id, status: "active" },
                });
                const overdueLoans = await prisma.loan.count({
                    where: { userId: u.id, status: "overdue" },
                });

                // Intentar leer campos nuevos si existen (después de prisma generate)
                const raw = u as any;

                return {
                    ...u,
                    phone: raw.phone ?? null,
                    licenseExpiresAt: raw.licenseExpiresAt ?? null,
                    stats: {
                        clients: u._count.clients,
                        loans: u._count.loans,
                        activeLoans,
                        overdueLoans,
                        portfolio: loanAgg._sum.amount ?? 0,
                        pendingBalance: loanAgg._sum.remainingBalance ?? 0,
                    },
                };
            })
        );

        return NextResponse.json(usersWithStats);
    } catch (error) {
        console.error("Error superadmin GET users:", error);
        return NextResponse.json({ error: "Error obteniendo usuarios" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "superadmin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { email, password, name, role } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
        }

        const hashedPassword = await hash(password, 12);

        // Construir data base (siempre funciona sin generate)
        const createData: any = {
            email,
            password: hashedPassword,
            name: name || null,
            role: role || "admin",
            isActive: true,
        };

        // Intentar con campos nuevos primero; si falla, usar solo campos base
        const extendedData: any = { ...createData };
        if (body.phone) extendedData.phone = body.phone;
        if (body.licenseExpiresAt) extendedData.licenseExpiresAt = new Date(body.licenseExpiresAt);

        let user;
        try {
            user = await prisma.user.create({ data: extendedData });
        } catch (extErr: any) {
            if (extErr?.message?.includes("Unknown argument")) {
                user = await prisma.user.create({ data: createData });
            } else {
                throw extErr;
            }
        }

        return NextResponse.json({
            id: user.id, name: user.name, email: user.email,
            role: user.role, isActive: user.isActive, createdAt: user.createdAt,
        }, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") return NextResponse.json({ error: "El correo ya está en uso" }, { status: 400 });
        console.error("Error superadmin POST user:", error);
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }
}
