import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    const debugInfo = {
        env: {
            NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "Set (ends with " + process.env.NEXTAUTH_URL.slice(-5) + ")" : "MISSING",
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set (length: " + process.env.NEXTAUTH_SECRET.length + ")" : "MISSING",
            DATABASE_URL: process.env.DATABASE_URL ? "Set (starts with " + process.env.DATABASE_URL.slice(0, 15) + "...)" : "MISSING",
            VERCEL_URL: process.env.VERCEL_URL || "MISSING",
        },
        database: {
            status: "Checking...",
            error: null as any,
            userCount: 0,
            adminUser: null as any,
        }
    };

    try {
        // Test database connection
        const count = await prisma.user.count();
        debugInfo.database.status = "CONNECTED";
        debugInfo.database.userCount = count;

        // Check for admin
        const admin = await prisma.user.findFirst({
            where: { role: "admin" }
        });
        debugInfo.database.adminUser = admin ? {
            id: admin.id,
            email: admin.email,
            role: admin.role,
        } : "NOT FOUND";

    } catch (err: any) {
        debugInfo.database.status = "ERROR";
        debugInfo.database.error = err.message || err;
    }

    return NextResponse.json(debugInfo);
}
