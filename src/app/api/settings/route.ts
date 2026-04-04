import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.settings.findUnique({
            where: { key: "company_config" }
        });
        
        if (!settings) {
            // Default config if none exists
            const defaultConfig = {
                brand: "FACT-PREST",
                name: "FACT-PREST SRL",
                slogan: "SOLUCIONES FINANCIERAS",
                address: "AV. PRINCIPAL #1, 1ER NIVEL",
                phone: "809-000-0000"
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
        const body = await req.json();
        
        const settings = await prisma.settings.upsert({
            where: { key: "company_config" },
            update: { value: body },
            create: {
                key: "company_config",
                value: body
            }
        });
        
        return NextResponse.json(settings.value);
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Error al actualizar la configuración" }, { status: 500 });
    }
}
