import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const userId = (session.user as any).id;

        const settings = await prisma.settings.findUnique({
            where: { userId }
        });
        
        if (!settings) {
            // Default config if none exists for this tenant
            const defaultConfig = {
                brand: "MI NEGOCIO",
                name: "EMPRESA SRL",
                slogan: "Servicios Financieros",
                address: "-",
                phone: "-"
            };
            return NextResponse.json(defaultConfig);
        }
        
        return NextResponse.json(settings.value);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Error al obtener la configuración" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const userId = (session.user as any).id;

        const body = await req.json();
        
        const settings = await prisma.settings.upsert({
            where: { userId },
            update: { value: body },
            create: {
                userId,
                value: body
            }
        });
        
        return NextResponse.json(settings.value);
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Error al actualizar la configuración" }, { status: 500 });
    }
}
