import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hash } from "bcryptjs";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "superadmin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
        });
        return NextResponse.json(users);
    } catch (error) {
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
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || "admin",
                isActive: true
            },
            select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') return NextResponse.json({ error: "El correo ya está en uso" }, { status: 400 });
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }
}
