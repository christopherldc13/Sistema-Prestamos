"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getPlan, type PlanFeatures, type PlanId } from "@/lib/plans";

interface UserPlanContextValue {
    subscriptionPlan: PlanId;
    plan: PlanFeatures;
    licenseExpiresAt: string | null;
    loading: boolean;
    refresh: () => Promise<void>;
}

const UserPlanContext = createContext<UserPlanContextValue | undefined>(undefined);

export function UserPlanProvider({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const [subscriptionPlan, setSubscriptionPlan] = useState<PlanId>("basic");
    const [plan, setPlan] = useState<PlanFeatures>(getPlan("basic"));
    const [licenseExpiresAt, setLicenseExpiresAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch("/api/me");
            if (res.ok) {
                const d = await res.json();
                if (d?.subscriptionPlan) setSubscriptionPlan(d.subscriptionPlan as PlanId);
                if (d?.plan) setPlan(d.plan as PlanFeatures);
                setLicenseExpiresAt(d?.licenseExpiresAt ?? null);
            }
        } catch {
            // se mantienen los valores por defecto
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Una sola llamada a /api/me por sesión, compartida por el Navbar y todas las páginas
        // (antes cada página la pedía por su cuenta, duplicando la petición en cada navegación)
        if (status === "authenticated") {
            refresh();
        } else if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status, refresh]);

    const value: UserPlanContextValue = {
        subscriptionPlan,
        plan,
        licenseExpiresAt,
        loading,
        refresh,
    };

    return <UserPlanContext.Provider value={value}>{children}</UserPlanContext.Provider>;
}

export function useUserPlan() {
    const ctx = useContext(UserPlanContext);
    if (!ctx) throw new Error("useUserPlan debe usarse dentro de <UserPlanProvider>");
    return ctx;
}
