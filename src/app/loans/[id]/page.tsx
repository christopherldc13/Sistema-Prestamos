"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
    CreditCard, Calendar, ArrowLeft, Download,
    PlusCircle, History, AlertCircle, CheckCircle2,
    DollarSign, FileText, X, Clock, Wallet,
    Table2, TrendingDown, ChevronRight, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { generateLoanReceipt, generatePaymentReceipt, generateAccountStatement, CompanyConfig } from "@/lib/pdf-generator";

type AmortRow = {
    installmentNumber: number;
    dueDate: string;
    principalPayment: number;
    interestPayment: number;
    totalPayment: number;
    balance: number;
};

export default function LoanDetailsPage() {
    const params = useParams();
    const { data: session } = useSession();
    const [loan, setLoan] = useState<any>(null);
    const [companyConfig, setCompanyConfig] = useState<CompanyConfig | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);

    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        method: "cash",
        date: new Date().toISOString().split("T")[0],
    });

    const fetchLoanData = async () => {
        try {
            const res = await fetch(`/api/loans/${params.id}`);
            if (res.ok) setLoan(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchCompanyConfig = async () => {
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            if (!data.error) setCompanyConfig(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (params.id) { fetchLoanData(); fetchCompanyConfig(); }
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
                generatePaymentReceipt(
                    data.payment,
                    { ...loan, remainingBalance: data.updatedLoan.remainingBalance },
                    session?.user?.name || "Administrador",
                    companyConfig
                );
            } else {
                const err = await res.json();
                alert(err.error || "Error al procesar pago");
            }
        } catch { alert("Error de conexión"); }
        finally { setIsSubmitting(false); }
    };

    // Derivar información financiera del préstamo
    const schedule: AmortRow[] = useMemo(() => {
        if (!loan?.paymentSchedule) return [];
        try { return loan.paymentSchedule as AmortRow[]; }
        catch { return []; }
    }, [loan]);

    const paidAmount = loan ? loan.totalToPay - loan.remainingBalance : 0;
    const progress = loan ? (paidAmount / loan.totalToPay) * 100 : 0;

    // Encontrar la próxima cuota pendiente (la primera cuya dueDate >= hoy y balance > 0)
    const nextInstallment = useMemo(() => {
        if (!schedule.length || !loan) return null;
        const paid = loan.totalToPay - loan.remainingBalance;
        let accumulated = 0;
        for (const row of schedule) {
            if (accumulated + row.totalPayment > paid + 0.01) return row;
            accumulated += row.totalPayment;
        }
        return null;
    }, [schedule, loan]);

    const daysUntilDue = useMemo(() => {
        if (!loan?.dueDate) return null;
        const diff = new Date(loan.dueDate).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [loan]);

    const fmtCurrency = (n: number) =>
        n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
                            {loan.status === "active" && <Clock size={14} />}
                            {loan.status === "paid" && <CheckCircle2 size={14} />}
                            {loan.status === "overdue" && <AlertCircle size={14} />}
                            <span>
                                {loan.status === "active" ? "Activo" :
                                 loan.status === "paid" ? "Pagado" :
                                 loan.status === "overdue" ? "Vencido" : loan.status}
                            </span>
                        </div>
                    </header>

                    <div className="progress-visualization">
                        <div className="progress-labels">
                            <span className="p-text">Progreso del Contrato</span>
                            <span className="p-perc">{progress.toFixed(1)}% completado</span>
                        </div>
                        <div className="glow-bar-container">
                            <motion.div
                                className={`glow-bar-fill ${loan.status === "overdue" ? "overdue" : ""}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Próxima cuota */}
                    {nextInstallment && loan.status !== "paid" && (
                        <div className={`next-payment-banner ${loan.status === "overdue" ? "danger" : ""}`}>
                            <div className="next-pay-left">
                                <ChevronRight size={14} />
                                <div>
                                    <span className="next-label">Próxima Cuota</span>
                                    <span className="next-date">
                                        {new Date(nextInstallment.dueDate + "T12:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "long" })}
                                        {daysUntilDue !== null && loan.status !== "overdue" &&
                                            ` · en ${daysUntilDue} día${daysUntilDue !== 1 ? "s" : ""}`}
                                        {loan.status === "overdue" && " · VENCIDO"}
                                    </span>
                                </div>
                            </div>
                            <div className="next-amount">${fmtCurrency(nextInstallment.totalPayment)}</div>
                        </div>
                    )}

                    <div className="main-actions-pro">
                        <button
                            className="btn-pay-pro"
                            onClick={() => {
                                if (loan.installmentAmount) {
                                    setPaymentForm(f => ({ ...f, amount: String(Math.min(loan.installmentAmount, loan.remainingBalance)) }));
                                }
                                setIsPaymentModalOpen(true);
                            }}
                            disabled={loan.status === "paid"}
                        >
                            <PlusCircle size={18} />
                            <span>Registrar Abono</span>
                        </button>
                        <button className="btn-download-pro" onClick={() => generateLoanReceipt(loan, companyConfig)}>
                            <Download size={18} />
                            <span>Contrato PDF</span>
                        </button>
                        <button className="btn-download-pro" onClick={() => generateAccountStatement(loan, companyConfig)}>
                            <BookOpen size={18} />
                            <span>Estado de Cuenta</span>
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
                            <div className="b-label"><Wallet size={14} /> Capital Prestado</div>
                            <div className="b-value">${fmtCurrency(loan.amount)}</div>
                        </div>
                        <div className="bal-item">
                            <div className="b-label"><TrendingDown size={14} /> Interés Total</div>
                            <div className="b-value gold">${fmtCurrency(loan.totalToPay - loan.amount)}</div>
                        </div>
                        <div className="bal-item">
                            <div className="b-label"><Wallet size={14} /> Total Pactado</div>
                            <div className="b-value">${fmtCurrency(loan.totalToPay)}</div>
                        </div>
                        <div className="bal-item danger">
                            <div className="b-label"><AlertCircle size={14} /> Saldo Pendiente</div>
                            <div className="b-value-big">${fmtCurrency(loan.remainingBalance)}</div>
                        </div>
                        <div className="bal-item success">
                            <div className="b-label"><CheckCircle2 size={14} /> Capital Recuperado</div>
                            <div className="b-value">${fmtCurrency(paidAmount)}</div>
                        </div>
                        {loan.installmentAmount && (
                            <div className="bal-item">
                                <div className="b-label"><CreditCard size={14} /> Cuota Fija (PMT)</div>
                                <div className="b-value">${fmtCurrency(loan.installmentAmount)}</div>
                            </div>
                        )}
                    </div>
                    <div className="bal-mini-info-row">
                        <div className="bal-mini-info">
                            <Calendar size={14} />
                            <span>Inicio: {new Date(loan.startDate).toLocaleDateString("es-DO")}</span>
                        </div>
                        {loan.dueDate && (
                            <div className={`bal-mini-info ${loan.status === "overdue" ? "overdue-text" : ""}`}>
                                <Clock size={14} />
                                <span>Vence: {new Date(loan.dueDate).toLocaleDateString("es-DO")}</span>
                            </div>
                        )}
                    </div>
                    <div className="loan-detail-pills">
                        <span className="detail-pill">{loan.interestRate}%
                            {loan.rateFrequency === "monthly" ? " mensual" :
                             loan.rateFrequency === "annual" ? " anual" : " diario"}
                        </span>
                        <span className="detail-pill">{loan.term} {
                            loan.termUnit === "months" ? "meses" :
                            loan.termUnit === "weeks" ? "semanas" : "días"
                        }</span>
                        <span className="detail-pill">{loan.interestType === "simple" ? "Simple" : "Francés"}</span>
                    </div>
                </motion.aside>
            </div>

            {/* Tabla de Amortización */}
            {schedule.length > 0 && (
                <section className="amort-section">
                    <header className="history-header">
                        <div className="h-title-group">
                            <Table2 size={20} className="icon-main" />
                            <h2>Tabla de Amortización</h2>
                        </div>
                        <button className="btn-toggle-amort" onClick={() => setShowSchedule(v => !v)}>
                            {showSchedule ? "Ocultar" : "Ver tabla"} ({schedule.length} cuotas)
                        </button>
                    </header>

                    <AnimatePresence>
                        {showSchedule && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: "hidden" }}
                            >
                                <div className="glass-card amort-table-container">
                                    <table className="pro-table-alt">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Fecha de Cuota</th>
                                                <th>Capital</th>
                                                <th>Interés</th>
                                                <th>Cuota Total</th>
                                                <th>Saldo Restante</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schedule.map((row, idx) => {
                                                const accPaid = schedule.slice(0, idx + 1).reduce((s, r) => s + r.totalPayment, 0);
                                                const isPaid = accPaid <= paidAmount + 0.01;
                                                return (
                                                    <tr key={row.installmentNumber} className={`row-alt-hover ${isPaid ? "row-paid" : ""}`}>
                                                        <td>
                                                            <span className={`installment-badge ${isPaid ? "paid" : ""}`}>
                                                                {isPaid ? <CheckCircle2 size={12} /> : row.installmentNumber}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="date-cell">
                                                                <Calendar size={14} className="dim" />
                                                                {new Date(row.dueDate + "T12:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })}
                                                            </div>
                                                        </td>
                                                        <td className="num-cell">${fmtCurrency(row.principalPayment)}</td>
                                                        <td className="num-cell interest-cell">${fmtCurrency(row.interestPayment)}</td>
                                                        <td className="num-cell total-cell">${fmtCurrency(row.totalPayment)}</td>
                                                        <td className="num-cell bal-cell">${fmtCurrency(row.balance)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            )}

            {/* Payment History Section */}
            <section className="history-section-pro">
                <header className="history-header">
                    <div className="h-title-group">
                        <History size={20} className="icon-main" />
                        <h2>Trazabilidad de Abonos</h2>
                    </div>
                    <span className="h-count">{loan.payments.length} Registros</span>
                </header>

                <div className="glass-card history-container-glass desktop-only-table">
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
                                                {new Date(p.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                            </div>
                                        </td>
                                        <td><span className="amount-pigo">+${fmtCurrency(p.amount)}</span></td>
                                        <td><span className="method-tag">{p.method.toUpperCase()}</span></td>
                                        <td className="text-right">
                                            <button className="btn-mini-download" onClick={() => generatePaymentReceipt(p, loan, session?.user?.name || "Administrador", companyConfig)}>
                                                <Download size={14} /><span>Recibo</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="empty-state-table">
                                        <div className="empty-icon-box"><CreditCard size={32} /></div>
                                        <p>Aún no se han registrado abonos para este préstamo.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mobile-only-cards">
                    {loan.payments.length > 0 ? (
                        loan.payments.map((p: any) => (
                            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card payment-mobile-card">
                                <div className="p-m-top">
                                    <div className="p-m-date">
                                        <Calendar size={12} />
                                        <span>{new Date(p.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</span>
                                    </div>
                                    <span className="method-tag">{p.method.toUpperCase()}</span>
                                </div>
                                <div className="p-m-main">
                                    <span className="amount-pigo">+${fmtCurrency(p.amount)}</span>
                                    <button className="btn-mini-download" onClick={() => generatePaymentReceipt(p, loan, session?.user?.name || "Administrador", companyConfig)}>
                                        <Download size={14} /><span>Recibo</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="glass-card empty-state-mobile">
                            <CreditCard size={24} className="dim" />
                            <p>No hay abonos registrados.</p>
                        </div>
                    )}
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
                                <button className="btn-close-modal" onClick={() => setIsPaymentModalOpen(false)}><X size={20} /></button>
                            </header>

                            {loan.installmentAmount && (
                                <div className="pmt-hint">
                                    <CheckCircle2 size={14} />
                                    <span>Cuota fija sugerida: <strong>${fmtCurrency(loan.installmentAmount)}</strong></span>
                                </div>
                            )}

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
                                            value={paymentForm.amount ? parseFloat(paymentForm.amount).toLocaleString("en-US") : ""}
                                            onChange={e => {
                                                const val = e.target.value.replace(/,/g, "");
                                                if (!isNaN(parseFloat(val)) || val === "")
                                                    setPaymentForm({ ...paymentForm, amount: val });
                                            }}
                                        />
                                    </div>
                                    <div className="limit-hint">
                                        <span>Máximo: ${fmtCurrency(loan.remainingBalance)}</span>
                                    </div>
                                </div>

                                <div className="form-row-modal">
                                    <div className="field-group-modal">
                                        <label>Método</label>
                                        <select className="select-pro-modal" value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                                            <option value="cash">Efectivo 💵</option>
                                            <option value="transfer">Transferencia 🏦</option>
                                            <option value="card">Tarjeta 💳</option>
                                        </select>
                                    </div>
                                    <div className="field-group-modal">
                                        <label>Fecha</label>
                                        <input type="date" className="input-pro-modal" required value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} />
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
        .ref-tag { display: flex; align-items: center; gap: 0.5rem; color: #475569; font-size: 0.8rem; font-weight: 700; margin-top: 0.5rem; text-transform: uppercase; }

        .status-pill-pro { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
        .status-pill-pro.active { background: rgba(99,102,241,0.1); color: #818cf8; }
        .status-pill-pro.paid { background: rgba(16,185,129,0.1); color: #10b981; }
        .status-pill-pro.overdue { background: rgba(244,63,94,0.1); color: #f43f5e; }

        .progress-visualization { margin-bottom: 1.5rem; }
        .progress-labels { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
        .p-text { font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
        .p-perc { font-size: 0.85rem; font-weight: 800; color: #6366f1; }
        .glow-bar-container { height: 12px; border-radius: 6px; background: rgba(255,255,255,0.03); overflow: hidden; }
        .glow-bar-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg, #6366f1, #a855f7); box-shadow: 0 0 20px rgba(99,102,241,0.4); }
        .glow-bar-fill.overdue { background: linear-gradient(90deg, #f43f5e, #fb923c); box-shadow: 0 0 20px rgba(244,63,94,0.4); }

        .next-payment-banner { display: flex; justify-content: space-between; align-items: center; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 2rem; }
        .next-payment-banner.danger { background: rgba(244,63,94,0.06); border-color: rgba(244,63,94,0.2); }
        .next-pay-left { display: flex; align-items: center; gap: 0.75rem; color: #818cf8; }
        .next-payment-banner.danger .next-pay-left { color: #f43f5e; }
        .next-label { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
        .next-date { font-size: 0.85rem; font-weight: 600; color: #94a3b8; }
        .next-amount { font-size: 1.35rem; font-weight: 900; color: white; }

        .main-actions-pro { display: flex; gap: 1.25rem; }
        .btn-pay-pro { background: #6366f1; color: white; border: none; padding: 0.9rem 1.75rem; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .btn-pay-pro:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(99,102,241,0.4); }
        .btn-pay-pro:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-download-pro { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); padding: 0.9rem 1.75rem; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .btn-download-pro:hover { background: rgba(255,255,255,0.08); color: white; }

        /* Balance card */
        .balance-summary-card { padding: 2rem; }
        .section-title-sm { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; margin-bottom: 1.5rem; }
        .balance-rows { display: flex; flex-direction: column; gap: 1.25rem; }
        .bal-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .b-label { font-size: 0.8rem; font-weight: 700; color: #64748b; display: flex; align-items: center; gap: 0.5rem; }
        .b-value { font-size: 1.15rem; font-weight: 800; color: #cbd5e1; }
        .b-value.gold { color: #f59e0b; }
        .b-value-big { font-size: 2rem; font-weight: 900; letter-spacing: -0.02em; }
        .bal-item.danger .b-value-big { color: #f43f5e; }
        .bal-item.success .b-value { color: #10b981; }

        .bal-mini-info-row { margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.04); display: flex; flex-direction: column; gap: 0.5rem; }
        .bal-mini-info { display: flex; align-items: center; gap: 0.5rem; color: #475569; font-size: 0.8rem; font-weight: 600; }
        .bal-mini-info.overdue-text { color: #f43f5e; }

        .loan-detail-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
        .detail-pill { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: #64748b; font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; }

        /* Amortization section */
        .amort-section { margin-bottom: 2.5rem; }
        .amort-table-container { padding: 0; overflow: hidden; overflow-x: auto; }
        .btn-toggle-amort { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); color: #818cf8; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-toggle-amort:hover { background: rgba(99,102,241,0.12); }
        .num-cell { text-align: right; font-family: monospace; color: #94a3b8; }
        .interest-cell { color: #f59e0b; }
        .total-cell { color: #10b981; font-weight: 700; }
        .bal-cell { color: #475569; }
        .row-paid td { opacity: 0.45; }
        .installment-badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.05); color: #64748b; font-size: 0.75rem; font-weight: 800; }
        .installment-badge.paid { background: rgba(16,185,129,0.1); color: #10b981; }

        /* History */
        .history-section-pro { margin-top: 1rem; }
        .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 0 0.5rem; }
        .h-title-group { display: flex; align-items: center; gap: 1rem; color: white; }
        .h-title-group h2 { font-size: 1.5rem; font-weight: 800; }
        .icon-main { color: #6366f1; }
        .h-count { background: rgba(255,255,255,0.05); padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: #94a3b8; }

        .history-container-glass { padding: 0; overflow: hidden; }
        .pro-table-alt { width: 100%; border-collapse: collapse; text-align: left; }
        .pro-table-alt th { padding: 1.25rem 1.5rem; background: rgba(15,23,42,0.4); font-size: 0.7rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pro-table-alt td { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
        .row-alt-hover:hover { background: rgba(255,255,255,0.015); }
        .date-cell { display: flex; align-items: center; gap: 0.75rem; color: #94a3b8; font-weight: 600; font-size: 0.9rem; }
        .date-cell .dim { color: #475569; }
        .amount-pigo { font-weight: 800; color: #10b981; font-size: 1rem; }
        .method-tag { font-size: 0.7rem; font-weight: 900; color: #475569; border: 1px solid rgba(255,255,255,0.05); padding: 0.25rem 0.6rem; border-radius: 4px; background: rgba(255,255,255,0.02); }
        .text-right { text-align: right; }
        .btn-mini-download { background: transparent; border: 1px solid rgba(99,102,241,0.2); color: #818cf8; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
        .btn-mini-download:hover { background: rgba(99,102,241,0.1); border-color: #6366f1; color: white; }
        .empty-state-table { padding: 5rem 0 !important; text-align: center; }
        .empty-icon-box { margin: 0 auto 1.5rem; width: 64px; height: 64px; border-radius: 20px; background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: center; color: #1e293b; }
        .empty-state-table p { color: #475569; font-weight: 600; }

        /* Modal */
        .modal-root { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .modal-overlay-new { position: absolute; inset: 0; cursor: pointer; }
        .modal-content-premium { position: relative; width: 100%; max-width: 500px; padding: 2.5rem; z-index: 1; }
        .modal-header-pro { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .modal-header-pro h3 { font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 0.25rem; }
        .modal-header-pro p { color: #64748b; font-size: 0.9rem; }
        .btn-close-modal { background: transparent; border: none; color: #475569; cursor: pointer; padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-close-modal:hover { background: rgba(255,255,255,0.05); color: white; }
        .pmt-hint { display: flex; align-items: center; gap: 0.75rem; background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.12); color: #10b981; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.85rem; margin-bottom: 1.5rem; }
        .field-group-modal { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .field-group-modal label { font-size: 0.85rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .input-icon-box { position: relative; display: flex; align-items: center; }
        .input-icon-box svg { position: absolute; left: 1.25rem; color: #475569; z-index: 1; }
        .input-pro-modal { width: 100%; background: rgba(15,23,42,0.4); border: 1px solid var(--border); color: white; padding: 1rem 1.25rem 1rem 2.75rem; border-radius: 12px; outline: none; font-size: 1.25rem; font-weight: 700; transition: border-color 0.2s; }
        .input-pro-modal:focus { border-color: var(--primary); }
        .limit-hint { display: flex; justify-content: flex-end; margin-top: 0.5rem; }
        .limit-hint span { font-size: 0.75rem; font-weight: 700; color: #475569; background: rgba(255,255,255,0.03); padding: 0.2rem 0.5rem; border-radius: 4px; }
        .form-row-modal { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1rem; }
        .select-pro-modal { width: 100%; background: rgba(15,23,42,0.4); border: 1px solid var(--border); color: white; padding: 1rem; border-radius: 12px; outline: none; font-weight: 600; appearance: none; }
        .select-pro-modal option { background: #0f172a; }
        .modal-footer-pro { display: flex; gap: 1rem; margin-top: 2rem; }
        .btn-cancel-pro { flex: 1; background: transparent; border: 1px solid var(--border); color: #94a3b8; padding: 1rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-cancel-pro:hover { background: rgba(255,255,255,0.03); color: white; }
        .btn-confirm-pro { flex: 2; background: var(--primary); color: white; border: none; padding: 1rem; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 16px -4px rgba(99,102,241,0.4); }
        .btn-confirm-pro:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
        .btn-confirm-pro:disabled { opacity: 0.5; cursor: not-allowed; }

        .state-screen { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; color: #475569; font-weight: 600; text-align: center; }
        .spinner-pro { width: 48px; height: 48px; border: 4px solid rgba(99,102,241,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-back-error { background: #6366f1; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; margin-top: 2rem; }

        .desktop-only-table { display: block; }
        .mobile-only-cards { display: none; }

        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .balance-summary-card { order: -1; }
          .loan-profile-wrapper { padding: 0 1rem 5rem; }
        }
        @media (max-width: 768px) {
          .desktop-only-table { display: none; }
          .mobile-only-cards { display: flex; flex-direction: column; gap: 1rem; }
          .payment-mobile-card { padding: 1.25rem; }
          .p-m-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
          .p-m-date { display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; font-size: 0.8rem; font-weight: 700; }
          .p-m-main { display: flex; justify-content: space-between; align-items: center; }
          .empty-state-mobile { padding: 3rem; text-align: center; color: #475569; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
          .main-control-card { padding: 1.5rem; }
          .client-name-title { font-size: 1.5rem; line-height: 1.2; }
          .h-title-group h2 { font-size: 1.25rem; }
          .b-value-big { font-size: 1.75rem; }
        }
        @media (max-width: 480px) {
          .main-actions-pro { flex-direction: column; width: 100%; }
          .btn-pay-pro, .btn-download-pro { width: 100%; justify-content: center; }
          .modal-content-premium { padding: 1.5rem; }
          .form-row-modal { grid-template-columns: 1fr; }
        }
      `}} />
        </div>
    );
}
