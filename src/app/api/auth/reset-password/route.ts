import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const { token, newPassword } = await req.json();
        if (!token || !newPassword) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }
        if (typeof newPassword !== "string" || newPassword.length < 6) {
            return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

        if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
            return NextResponse.json({ error: "El enlace es inválido o ya venció. Solicita uno nuevo." }, { status: 400 });
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: await hash(newPassword, 12) },
            }),
            prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Error al restablecer la contraseña" }, { status: 500 });
    }
}
