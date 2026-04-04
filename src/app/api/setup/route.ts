import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const userCount = await prisma.user.count();

        if (userCount > 0) {
            return NextResponse.json({ message: "El sistema ya tiene usuarios registrados." });
        }

        const admin = await prisma.user.create({
            data: {
                email: "admin@lumina.com",
                password: "admin", // En producción usa bcrypt
                name: "Admin Lumina",
                role: "admin",
            },
        });

        return NextResponse.json({
            message: "Admin creado con éxito",
            user: { email: admin.email, password: "admin" }
        });
    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json({ error: "Error en la inicialización" }, { status: 500 });
    }
}
