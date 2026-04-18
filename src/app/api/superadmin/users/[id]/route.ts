import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";

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

        // ── Campos que SIEMPRE existen en el schema ──
        const safeData: any = {};
        if (body.isActive !== undefined) safeData.isActive = body.isActive;
        if (body.role     !== undefined) safeData.role     = body.role;
        if (body.name     !== undefined) safeData.name     = body.name;
        if (body.newPassword) safeData.password = await hash(body.newPassword, 12);

        // ── Campos NUEVOS que requieren "npx prisma generate" ──
        const hasNewFields = body.phone !== undefined || body.licenseExpiresAt !== undefined;

        if (hasNewFields) {
            const newFieldsData: any = { ...safeData };
            if (body.phone !== undefined) newFieldsData.phone = body.phone || null;
            if (body.licenseExpiresAt !== undefined) {
                newFieldsData.licenseExpiresAt = body.licenseExpiresAt
                    ? new Date(body.licenseExpiresAt)
                    : null;
            }

            try {
                const u = await prisma.user.update({
                    where: { id: params.id },
                    data: newFieldsData,
                });
                return NextResponse.json(userToJSON(u));
            } catch (e: any) {
                if (e?.message?.includes("Unknown argument")) {
                    // prisma generate no se ha corrido — devolver error descriptivo
                    return NextResponse.json(
                        { error: "Debes correr 'npx prisma generate && npx prisma db push' para usar campos de licencia." },
                        { status: 422 }
                    );
                }
                throw e;
            }
        }

        // ── Update normal con campos seguros ──
        if (Object.keys(safeData).length === 0) {
            return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: safeData,
        });

        return NextResponse.json(userToJSON(updatedUser));
    } catch (error: any) {
        console.error("PUT user error:", error?.message ?? error);
        return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "superadmin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const target = await prisma.user.findUnique({ where: { id: params.id } });
        if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        if (target.role === "superadmin") {
            return NextResponse.json({ error: "No puedes eliminar al superadmin" }, { status: 403 });
        }
        await prisma.user.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE user error:", error?.message ?? error);
        return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
    }
}

function userToJSON(u: any) {
    return {
        id: u.id, name: u.name, email: u.email,
        role: u.role, isActive: u.isActive, createdAt: u.createdAt,
    };
}
