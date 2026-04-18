import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function GET() {
    try {
        const hashedPassword = await hash("admin123", 12);

        // 1. Create or ensure Superadmin exists
        const superadmin = await prisma.user.upsert({
            where: { email: "christopherlantiguadelacruz@gmail.com" },
            update: {
                password: hashedPassword,
                role: "superadmin",
                isActive: true,
            },
            create: {
                email: "christopherlantiguadelacruz@gmail.com",
                password: hashedPassword,
                name: "Christopher L",
                role: "superadmin",
                isActive: true,
            },
        });

        // 2. Assign all orphaned clients to Superadmin
        const clientsUpdate = await prisma.client.updateMany({
            where: { userId: null },
            data: { userId: superadmin.id }
        });

        // 3. Assign all orphaned loans to Superadmin
        const loansUpdate = await prisma.loan.updateMany({
            where: { userId: null },
            data: { userId: superadmin.id }
        });

        // 4. Assign orphaned settings to Superadmin
        const settingsUpdate = await prisma.settings.updateMany({
            where: { userId: null },
            data: { userId: superadmin.id }
        });

        return NextResponse.json({
            message: "Setup Multi-tenant completado",
            superadmin: superadmin.email,
            migratedClients: clientsUpdate.count,
            migratedLoans: loansUpdate.count,
            migratedSettings: settingsUpdate.count,
        });
    } catch (error: any) {
        console.error("Setup error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
