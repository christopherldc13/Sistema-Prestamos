"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, HeartHandshake, FileText, ChevronRight,
  TrendingUp, DollarSign, Clock, AlertTriangle, CheckCircle2,
  ArrowUpRight, Wallet, Activity, CalendarX, ShieldCheck
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
  return new Date().toLocaleDateString("es-DO", {
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

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `$${Math.round(n).toLocaleString("es-DO")}`;
  return `$${Math.round(n)}`;
}

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } } };

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

  const userName = session?.user?.name || "Administrador";

  return (
    <div className="home-wrapper">
      <div className="bg-glow glow-1" />
      <div className="bg-glow glow-2" />

      {/* ── Header ── */}
      <header className="dashboard-header">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="greeting-label">{getGreeting()},</p>
          <h1 className="welcome-text">{userName}</h1>
          <p className="welcome-sub">Resumen de tu cartera de préstamos</p>
        </motion.div>
        <motion.div className="header-right" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.12 }}>
          <div className="header-badge"><div className="status-dot" /> Sistema Activo</div>
          <p className="date-text">{formatDate()}</p>
        </motion.div>
      </header>

      {/* ── KPI Cards ── */}
      <motion.div className="stats-grid" variants={container} initial="hidden" animate="visible">
        {[
          {
            title: "Préstamos Activos",
            value: stats.activeLoans.toString(),
            suffix: "",
            icon: <HeartHandshake size={18} />,
            sub: stats.overdueLoans > 0 ? `${stats.overdueLoans} con retraso` : "Al corriente",
            subOk: stats.overdueLoans === 0,
            color: "#6366f1",
            gradient: "linear-gradient(135deg,#6366f1,#4f46e5)",
          },
          {
            title: "Cartera Total",
            value: fmtMoney(stats.totalLent),
            suffix: "",
            icon: <DollarSign size={18} />,
            sub: `Pendiente: ${fmtMoney(stats.pendingBalance)}`,
            subOk: null,
            color: "#a855f7",
            gradient: "linear-gradient(135deg,#a855f7,#7e22ce)",
          },
          {
            title: "Recaudación",
            value: fmtMoney(stats.totalCollected),
            suffix: "",
            icon: <TrendingUp size={18} />,
            sub: "Total histórico",
            subOk: true,
            color: "#10b981",
            gradient: "linear-gradient(135deg,#10b981,#059669)",
          },
          {
            title: "Ganancia Bruta",
            value: fmtMoney(stats.totalEarnings),
            suffix: "",
            icon: <Wallet size={18} />,
            sub: "Intereses generados",
            subOk: true,
            color: "#f59e0b",
            gradient: "linear-gradient(135deg,#f59e0b,#d97706)",
          },
        ].map(card => (
          <motion.div key={card.title} variants={item}>
            <StatCard loading={loading} {...card} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Metrics Bar ── */}
      <motion.div
        className="metrics-bar glass-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.38 }}
      >
        <MetricItem icon={<CheckCircle2 size={14} />} label="Pagados" value={stats.paidLoans} color="#10b981" />
        <div className="metric-sep" />
        <MetricItem icon={<AlertTriangle size={14} />} label="En retraso" value={stats.overdueLoans} color={stats.overdueLoans > 0 ? "#f59e0b" : "#475569"} />
        <div className="metric-sep" />
        <MetricItem icon={<HeartHandshake size={14} />} label="Activos" value={stats.activeLoans} color="#6366f1" />
        <div className="metric-sep" />
        <MetricItem icon={<ArrowUpRight size={14} />} label="Tasa de cobro" value={`${collectionRate}%`} color={collectionRate >= 70 ? "#10b981" : "#f59e0b"} highlight />
      </motion.div>

      {/* ── Bottom Grid ── */}
      <div className="bottom-grid">
        {/* Actividad Reciente */}
        <motion.div className="glass-card feed-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
          <div className="feed-header">
            <div className="feed-title">
              <Activity size={16} color="#6366f1" />
              Actividad Reciente
            </div>
            <Link href="/loans" className="feed-link">Ver todos <ChevronRight size={13} /></Link>
          </div>
          {loading ? (
            <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-row" />)}</div>
          ) : stats.recentLoans?.length > 0 ? (
            <div className="feed-list">
              {stats.recentLoans.map((l: any) => (
                <Link key={l.id} href={`/loans/${l.id}`} className="feed-item">
                  <div className={`feed-dot dot-${l.status}`} />
                  <div className="feed-info">
                    <span className="feed-name">{l.clientName}</span>
                    <span className="feed-time">{timeAgo(l.createdAt)}</span>
                  </div>
                  <div className="feed-right">
                    <span className="feed-amount">{fmtMoney(l.amount)}</span>
                    <span className={`feed-badge badge-${l.status}`}>
                      {l.status === "active" ? "Activo" : l.status === "paid" ? "Pagado" : "Vencido"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="feed-empty">No hay préstamos registrados aún.</div>
          )}
        </motion.div>

        {/* Vencidos */}
        <motion.div className="glass-card feed-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}>
          <div className="feed-header">
            <div className="feed-title" style={{ color: stats.overdueList?.length > 0 ? "#fbbf24" : "white" }}>
              <CalendarX size={16} color={stats.overdueList?.length > 0 ? "#fbbf24" : "#475569"} />
              Préstamos Vencidos
              {stats.overdueList?.length > 0 && (
                <span className="overdue-pill">{stats.overdueList.length}</span>
              )}
            </div>
            <Link href="/loans" className="feed-link">Gestionar <ChevronRight size={13} /></Link>
          </div>
          {loading ? (
            <div className="skeleton-list">{[1,2].map(i => <div key={i} className="skeleton-row" />)}</div>
          ) : stats.overdueList?.length > 0 ? (
            <div className="feed-list">
              {stats.overdueList.map((l: any) => (
                <Link key={l.id} href={`/loans/${l.id}`} className="feed-item feed-item-warn">
                  <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <div className="feed-info">
                    <span className="feed-name">{l.clientName}</span>
                    <span className="feed-time">Venció {l.dueDate ? new Date(l.dueDate).toLocaleDateString("es-DO", { day: "numeric", month: "short" }) : "—"}</span>
                  </div>
                  <div className="feed-right">
                    <span className="feed-amount" style={{ color: "#fbbf24" }}>{fmtMoney(l.remainingBalance)}</span>
                    <span className="feed-time">pendiente</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="feed-empty feed-empty-ok">
              <CheckCircle2 size={26} color="#10b981" />
              ¡Sin préstamos vencidos!
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Quick Actions ── */}
      <section className="quick-section">
        <h2 className="section-label">Operaciones Rápidas</h2>
        <motion.div className="quick-grid" variants={container} initial="hidden" animate="visible">
          {[
            { href: "/clients",       title: "Clientes",           desc: "Padrón de clientes activos",    icon: <Users size={18} />,        color: "linear-gradient(135deg,#6366f1,#4f46e5)" },
            { href: "/loans/create",  title: "Nuevo Préstamo",     desc: "Generar crédito inmediato",     icon: <Clock size={18} />,        color: "linear-gradient(135deg,#10b981,#059669)" },
            { href: "/loans",         title: "Cartera",            desc: "Ver todos los préstamos",       icon: <LayoutDashboard size={18} />,color: "linear-gradient(135deg,#a855f7,#7e22ce)" },
            { href: "/reports",       title: "Reportes",           desc: "Análisis de rentabilidad",      icon: <FileText size={18} />,     color: "linear-gradient(135deg,#f59e0b,#d97706)" },
            { href: "/subscription",  title: "Suscripción",        desc: "Pagos y licencia",              icon: <ShieldCheck size={18} />,  color: "linear-gradient(135deg,#ec4899,#be185d)" },
          ].map(a => (
            <motion.div key={a.href} variants={item}>
              <Link href={a.href} className="quick-item glass-card">
                <div className="quick-icon" style={{ background: a.color }}>{a.icon}</div>
                <div className="quick-meta">
                  <span className="quick-title">{a.title}</span>
                  <span className="quick-desc">{a.desc}</span>
                </div>
                <ChevronRight size={15} className="quick-arrow" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Base ── */
        .home-wrapper {
          position: relative;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .bg-glow { position: fixed; border-radius: 50%; filter: blur(130px); pointer-events: none; z-index: 0; }
        .glow-1 { width: 520px; height: 520px; background: rgba(99,102,241,0.06); top: -180px; left: -120px; }
        .glow-2 { width: 420px; height: 420px; background: rgba(168,85,247,0.05); bottom: 0; right: -100px; }

        /* ── Header ── */
        .dashboard-header {
          position: relative; z-index: 1;
          display: flex; justify-content: space-between; align-items: flex-end;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .greeting-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6366f1;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.2rem;
        }
        .welcome-text {
          font-size: 2.4rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 0.35rem;
        }
        .welcome-sub {
          font-size: 0.875rem;
          color: #475569;
          font-weight: 400;
        }
        .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
        .header-badge {
          display: inline-flex; align-items: center; gap: 0.45rem;
          background: rgba(16,185,129,0.08);
          color: #10b981;
          padding: 0.4rem 0.9rem;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(16,185,129,0.18);
          letter-spacing: 0.02em;
        }
        .status-dot {
          width: 6px; height: 6px;
          background: #10b981; border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(16,185,129,0.2);
          animation: pulse-dot 2.2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%,100%{ box-shadow:0 0 0 2px rgba(16,185,129,0.2); }
          50%    { box-shadow:0 0 0 5px rgba(16,185,129,0.08); }
        }
        .date-text {
          font-size: 0.72rem;
          color: #334155;
          text-transform: capitalize;
          letter-spacing: 0.01em;
        }

        /* ── KPI Grid ── */
        .stats-grid {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        .stat-card {
          position: relative;
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.5rem 1.6rem 1.35rem;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s;
          cursor: default;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 48px rgba(0,0,0,0.35);
          border-color: rgba(255,255,255,0.1);
        }
        .stat-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          border-radius: 16px 16px 0 0;
          opacity: 0.9;
        }
        .stat-head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.1rem;
        }
        .stat-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }
        .stat-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .stat-val {
          font-size: 1.95rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.6rem;
          font-variant-numeric: tabular-nums;
        }
        .stat-val-skeleton {
          height: 1.95rem; width: 55%;
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
          margin-bottom: 0.6rem;
          animation: shimmer 1.5s ease infinite;
        }
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        .stat-sub {
          font-size: 0.775rem;
          font-weight: 500;
          display: flex; align-items: center; gap: 0.3rem;
        }

        /* ── Metrics Bar ── */
        .metrics-bar {
          position: relative; z-index: 1;
          display: flex; align-items: center;
          padding: 0.9rem 1.75rem;
          gap: 0;
        }
        .metric-item {
          display: flex; align-items: center; gap: 0.5rem;
          flex: 1; justify-content: center;
        }
        .metric-label {
          font-size: 0.78rem; color: #475569; font-weight: 500;
        }
        .metric-value {
          font-size: 0.88rem; font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .metric-sep { width: 1px; height: 24px; background: rgba(255,255,255,0.06); margin: 0 0.25rem; }

        /* ── Bottom Grid ── */
        .bottom-grid {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;
        }
        .feed-card { padding: 1.5rem; }
        .feed-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.25rem;
        }
        .feed-title {
          display: flex; align-items: center; gap: 0.55rem;
          font-size: 0.9rem; font-weight: 700; color: white;
          letter-spacing: -0.01em;
        }
        .feed-link {
          display: flex; align-items: center; gap: 0.2rem;
          color: #6366f1; font-size: 0.75rem; font-weight: 600;
          text-decoration: none; transition: opacity 0.2s;
        }
        .feed-link:hover { opacity: 0.75; }
        .overdue-pill {
          background: #f59e0b; color: #000;
          border-radius: 99px; padding: 0.1rem 0.45rem;
          font-size: 0.68rem; font-weight: 800;
        }
        .feed-list { display: flex; flex-direction: column; gap: 0.4rem; }
        .feed-item {
          display: flex; align-items: center; gap: 0.85rem;
          padding: 0.7rem 0.85rem;
          border-radius: 10px;
          background: rgba(255,255,255,0.018);
          border: 1px solid rgba(255,255,255,0.04);
          text-decoration: none;
          transition: all 0.18s;
        }
        .feed-item:hover {
          background: rgba(99,102,241,0.06);
          border-color: rgba(99,102,241,0.15);
        }
        .feed-item-warn:hover {
          background: rgba(245,158,11,0.06);
          border-color: rgba(245,158,11,0.15);
        }
        .feed-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
        }
        .dot-active  { background: #6366f1; box-shadow: 0 0 5px #6366f1; }
        .dot-paid    { background: #10b981; }
        .dot-overdue { background: #f59e0b; box-shadow: 0 0 5px #f59e0b; }
        .feed-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.08rem; }
        .feed-name {
          font-size: 0.85rem; font-weight: 600; color: #e2e8f0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .feed-time { font-size: 0.72rem; color: #475569; }
        .feed-right {
          display: flex; flex-direction: column; align-items: flex-end; gap: 0.08rem;
          flex-shrink: 0;
        }
        .feed-amount {
          font-size: 0.88rem; font-weight: 700; color: #f8fafc;
          font-variant-numeric: tabular-nums;
        }
        .feed-badge {
          font-size: 0.66rem; font-weight: 700;
          padding: 0.12rem 0.42rem; border-radius: 4px;
        }
        .badge-active  { background: rgba(99,102,241,0.12); color: #818cf8; }
        .badge-paid    { background: rgba(16,185,129,0.12); color: #34d399; }
        .badge-overdue { background: rgba(245,158,11,0.12); color: #fbbf24; }
        .feed-empty {
          text-align: center; padding: 2.5rem 1rem;
          color: #334155; font-size: 0.85rem;
        }
        .feed-empty-ok {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.65rem; color: #10b981; font-weight: 600;
        }
        .skeleton-list { display: flex; flex-direction: column; gap: 0.4rem; }
        .skeleton-row {
          height: 50px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          animation: shimmer 1.5s ease infinite;
        }

        /* ── Quick Actions ── */
        .quick-section { position: relative; z-index: 1; }
        .section-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #475569;
          margin-bottom: 0.9rem;
          display: flex; align-items: center; gap: 0.6rem;
        }
        .section-label::before {
          content: '';
          display: inline-block;
          width: 2px; height: 0.85rem;
          background: #6366f1; border-radius: 4px;
        }
        .quick-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.85rem;
        }
        .quick-item {
          display: flex; align-items: center; gap: 0.85rem;
          padding: 1rem 1.1rem;
          border: 1px solid rgba(255,255,255,0.05);
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .quick-item:hover {
          border-color: rgba(99,102,241,0.3);
          background: rgba(99,102,241,0.04);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .quick-icon {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        }
        .quick-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
        .quick-title {
          font-size: 0.82rem; font-weight: 700; color: #e2e8f0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .quick-desc {
          font-size: 0.7rem; color: #475569;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .quick-arrow {
          color: #334155; flex-shrink: 0;
          transition: transform 0.18s, color 0.18s;
        }
        .quick-item:hover .quick-arrow { transform: translateX(3px); color: #6366f1; }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .quick-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .bottom-grid { grid-template-columns: 1fr; }
          .quick-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 0.85rem; }
          .dashboard-header { flex-direction: column; align-items: flex-start; gap: 0.85rem; padding-bottom: 1.25rem; }
          .header-right { align-items: flex-start; }
          .welcome-text { font-size: 1.75rem; }
          .metrics-bar { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding: 1rem 1.25rem; }
          .metric-sep { display: none; }
          .metric-item { justify-content: flex-start; }
          .quick-grid { grid-template-columns: 1fr; }
        }
      `}} />
    </div>
  );
}

function StatCard({ title, value, icon, sub, subOk, gradient, loading }: any) {
  return (
    <div className="stat-card">
      <div className="stat-bar" style={{ background: gradient }} />
      <div className="stat-head">
        <span className="stat-label">{title}</span>
        <div className="stat-icon" style={{ background: gradient }}>{icon}</div>
      </div>
      {loading
        ? <div className="stat-val-skeleton" />
        : <div className="stat-val">{value}</div>
      }
      <div className="stat-sub" style={{ color: subOk === true ? "#10b981" : subOk === false ? "#f59e0b" : "#475569" }}>
        {subOk === true  && <CheckCircle2 size={11} />}
        {subOk === false && <AlertTriangle size={11} />}
        {sub}
      </div>
    </div>
  );
}

function MetricItem({ icon, label, value, color, highlight }: any) {
  return (
    <div className="metric-item">
      <span style={{ color, display: "flex" }}>{icon}</span>
      <span className="metric-label">{label}:</span>
      <span className="metric-value" style={{ color: highlight ? color : "#f8fafc" }}>{value}</span>
    </div>
  );
}
