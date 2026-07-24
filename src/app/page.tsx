"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    ShieldCheck, ArrowRight, Sun, Moon, ReceiptText, Check,
    BarChart3, Users, CreditCard, FileText, Table2, ShieldAlert,
    Zap, Palette, LayoutDashboard, Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { PLANS, type PlanId } from "@/lib/plans";

const FEATURES = [
    { icon: Users, title: "Gestión de Clientes", text: "Registra y administra tu cartera de clientes con toda su información de contacto e historial." },
    { icon: CreditCard, title: "Préstamos flexibles", text: "Interés simple o amortización francesa, con cuotas fijas, plazos y tasas personalizadas." },
    { icon: ReceiptText, title: "Cobros y Abonos", text: "Registra pagos y lleva el control exacto de cada cuota, capital, interés y saldo pendiente." },
    { icon: ShieldAlert, title: "Mora automática", text: "Reglas de mora configurables por rango de días, con monto fijo o porcentaje, calculadas solas." },
    { icon: FileText, title: "Contratos en PDF", text: "Genera contratos de préstamo y reconocimiento de deuda listos para firmar en segundos." },
    { icon: Table2, title: "Recibos y Estados de Cuenta", text: "Comprobantes de pago y estados de cuenta profesionales, listos para compartir." },
    { icon: BarChart3, title: "Reportes y Analítica", text: "Visualiza la rentabilidad, cartera activa y tasa de cobro de tu negocio de un vistazo." },
    { icon: LayoutDashboard, title: "Dashboard en tiempo real", text: "Capital prestado, recaudación, ganancia y préstamos vencidos, siempre a la vista." },
    { icon: Zap, title: "Planes a la medida", text: "Cada negocio con su propio plan, límites y funciones — ajustables según lo que necesites." },
];

const STEPS = [
    { n: "01", title: "Registra tus clientes", text: "Carga la información de tus clientes una sola vez y reutilízala en cada préstamo." },
    { n: "02", title: "Crea el préstamo", text: "Define monto, tasa, plazo y tipo de interés — el sistema calcula la cuota y el cronograma." },
    { n: "03", title: "Cobra y da seguimiento", text: "Registra abonos, controla la mora y genera contratos y recibos sin salir del sistema." },
];

const PLAN_ORDER: PlanId[] = ["basic", "intermediate", "premium"];

const PLAN_HIGHLIGHTS: Record<PlanId, string[]> = {
    basic: ["Hasta 25 clientes", "Hasta 15 préstamos activos", "Reglas de mora"],
    intermediate: ["Hasta 100 clientes", "Contratos en PDF", "Reportes avanzados", "Marca personalizada"],
    premium: ["Clientes y préstamos ilimitados", "Amortización francesa", "Exportar datos", "Todo lo del plan Intermedio"],
};

const TRUST_ITEMS = [
    { icon: ShieldCheck, text: "Inicio de sesión seguro con Google" },
    { icon: Palette, text: "Modo claro y oscuro" },
    { icon: Sparkles, text: "Plan a la medida de tu negocio" },
];

