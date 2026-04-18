import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const userId = (session.user as any).id;

        // Intentar leer licenseExpiresAt; si no existe aún (pre prisma generate), devuelve null
        let licenseExpiresAt: Date | null = null;
        try {
            const user = await (prisma.user.findUnique as any)({
                where: { id: userId },
                select: { licenseExpiresAt: true },
            });
            licenseExpiresAt = user?.licenseExpiresAt ?? null;
        } catch {
            // Campo no disponible aún — ignorar
        }

        return NextResponse.json({ licenseExpiresAt });
    } catch (error) {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
