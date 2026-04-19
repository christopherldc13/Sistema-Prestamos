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

        let licenseExpiresAt: Date | null = null;
        let subscriptionPlan: string = "basic";
        try {
            const user = await (prisma.user.findUnique as any)({
                where: { id: userId },
                select: { licenseExpiresAt: true, subscriptionPlan: true },
            });
            licenseExpiresAt = user?.licenseExpiresAt ?? null;
            subscriptionPlan = user?.subscriptionPlan ?? "basic";
        } catch {
            // Campo no disponible aún — ignorar
        }

        return NextResponse.json({ licenseExpiresAt, subscriptionPlan });
    } catch (error) {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