export default function LandingPage() {
    const { data: session, status } = useSession();
    const { theme, toggleTheme } = useTheme();
    const isAuthenticated = status === "authenticated";
    const primaryHref = isAuthenticated ? (((session?.user as any)?.role === "superadmin") ? "/superadmin" : "/dashboard") : "/login";
    const primaryLabel = isAuthenticated ? "Ir al Dashboard" : "Iniciar Sesión";

    return (
        <div className="landing-viewer">
            <header className="landing-header">
                <div className="landing-header-inner">
                    <div className="landing-brand">
                        <span className="landing-brand-icon"><ShieldCheck size={18} /></span>
                        <span className="landing-brand-name">Fact-Prest</span>
                    </div>
                    <div className="landing-header-actions">
                        <button
                            className="landing-theme-toggle"
                            onClick={toggleTheme}
                            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo noche"}
                            aria-label="Cambiar tema"
                        >
                            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                        </button>
                        <Link href={primaryHref} className="landing-btn-login">
                            {primaryLabel}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="landing-main">
                {/* ── Hero ── */}
                <motion.section
                    className="landing-hero"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <div className="landing-eyebrow"><Zap size={13} /> Gestión de préstamos, simplificada</div>
                    <h1 className="landing-headline">Toma el control total de tu cartera de préstamos</h1>
                    <p className="landing-subtext">
                        Fact-Prest es la plataforma para gestionar clientes, préstamos, cobros y mora con claridad y seguridad —
                        todo desde un solo lugar.
                    </p>
                    <Link href={primaryHref} className="landing-btn-hero">
                        {primaryLabel} <ArrowRight size={18} />
                    </Link>

                    <div className="landing-trust-row">
                        {TRUST_ITEMS.map((t, i) => (
                            <div key={i} className="landing-trust-item">
                                <t.icon size={14} /> {t.text}
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* ── Features ── */}
                <motion.section
                    className="landing-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="landing-section-head">
                        <span className="landing-section-label">Todo en un solo lugar</span>
                        <h2>Todo lo que necesitas para gestionar tu negocio de préstamos</h2>
                    </div>
                    <div className="landing-features">
                        {FEATURES.map((f, i) => (
                            <div key={i} className="landing-feature-card">
                                <div className="landing-feature-icon"><f.icon size={20} /></div>
                                <h3>{f.title}</h3>
                                <p>{f.text}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* ── Cómo funciona ── */}
                <motion.section
                    className="landing-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="landing-section-head">
                        <span className="landing-section-label">Cómo funciona</span>
                        <h2>De cero a cobrando en tres pasos</h2>
                    </div>
                    <div className="landing-steps">
                        {STEPS.map((s, i) => (
                            <div key={i} className="landing-step-card">
                                <span className="landing-step-num">{s.n}</span>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* ── Planes ── */}
                <motion.section
                    className="landing-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="landing-section-head">
                        <span className="landing-section-label">Planes</span>
                        <h2>Un plan para cada etapa de tu negocio</h2>
                        <p className="landing-section-sub">Los planes se activan y personalizan directamente con el administrador del sistema.</p>
                    </div>
                    <div className="landing-plans">
                        {PLAN_ORDER.map(pid => {
                            const p = PLANS[pid];
                            return (
                                <div key={pid} className={`landing-plan-card ${pid === "intermediate" ? "featured" : ""}`}>
                                    {p.badge && <div className="landing-plan-badge" style={{ background: p.color }}>{p.badge}</div>}
                                    <h3 style={{ color: p.color }}>{p.name}</h3>
                                    <p className="landing-plan-tagline">{p.tagline}</p>
                                    <div className="landing-plan-price">
                                        <span className="amount">{p.price}</span>
                                        <span className="note">{p.priceNote}</span>
                                    </div>
                                    <ul className="landing-plan-list">
                                        {PLAN_HIGHLIGHTS[pid].map((h, i) => (
                                            <li key={i}><Check size={14} color={p.color} /> {h}</li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </motion.section>

                {/* ── CTA final ── */}
                <motion.section
                    className="landing-cta"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4 }}
                >
                    <h2>¿Listo para ordenar tu cartera de préstamos?</h2>
                    <p>Entra al sistema y empieza a llevar el control de tus clientes, préstamos y cobros hoy mismo.</p>
                    <Link href={primaryHref} className="landing-btn-hero">
                        {primaryLabel} <ArrowRight size={18} />
                    </Link>
                </motion.section>
            </main>

            <footer className="landing-footer">
                <p>© 2026 Fact-Prest System</p>
            </footer>

            <a
                href="https://wa.me/18295743442"
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-fab"
                title="Contáctanos por WhatsApp"
                aria-label="Contáctanos por WhatsApp"
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.876.517 3.632 1.415 5.134L2 22l4.995-1.386A9.945 9.945 0 0 0 12.001 22C17.524 22 22 17.523 22 12S17.524 2 12.001 2zm0 18.166a8.13 8.13 0 0 1-4.146-1.136l-.297-.176-3.098.86.826-3.02-.193-.31A8.13 8.13 0 0 1 3.834 12c0-4.5 3.665-8.166 8.167-8.166 4.5 0 8.166 3.665 8.166 8.166 0 4.502-3.665 8.166-8.166 8.166z"/>
                </svg>
            </a>

            <style dangerouslySetInnerHTML={{
                __html: `
        .landing-viewer {
          position: fixed;
          inset: 0;
          overflow-y: auto;
          background: var(--bg-page);
          z-index: 10;
          display: flex;
          flex-direction: column;
        }

        /* ── Header ── */
        .landing-header {
          border-bottom: 1px solid rgba(var(--edge-rgb), 0.08);
          background: var(--bg-surface-92);
          backdrop-filter: blur(14px);
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .landing-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .landing-brand { display: flex; align-items: center; gap: 0.55rem; }
        .landing-brand-icon {
          width: 32px; height: 32px;
          background: #3730a3;
          color: #ffffff;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .landing-brand-name { font-size: 1.1rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.01em; }

        .landing-header-actions { display: flex; align-items: center; gap: 0.75rem; }
        .landing-theme-toggle {
          width: 36px; height: 36px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(var(--edge-rgb), 0.06);
          border: 1px solid rgba(var(--edge-rgb), 0.1);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .landing-theme-toggle:hover { background: rgba(var(--edge-rgb), 0.1); color: var(--text-main); }

        .landing-btn-login {
          background: #3730a3;
          color: #ffffff;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 0.55rem 1.1rem;
          border-radius: 9px;
          transition: background 0.15s;
        }
        .landing-btn-login:hover { background: #322e91; }

        /* ── Main ── */
        .landing-main {
          flex: 1;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          padding: 4.5rem 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 6rem;
        }

        .landing-hero { text-align: center; max-width: 720px; margin: 0 auto; }
        .landing-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(99,102,241,0.12);
          color: var(--primary);
          border: 1px solid rgba(99,102,241,0.25);
          padding: 0.35rem 0.9rem;
          border-radius: 99px;
          font-size: 0.78rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
        }
        .landing-headline {
          font-size: 2.75rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 1.25rem;
        }
        .landing-subtext {
          font-size: 1.05rem;
          color: var(--text-muted);
          line-height: 1.65;
          margin-bottom: 2rem;
        }
        .landing-btn-hero {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #3730a3;
          color: #ffffff;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          padding: 0.9rem 1.75rem;
          border-radius: 10px;
          transition: background 0.15s;
        }
        .landing-btn-hero:hover { background: #322e91; }

        .landing-trust-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }
        .landing-trust-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-faint);
        }

        /* ── Section shell ── */
        .landing-section-head { text-align: center; max-width: 620px; margin: 0 auto 2.5rem; }
        .landing-section-label {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--primary);
          margin-bottom: 0.6rem;
        }
        .landing-section-head h2 {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
          line-height: 1.25;
        }
        .landing-section-sub {
          margin-top: 0.6rem;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        /* ── Features ── */
        .landing-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .landing-feature-card {
          background: var(--bg-card);
          border: 1px solid rgba(var(--edge-rgb), 0.08);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .landing-feature-icon {
          width: 40px; height: 40px;
          background: #3730a3;
          color: #ffffff;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1rem;
        }
        .landing-feature-card h3 {
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.4rem;
          letter-spacing: -0.01em;
        }
        .landing-feature-card p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.55;
        }

        /* ── Steps ── */
        .landing-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .landing-step-card {
          background: var(--bg-card);
          border: 1px solid rgba(var(--edge-rgb), 0.08);
          border-radius: 16px;
          padding: 1.75rem 1.5rem;
          position: relative;
        }
        .landing-step-num {
          display: block;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--primary);
          opacity: 0.55;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }
        .landing-step-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .landing-step-card p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.55;
        }

        /* ── Plans ── */
        .landing-plans {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          align-items: start;
        }
        .landing-plan-card {
          position: relative;
          background: var(--bg-card);
          border: 1px solid rgba(var(--edge-rgb), 0.08);
          border-radius: 18px;
          padding: 2rem 1.75rem;
        }
        .landing-plan-card.featured {
          border-color: rgba(55,48,163,0.35);
          box-shadow: 0 0 0 1px rgba(55,48,163,0.12);
        }
        .landing-plan-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          color: #ffffff;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.25rem 0.9rem;
          border-radius: 99px;
        }
        .landing-plan-card h3 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.3rem; letter-spacing: -0.01em; }
        .landing-plan-tagline { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; }
        .landing-plan-price { display: flex; align-items: baseline; gap: 0.3rem; margin-bottom: 1.5rem; }
        .landing-plan-price .amount { font-size: 1.9rem; font-weight: 800; color: var(--text-main); }
        .landing-plan-price .note { font-size: 0.85rem; color: var(--text-muted); }
        .landing-plan-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.7rem; }
        .landing-plan-list li { display: flex; align-items: center; gap: 0.55rem; font-size: 0.85rem; color: var(--text-secondary); font-weight: 500; }

        /* ── CTA final ── */
        .landing-cta {
          text-align: center;
          background: #3730a3;
          border-radius: 20px;
          padding: 3.5rem 2rem;
        }
        .landing-cta h2 { font-size: 1.75rem; font-weight: 800; color: #ffffff; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
        .landing-cta p { font-size: 0.95rem; color: rgba(255,255,255,0.75); max-width: 480px; margin: 0 auto 1.75rem; line-height: 1.6; }
        .landing-cta .landing-btn-hero { background: #ffffff; color: #3730a3; }
        .landing-cta .landing-btn-hero:hover { background: #f1f0fb; }

        /* ── Footer ── */
        .landing-footer {
          text-align: center;
          padding: 1.5rem;
          color: var(--text-faint);
          font-size: 0.8rem;
          border-top: 1px solid rgba(var(--edge-rgb), 0.08);
        }

        /* ── WhatsApp FAB ── */
        .whatsapp-fab {
          position: fixed;
          right: 1.5rem;
          bottom: 1.5rem;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #25d366;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          z-index: 20;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .whatsapp-fab:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .landing-features { grid-template-columns: 1fr 1fr; }
          .landing-steps { grid-template-columns: 1fr; }
          .landing-plans { grid-template-columns: 1fr; max-width: 380px; margin: 0 auto; }
          .landing-headline { font-size: 2.1rem; }
          .landing-main { gap: 4.5rem; }
        }
        @media (max-width: 560px) {
          .landing-main { padding: 3rem 1.25rem 2rem; }
          .landing-headline { font-size: 1.75rem; }
          .landing-features { grid-template-columns: 1fr; }
          .landing-header-inner { padding: 0.85rem 1.25rem; }
          .landing-btn-login { padding: 0.5rem 0.85rem; font-size: 0.82rem; }
          .landing-section-head h2 { font-size: 1.5rem; }
          .landing-cta { padding: 2.5rem 1.5rem; }
          .landing-cta h2 { font-size: 1.4rem; }
        }
      `}} />
        </div>
    );
}
