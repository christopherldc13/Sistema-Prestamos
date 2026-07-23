export type PlanId = "basic" | "intermediate" | "premium";

export interface PlanFeatures {
  id: PlanId | "custom";
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
  // Precios mensual
  price: string;
  priceNote: string;
  // Precios anual (2 meses gratis)
  priceAnnual: string;
  priceAnnualNote: string;
  priceAnnualSaving: string;
  color: string;
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
    price: "RD$ 500",
    priceNote: "/mes",
    priceAnnual: "RD$ 5,000",
    priceAnnualNote: "/año",
    priceAnnualSaving: "Ahorras RD$ 1,000",
    color: "#6b7280",
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
    price: "RD$ 950",
    priceNote: "/mes",
    priceAnnual: "RD$ 9,500",
    priceAnnualNote: "/año",
    priceAnnualSaving: "Ahorras RD$ 1,900",
    color: "#3b82f6",
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
    price: "RD$ 1,800",
    priceNote: "/mes",
    priceAnnual: "RD$ 18,000",
    priceAnnualNote: "/año",
    priceAnnualSaving: "Ahorras RD$ 3,600",
    color: "#a855f7",
    badge: "Pro",
  },
};

export function getPlan(planId: string): PlanFeatures {
  return PLANS[planId as PlanId] ?? PLANS.basic;
}

export function formatLimit(limit: number): string {
  return limit === -1 ? "Ilimitado" : String(limit);
}

// ── Personalización por usuario ──
// Un usuario puede desviarse de su plantilla (subscriptionPlan) en cualquiera de estos
// campos. Si el campo es null/undefined en la base de datos, se hereda el valor de la
// plantilla. Esto mantiene compatibilidad total con usuarios existentes (todos los campos
// de override en null = se comportan exactamente como su plan de siempre).
export const PLAN_OVERRIDE_KEYS = [
  "maxClients",
  "maxActiveLoans",
  "maxPaymentHistory",
  "hasContractPDF",
  "hasStatementPDF",
  "hasFrenchAmortization",
  "hasAmortizationTable",
  "hasAdvancedReports",
  "hasExport",
  "hasCustomBranding",
] as const;

export type PlanOverrideKey = (typeof PLAN_OVERRIDE_KEYS)[number];

export interface UserPlanOverrides {
  maxClients?: number | null;
  maxActiveLoans?: number | null;
  maxPaymentHistory?: number | null;
  hasContractPDF?: boolean | null;
  hasStatementPDF?: boolean | null;
  hasFrenchAmortization?: boolean | null;
  hasAmortizationTable?: boolean | null;
  hasAdvancedReports?: boolean | null;
  hasExport?: boolean | null;
  hasCustomBranding?: boolean | null;
  planPrice?: number | null;
}

/**
 * Resuelve el plan real de un usuario: parte de la plantilla (subscriptionPlan) y aplica
 * cualquier override individual que el Maestro haya configurado para ese usuario.
 * Si hay al menos un override activo, el plan resultante se marca como "Personalizado".
 */
export function resolveUserPlan(
  user: { subscriptionPlan?: string | null } & UserPlanOverrides
): PlanFeatures {
  const base = getPlan(user.subscriptionPlan ?? "basic");
  const isCustom = PLAN_OVERRIDE_KEYS.some(
    (key) => user[key] !== null && user[key] !== undefined
  );

  const resolved: PlanFeatures = { ...base };
  for (const key of PLAN_OVERRIDE_KEYS) {
    const value = user[key];
    if (value !== null && value !== undefined) {
      (resolved as any)[key] = value;
    }
  }

  if (user.planPrice !== null && user.planPrice !== undefined) {
    resolved.price = `RD$ ${user.planPrice.toLocaleString("es-DO")}`;
    resolved.priceNote = "/mes";
    resolved.priceAnnual = "—";
    resolved.priceAnnualNote = "";
    resolved.priceAnnualSaving = "";
  }

  if (isCustom) {
    resolved.id = "custom";
    resolved.name = "Personalizado";
    resolved.tagline = "Plan a la medida configurado por el administrador";
    resolved.badge = undefined;
  }

  return resolved;
}
