"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // El estado inicial siempre es "dark" para que el primer render del cliente
    // coincida exactamente con el HTML del servidor (evita error de hidratación).
    // El script anti-flash en layout.tsx ya dejó el data-theme correcto en el DOM
    // antes de hidratar; el efecto de abajo solo sincroniza el estado de React con eso.
    const [theme, setThemeState] = useState<Theme>("dark");
    const hasSyncedFromDom = useRef(false);

    useEffect(() => {
        const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
        setThemeState(current);
    }, []);

    useEffect(() => {
        // La primera pasada solo refleja lo que el script anti-flash ya aplicó;
        // no se debe reescribir para no pisar ese valor con el "dark" inicial.
        if (!hasSyncedFromDom.current) {
            hasSyncedFromDom.current = true;
            return;
        }
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        try { window.localStorage.setItem("theme", t); } catch {}
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState(prev => {
            const next: Theme = prev === "dark" ? "light" : "dark";
            try { window.localStorage.setItem("theme", next); } catch {}
            return next;
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
    return ctx;
}
