import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "superadmin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { isActive, role, name } = body;

        const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: {
                ...(isActive !== undefined && { isActive }),
                ...(role !== undefined && { role }),
                ...(name !== undefined && { name }),
            },
            select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
    }
}
