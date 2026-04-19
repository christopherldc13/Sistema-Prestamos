"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Check, X, Zap, Star, Shield, Users, CreditCard,
  BarChart3, FileText, Palette, ArrowRight, Crown, Download, Table2, History
} from "lucide-react";
import { PLANS, formatLimit, type PlanId } from "@/lib/plans";

const PLAN_ORDER: PlanId[] = ["basic", "intermediate", "premium"];

const FEATURE_ROWS = [
  { icon: <Users size={16} />,    label: "Clientes máximos",         key: "maxClients" as const,          type: "limit" },
  { icon: <CreditCard size={16} />, label: "Préstamos activos",       key: "maxActiveLoans" as const,      type: "limit" },
  { icon: <History size={16} />,  label: "Historial de pagos",        key: "maxPaymentHistory" as const,   type: "limit" },
  { icon: <FileText size={16} />, label: "Generar Contrato PDF",      key: "hasContractPDF" as const,      type: "bool" },
  { icon: <FileText size={16} />, label: "Estado de Cuenta PDF",      key: "hasStatementPDF" as const,     type: "bool" },
  { icon: <Table2 size={16} />,   label: "Tabla de Amortización",     key: "hasAmortizationTable" as const,type: "bool" },
  { icon: <CreditCard size={16} />,label: "Amortización Francesa",    key: "hasFrenchAmortization" as const,type: "bool" },
  { icon: <BarChart3 size={16} />,label: "Reportes avanzados",        key: "hasAdvancedReports" as const,  type: "bool" },
  { icon: <Download size={16} />, label: "Exportar Data",             key: "hasExport" as const,           type: "bool" },
  { icon: <Palette size={16} />,  label: "Marca personalizada",       key: "hasCustomBranding" as const,   type: "bool" },
];

