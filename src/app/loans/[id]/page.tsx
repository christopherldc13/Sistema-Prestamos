"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    CreditCard, Calendar, ArrowLeft, Download,
    PlusCircle, History, AlertCircle, CheckCircle2,
    DollarSign, User, FileText, ChevronRight, X, Clock, Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { generateLoanReceipt, generatePaymentReceipt } from "@/lib/pdf-generator";


export default function LoanDetailsPage() {
    const params = useParams();
    const { data: session } = useSession();
    const [loan, setLoan] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        method: "cash",
        date: new Date().toISOString().split('T')[0],
    });

    const fetchLoanData = async () => {
        try {
            const res = await fetch(`/api/loans/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setLoan(data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (params.id) fetchLoanData();
    }, [params.id]);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawAmount = parseFloat(paymentForm.amount);
        if (isNaN(rawAmount) || rawAmount <= 0) return alert("Ingrese un monto válido.");
        if (rawAmount > loan.remainingBalance) return alert("El monto supera el saldo restante.");

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...paymentForm, amount: rawAmount, loanId: params.id }),
            });
            if (res.ok) {
                const data = await res.json();
                setIsPaymentModalOpen(false);
                setPaymentForm({ ...paymentForm, amount: "" });
                await fetchLoanData();
                generatePaymentReceipt(data.payment, { ...loan, remainingBalance: data.updatedLoan.remainingBalance }, session?.user?.name || "Administrador");
            } else {

                const err = await res.json();
                alert(err.error || "Error al procesar pago");
            }
        } catch (e) { alert("Error de conexión"); }
        finally { setIsSubmitting(false); }
    };

    if (loading) return (
        <div className="state-screen">
            <div className="spinner-pro"></div>
            <p>Sincronizando datos del crédito...</p>
        </div>
    );

    if (!loan) return (
        <div className="state-screen">
            <AlertCircle size={48} color="#f43f5e" />
            <p>No se pudo localizar el registro del préstamo.</p>
            <Link href="/loans" className="btn-back-error">Volver al listado</Link>
        </div>
    );

    const paidAmount = loan.totalToPay - loan.remainingBalance;
    const progress = (paidAmount / loan.totalToPay) * 100;

    return (
        <div className="loan-profile-wrapper">
            <Link href="/loans" className="btn-back-minimal">
                <ArrowLeft size={16} /> Volver a Cartera de Préstamos
            </Link>

            <div className="dashboard-grid">
                {/* Main Control Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card main-control-card"
                >
                    <header className="control-header">
                        <div className="title-area">
                            <h1 className="client-name-title">Préstamo de {loan.client.fullName}</h1>
                            <div className="ref-tag">
                                <FileText size={12} />
                                <span>Ref: #{loan.id.substring(loan.id.length - 8).toUpperCase()}</span>
                            </div>
                        </div>
                        <div className={`status-pill-pro ${loan.status}`}>
                            {loan.status === 'active' && <Clock size={14} />}
                            {loan.status === 'paid' && <CheckCircle2 size={14} />}
                            {loan.status === 'overdue' && <AlertCircle size={14} />}
                            <span>{loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</span>
                        </div>
                    </header>

                    <div className="progress-visualization">
                        <div className="progress-labels">
                            <span className="p-text">Progreso del Contrato</span>
                            <span className="p-perc">{progress.toFixed(1)}% completado</span>
                        </div>
                        <div className="glow-bar-container">
                            <motion.div
                                className="glow-bar-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    <div className="main-actions-pro">
                        <button
                            className="btn-pay-pro"
                            onClick={() => setIsPaymentModalOpen(true)}
                            disabled={loan.status === 'paid'}
                        >
                            <PlusCircle size={18} />
                            <span>Registrar Abono</span>
                        </button>
                        <button className="btn-download-pro" onClick={() => generateLoanReceipt(loan)}>
                            <Download size={18} />
                            <span>Contrato PDF</span>
                        </button>
                    </div>
                </motion.div>

                {/* Balance Summary Card */}
                <motion.aside
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card balance-summary-card"
                >
                    <h3 className="section-title-sm">Balance Financiero</h3>
                    <div className="balance-rows">
                        <div className="bal-item">
                            <div className="b-label"><Wallet size={14} /> Total Pactado</div>
                            <div className="b-value">${loan.totalToPay.toLocaleString()}</div>
                        </div>
                        <div className="bal-item danger">
                            <div className="b-label"><AlertCircle size={14} /> Saldo Pendiente</div>
                            <div className="b-value-big">${loan.remainingBalance.toLocaleString()}</div>
                        </div>
                        <div className="bal-item success">
                            <div className="b-label"><CheckCircle2 size={14} /> Capital Recuperado</div>
                            <div className="b-value">${paidAmount.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="bal-mini-info">
                        <Calendar size={14} />
                        <span>Fecha Inicio: {new Date(loan.startDate).toLocaleDateString()}</span>
                    </div>
                </motion.aside>
            </div>

            {/* Payment History */}
            <section className="history-section-pro">
                <header className="history-header">
                    <div className="h-title-group">
                        <History size={20} className="icon-main" />
                        <h2>Trazabilidad de Abonos</h2>
                    </div>
                    <span className="h-count">{loan.payments.length} Registros</span>
                </header>

                <div className="glass-card history-container-glass">
                    <table className="pro-table-alt">
                        <thead>
                            <tr>
                                <th>Fecha del Pago</th>
                                <th>Monto del Abono</th>
                                <th>Medio de Pago</th>
                                <th className="text-right">Comprobante</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loan.payments.length > 0 ? (
                                loan.payments.map((p: any) => (
                                    <tr key={p.id} className="row-alt-hover">
                                        <td>
                                            <div className="date-cell">
                                                <Calendar size={14} className="dim" />
                                                {new Date(p.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="amount-pigo">+${p.amount.toLocaleString()}</span>
                                        </td>
                                        <td>
                                            <span className="method-tag">{p.method.toUpperCase()}</span>
                                        </td>
                                        <td className="text-right">
                                            <button className="btn-mini-download" onClick={() => generatePaymentReceipt(p, loan, session?.user?.name || "Administrador")}>
                                                <Download size={14} />
                                                <span>Recibo</span>
                                            </button>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="empty-state-table">
                                        <div className="empty-icon-box">
                                            <CreditCard size={32} />
                                        </div>
                                        <p>Aún no se han registrado abonos para este préstamo.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Payment Modal */}
            <AnimatePresence>
                {isPaymentModalOpen && (
                    <div className="modal-root">
                        <motion.div
                            initial={{ backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }}
                            animate={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.7)" }}
                            exit={{ backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }}
                            className="modal-overlay-new"
                            onClick={() => setIsPaymentModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="glass-card modal-content-premium"
                        >
                            <header className="modal-header-pro">
                                <div>
                                    <h3>Nuevo Abono</h3>
                                    <p>Registrar entrada de capital al préstamo</p>
                                </div>
                                <button className="btn-close-modal" onClick={() => setIsPaymentModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </header>

                            <form onSubmit={handlePayment} className="modal-form-pro">
                                <div className="field-group-modal">
                                    <label>Importe a Recibir ($)</label>
                                    <div className="input-icon-box">
                                        <DollarSign size={16} />
                                        <input
                                            type="text"
                                            className="input-pro-modal"
                                            placeholder="0,000.00"
                                            required
                                            autoFocus
                                            value={paymentForm.amount ? parseFloat(paymentForm.amount).toLocaleString('en-US') : ""}
                                            onChange={e => {
                                                const val = e.target.value.replace(/,/g, "");
                                                if (!isNaN(parseFloat(val)) || val === "") {
                                                    setPaymentForm({ ...paymentForm, amount: val });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="limit-hint">
                                        <span>Máximo: ${loan.remainingBalance.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="form-row-modal">
                                    <div className="field-group-modal">
                                        <label>Método</label>
                                        <select
                                            className="select-pro-modal"
                                            value={paymentForm.method}
                                            onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                        >
                                            <option value="cash">Efectivo 💵</option>
                                            <option value="transfer">Transferencia 🏦</option>
                                            <option value="card">Tarjeta 💳</option>
                                        </select>
                                    </div>
                                    <div className="field-group-modal">
                                        <label>Fecha</label>
                                        <input
                                            type="date"
                                            className="input-pro-modal"
                                            required
                                            value={paymentForm.date}
                                            onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <footer className="modal-footer-pro">
                                    <button type="button" className="btn-cancel-pro" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</button>
                                    <button type="submit" className="btn-confirm-pro" disabled={isSubmitting}>
                                        {isSubmitting ? "Procesando..." : "Confirmar e Imprimir Recibo"}
                                    </button>
                                </footer>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
        .loan-profile-wrapper { width: 100%; max-width: 1400px; margin: 0 auto; padding-bottom: 5rem; }
        .btn-back-minimal { display: flex; align-items: center; gap: 0.6rem; color: #64748b; font-size: 0.85rem; font-weight: 700; text-decoration: none; margin-bottom: 2rem; transition: color 0.2s; }
        .btn-back-minimal:hover { color: white; }

        .dashboard-grid { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; margin-bottom: 2.5rem; }
        
        .main-control-card { padding: 3rem; }
        .control-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
        .client-name-title { font-size: 2.25rem; font-weight: 800; color: white; letter-spacing: -0.02em; }
        .ref-tag { display: flex; align-items: center; gap: 0.5rem; color: #475569; font-size: 0.8rem; font-weight: 700; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .status-pill-pro { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
        .status-pill-pro.active { background: rgba(99, 102, 241, 0.1); color: #818cf8; }
        .status-pill-pro.paid { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-pill-pro.overdue { background: rgba(244, 63, 94, 0.1); color: #f43f5e; }

        .progress-visualization { margin-bottom: 3rem; }
        .progress-labels { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
        .p-text { font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
        .p-perc { font-size: 0.85rem; font-weight: 800; color: #6366f1; }
        
        .glow-bar-container { height: 12px; border-radius: 6px; background: rgba(255,255,255,0.03); overflow: hidden; position: relative; }
        .glow-bar-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg, #6366f1, #a855f7); box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }

        .main-actions-pro { display: flex; gap: 1.25rem; }
        .btn-pay-pro { background: #6366f1; color: white; border: none; padding: 0.9rem 1.75rem; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .btn-pay-pro:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4); }
        .btn-pay-pro:disabled { opacity: 0.4; cursor: not-allowed; }
        
        .btn-download-pro { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); padding: 0.9rem 1.75rem; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .btn-download-pro:hover { background: rgba(255,255,255,0.08); color: white; }

        .balance-summary-card { padding: 2rem; position: relative; overflow: hidden; }
        .section-title-sm { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; margin-bottom: 2rem; }
        
        .balance-rows { display: flex; flex-direction: column; gap: 1.75rem; }
        .bal-item { display: flex; flex-direction: column; gap: 0.4rem; }
        .b-label { font-size: 0.8rem; font-weight: 700; color: #64748b; display: flex; align-items: center; gap: 0.5rem; }
        .b-value { font-size: 1.25rem; font-weight: 800; color: #cbd5e1; }
        .b-value-big { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.02em; }
        
        .bal-item.danger .b-value-big { color: #f43f5e; }
        .bal-item.success .b-value { color: #10b981; }
        
        .bal-mini-info { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.03); display: flex; align-items: center; gap: 0.75rem; color: #475569; font-size: 0.8rem; font-weight: 600; }

        .history-section-pro { margin-top: 3rem; }
        .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 0 0.5rem; }
        .h-title-group { display: flex; align-items: center; gap: 1rem; color: white; }
        .h-title-group h2 { font-size: 1.5rem; font-weight: 800; }
        .icon-main { color: #6366f1; }
        .h-count { background: rgba(255,255,255,0.05); padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: #94a3b8; }

        .history-container-glass { padding: 0; overflow: hidden; }
        .pro-table-alt { width: 100%; border-collapse: collapse; text-align: left; }
        .pro-table-alt th { padding: 1.25rem 2rem; background: rgba(15, 23, 42, 0.4); font-size: 0.7rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pro-table-alt td { padding: 1.25rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
        
        .row-alt-hover:hover { background: rgba(255,255,255,0.015); }
        
        .date-cell { display: flex; align-items: center; gap: 0.75rem; color: #94a3b8; font-weight: 600; font-size: 0.9rem; }
        .date-cell .dim { color: #475569; }
        .amount-pigo { font-weight: 800; color: #10b981; font-size: 1rem; }
        .method-tag { font-size: 0.7rem; font-weight: 900; color: #475569; border: 1px solid rgba(255,255,255,0.05); padding: 0.25rem 0.6rem; border-radius: 4px; background: rgba(255,255,255,0.02); }
        
        .btn-mini-download { background: transparent; border: 1px solid rgba(99, 102, 241, 0.2); color: #818cf8; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
        .btn-mini-download:hover { background: rgba(99, 102, 241, 0.1); border-color: #6366f1; color: white; }

        .empty-state-table { padding: 5rem 0 !important; text-align: center; }
        .empty-icon-box { margin: 0 auto 1.5rem; width: 64px; height: 64px; border-radius: 20px; background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: center; color: #1e293b; }
        .empty-state-table p { color: #475569; font-weight: 600; }

        /* Modal Premium styles */
        .modal-root { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .modal-overlay-new { position: absolute; inset: 0; cursor: pointer; }
        .modal-content-premium { position: relative; width: 100%; max-width: 500px; padding: 2.5rem; z-index: 1; }
        
        .modal-header-pro { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
        .modal-header-pro h3 { font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 0.25rem; }
        .modal-header-pro p { color: #64748b; font-size: 0.9rem; }
        
        .btn-close-modal { background: transparent; border: none; color: #475569; cursor: pointer; padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-close-modal:hover { background: rgba(255,255,255,0.05); color: white; }

        .field-group-modal { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .field-group-modal label { font-size: 0.85rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .input-icon-box { position: relative; display: flex; align-items: center; }
        .input-icon-box svg { position: absolute; left: 1.25rem; color: #475569; z-index: 1; }
        .input-pro-modal { width: 100%; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); color: white; padding: 1rem 1.25rem 1rem 2.75rem; border-radius: 12px; outline: none; font-size: 1.25rem; font-weight: 700; transition: border-color 0.2s; }
        .input-pro-modal:focus { border-color: var(--primary); }
        
        .limit-hint { display: flex; justify-content: flex-end; margin-top: 0.5rem; }
        .limit-hint span { font-size: 0.75rem; font-weight: 700; color: #475569; background: rgba(255,255,255,0.03); padding: 0.2rem 0.5rem; border-radius: 4px; }
        
        .form-row-modal { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1rem; }
        .select-pro-modal { width: 100%; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); color: white; padding: 1rem; border-radius: 12px; outline: none; font-weight: 600; appearance: none; }
        .select-pro-modal option { background: #0f172a; }

        .modal-footer-pro { display: flex; gap: 1rem; margin-top: 2.5rem; }
        .btn-cancel-pro { flex: 1; background: transparent; border: 1px solid var(--border); color: #94a3b8; padding: 1rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-cancel-pro:hover { background: rgba(255,255,255,0.03); color: white; }
        
        .btn-confirm-pro { flex: 2; background: var(--primary); color: white; border: none; padding: 1rem; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 16px -4px rgba(99, 102, 241, 0.4); }
        .btn-confirm-pro:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 12px 24px -6px rgba(99, 102, 241, 0.5); }
        .btn-confirm-pro:disabled { opacity: 0.5; cursor: not-allowed; }

        .loading-state, .error-state, .state-screen { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; color: #475569; font-weight: 600; text-align: center; }
        .spinner-pro { width: 48px; height: 48px; border: 4px solid rgba(99, 102, 241, 0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .btn-back-error { background: #6366f1; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; margin-top: 2rem; }

        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .balance-summary-card { order: -1; }
        }
        @media (max-width: 640px) {
          .client-name-title { font-size: 1.5rem; }
          .main-actions-pro { flex-direction: column; }
          .form-row-modal { grid-template-columns: 1fr; }
          .main-control-card { padding: 1.5rem; }
        }
      `}} />
        </div>
    );
}
