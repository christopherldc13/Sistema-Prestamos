import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const client = await prisma.client.findUnique({
            where: { id },
            include: { loans: { include: { payments: true }, orderBy: { createdAt: 'desc' } } },
        });
        if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
        return NextResponse.json(client);
    } catch (error) {
        return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await req.json();
        const { fullName, idNumber, phone, address, email } = body;

        const updatedClient = await prisma.client.update({
            where: { id },
            data: { fullName, idNumber, phone, address, email },
        });

        return NextResponse.json(updatedClient);
    } catch (error: any) {
        console.error("Error updating client:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ya existe un cliente con esta identificación" }, { status: 400 });
        }
        return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if client has loans
        const clientWithLoans = await prisma.client.findUnique({
            where: { id },
            include: { loans: true }
        });

        if (clientWithLoans?.loans?.length && clientWithLoans.loans.length > 0) {
            return NextResponse.json({ error: "No se puede eliminar un cliente con préstamos registrados" }, { status: 400 });
        }

        await prisma.client.delete({ where: { id } });
        return NextResponse.json({ message: "Cliente eliminado correctamente" });
    } catch (error) {
        console.error("Error deleting client:", error);
        return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
    }
}
