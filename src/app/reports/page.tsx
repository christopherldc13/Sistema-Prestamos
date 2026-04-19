"use client";

import React, { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Download,
    RefreshCcw,
    CreditCard,
    Target,
    Lock,
    Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getPlan, type PlanFeatures } from "@/lib/plans";

export default function ReportsPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<PlanFeatures>(getPlan("basic"));

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/reports");
            const result = await res.json();
            setData(result);
        } catch (e) {
            console.error("Error fetching reports:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
        fetch("/api/me")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.subscriptionPlan) setPlan(getPlan(d.subscriptionPlan)); })
            .catch(() => {});
    }, []);

    if (loading && !data) {
        return (
            <div className="loading-reports">
                <RefreshCcw className="animate-spin" size={40} />
                <p>Generando Análisis Financiero...</p>
            </div>
        );
    }

    const { stats, recentPayments } = data || {};

    const recoveryRate = stats ? (stats.totalCollected / (stats.totalLent || 1)) * 100 : 0;

    return (
        <div className="reports-container">
            <header className="page-header-pro">
                <div className="title-stack">
                    <h1 className="title-pro">Centro de Reportes</h1>
                    <p className="subtitle-pro">Análisis de rendimiento y flujo de efectivo en tiempo real</p>
                </div>
                <div className="header-actions">
                    <button className="btn-filter-soft">
                        <Filter size={16} /> <span>Filtrar Período</span>
                    </button>
                    {plan.hasExport ? (
                        <button className="btn-export-premium">
                            <Download size={16} /> <span>Exportar Data</span>
                        </button>
                    ) : (
                        <button className="btn-export-locked" onClick={() => router.push("/plans")} title="Disponible en Plan Premium">
                            <Lock size={14} /> <span>Exportar Data</span> <span className="locked-badge">Premium</span>
                        </button>
                    )}
                </div>
            </header>

            {/* KPI Grid */}
            <div className="stats-header-grid">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card kpi-card"
                >
                    <div className="kpi-icon-row">
                        <div className="kpi-icon-bg money-icon">
                            <DollarSign size={20} />
                        </div>
                        <span className="kpi-growth pos"><ArrowUpRight size={14} /> +12%</span>
                    </div>
                    <div className="kpi-info-stack">
                        <span className="kpi-label">Capital en Calle</span>
                        <span className="kpi-value">${stats?.totalLent.toLocaleString()}</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card kpi-card"
                >
                    <div className="kpi-icon-row">
                        <div className="kpi-icon-bg collect-icon">
                            <TrendingUp size={20} />
                        </div>
                        <span className="kpi-growth pos"><ArrowUpRight size={14} /> +8%</span>
                    </div>
                    <div className="kpi-info-stack">
                        <span className="kpi-label">Total Recaudado</span>
                        <span className="kpi-value">${stats?.totalCollected.toLocaleString()}</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card kpi-card highlight-glow"
                >
                    <div className="kpi-icon-row">
                        <div className="kpi-icon-bg today-icon">
                            <Calendar size={20} />
                        </div>
                        <span className="kpi-growth pulse">Habilitado</span>
                    </div>
                    <div className="kpi-info-stack">
                        <span className="kpi-label">Cobros de Hoy</span>
                        <span className="kpi-value">${stats?.collectedToday.toLocaleString()}</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card kpi-card"
                >
                    <div className="kpi-icon-row">
                        <div className="kpi-icon-bg target-icon">
                            <Target size={20} />
                        </div>
                        <span className="kpi-growth neg"><ArrowDownRight size={14} /> -2%</span>
                    </div>
                    <div className="kpi-info-stack">
                        <span className="kpi-label">Saldo Pendiente</span>
                        <span className="kpi-value">${stats?.pendingBalance.toLocaleString()}</span>
                    </div>
                </motion.div>
            </div>

            <div className="reports-main-layout">
                {/* Real-time Collections Stream */}
                <div className="glass-card table-section">
                    <div className="section-header">
                        <h3>Flujo Reciente de Caja</h3>
                        <div className="badge-live">Live</div>
                    </div>
                    <div className="table-wrapper-pro">
                        <table className="table-pro">
                            <thead>
                                <tr>
                                    <th>EMISOR/CLIENTE</th>
                                    <th>REFERENCIA</th>
                                    <th>METODO</th>
                                    <th>MONTO</th>
                                    <th>ESTADO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayments?.map((p: any) => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="client-cell">
                                                <div className="avatar-fake">{p.loan.client.fullName[0]}</div>
                                                <div className="client-data">
                                                    <span className="name">{p.loan.client.fullName}</span>
                                                    <span className="meta">ID: {p.loan.client.idNumber}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="ref-tag">#{p.id.substring(p.id.length - 8).toUpperCase()}</span>
                                        </td>
                                        <td>
                                            <span className="method-pill">{p.method.toUpperCase()}</span>
                                        </td>
                                        <td className="amount-cell">
                                            <span className="amount-val">${p.amount.toLocaleString()}</span>
                                        </td>
                                        <td>
                                            <span className="status-badge-ok">PROCESADO</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Vertical Analytics Sidebar */}
                <aside className="analytics-sidebar">
                    {plan.hasAdvancedReports ? (
                        <>
                            <div className="glass-card sidebar-stat-card">
                                <h3>Tasa de Recuperación</h3>
                                <div className="circular-progress-wrap">
                                    <svg viewBox="0 0 36 36" className="circular-chart indigo">
                                        <path className="circle-bg"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path className="circle"
                                            strokeDasharray={`${recoveryRate}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <text x="18" y="20.35" className="percentage">{Math.round(recoveryRate)}%</text>
                                    </svg>
                                </div>
                                <p className="sidebar-hint">Capital recaudado vs Total desembolsado</p>
                            </div>

                            <div className="glass-card sidebar-stat-card">
                                <h3>Cartera de Préstamos</h3>
                                <div className="stat-row">
                                    <span className="s-label">Créditos Activos</span>
                                    <span className="s-val text-indigo">{stats?.activeLoans}</span>
                                </div>
                                <div className="stat-row">
                                    <span className="s-label">Créditos Liquidados</span>
                                    <span className="s-val text-green">{stats?.paidLoans}</span>
                                </div>
                                <div className="stat-row total-border">
                                    <span className="s-label">Total Histórico</span>
                                    <span className="s-val">{(stats?.activeLoans || 0) + (stats?.paidLoans || 0)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-card sidebar-locked" onClick={() => router.push("/plans")}>
                            <Lock size={28} className="lock-icon-lg" />
                            <h3>Analíticas Avanzadas</h3>
                            <p>Tasa de recuperación, cartera detallada y más. Disponible en Plan Intermedio o superior.</p>
                            <button className="btn-upgrade-inline">
                                <Zap size={14} /> Ver Planes
                            </button>
                        </div>
                    )}
                </aside>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .reports-container { padding: 1rem 0 5rem; }
                .page-header-pro { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; }
                .title-pro { font-size: 2.5rem; font-weight: 800; color: white; letter-spacing: -0.02em; }
                .subtitle-pro { color: #64748b; font-size: 1rem; margin-top: 0.5rem; }
                
                .header-actions { display: flex; gap: 1rem; }
                .btn-filter-soft { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; cursor: pointer; }
                .btn-filter-soft:hover { background: rgba(255,255,255,0.06); color: white; }
                .btn-export-premium { background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4); }
                .btn-export-premium:hover { transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(99, 102, 241, 0.5); }
                .btn-export-locked { background: rgba(255,255,255,0.04); color: #64748b; border: 1px solid rgba(255,255,255,0.08); padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
                .btn-export-locked:hover { background: rgba(255,255,255,0.07); color: #94a3b8; }
                .locked-badge { background: rgba(168,85,247,0.2); color: #c084fc; padding: 0.15rem 0.5rem; border-radius: 99px; font-size: 0.7rem; font-weight: 800; }
                .sidebar-locked { padding: 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; cursor: pointer; border: 1px dashed rgba(255,255,255,0.1) !important; transition: border-color 0.2s; }
                .sidebar-locked:hover { border-color: rgba(168,85,247,0.4) !important; }
                .lock-icon-lg { color: #475569; }
                .sidebar-locked h3 { font-size: 1rem; font-weight: 700; color: white; margin: 0; }
                .sidebar-locked p { font-size: 0.82rem; color: #64748b; line-height: 1.5; margin: 0; }
                .btn-upgrade-inline { display: flex; align-items: center; gap: 0.4rem; background: linear-gradient(135deg,#7c3aed,#a855f7); color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 99px; font-size: 0.8rem; font-weight: 700; cursor: pointer; }

                .stats-header-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
                .kpi-card { padding: 2rem; position: relative; overflow: hidden; border-radius: 20px; }
                .kpi-icon-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .kpi-icon-bg { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .money-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .collect-icon { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
                .today-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .target-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                
                .kpi-growth { font-size: 0.7rem; font-weight: 800; padding: 0.25rem 0.5rem; border-radius: 6px; display: flex; align-items: center; gap: 0.25rem; }
                .kpi-growth.pos { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .kpi-growth.neg { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .kpi-growth.pulse { color: #f59e0b; animation: pulse 2s infinite; }
                
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

                .kpi-label { display: block; font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem; }
                .kpi-value { display: block; font-size: 1.75rem; font-weight: 900; color: white; letter-spacing: -0.01em; }
                .highlight-glow { border: 1px solid rgba(245, 158, 11, 0.2); box-shadow: 0 0 20px rgba(245, 158, 11, 0.05); }

                .reports-main-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: start; }
                
                .table-section { padding: 0; overflow: hidden; }
                .section-header { padding: 1.5rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .section-header h3 { font-size: 1.1rem; font-weight: 800; color: white; }
                .badge-live { background: #ef4444; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.65rem; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }

                .table-wrapper-pro { overflow-x: auto; }
                .table-pro { width: 100%; border-collapse: collapse; min-width: 600px; }
                .table-pro th { text-align: left; padding: 1.25rem 2rem; font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(0,0,0,0.1); }
                .table-pro td { padding: 1.25rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
                .table-pro tr:last-child td { border-bottom: none; }
                
                .client-cell { display: flex; align-items: center; gap: 1rem; }
                .avatar-fake { width: 36px; height: 36px; border-radius: 10px; background: rgba(99, 102, 241, 0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem; }
                .client-data { display: flex; flex-direction: column; }
                .client-data .name { color: #f8fafc; font-weight: 700; font-size: 0.95rem; }
                .client-data .meta { font-size: 0.75rem; color: #64748b; font-weight: 500; }
                
                .ref-tag { background: rgba(255,255,255,0.05); padding: 0.25rem 0.5rem; border-radius: 6px; font-family: monospace; color: #94a3b8; font-size: 0.85rem; }
                .method-pill { font-size: 0.75rem; font-weight: 800; color: #cbd5e1; }
                .amount-cell { text-align: right; }
                .amount-val { font-weight: 800; color: white; font-size: 1rem; }
                .status-badge-ok { font-size: 0.65rem; font-weight: 900; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 0.4rem 0.8rem; border-radius: 20px; }

                .analytics-sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
                .sidebar-stat-card { padding: 2rem; }
                .sidebar-stat-card h3 { font-size: 1rem; font-weight: 800; color: white; margin-bottom: 1.5rem; text-align: center; }
                
                .circular-progress-wrap { display: flex; justify-content: center; margin-bottom: 1rem; }
                .circular-chart { display: block; margin: 10px auto; max-width: 140px; }
                .circle-bg { fill: none; stroke: rgba(255,255,255,0.03); stroke-width: 3.8; }
                .circle { fill: none; stroke-width: 3.8; stroke-linecap: round; animation: progress 1s ease-out forwards; stroke: #6366f1; }
                @keyframes progress { 0% { stroke-dasharray: 0 100; } }
                .percentage { fill: white; font-size: 0.6em; font-weight: 900; text-anchor: middle; }
                .sidebar-hint { font-size: 0.75rem; color: #475569; text-align: center; font-weight: 600; line-height: 1.4; }

                .stat-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .s-label { font-size: 0.85rem; color: #64748b; font-weight: 700; }
                .s-val { font-weight: 800; font-size: 1rem; }
                .text-indigo { color: #6366f1; }
                .text-green { color: #10b981; }
                .total-border { border-top: 1px solid rgba(255,255,255,0.05); margin-top: 1rem; padding-top: 1rem; }

                .loading-reports { height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; color: #64748b; }
                .loading-reports p { font-weight: 700; letter-spacing: 0.05em; }

                @media (max-width: 1100px) {
                    .stats-header-grid { grid-template-columns: 1fr 1fr; }
                    .reports-main-layout { grid-template-columns: 1fr; }
                }
                @media (max-width: 640px) {
                    .stats-header-grid { grid-template-columns: 1fr; }
                    .page-header-pro { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .header-actions { width: 100%; }
                    .header-actions button { flex: 1; justify-content: center; }
                }
            `}} />
        </div>
    );
}
