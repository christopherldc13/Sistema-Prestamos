import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

const GENERIC_RESPONSE = {
    success: true,
    message: "Si ese correo tiene una cuenta registrada, te enviamos un enlace para restablecer tu contraseña.",
};

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Correo requerido" }, { status: 400 });
        }

        const emailTrimmed = email.trim().toLowerCase();

        // Siempre respondemos igual exista o no la cuenta, para no revelar qué correos están registrados.
        try {
            const user = await prisma.user.findUnique({ where: { email: emailTrimmed } });

            if (user && user.isActive !== false) {
                // Invalidar cualquier token anterior sin usar de este usuario
                await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

                const rawToken = crypto.randomBytes(32).toString("hex");
                const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
                const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

                await prisma.passwordResetToken.create({
                    data: { userId: user.id, tokenHash, expiresAt },
                });

                const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
                const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

                await sendPasswordResetEmail(user.email, resetUrl);
            }
        } catch (innerError) {
            console.error("Error procesando solicitud de restablecimiento:", innerError);
            // No se filtra el error al cliente — misma respuesta genérica de siempre
        }

        return NextResponse.json(GENERIC_RESPONSE);
    } catch {
        return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
    }
}