export default function PlansPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string>("basic");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.subscriptionPlan) setCurrentPlan(d.subscriptionPlan);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const planIcons: Record<PlanId, React.ReactNode> = {
    basic: <Shield size={28} />,
    intermediate: <Star size={28} />,
    premium: <Crown size={28} />,
  };

  return (
    <div className="plans-wrapper">
      <div className="plans-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-badge">
            <Zap size={14} />
            Planes de Suscripción
          </div>
          <h1 className="plans-title">Elige el plan perfecto para tu negocio</h1>
          <p className="plans-subtitle">
            Todos los planes incluyen acceso al dashboard, gestión de clientes y préstamos, y soporte.
          </p>
        </motion.div>
      </div>

      {/* Cards de planes */}
      <div className="plans-grid">
        {PLAN_ORDER.map((planId, idx) => {
          const plan = PLANS[planId];
          const isCurrentPlan = currentPlan === planId;
          const isPremium = planId === "premium";

          return (
            <motion.div
              key={planId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`plan-card ${isPremium ? "plan-card-featured" : ""} ${isCurrentPlan ? "plan-card-current" : ""}`}
            >
              {plan.badge && (
                <div className="plan-badge" style={{ background: plan.color }}>
                  {plan.badge}
                </div>
              )}
              {isCurrentPlan && (
                <div className="current-badge">Tu plan actual</div>
              )}

              <div className="plan-icon" style={{ color: plan.color }}>
                {planIcons[planId]}
              </div>

              <div className="plan-name-section">
                <h2 className="plan-name" style={{ color: plan.color }}>{plan.name}</h2>
                <p className="plan-tagline">{plan.tagline}</p>
              </div>

              <div className="plan-price-section">
                <span className="plan-price">{plan.price}</span>
                {plan.priceNote && <span className="plan-price-note">{plan.priceNote}</span>}
              </div>

              <div className="plan-divider" />

              <ul className="plan-features">
                {FEATURE_ROWS.map((row) => {
                  const val = (plan as any)[row.key];
                  const isEnabled = row.type === "bool" ? val : true;
                  const displayVal = row.type === "limit" ? formatLimit(val as number) : null;

                  return (
                    <li key={row.key} className={`feature-row ${!isEnabled && row.type === "bool" ? "feature-disabled" : ""}`}>
                      <span className="feature-icon">{row.icon}</span>
                      <span className="feature-label">{row.label}</span>
                      <span className="feature-value">
                        {row.type === "limit" ? (
                          <span className="limit-badge">{displayVal}</span>
                        ) : val ? (
                          <Check size={16} className="check-icon" />
                        ) : (
                          <X size={16} className="x-icon" />
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {isCurrentPlan ? (
                <button className="plan-btn plan-btn-current" disabled>
                  Plan Actual
                </button>
              ) : (
                <button
                  className="plan-btn"
                  style={{ background: plan.gradient, borderColor: plan.color }}
                  onClick={() => router.push("/subscription")}
                >
                  Contratar plan <ArrowRight size={16} />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Tabla de comparación detallada */}
      <motion.div
        className="compare-section"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="compare-title">Comparación detallada</h2>
        <div className="compare-table-wrapper">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="compare-feature-col">Característica</th>
                {PLAN_ORDER.map(planId => (
                  <th key={planId} className={currentPlan === planId ? "col-current" : ""}>
                    <span style={{ color: PLANS[planId].color }}>{PLANS[planId].name}</span>
                    {currentPlan === planId && <span className="col-current-badge">Actual</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row, i) => (
                <tr key={row.key} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                  <td className="feature-col">
                    <span className="feature-row-icon">{row.icon}</span>
                    {row.label}
                  </td>
                  {PLAN_ORDER.map(planId => {
                    const val = (PLANS[planId] as any)[row.key];
                    return (
                      <td key={planId} className={`value-col ${currentPlan === planId ? "col-current" : ""}`}>
                        {row.type === "limit" ? (
                          <span className="table-limit">{formatLimit(val as number)}</span>
                        ) : val ? (
                          <Check size={18} className="check-icon" />
                        ) : (
                          <X size={18} className="x-icon" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="row-price">
                <td className="feature-col"><strong>Precio</strong></td>
                {PLAN_ORDER.map(planId => (
                  <td key={planId} className={`value-col ${currentPlan === planId ? "col-current" : ""}`}>
                    <strong style={{ color: PLANS[planId].color }}>
                      {PLANS[planId].price}{PLANS[planId].priceNote}
                    </strong>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* CTA inferior */}
      <motion.div
        className="cta-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="cta-text">
          ¿Listo para actualizar? Realiza tu pago y contacta con el administrador para activar tu plan.
        </p>
        <button className="cta-btn" onClick={() => router.push("/subscription")}>
          Ver métodos de pago <ArrowRight size={18} />
        </button>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .plans-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem 5rem;
        }

        .plans-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(99, 102, 241, 0.12);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.25);
          padding: 0.35rem 0.9rem;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .plans-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin: 0 0 0.75rem;
          letter-spacing: -0.03em;
        }

        .plans-subtitle {
          font-size: 1.05rem;
          color: #94a3b8;
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 4rem;
          align-items: start;
        }

        .plan-card {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 2rem;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .plan-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .plan-card-featured {
          border-color: rgba(168, 85, 247, 0.4);
          background: rgba(30, 20, 50, 0.85);
          box-shadow: 0 0 40px rgba(168, 85, 247, 0.1);
        }

        .plan-card-current {
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.12);
        }

        .plan-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.25rem 1rem;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 800;
          color: white;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .current-badge {
          position: absolute;
          top: -12px;
          right: 1.25rem;
          background: rgba(99, 102, 241, 0.9);
          color: white;
          padding: 0.2rem 0.75rem;
          border-radius: 99px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .plan-icon {
          display: flex;
          align-items: center;
        }

        .plan-name-section { display: flex; flex-direction: column; gap: 0.25rem; }

        .plan-name {
          font-size: 1.6rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .plan-tagline {
          color: #94a3b8;
          font-size: 0.9rem;
          margin: 0;
        }

        .plan-price-section {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .plan-price {
          font-size: 2rem;
          font-weight: 800;
          color: white;
        }

        .plan-price-note {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .plan-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
        }

        .feature-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.9rem;
          color: #cbd5e1;
        }

        .feature-disabled {
          opacity: 0.4;
        }

        .feature-icon { color: #64748b; display: flex; }
        .feature-label { flex: 1; }
        .feature-value { display: flex; align-items: center; }

        .limit-badge {
          background: rgba(255,255,255,0.08);
          padding: 0.15rem 0.6rem;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }

        .check-icon { color: #4ade80; }
        .x-icon { color: #f87171; }

        .plan-btn {
          width: 100%;
          padding: 0.85rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          border: 1px solid transparent;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.2s, transform 0.1s;
          margin-top: 0.5rem;
        }

        .plan-btn:hover:not(:disabled) { opacity: 0.88; transform: scale(0.99); }

        .plan-btn-current {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.1);
          color: #64748b;
          cursor: default;
        }

        /* Compare table */
        .compare-section { margin-bottom: 3rem; }

        .compare-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .compare-table-wrapper {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
        }

        .compare-table {
          width: 100%;
          border-collapse: collapse;
        }

        .compare-table thead tr {
          background: rgba(255,255,255,0.04);
        }

        .compare-table th {
          padding: 1rem 1.25rem;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 700;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .compare-feature-col {
          text-align: left !important;
          color: #64748b !important;
          font-size: 0.8rem !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .col-current {
          background: rgba(99, 102, 241, 0.06);
        }

        .col-current-badge {
          display: inline-block;
          background: rgba(99, 102, 241, 0.7);
          color: white;
          font-size: 0.65rem;
          padding: 0.1rem 0.5rem;
          border-radius: 99px;
          margin-left: 0.4rem;
          font-weight: 700;
        }

        .compare-table td {
          padding: 0.85rem 1.25rem;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .row-even { background: transparent; }
        .row-odd { background: rgba(255,255,255,0.02); }
        .row-price td { border-top: 1px solid rgba(255,255,255,0.08); border-bottom: none; }

        .feature-col {
          text-align: left !important;
          color: #cbd5e1;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .feature-row-icon { color: #64748b; display: flex; }

        .value-col { font-size: 0.9rem; color: #e2e8f0; }
        .table-limit { font-weight: 600; }

        /* CTA */
        .cta-section {
          text-align: center;
          padding: 3rem;
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .cta-text {
          color: #94a3b8;
          font-size: 1rem;
          max-width: 500px;
          margin: 0;
          line-height: 1.6;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: white;
          border: none;
          padding: 0.85rem 2rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }

        .cta-btn:hover { opacity: 0.88; transform: scale(0.99); }

        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: 1fr; }
          .plans-title { font-size: 1.75rem; }
          .compare-table-wrapper { overflow-x: auto; }
          .compare-table { min-width: 550px; }
          .feature-col { display: table-cell !important; }
        }
      `}} />
    </div>
  );
}
