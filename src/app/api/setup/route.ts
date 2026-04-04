import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function GET() {
    try {
        const hashedPassword = await hash("admin", 12);

        const admin = await prisma.user.upsert({
            where: { email: "admin@usuario.com" },
            update: {
                password: hashedPassword,
                role: "admin",
            },
            create: {
                email: "admin@usuario.com",
                password: hashedPassword,
                name: "Admin Sistema",
                role: "admin",
            },
        });

        return NextResponse.json({
            message: "Admin actualizado con contraseña bcrypt",
            user: { email: admin.email, password: "admin" }
        });
    } catch (error: any) {
        console.error("Setup error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
