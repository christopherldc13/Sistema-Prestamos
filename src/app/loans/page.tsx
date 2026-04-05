"use client";

import React, { useState, useEffect } from "react";
import {
    CreditCard, Search, Filter, ArrowRight,
    CheckCircle2, AlertCircle, Clock, MoreVertical,
    ChevronRight, Calendar, User, DollarSign, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function LoansPage() {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const fetchLoans = async () => {
        try {
            const res = await fetch("/api/loans");
            const data = await res.json();
            if (Array.isArray(data)) setLoans(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const filteredLoans = loans.filter((l: any) => {
        const matchesSearch = l.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.id.includes(searchTerm);
        const matchesFilter = filterStatus === "all" || l.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="loans-wrapper">
            <header className="loans-header">
                <div className="header-text">
                    <h1 className="title-pro">Cartera de Préstamos</h1>
                    <p className="subtitle-pro">Seguimiento global de activos y cobros</p>
                </div>
                <Link href="/loans/create" className="btn-add-loan-pro">
                    <CreditCard size={18} />
                    <span>Nuevo Préstamo</span>
                </Link>
            </header>

            <div className="tools-section glass-card">
                <div className="search-box-pro">
                    <Search size={18} className="search-icon-dim" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o ID de préstamo..."
                        className="search-input-pro"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm("")}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="divider-v"></div>

                <div className="filter-pro">
                    <Filter size={18} className="filter-icon-dim" />
                    <select
                        className="select-pro"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">🟢 Préstamos Activos</option>
                        <option value="paid">🔵 Préstamos Saldados</option>
                        <option value="overdue">🔴 Préstamos Atrasados</option>
                    </select>
                </div>
            </div>

            <main className="loans-content-area">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="state-msg">
                            <div className="spinner-mini"></div>
                            <span>Consultando registros...</span>
                        </div>
                    ) : filteredLoans.length > 0 ? (
                        <div className="table-responsive glass-card">
                            <table className="pro-table">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Monto Total</th>
                                        <th>Saldo Pendiente</th>
                                        <th>Plazo</th>
                                        <th>Estado</th>
                                        <th className="text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLoans.map((loan: any) => (
                                        <motion.tr
                                            key={loan.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="row-hover"
                                        >
                                            <td>
                                                <div className="client-info-cell">
                                                    <div className="mini-avatar">
                                                        <User size={14} />
                                                    </div>
                                                    <div className="client-meta">
                                                        <span className="name">{loan.client.fullName}</span>
                                                        <span className="id-sub">#{loan.id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="amount-main">${loan.totalToPay.toLocaleString()}</span>
                                            </td>
                                            <td>
                                                <div className="pending-cell">
                                                    <span className={`amount-pending ${loan.remainingBalance > 0 ? 'highlight' : ''}`}>
                                                        ${loan.remainingBalance.toLocaleString()}
                                                    </span>
                                                    <div className="mini-progress">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${((loan.totalToPay - loan.remainingBalance) / loan.totalToPay) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="term-cell">
                                                    <Calendar size={14} />
                                                    <span>{loan.term} {loan.termUnit === 'months' ? 'Meses' : loan.termUnit === 'weeks' ? 'Sems' : 'Días'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${loan.status}`}>
                                                    {loan.status === 'active' && <Clock size={12} />}
                                                    {loan.status === 'paid' && <CheckCircle2 size={12} />}
                                                    {loan.status === 'overdue' && <AlertCircle size={12} />}
                                                    {loan.status === 'active' ? 'Activo' : 
                                                     loan.status === 'paid' ? 'Pagado' : 
                                                     loan.status === 'overdue' ? 'Vencido' : loan.status}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <Link href={`/loans/${loan.id}`} className="btn-go-details">
                                                    Gestionar <ChevronRight size={14} />
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="state-msg">
                            <div className="empty-box">
                                <DollarSign size={40} />
                            </div>
                            <p>No se encontraron préstamos registrados.</p>
                            <Link href="/loans/create" className="btn-add-client" style={{ marginTop: '1.5rem' }}>
                                Crear primer préstamo
                            </Link>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
        .loans-wrapper { width: 100%; max-width: 1400px; margin: 0 auto; padding-bottom: 3rem; }
        .loans-header { 
          display: flex; justify-content: space-between; align-items: flex-end; 
          margin-bottom: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1.5rem;
        }
        .title-pro { font-size: 2.25rem; font-weight: 800; color: white; letter-spacing: -0.02em; }
        .subtitle-pro { color: #64748b; font-size: 0.95rem; margin-top: 0.25rem; }
        
        .btn-add-loan-pro {
          background: var(--primary); color: white; border: none; 
          padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700; 
          display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s;
          text-decoration: none;
        }
        .btn-add-loan-pro:hover { background: var(--primary-hover); transform: translateY(-2px); }

        .tools-section { 
          display: flex; align-items: center; padding: 0.75rem 1.5rem; margin-bottom: 2rem; 
          background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border);
        }
        .search-box-pro { flex: 1; display: flex; align-items: center; }
        .search-icon-dim { color: #475569; margin-right: 1rem; }
        .search-input-pro { background: transparent; border: none; color: white; width: 100%; outline: none; font-size: 0.95rem; padding: 0.75rem 0; }
        .clear-search { color: #475569; border: none; background: transparent; cursor: pointer; padding: 4px; }
        
        .divider-v { width: 1px; height: 32px; background: rgba(255,255,255,0.08); margin: 0 1.5rem; }
        
        .filter-pro { display: flex; align-items: center; gap: 0.75rem; }
        .filter-icon-dim { color: #475569; }
        .select-pro { background: transparent; border: none; color: #94a3b8; font-weight: 600; outline: none; cursor: pointer; font-size: 0.9rem; }
        .select-pro option { background: #0f172a; color: white; }

        .table-responsive { overflow-x: auto; padding: 0; background: rgba(15, 23, 42, 0.2); }
        .pro-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 900px; }
        .pro-table th { padding: 1.25rem 1.5rem; font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pro-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
        
        .row-hover:hover { background: rgba(255,255,255,0.02); }

        .client-info-cell { display: flex; align-items: center; gap: 1rem; }
        .mini-avatar { width: 32px; height: 32px; border-radius: 8px; background: rgba(99, 102, 241, 0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; }
        .client-meta { display: flex; flex-direction: column; }
        .client-meta .name { font-weight: 700; color: white; font-size: 0.95rem; }
        .client-meta .id-sub { font-size: 0.7rem; color: #475569; font-weight: 600; }

        .amount-main { font-weight: 700; color: #cbd5e1; }
        .pending-cell { display: flex; flex-direction: column; gap: 0.5rem; min-width: 140px; }
        .amount-pending { font-weight: 800; color: #475569; }
        .amount-pending.highlight { color: #f59e0b; }
        .mini-progress { width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: #6366f1; border-radius: 4px; }

        .term-cell { display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; font-size: 0.9rem; }

        .status-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .status-pill.active { background: rgba(99, 102, 241, 0.1); color: #818cf8; }
        .status-pill.paid { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-pill.overdue { background: rgba(244, 63, 94, 0.1); color: #f43f5e; }

        .btn-go-details { background: rgba(255,255,255,0.05); color: #6366f1; border: none; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem; }
        .btn-go-details:hover { background: rgba(99, 102, 241, 0.1); }
        .text-right { text-align: right; }

        .state-msg { text-align: center; padding: 8rem 0; color: #475569; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .spinner-mini { width: 32px; height: 32px; border: 3px solid rgba(99, 102, 241, 0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .empty-box { width: 64px; height: 64px; border-radius: 20px; background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }

        @media (max-width: 1024px) {
          .loans-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
          .tools-section { flex-direction: column; align-items: stretch; gap: 1rem; }
          .divider-v { display: none; }
        }
      `}} />
        </div>
    );
}
