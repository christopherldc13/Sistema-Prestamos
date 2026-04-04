"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, Users, HeartHandshake, FileText, ChevronRight, TrendingUp, DollarSign, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalLent: 0,
    totalCollected: 0,
    totalEarnings: 0,
    activeLoans: 0,
    paidLoans: 0,
    overdueLoans: 0,
    pendingBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Error fetching stats:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="home-wrapper">
      <header className="dashboard-header">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="welcome-text">Panel de Control</h1>
          <p className="welcome-sub">Bienvenido de nuevo, {session?.user?.name || "Administrador"}</p>
        </motion.div>

        <div className="header-badge">
          <div className="status-dot"></div>
          Sistema Fact-Prest Activo
        </div>
      </header>

      <div className="stats-container">
        <StatCard
          title="Préstamos Activos"
          value={stats.activeLoans.toString()}
          icon={<HeartHandshake size={22} />}
          trend={`${stats.overdueLoans} con retraso`}
          color="linear-gradient(135deg, #6366f1, #4f46e5)"
        />
        <StatCard
          title="Cartera Total"
          value={`$${stats.totalLent.toLocaleString()}`}
          icon={<DollarSign size={22} />}
          trend={`Pendiente: $${stats.pendingBalance.toLocaleString()}`}
          color="linear-gradient(135deg, #a855f7, #7e22ce)"
        />
        <StatCard
          title="Recaudación"
          value={`$${stats.totalCollected.toLocaleString()}`}
          icon={<TrendingUp size={22} />}
          trend="Total histórico"
          color="linear-gradient(135deg, #10b981, #059669)"
        />
        <StatCard
          title="Ganancia Bruta"
          value={`$${stats.totalEarnings.toLocaleString()}`}
          icon={<FileText size={22} />}
          trend="Intereses generados"
          color="linear-gradient(135deg, #f59e0b, #d97706)"
        />
      </div>

      <section className="dashboard-actions">
        <h2 className="group-label">Operaciones Rápidas</h2>
        <div className="actions-layout">
          <Link href="/clients">
            <ActionItem title="Clientes" desc="Padron de clientes activos" icon={<Users size={20} />} />
          </Link>
          <Link href="/loans/create">
            <ActionItem title="Nuevo Préstamo" desc="Generar crédito inmediato" icon={<Clock size={20} />} />
          </Link>
          <Link href="/loans">
            <ActionItem title="Listado de Créditos" desc="Ver todos los préstamos" icon={<LayoutDashboard size={20} />} />
          </Link>
          <Link href="/reports">
            <ActionItem title="Reportes" desc="Análisis de rentabilidad" icon={<FileText size={20} />} />
          </Link>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        .home-wrapper {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .welcome-text {
          font-size: 2.25rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }
        .welcome-sub {
          color: #94a3b8;
          font-size: 1rem;
        }
        .header-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 0.5rem 0.875rem;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
        }
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .stat-card-custom {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 1.75rem;
          transition: transform 0.2s;
        }
        .stat-card-custom:hover {
          transform: translateY(-4px);
        }
        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 16px -4px rgba(0,0,0,0.3);
        }
        .stat-label {
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-main-val {
          font-size: 2rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.5rem;
        }
        .stat-sub-trend {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .group-label {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 1.25rem;
        }
        .actions-layout {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
        }
        .action-item-box {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .action-item-box:hover {
          background: rgba(255,255,255,0.03);
          border-color: rgba(99, 102, 241, 0.3);
        }
        .action-icon-cir {
          width: 44px;
          height: 44px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
        }
        .action-meta h3 {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.15rem;
        }
        .action-meta p {
          font-size: 0.8rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .welcome-text { font-size: 1.75rem; }
          .dashboard-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .home-wrapper { gap: 1.5rem; }
          .stats-container { grid-template-columns: 1fr; }
          .actions-layout { grid-template-columns: 1fr; }
        }
      `}} />
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  return (
    <div className="glass-card stat-card-custom">
      <div className="stat-top">
        <span className="stat-label">{title}</span>
        <div className="stat-icon-wrapper" style={{ background: color }}>{icon}</div>
      </div>
      <div className="stat-main-val">{value}</div>
      <div className="stat-sub-trend">{trend}</div>
    </div>
  );
}

function ActionItem({ title, desc, icon }: any) {
  return (
    <div className="glass-card action-item-box">
      <div className="action-icon-cir">{icon}</div>
      <div className="action-meta">
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
      <ChevronRight size={16} style={{ marginLeft: "auto", color: "#334155" }} />
    </div>
  );
}
