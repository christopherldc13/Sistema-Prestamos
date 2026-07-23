import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import { generateRandomPassword } from "@/lib/password";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "superadmin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        // Intentar incluir campos nuevos; si Prisma no los conoce aún, usar select base
        let users: any[];
        try {
            users = await (prisma.user.findMany as any)({
                orderBy: { createdAt: "desc" },
                select: {
                    id: true, name: true, email: true, phone: true,
                    role: true, isActive: true, licenseExpiresAt: true,
                    subscriptionPlan: true, createdAt: true,
                    maxClients: true, maxActiveLoans: true, maxPaymentHistory: true,
                    hasContractPDF: true, hasStatementPDF: true, hasFrenchAmortization: true,
                    hasAmortizationTable: true, hasAdvancedReports: true, hasExport: true,
                    hasCustomBranding: true, planPrice: true,
                    _count: { select: { clients: true, loans: true } },
                },
            });
        } catch {
            users = await prisma.user.findMany({
                orderBy: { createdAt: "desc" },
                select: {
                    id: true, name: true, email: true,
                    role: true, isActive: true, createdAt: true,
                    _count: { select: { clients: true, loans: true } },
                },
            });
        }

        const usersWithStats = await Promise.all(
            users.map(async (u: any) => {
                const loanAgg = await prisma.loan.aggregate({
                    where: { userId: u.id },
                    _sum: { amount: true, remainingBalance: true },
                });
                const activeLoans = await prisma.loan.count({
                    where: { userId: u.id, status: "active" },
                });
                const overdueLoans = await prisma.loan.count({
                    where: { userId: u.id, status: "overdue" },
                });

                return {
                    ...u,
                    phone: u.phone ?? null,
                    licenseExpiresAt: u.licenseExpiresAt ?? null,
                    subscriptionPlan: u.subscriptionPlan ?? "basic",
                    stats: {
                        clients: u._count?.clients ?? 0,
                        loans: u._count?.loans ?? 0,
                        activeLoans,
                        overdueLoans,
                        portfolio: loanAgg._sum.amount ?? 0,
                        pendingBalance: loanAgg._sum.remainingBalance ?? 0,
                    },
                };
            })
        );

        return NextResponse.json(usersWithStats);
    } catch (error) {
        console.error("Error superadmin GET users:", error);
        return NextResponse.json({ error: "Error obteniendo usuarios" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "superadmin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { email, name, role } = body;

        if (!email) {
            return NextResponse.json({ error: "El correo es obligatorio" }, { status: 400 });
        }

        // La contraseña la genera el sistema — el Maestro nunca la escribe ni la ve,
        // se le envía únicamente al usuario nuevo por correo.
        const plainPassword = generateRandomPassword();
        const hashedPassword = await hash(plainPassword, 12);

        const createData: any = {
            email,
            password: hashedPassword,
            name: name || null,
            role: role || "admin",
            isActive: true,
        };

        const extendedData: any = { ...createData };
        if (body.phone) extendedData.phone = body.phone;
        if (body.licenseExpiresAt) extendedData.licenseExpiresAt = new Date(body.licenseExpiresAt);
        if (body.subscriptionPlan) extendedData.subscriptionPlan = body.subscriptionPlan;
        const PLAN_OVERRIDE_FIELDS = [
            "maxClients", "maxActiveLoans", "maxPaymentHistory",
            "hasContractPDF", "hasStatementPDF", "hasFrenchAmortization",
            "hasAmortizationTable", "hasAdvancedReports", "hasExport",
            "hasCustomBranding", "planPrice",
        ] as const;
        for (const key of PLAN_OVERRIDE_FIELDS) {
            if (body[key] !== undefined) extendedData[key] = body[key];
        }

        let user;
        try {
            user = await prisma.user.create({ data: extendedData });
        } catch (extErr: any) {
            if (extErr?.message?.includes("Unknown argument")) {
                user = await prisma.user.create({ data: createData });
            } else {
                throw extErr;
            }
        }

        let emailSent = true;
        try {
            await sendWelcomeEmail({ name: user.name || "", email: user.email, password: plainPassword });
        } catch (emailError) {
            console.error("Error enviando correo de bienvenida:", emailError);
            emailSent = false;
        }

        return NextResponse.json({
            id: user.id, name: user.name, email: user.email,
            role: user.role, isActive: user.isActive, createdAt: user.createdAt,
            emailSent,
            // Solo se devuelve la contraseña cuando el correo falló, para que el Maestro
            // pueda comunicarla manualmente — si el correo se envió, no hace falta exponerla.
            ...(emailSent ? {} : { generatedPassword: plainPassword }),
        }, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") return NextResponse.json({ error: "El correo ya está en uso" }, { status: 400 });
        console.error("Error superadmin POST user:", error);
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }
}
