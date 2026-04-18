"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, HeartHandshake, FileText, ChevronRight,
  TrendingUp, DollarSign, Clock, AlertTriangle, CheckCircle2,
  ArrowUpRight, Wallet, Activity, CalendarX
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function formatDate() {
  return new Date().toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)}d`;
}

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

export default function Home() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>({
    totalLent: 0, totalCollected: 0, totalEarnings: 0,
    activeLoans: 0, paidLoans: 0, overdueLoans: 0, pendingBalance: 0,
    recentLoans: [], overdueList: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && (session.user as any)?.role === "superadmin") {
      window.location.href = "/superadmin";
      return;
    }
    if (session) {
      fetch("/api/stats")
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setStats(d); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);

  const collectionRate = stats.totalLent > 0
    ? Math.round((stats.totalCollected / stats.totalLent) * 100) : 0;

  return (
    <div className="home-wrapper">
      <div className="bg-glow glow-1" />
      <div className="bg-glow glow-2" />

      {/* Header */}
      <header className="dashboard-header">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="greeting-label">{getGreeting()},</p>
          <h1 className="welcome-text">{session?.user?.name || "Administrador"}</h1>
          <p className="welcome-sub">Aquí tienes el resumen de tu cartera de préstamos.</p>
        </motion.div>
        <motion.div className="header-right" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <div className="header-badge"><div className="status-dot" /> Sistema Fact-Prest Activo</div>
          <p className="date-text">{formatDate()}</p>
        </motion.div>
      </header>

      {/* Stat Cards */}
      <motion.div className="stats-container" variants={container} initial="hidden" animate="visible">
        {[
          { title: "Préstamos Activos", value: stats.activeLoans.toString(), icon: <HeartHandshake size={20} />, trend: stats.overdueLoans > 0 ? `${stats.overdueLoans} con retraso` : "Al corriente", trendOk: stats.overdueLoans === 0, color: "linear-gradient(135deg,#6366f1,#4f46e5)", accent: "#6366f1" },
          { title: "Cartera Total", value: `$${stats.totalLent.toLocaleString()}`, icon: <DollarSign size={20} />, trend: `Pendiente: $${stats.pendingBalance.toLocaleString()}`, trendOk: null, color: "linear-gradient(135deg,#a855f7,#7e22ce)", accent: "#a855f7" },
          { title: "Recaudación", value: `$${stats.totalCollected.toLocaleString()}`, icon: <TrendingUp size={20} />, trend: "Total histórico", trendOk: true, color: "linear-gradient(135deg,#10b981,#059669)", accent: "#10b981" },
          { title: "Ganancia Bruta", value: `$${stats.totalEarnings.toLocaleString()}`, icon: <Wallet size={20} />, trend: "Intereses generados", trendOk: true, color: "linear-gradient(135deg,#f59e0b,#d97706)", accent: "#f59e0b" },
        ].map(card => (
          <motion.div key={card.title} variants={item}>
            <StatCard loading={loading} {...card} />
          </motion.div>
        ))}
      </motion.div>

      {/* Summary Bar */}
      <motion.div className="summary-bar glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }}>
        <SummaryItem icon={<CheckCircle2 size={15} />} label="Pagados" value={stats.paidLoans} color="#10b981" />
        <div className="summary-divider" />
        <SummaryItem icon={<AlertTriangle size={15} />} label="En retraso" value={stats.overdueLoans} color={stats.overdueLoans > 0 ? "#f59e0b" : "#64748b"} />
        <div className="summary-divider" />
        <SummaryItem icon={<HeartHandshake size={15} />} label="Activos" value={stats.activeLoans} color="#6366f1" />
        <div className="summary-divider" />
        <SummaryItem icon={<ArrowUpRight size={15} />} label="Tasa de cobro" value={`${collectionRate}%`} color={collectionRate >= 70 ? "#10b981" : "#f59e0b"} />
      </motion.div>

      {/* Bottom Grid: Activity + Overdue */}
      <div className="dashboard-bottom-grid">
        {/* Recent Loans */}
        <motion.div className="glass-card activity-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <div className="activity-header">
            <div className="activity-title"><Activity size={18} color="#6366f1" /> Actividad Reciente</div>
            <Link href="/loans" className="activity-link">Ver todos <ChevronRight size={14} /></Link>
          </div>
          {loading ? (
            <div className="act-skeleton-list">{[1,2,3].map(i => <div key={i} className="act-skeleton" />)}</div>
          ) : stats.recentLoans?.length > 0 ? (
            <div className="activity-list">
              {stats.recentLoans.map((l: any) => (
                <Link key={l.id} href={`/loans/${l.id}`} className="activity-item">
                  <div className={`act-dot dot-${l.status}`} />
                  <div className="act-info">
                    <span className="act-name">{l.clientName}</span>
                    <span className="act-meta">{timeAgo(l.createdAt)}</span>
                  </div>
                  <div className="act-right">
                    <span className="act-amount">${l.amount.toLocaleString()}</span>
                    <span className={`act-status s-${l.status}`}>{l.status === "active" ? "Activo" : l.status === "paid" ? "Pagado" : "Vencido"}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="act-empty">No hay préstamos registrados aún.</div>
          )}
        </motion.div>

        {/* Overdue Alerts */}
        <motion.div className="glass-card overdue-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <div className="activity-header">
            <div className="activity-title" style={{ color: stats.overdueList?.length > 0 ? "#fbbf24" : "inherit" }}>
              <CalendarX size={18} color={stats.overdueList?.length > 0 ? "#fbbf24" : "#64748b"} /> Préstamos Vencidos
              {stats.overdueList?.length > 0 && <span className="overdue-count">{stats.overdueList.length}</span>}
            </div>
            <Link href="/loans" className="activity-link">Gestionar <ChevronRight size={14} /></Link>
          </div>
          {loading ? (
            <div className="act-skeleton-list">{[1,2].map(i => <div key={i} className="act-skeleton" />)}</div>
          ) : stats.overdueList?.length > 0 ? (
            <div className="activity-list">
              {stats.overdueList.map((l: any) => (
                <Link key={l.id} href={`/loans/${l.id}`} className="activity-item overdue-item">
                  <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <div className="act-info">
                    <span className="act-name">{l.clientName}</span>
                    <span className="act-meta">Venció {l.dueDate ? new Date(l.dueDate).toLocaleDateString("es-MX") : "—"}</span>
                  </div>
                  <div className="act-right">
                    <span className="act-amount overdue-balance">${l.remainingBalance.toLocaleString()}</span>
                    <span className="act-meta">pendiente</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="act-empty act-empty-good">
              <CheckCircle2 size={28} color="#10b981" />
              <span>¡Sin préstamos vencidos!</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <section className="dashboard-actions">
        <h2 className="group-label">Operaciones Rápidas</h2>
        <motion.div className="actions-layout" variants={container} initial="hidden" animate="visible">
          {[
            { href: "/clients", title: "Clientes", desc: "Padrón de clientes activos", icon: <Users size={20} />, color: "linear-gradient(135deg,#6366f1,#4f46e5)" },
            { href: "/loans/create", title: "Nuevo Préstamo", desc: "Generar crédito inmediato", icon: <Clock size={20} />, color: "linear-gradient(135deg,#10b981,#059669)" },
            { href: "/loans", title: "Listado de Créditos", desc: "Ver todos los préstamos", icon: <LayoutDashboard size={20} />, color: "linear-gradient(135deg,#a855f7,#7e22ce)" },
            { href: "/reports", title: "Reportes", desc: "Análisis de rentabilidad", icon: <FileText size={20} />, color: "linear-gradient(135deg,#f59e0b,#d97706)" },
          ].map(action => (
            <motion.div key={action.href} variants={item}>
              <Link href={action.href}><ActionItem {...action} /></Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: styles }} />
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendOk, color, accent, loading }: any) {
  return (
    <div className="glass-card stat-card-custom" style={{ "--accent": accent } as React.CSSProperties}>
      <div className="stat-accent-bar" />
      <div className="stat-top">
        <span className="stat-label">{title}</span>
        <div className="stat-icon-wrapper" style={{ background: color }}>{icon}</div>
      </div>
      {loading ? <div className="skeleton-val" /> : <div className="stat-main-val">{value}</div>}
      <div className="stat-sub-trend" style={{ color: trendOk === true ? "#10b981" : trendOk === false ? "#f59e0b" : "#64748b" }}>
        {trendOk === true && <CheckCircle2 size={12} />}
        {trendOk === false && <AlertTriangle size={12} />}
        {trend}
      </div>
    </div>
  );
}

function SummaryItem({ icon, label, value, color }: any) {
  return (
    <div className="summary-item">
      <span className="summary-icon" style={{ color }}>{icon}</span>
      <span className="summary-label">{label}:</span>
      <span className="summary-value" style={{ color }}>{value}</span>
    </div>
  );
}

function ActionItem({ title, desc, icon, color }: any) {
  return (
    <div className="glass-card action-item-box">
      <div className="action-icon-cir" style={{ background: color }}>{icon}</div>
      <div className="action-meta"><h3>{title}</h3><p>{desc}</p></div>
      <ChevronRight size={16} className="action-chevron" />
    </div>
  );
}

const styles = `
  .home-wrapper { position: relative; width: 100%; max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; overflow: hidden; }
  .bg-glow { position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0; }
  .glow-1 { width: 500px; height: 500px; background: rgba(99,102,241,0.07); top: -150px; left: -100px; }
  .glow-2 { width: 400px; height: 400px; background: rgba(168,85,247,0.06); bottom: 0; right: -80px; }

  .dashboard-header { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .greeting-label { font-size: 0.95rem; color: #6366f1; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 0.15rem; }
  .welcome-text { font-size: 2.25rem; font-weight: 800; color: white; letter-spacing: -0.02em; margin-bottom: 0.3rem; }
  .welcome-sub { color: #64748b; font-size: 0.95rem; }
  .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
  .header-badge { display: flex; align-items: center; gap: 0.5rem; background: rgba(16,185,129,0.1); color: #10b981; padding: 0.45rem 0.875rem; border-radius: 99px; font-size: 0.78rem; font-weight: 600; border: 1px solid rgba(16,185,129,0.2); }
  .status-dot { width: 7px; height: 7px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 2px rgba(16,185,129,0.25); animation: pulse-dot 2s ease-in-out infinite; }
  @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 2px rgba(16,185,129,0.25),0 0 8px #10b981} 50%{box-shadow:0 0 0 5px rgba(16,185,129,0.12),0 0 12px #10b981} }
  .date-text { font-size: 0.78rem; color: #475569; text-transform: capitalize; }

  .stats-container { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; }
  .stat-card-custom { position: relative; display: flex; flex-direction: column; padding: 1.5rem 1.75rem; overflow: hidden; transition: transform 0.22s ease, box-shadow 0.22s ease; }
  .stat-card-custom:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(0,0,0,0.4); }
  .stat-accent-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent, #6366f1); border-radius: 16px 16px 0 0; opacity: 0.8; }
  .stat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; margin-top: 0.25rem; }
  .stat-icon-wrapper { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 6px 16px -4px rgba(0,0,0,0.35); flex-shrink: 0; }
  .stat-label { color: #94a3b8; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; }
  .stat-main-val { font-size: 2rem; font-weight: 800; color: white; letter-spacing: -0.02em; margin-bottom: 0.5rem; line-height: 1; }
  .skeleton-val { height: 2rem; width: 60%; background: rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 0.5rem; animation: shimmer 1.4s ease infinite; }
  @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
  .stat-sub-trend { font-size: 0.8rem; font-weight: 500; display: flex; align-items: center; gap: 0.3rem; }

  .summary-bar { position: relative; z-index: 1; display: flex; align-items: center; gap: 0; padding: 1rem 1.75rem; flex-wrap: wrap; }
  .summary-item { display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 120px; justify-content: center; }
  .summary-icon { display: flex; }
  .summary-label { font-size: 0.82rem; color: #64748b; font-weight: 500; }
  .summary-value { font-size: 0.9rem; font-weight: 700; color: white; }
  .summary-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.07); margin: 0 0.5rem; }

  /* Bottom Grid */
  .dashboard-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; position: relative; z-index: 1; }
  .activity-card, .overdue-card { padding: 1.5rem; }
  .activity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
  .activity-title { display: flex; align-items: center; gap: 0.6rem; font-size: 0.95rem; font-weight: 700; color: white; }
  .activity-link { display: flex; align-items: center; gap: 0.25rem; color: #6366f1; font-size: 0.8rem; font-weight: 600; text-decoration: none; transition: opacity 0.2s; }
  .activity-link:hover { opacity: 0.8; }
  .overdue-count { background: #f59e0b; color: #000; border-radius: 99px; padding: 0.1rem 0.5rem; font-size: 0.72rem; font-weight: 800; }

  .activity-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .activity-item { display: flex; align-items: center; gap: 0.875rem; padding: 0.75rem; border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); text-decoration: none; transition: all 0.2s; }
  .activity-item:hover { background: rgba(99,102,241,0.06); border-color: rgba(99,102,241,0.15); }
  .overdue-item:hover { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.15); }

  .act-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot-active  { background: #6366f1; box-shadow: 0 0 6px #6366f1; }
  .dot-paid    { background: #10b981; }
  .dot-overdue { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }

  .act-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
  .act-name { font-size: 0.88rem; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .act-meta { font-size: 0.75rem; color: #64748b; }
  .act-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.1rem; flex-shrink: 0; }
  .act-amount { font-size: 0.9rem; font-weight: 700; color: white; }
  .overdue-balance { color: #fbbf24; }

  .act-status { font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; }
  .s-active  { background: rgba(99,102,241,0.12); color: #818cf8; }
  .s-paid    { background: rgba(16,185,129,0.12); color: #34d399; }
  .s-overdue { background: rgba(245,158,11,0.12); color: #fbbf24; }

  .act-empty { text-align: center; padding: 2rem; color: #475569; font-size: 0.88rem; }
  .act-empty-good { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; color: #10b981; }
  .act-skeleton-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .act-skeleton { height: 52px; background: rgba(255,255,255,0.04); border-radius: 10px; animation: shimmer 1.4s ease infinite; }

  /* Quick Actions */
  .dashboard-actions { position: relative; z-index: 1; }
  .group-label { font-size: 1.1rem; font-weight: 700; color: #f8fafc; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
  .group-label::before { content: ''; display: inline-block; width: 3px; height: 1.1rem; background: #6366f1; border-radius: 4px; }
  .actions-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
  .action-item-box { display: flex; align-items: center; gap: 1rem; padding: 1.1rem 1.25rem; transition: all 0.22s ease; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; }
  .action-item-box:hover { background: rgba(255,255,255,0.04); border-color: rgba(99,102,241,0.35); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
  .action-icon-cir { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
  .action-meta { flex: 1; min-width: 0; }
  .action-meta h3 { font-size: 0.95rem; font-weight: 700; color: white; margin-bottom: 0.15rem; }
  .action-meta p { font-size: 0.78rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .action-chevron { color: #334155; flex-shrink: 0; transition: transform 0.2s, color 0.2s; }
  .action-item-box:hover .action-chevron { transform: translateX(3px); color: #6366f1; }

  @media (max-width: 900px) { .dashboard-bottom-grid { grid-template-columns: 1fr; } }
  @media (max-width: 768px) {
    .welcome-text { font-size: 1.6rem; }
    .dashboard-header { flex-direction: column; align-items: flex-start; gap: 1rem; padding-bottom: 1.2rem; }
    .header-right { align-items: flex-start; }
    .home-wrapper { gap: 1.25rem; }
    .stats-container { grid-template-columns: 1fr; gap: 1rem; }
    .stat-card-custom { padding: 1.25rem; }
    .actions-layout { grid-template-columns: 1fr; gap: 1rem; }
    .summary-bar { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1.25rem; }
    .summary-divider { display: none; }
    .summary-item { justify-content: flex-start; min-width: auto; }
  }
`;
