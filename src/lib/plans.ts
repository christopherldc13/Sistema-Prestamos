export type PlanId = "basic" | "intermediate" | "premium";

export interface PlanFeatures {
  id: PlanId;
  name: string;
  tagline: string;
  // Límites numéricos (-1 = ilimitado)
  maxClients: number;
  maxActiveLoans: number;
  maxPaymentHistory: number;
  // Funciones de documentos
  hasContractPDF: boolean;
  hasStatementPDF: boolean;
  // Cálculo y análisis
  hasFrenchAmortization: boolean;
  hasAmortizationTable: boolean;
  hasAdvancedReports: boolean;
  hasExport: boolean;
  // Personalización
  hasCustomBranding: boolean;
  // Presentación
  price: string;
  priceNote: string;
  color: string;
  gradient: string;
  badge?: string;
}

export const PLANS: Record<PlanId, PlanFeatures> = {
  basic: {
    id: "basic",
    name: "Básico",
    tagline: "Ideal para comenzar",
    maxClients: 25,
    maxActiveLoans: 15,
    maxPaymentHistory: 5,
    hasContractPDF: false,
    hasStatementPDF: false,
    hasFrenchAmortization: false,
    hasAmortizationTable: false,
    hasAdvancedReports: false,
    hasExport: false,
    hasCustomBranding: false,
    price: "RD$ 800",
    priceNote: "/mes",
    color: "#6b7280",
    gradient: "linear-gradient(135deg, #374151, #4b5563)",
  },
  intermediate: {
    id: "intermediate",
    name: "Intermedio",
    tagline: "Para negocios en crecimiento",
    maxClients: 100,
    maxActiveLoans: 60,
    maxPaymentHistory: 30,
    hasContractPDF: true,
    hasStatementPDF: false,
    hasFrenchAmortization: false,
    hasAmortizationTable: true,
    hasAdvancedReports: true,
    hasExport: false,
    hasCustomBranding: true,
    price: "RD$ 1,500",
    priceNote: "/mes",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
    badge: "Popular",
  },
  premium: {
    id: "premium",
    name: "Premium",
    tagline: "Máxima potencia sin límites",
    maxClients: -1,
    maxActiveLoans: -1,
    maxPaymentHistory: -1,
    hasContractPDF: true,
    hasStatementPDF: true,
    hasFrenchAmortization: true,
    hasAmortizationTable: true,
    hasAdvancedReports: true,
    hasExport: true,
    hasCustomBranding: true,
    price: "RD$ 3,000",
    priceNote: "/mes",
    color: "#a855f7",
    gradient: "linear-gradient(135deg, #7c3aed, #a855f7)",
    badge: "Pro",
  },
};

export function getPlan(planId: string): PlanFeatures {
  return PLANS[planId as PlanId] ?? PLANS.basic;
}

export function formatLimit(limit: number): string {
  return limit === -1 ? "Ilimitado" : String(limit);
}
