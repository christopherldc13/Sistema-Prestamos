import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash, compare } from "bcryptjs";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { currentPassword, newPassword } = await req.json();
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

        const valid = await compare(currentPassword, user.password);
        if (!valid) {
            return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { password: await hash(newPassword, 12) },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Error al cambiar la contraseña" }, { status: 500 });
    }
}
