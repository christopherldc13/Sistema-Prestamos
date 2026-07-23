"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
    CreditCard, Calendar, ArrowLeft, Download,
    PlusCircle, History, AlertCircle, CheckCircle2,
    DollarSign, FileText, X, Clock, Wallet,
    Table2, TrendingDown, TrendingUp, ChevronRight, BookOpen,
    Copy, Check, Building2, ShieldAlert, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { generateLoanReceipt, generatePaymentReceipt, generateAccountStatement, getPaymentReceiptDetails, CompanyConfig } from "@/lib/pdf-generator";
import { useUserPlan } from "@/components/UserPlanProvider";
import { Lock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

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
    const router = useRouter();
    const { data: session } = useSession();
    const [loan, setLoan] = useState<any>(null);
    const [companyConfig, setCompanyConfig] = useState<CompanyConfig | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const { plan } = useUserPlan();
    const [viewingPayment, setViewingPayment] = useState<any>(null);

    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        method: "cash",
        date: new Date().toISOString().split("T")[0],
    });
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyField = (text: string, key: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(key);
            setTimeout(() => setCopiedField(null), 2000);
        }).catch(() => {});
    };

    const bankAccounts: any[] = (companyConfig as any)?.bankAccounts ?? [];

    const fetchLoanData = async () => {
        try {
            const res = await fetch(`/api/loans/${params.id}`);
            if (res.ok) {
                const fresh = await res.json();
                setLoan(fresh);
                return fresh;
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
        return null;
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
        if (rawAmount > loan.remainingBalance + accumulatedLateFee) return alert("El monto supera el saldo restante (incluyendo la mora).");
        if (accumulatedLateFee > 0) {
            const minRequired = Math.min((loan.installmentAmount || 0) + accumulatedLateFee, loan.remainingBalance + accumulatedLateFee);
            if (rawAmount + 0.01 < minRequired) {
                return alert(`Este préstamo tiene una mora pendiente de $${fmtCurrency(accumulatedLateFee)}. Debes abonar al menos $${fmtCurrency(minRequired)} (cuota + mora) para continuar.`);
            }
        }

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
                const freshLoan = await fetchLoanData();
                generatePaymentReceipt(
                    data.payment,
                    freshLoan || { ...loan, remainingBalance: data.updatedLoan.remainingBalance },
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
        const dateStr = nextInstallment?.dueDate ?? loan?.dueDate;
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
        const dueUTC = Date.UTC(y, m - 1, d);
        const now = new Date();
        const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        return Math.round((dueUTC - nowUTC) / (1000 * 60 * 60 * 24));
    }, [nextInstallment, loan]);

    // El servidor ya calcula la mora en base a la cuota más próxima vencida (no la fecha final del préstamo)
    const accumulatedLateFee: number = loan?.accumulatedLateFee || 0;

    // Mora ya cobrada históricamente (suma de todos los pagos), distinto de la mora pendiente actual
    const totalLateFeeCollected: number = useMemo(() => {
        return (loan?.payments || []).reduce((s: number, p: any) => s + (p.lateFeeAmount || 0), 0);
    }, [loan]);
    const daysOverdue: number = loan?.daysOverdue || 0;

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
                                 loan.status === "overdue" ? `En Mora · ${daysOverdue} día${daysOverdue !== 1 ? "s" : ""}` : loan.status}
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
                            <div className="next-amount">
                                ${fmtCurrency(nextInstallment.totalPayment)}
                                {accumulatedLateFee > 0 && <span style={{display:"block", fontSize:"0.75rem", color:"#f43f5e", marginTop:"4px"}}>+ ${fmtCurrency(accumulatedLateFee)} de mora</span>}
                            </div>
                        </div>
                    )}

                    <div className="main-actions-pro">
                        <button
                            className="btn-pay-pro"
                            onClick={() => {
                                if (loan.installmentAmount) {
                                    setPaymentForm(f => ({ ...f, amount: String(Math.min(loan.installmentAmount + accumulatedLateFee, loan.remainingBalance + accumulatedLateFee)) }));
                                }
                                setIsPaymentModalOpen(true);
                            }}
                            disabled={loan.status === "paid"}
                        >
                            <PlusCircle size={18} />
                            <span>Registrar Abono</span>
                        </button>

                        {plan.hasContractPDF ? (
                            <button className="btn-download-pro" onClick={() => generateLoanReceipt(loan, companyConfig)}>
                                <Download size={18} />
                                <span>Contrato PDF</span>
                            </button>
                        ) : (
                            <button className="btn-locked-action" onClick={() => router.push("/plans")} title="Disponible desde Plan Intermedio">
                                <Lock size={16} />
                                <span>Contrato PDF</span>
                                <span className="lock-plan-badge">Intermedio</span>
                            </button>
                        )}

                        {plan.hasStatementPDF ? (
                            <button className="btn-download-pro" onClick={() => generateAccountStatement(loan, companyConfig)}>
                                <BookOpen size={18} />
                                <span>Estado de Cuenta</span>
                            </button>
                        ) : (
                            <button className="btn-locked-action" onClick={() => router.push("/plans")} title="Disponible desde Plan Intermedio">
                                <Lock size={16} />
                                <span>Estado de Cuenta</span>
                                <span className="lock-plan-badge">Intermedio</span>
                            </button>
                        )}
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
                        {totalLateFeeCollected > 0 && (
                            <div className="bal-item mora-collected">
                                <div className="b-label"><ShieldAlert size={14} /> Mora Cobrada (Total)</div>
                                <div className="b-value mora-collected-value">${fmtCurrency(totalLateFeeCollected)}</div>
                            </div>
                        )}
                        <div className="bal-item ganancia-total">
                            <div className="b-label"><TrendingUp size={14} /> Ganancia Total {totalLateFeeCollected > 0 ? "(Interés + Mora)" : ""}</div>
                            <div className="b-value-big ganancia-value">${fmtCurrency((loan.totalToPay - loan.amount) + totalLateFeeCollected)}</div>
                        </div>
                        <div className="bal-item">
                            <div className="b-label"><Wallet size={14} /> Total Pactado</div>
                            <div className="b-value">${fmtCurrency(loan.totalToPay)}</div>
                        </div>
                        <div className="bal-item danger">
                            <div className="b-label"><AlertCircle size={14} /> Saldo Pendiente</div>
                            <div className="b-value-big">${fmtCurrency(loan.remainingBalance)}</div>
                        </div>
                        {accumulatedLateFee > 0 && (
                            <div className="bal-item mora-alert">
                                <div className="b-label"><AlertCircle size={14} /> Mora Acumulada ({daysOverdue} día{daysOverdue !== 1 ? "s" : ""})</div>
                                <div className="b-value-big mora-value">+ ${fmtCurrency(accumulatedLateFee)}</div>
                            </div>
                        )}
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
                             loan.rateFrequency === "annual" ? " anual" :
                             loan.rateFrequency === "biweekly" ? " quincenal" : " diario"}
                        </span>
                        <span className="detail-pill">{loan.term} {
                            loan.termUnit === "months" ? "meses" :
                            loan.termUnit === "biweekly" ? "quincenas" :
                            loan.termUnit === "weeks" ? "semanas" : "días"
                        }</span>
                        <span className="detail-pill">{loan.interestType === "simple" ? "Simple" : "Francés"}</span>
                    </div>
                </motion.aside>
            </div>

            {/* Bank Accounts Card */}
            {bankAccounts.length > 0 && loan.status !== "paid" && (
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bank-section"
                >
                    <header className="history-header">
                        <div className="h-title-group">
                            <Building2 size={20} className="icon-main" />
                            <h2>Cuentas para Transferencia</h2>
                        </div>
                        <span className="h-count">{bankAccounts.length} cuenta{bankAccounts.length !== 1 ? "s" : ""}</span>
                    </header>
                    <div className="bank-accounts-grid">
                        {bankAccounts.map((acc: any) => (
                            <div key={acc.id} className="glass-card bank-account-display-card">
                                <div className="badc-top">
                                    <span className="badc-bank">{acc.bank}</span>
                                    <span className="badc-type">{acc.type}</span>
                                </div>
                                <div className="badc-number-row">
                                    <span className="badc-number">{acc.number}</span>
                                    <button
                                        className={`badc-copy ${copiedField === `page-${acc.id}` ? "copied" : ""}`}
                                        onClick={() => copyField(acc.number, `page-${acc.id}`)}
                                    >
                                        {copiedField === `page-${acc.id}` ? <Check size={13} /> : <Copy size={13} />}
                                        <span>{copiedField === `page-${acc.id}` ? "Copiado!" : "Copiar"}</span>
                                    </button>
                                </div>
                                <div className="badc-holder">
                                    <span className="badc-holder-label">A nombre de</span>
                                    <span className="badc-holder-name">{acc.holder}</span>
                                </div>
                                {acc.iban && (
                                    <div className="badc-iban-row">
                                        <span className="badc-holder-label">IBAN</span>
                                        <span className="badc-iban">{acc.iban}</span>
                                        <button
                                            className={`badc-copy badc-copy-sm ${copiedField === `page-iban-${acc.id}` ? "copied" : ""}`}
                                            onClick={() => copyField(acc.iban, `page-iban-${acc.id}`)}
                                        >
                                            {copiedField === `page-iban-${acc.id}` ? <Check size={11} /> : <Copy size={11} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.section>
            )}

            {/* Tabla de Amortización */}
            {schedule.length > 0 && (
                <section className="amort-section">
                    <header className="history-header">
                        <div className="h-title-group">
                            <Table2 size={20} className="icon-main" />
                            <h2>Tabla de Amortización</h2>
                        </div>
                        {plan.hasAmortizationTable ? (
                            <button className="btn-toggle-amort" onClick={() => setShowSchedule(v => !v)}>
                                {showSchedule ? "Ocultar" : "Ver tabla"} ({schedule.length} cuotas)
                            </button>
                        ) : (
                            <button className="btn-locked-sm" onClick={() => router.push("/plans")}>
                                <Lock size={13} /> Intermedio+
                            </button>
                        )}
                    </header>
                    {!plan.hasAmortizationTable && (
                        <div className="amort-locked-block" onClick={() => router.push("/plans")}>
                            <Lock size={24} />
                            <div>
                                <strong>Tabla de Amortización bloqueada</strong>
                                <p>Disponible en Plan Intermedio o superior. Ver el desglose completo de cuotas, capital e interés por período.</p>
                            </div>
                            <button className="btn-upgrade-sm"><Zap size={13} /> Actualizar Plan</button>
                        </div>
                    )}

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
                    <div className="h-count-group">
                        <span className="h-count">{loan.payments.length} Registros</span>
                        {plan.maxPaymentHistory !== -1 && loan.payments.length > plan.maxPaymentHistory && (
                            <span className="h-limit-badge">Mostrando últimos {plan.maxPaymentHistory}</span>
                        )}
                    </div>
                </header>

                {(() => {
                    const visiblePayments = plan.maxPaymentHistory === -1
                        ? loan.payments
                        : [...loan.payments].slice(-plan.maxPaymentHistory);
                    return (
                        <>
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
                                    {visiblePayments.length > 0 ? (
                                        visiblePayments.map((p: any) => (
                                            <tr key={p.id} className="row-alt-hover">
                                                <td>
                                                    <div className="date-cell">
                                                        <Calendar size={14} className="dim" />
                                                        {new Date(p.date.split("T")[0] + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </div>
                                                </td>
                                                <td><span className="amount-pigo">+${fmtCurrency(p.amount)}</span></td>
                                                <td><span className="method-tag">{p.method.toUpperCase()}</span></td>
                                                <td className="text-right">
                                                    <div className="receipt-actions">
                                                        <button className="btn-mini-view" onClick={() => setViewingPayment(p)}>
                                                            <Eye size={14} /><span>Ver</span>
                                                        </button>
                                                        <button className="btn-mini-download" onClick={() => generatePaymentReceipt(p, loan, session?.user?.name || "Administrador", companyConfig)}>
                                                            <Download size={14} /><span>Recibo</span>
                                                        </button>
                                                    </div>
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
                            {plan.maxPaymentHistory !== -1 && loan.payments.length > plan.maxPaymentHistory && (
                                <div className="history-limit-row" onClick={() => router.push("/plans")}>
                                    <Lock size={14} />
                                    <span>{loan.payments.length - plan.maxPaymentHistory} pagos anteriores ocultos — actualiza tu plan para ver el historial completo</span>
                                    <button className="btn-upgrade-sm"><Zap size={13} /> Ver Planes</button>
                                </div>
                            )}
                        </div>

                        <div className="mobile-only-cards">
                            {visiblePayments.length > 0 ? (
                                visiblePayments.map((p: any) => (
                                    <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card payment-mobile-card">
                                        <div className="p-m-top">
                                            <div className="p-m-date">
                                                <Calendar size={12} />
                                                <span>{new Date(p.date.split("T")[0] + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</span>
                                            </div>
                                            <span className="method-tag">{p.method.toUpperCase()}</span>
                                        </div>
                                        <div className="p-m-main">
                                            <span className="amount-pigo">+${fmtCurrency(p.amount)}</span>
                                            <div className="receipt-actions">
                                                <button className="btn-mini-view" onClick={() => setViewingPayment(p)}>
                                                    <Eye size={14} /><span>Ver</span>
                                                </button>
                                                <button className="btn-mini-download" onClick={() => generatePaymentReceipt(p, loan, session?.user?.name || "Administrador", companyConfig)}>
                                                    <Download size={14} /><span>Recibo</span>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="glass-card empty-state-mobile">
                                    <CreditCard size={24} className="dim" />
                                    <p>No hay abonos registrados.</p>
                                </div>
                            )}
                            {plan.maxPaymentHistory !== -1 && loan.payments.length > plan.maxPaymentHistory && (
                                <div className="history-limit-row" onClick={() => router.push("/plans")}>
                                    <Lock size={14} />
                                    <span>{loan.payments.length - plan.maxPaymentHistory} pagos ocultos</span>
                                    <button className="btn-upgrade-sm"><Zap size={13} /> Planes</button>
                                </div>
                            )}
                        </div>
                        </>
                    );
                })()}
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

                            {accumulatedLateFee > 0 && (
                                <div className="mora-mandatory-notice">
                                    <AlertCircle size={14} />
                                    <span>Este préstamo tiene una mora de ${fmtCurrency(accumulatedLateFee)} pendiente. Todo abono debe incluirla.</span>
                                </div>
                            )}

                            <div className="pmt-hints-row">
                                {loan.installmentAmount && (
                                    <>
                                        {accumulatedLateFee === 0 && (
                                            <button
                                                type="button"
                                                className="pmt-hint-btn"
                                                onClick={() => setPaymentForm(f => ({ ...f, amount: String(Math.min(loan.installmentAmount, loan.remainingBalance)) }))}
                                            >
                                                <span className="pmt-hint-label">Pagar cuota</span>
                                                <span className="pmt-hint-value">${fmtCurrency(Math.min(loan.installmentAmount, loan.remainingBalance))}</span>
                                            </button>
                                        )}
                                        {accumulatedLateFee > 0 && (
                                            <button
                                                type="button"
                                                className="pmt-hint-btn"
                                                onClick={() => setPaymentForm(f => ({ ...f, amount: String(Math.min(loan.installmentAmount + accumulatedLateFee, loan.remainingBalance + accumulatedLateFee)) }))}
                                                style={{ borderColor: "rgba(244,63,94,0.3)" }}
                                            >
                                                <span className="pmt-hint-label" style={{ color: "#fca5a5" }}>Cuota + Mora (obligatorio)</span>
                                                <span className="pmt-hint-value">${fmtCurrency(Math.min(loan.installmentAmount + accumulatedLateFee, loan.remainingBalance + accumulatedLateFee))}</span>
                                            </button>
                                        )}
                                    </>
                                )}
                                <button
                                    type="button"
                                    className="pmt-hint-btn pmt-hint-total"
                                    onClick={() => setPaymentForm(f => ({ ...f, amount: String(loan.remainingBalance + accumulatedLateFee) }))}
                                >
                                    <span className="pmt-hint-label">Saldar total {accumulatedLateFee > 0 ? "(incluye mora)" : ""}</span>
                                    <span className="pmt-hint-value">${fmtCurrency(loan.remainingBalance + accumulatedLateFee)}</span>
                                </button>
                            </div>

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
                                        <span>Máximo: ${fmtCurrency(loan.remainingBalance + accumulatedLateFee)}</span>
                                        {accumulatedLateFee > 0 && <span className="limit-hint-min">Mínimo (incluye mora): ${fmtCurrency(Math.min((loan.installmentAmount || 0) + accumulatedLateFee, loan.remainingBalance + accumulatedLateFee))}</span>}
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

                                {/* Transfer accounts panel */}
                                <AnimatePresence>
                                    {paymentForm.method === "transfer" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: "hidden" }}
                                            className="transfer-panel-wrapper"
                                        >
                                            <div className="transfer-panel">
                                                <div className="transfer-panel-header">
                                                    <Building2 size={15} />
                                                    <span>Cuentas para Transferencia</span>
                                                </div>
                                                {bankAccounts.length === 0 ? (
                                                    <p className="transfer-no-accounts">No hay cuentas configuradas. El administrador puede agregarlas en Configuración.</p>
                                                ) : (
                                                    <div className="transfer-accounts-list">
                                                        {bankAccounts.map((acc: any) => (
                                                            <div key={acc.id} className="transfer-account-card">
                                                                <div className="tac-bank-row">
                                                                    <span className="tac-bank">{acc.bank}</span>
                                                                    <span className="tac-type">{acc.type}</span>
                                                                </div>
                                                                <div className="tac-number-row">
                                                                    <span className="tac-number">{acc.number}</span>
                                                                    <button
                                                                        type="button"
                                                                        className={`tac-copy-btn ${copiedField === `num-${acc.id}` ? "copied" : ""}`}
                                                                        onClick={() => copyField(acc.number, `num-${acc.id}`)}
                                                                    >
                                                                        {copiedField === `num-${acc.id}` ? <Check size={12} /> : <Copy size={12} />}
                                                                        {copiedField === `num-${acc.id}` ? "Copiado" : "Copiar"}
                                                                    </button>
                                                                </div>
                                                                <div className="tac-holder-row">
                                                                    <span className="tac-holder-label">A nombre de:</span>
                                                                    <span className="tac-holder">{acc.holder}</span>
                                                                </div>
                                                                {acc.iban && (
                                                                    <div className="tac-iban-row">
                                                                        <span className="tac-holder-label">IBAN:</span>
                                                                        <span className="tac-number tac-iban">{acc.iban}</span>
                                                                        <button
                                                                            type="button"
                                                                            className={`tac-copy-btn ${copiedField === `iban-${acc.id}` ? "copied" : ""}`}
                                                                            onClick={() => copyField(acc.iban, `iban-${acc.id}`)}
                                                                        >
                                                                            {copiedField === `iban-${acc.id}` ? <Check size={12} /> : <Copy size={12} />}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

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

            {/* Modal: Ver Detalles del Recibo */}
            <AnimatePresence>
                {viewingPayment && (() => {
                    const d = getPaymentReceiptDetails(viewingPayment, loan);
                    return (
                        <div className="modal-root">
                            <motion.div
                                initial={{ backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }}
                                animate={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.7)" }}
                                exit={{ backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }}
                                className="modal-overlay-new"
                                onClick={() => setViewingPayment(null)}
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="glass-card modal-content-premium view-receipt-modal"
                            >
                                <header className="modal-header-pro">
                                    <div>
                                        <h3>Detalle del Recibo</h3>
                                        <p>{d.receiptNo} · Cuota {d.installmentNumber} de {d.totalInstallments}</p>
                                    </div>
                                    <button className="btn-close-modal" onClick={() => setViewingPayment(null)}><X size={20} /></button>
                                </header>

                                <div className="vr-breakdown">
                                    <div className="vr-row">
                                        <span><Wallet size={14} /> Capital amortizado</span>
                                        <strong>${fmtCurrency(d.capitalPart)}</strong>
                                    </div>
                                    <div className="vr-row">
                                        <span><TrendingDown size={14} /> Interés del período</span>
                                        <strong>${fmtCurrency(d.interestPart)}</strong>
                                    </div>
                                    <div className="vr-row">
                                        <span><ShieldAlert size={14} /> Mora</span>
                                        <strong className={d.lateFeePart > 0 ? "vr-mora" : ""}>${fmtCurrency(d.lateFeePart)}</strong>
                                    </div>
                                </div>

                                <div className="vr-total-row">
                                    <span>Total Recibido</span>
                                    <span className="vr-total-value">${fmtCurrency(d.totalReceived)}</span>
                                </div>
                                <div className="vr-meta-row">
                                    <span>Forma de pago</span>
                                    <span className="method-tag">{d.methodLabel.toUpperCase()}</span>
                                </div>

                                <div className="vr-divider" />

                                <h4 className="vr-section-title">Resumen de Cuenta</h4>
                                <div className="vr-breakdown">
                                    <div className="vr-row">
                                        <span>Saldo anterior</span>
                                        <strong>${fmtCurrency(d.prevBalance)}</strong>
                                    </div>
                                    <div className="vr-row">
                                        <span>Abonado a capital</span>
                                        <strong>- ${fmtCurrency(d.principalPortion)}</strong>
                                    </div>
                                    {d.lateFeePart > 0 && (
                                        <div className="vr-row">
                                            <span>Mora cobrada (no amortiza)</span>
                                            <strong className="vr-mora">${fmtCurrency(d.lateFeePart)}</strong>
                                        </div>
                                    )}
                                    <div className="vr-row vr-row-final">
                                        <span>Saldo pendiente</span>
                                        <strong className={d.afterBalance === 0 ? "vr-paid" : ""}>${fmtCurrency(d.afterBalance)}</strong>
                                    </div>
                                </div>

                                {d.afterBalance === 0 && (
                                    <div className="vr-paid-banner"><CheckCircle2 size={15} /> Préstamo pagado — gracias</div>
                                )}

                                {d.nextInstallment && d.afterBalance > 0 && (
                                    <div className="vr-next-installment">
                                        <span>Próxima cuota</span>
                                        <span>{new Date(d.nextInstallment.dueDate + "T12:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short" })} · ${fmtCurrency(d.nextInstallment.totalPayment)}</span>
                                    </div>
                                )}

                                <footer className="modal-footer-pro">
                                    <button type="button" className="btn-cancel-pro" onClick={() => setViewingPayment(null)}>Cerrar</button>
                                    <button
                                        type="button"
                                        className="btn-confirm-pro"
                                        onClick={() => generatePaymentReceipt(viewingPayment, loan, session?.user?.name || "Administrador", companyConfig)}
                                    >
                                        <Download size={16} /> Descargar Recibo
                                    </button>
                                </footer>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
        .loan-profile-wrapper { width: 100%; max-width: 1400px; margin: 0 auto; padding-bottom: 5rem; }
        .btn-back-minimal { display: flex; align-items: center; gap: 0.6rem; color: var(--text-dim); font-size: 0.85rem; font-weight: 700; text-decoration: none; margin-bottom: 2rem; transition: color 0.2s; }
        .btn-back-minimal:hover { color: var(--text-main); }

        .dashboard-grid { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; margin-bottom: 2.5rem; }

        .main-control-card { padding: 3rem; }
        .control-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
        .client-name-title { font-size: 2.25rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em; }
        .ref-tag { display: flex; align-items: center; gap: 0.5rem; color: var(--text-faint); font-size: 0.8rem; font-weight: 700; margin-top: 0.5rem; text-transform: uppercase; }

        .status-pill-pro { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
        .status-pill-pro.active { background: rgba(99,102,241,0.1); color: #818cf8; }
        .status-pill-pro.paid { background: rgba(16,185,129,0.1); color: #10b981; }
        .status-pill-pro.overdue { background: rgba(244,63,94,0.1); color: #f43f5e; }

        .progress-visualization { margin-bottom: 1.5rem; }
        .progress-labels { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
        .p-text { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }
        .p-perc { font-size: 0.85rem; font-weight: 800; color: #6366f1; }
        .glow-bar-container { height: 12px; border-radius: 6px; background: rgba(var(--edge-rgb), 0.03); overflow: hidden; }
        .glow-bar-fill { height: 100%; border-radius: 6px; background: #6366f1; box-shadow: 0 0 20px rgba(99,102,241,0.4); }
        .glow-bar-fill.overdue { background: #f43f5e; box-shadow: 0 0 20px rgba(244,63,94,0.4); }

        .next-payment-banner { display: flex; justify-content: space-between; align-items: center; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 2rem; }
        .next-payment-banner.danger { background: rgba(244,63,94,0.06); border-color: rgba(244,63,94,0.2); }
        .next-pay-left { display: flex; align-items: center; gap: 0.75rem; color: #818cf8; }
        .next-payment-banner.danger .next-pay-left { color: #f43f5e; }
        .next-label { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
        .next-date { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .next-amount { font-size: 1.35rem; font-weight: 900; color: var(--text-main); }

        .main-actions-pro { display: flex; gap: 1.25rem; }
        .btn-pay-pro { background: #6366f1; color: white; border: none; padding: 0.9rem 1.75rem; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .btn-pay-pro:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(99,102,241,0.4); }
        .btn-pay-pro:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-download-pro { background: rgba(var(--edge-rgb), 0.05); color: var(--text-muted); border: 1px solid rgba(var(--edge-rgb), 0.08); padding: 0.9rem 1.75rem; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .btn-download-pro:hover { background: rgba(var(--edge-rgb), 0.08); color: var(--text-main); }
        .btn-locked-action { background: rgba(245,158,11,0.06); color: var(--text-dim); border: 1px dashed rgba(245,158,11,0.3); padding: 0.9rem 1.5rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.6rem; cursor: pointer; transition: all 0.2s; font-size: 0.88rem; }
        .btn-locked-action:hover { background: rgba(245,158,11,0.1); color: #fbbf24; border-style: solid; }
        .lock-plan-badge { background: rgba(245,158,11,0.15); color: #fbbf24; padding: 0.1rem 0.5rem; border-radius: 99px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.03em; }
        .btn-locked-sm { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(245,158,11,0.08); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); padding: 0.4rem 0.85rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
        .amort-locked-block { display: flex; align-items: center; gap: 1rem; background: rgba(245,158,11,0.06); border: 1px dashed rgba(245,158,11,0.2); border-radius: 12px; padding: 1.25rem 1.5rem; cursor: pointer; transition: all 0.2s; color: var(--text-muted); margin-top: 0.75rem; }
        .amort-locked-block:hover { background: rgba(245,158,11,0.1); }
        .amort-locked-block strong { display: block; color: #fbbf24; font-size: 0.9rem; margin-bottom: 0.25rem; }
        .amort-locked-block p { font-size: 0.8rem; color: var(--text-dim); margin: 0; line-height: 1.5; }
        .btn-upgrade-sm { display: inline-flex; align-items: center; gap: 0.3rem; background: #7c3aed; color: white; border: none; padding: 0.4rem 0.9rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
        .h-count-group { display: flex; align-items: center; gap: 0.6rem; }
        .h-limit-badge { background: rgba(245,158,11,0.12); color: #fbbf24; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.7rem; font-weight: 700; }
        .history-limit-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1.5rem; background: rgba(245,158,11,0.06); border-top: 1px solid rgba(245,158,11,0.15); color: var(--text-dim); font-size: 0.82rem; cursor: pointer; }
        .history-limit-row:hover { background: rgba(245,158,11,0.1); }
        .history-limit-row span { flex: 1; }

        /* Balance card */
        .balance-summary-card { padding: 2rem; }
        .section-title-sm { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-faint); letter-spacing: 0.1em; margin-bottom: 1.5rem; }
        .balance-rows { display: flex; flex-direction: column; gap: 1.25rem; }
        .bal-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .b-label { font-size: 0.8rem; font-weight: 700; color: var(--text-dim); display: flex; align-items: center; gap: 0.5rem; }
        .b-value { font-size: 1.15rem; font-weight: 800; color: var(--text-tertiary); }
        .b-value.gold { color: #f59e0b; }
        .b-value-big { font-size: 2rem; font-weight: 900; letter-spacing: -0.02em; }
        .bal-item.danger .b-value-big { color: #f43f5e; }
        .bal-item.success .b-value { color: #10b981; }
        .bal-item.mora-alert { background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.25); border-radius: 12px; padding: 0.85rem 1rem; }
        .bal-item.mora-alert .b-label { color: #f43f5e; font-weight: 800; }
        .b-value-big.mora-value { color: #f43f5e; font-size: 1.5rem; }
        .bal-item.mora-collected { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; padding: 0.85rem 1rem; }
        .bal-item.mora-collected .b-label { color: #f59e0b; }
        .b-value.mora-collected-value { color: #f59e0b; }
        .bal-item.ganancia-total { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); border-radius: 12px; padding: 0.85rem 1rem; }
        .bal-item.ganancia-total .b-label { color: #10b981; font-weight: 800; }
        .b-value-big.ganancia-value { color: #10b981; font-size: 1.6rem; }

        .bal-mini-info-row { margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(var(--edge-rgb), 0.04); display: flex; flex-direction: column; gap: 0.5rem; }
        .bal-mini-info { display: flex; align-items: center; gap: 0.5rem; color: var(--text-faint); font-size: 0.8rem; font-weight: 600; }
        .bal-mini-info.overdue-text { color: #f43f5e; }

        .loan-detail-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
        .detail-pill { background: rgba(var(--edge-rgb), 0.04); border: 1px solid rgba(var(--edge-rgb), 0.07); color: var(--text-dim); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; }

        /* Amortization section */
        .amort-section { margin-bottom: 2.5rem; }
        .amort-table-container { padding: 0; overflow: hidden; overflow-x: auto; }
        .btn-toggle-amort { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); color: #818cf8; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-toggle-amort:hover { background: rgba(99,102,241,0.12); }
        .num-cell { text-align: right; font-family: monospace; color: var(--text-muted); }
        .interest-cell { color: #f59e0b; }
        .total-cell { color: #10b981; font-weight: 700; }
        .bal-cell { color: var(--text-faint); }
        .row-paid td { opacity: 0.45; }
        .installment-badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: rgba(var(--edge-rgb), 0.05); color: var(--text-dim); font-size: 0.75rem; font-weight: 800; }
        .installment-badge.paid { background: rgba(16,185,129,0.1); color: #10b981; }

        /* History */
        .history-section-pro { margin-top: 1rem; }
        .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 0 0.5rem; }
        .h-title-group { display: flex; align-items: center; gap: 1rem; color: var(--text-main); }
        .h-title-group h2 { font-size: 1.5rem; font-weight: 800; }
        .icon-main { color: #6366f1; }
        .h-count { background: rgba(var(--edge-rgb), 0.05); padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }

        .history-container-glass { padding: 0; overflow: hidden; }
        .pro-table-alt { width: 100%; border-collapse: collapse; text-align: left; }
        .pro-table-alt th { padding: 1.25rem 1.5rem; background: var(--bg-surface-4); font-size: 0.7rem; font-weight: 800; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(var(--edge-rgb), 0.05); }
        .pro-table-alt td { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(var(--edge-rgb), 0.03); vertical-align: middle; }
        .row-alt-hover:hover { background: rgba(var(--edge-rgb), 0.015); }
        .date-cell { display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); font-weight: 600; font-size: 0.9rem; }
        .date-cell .dim { color: var(--text-faint); }
        .amount-pigo { font-weight: 800; color: #10b981; font-size: 1rem; }
        .method-tag { font-size: 0.7rem; font-weight: 900; color: var(--text-faint); border: 1px solid rgba(var(--edge-rgb), 0.05); padding: 0.25rem 0.6rem; border-radius: 4px; background: rgba(var(--edge-rgb), 0.02); }
        .text-right { text-align: right; }
        .receipt-actions { display: inline-flex; gap: 0.5rem; }
        .btn-mini-download { background: transparent; border: 1px solid rgba(99,102,241,0.2); color: #818cf8; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
        .btn-mini-download:hover { background: rgba(99,102,241,0.1); border-color: #6366f1; color: var(--text-main); }
        .btn-mini-view { background: transparent; border: 1px solid rgba(var(--edge-rgb), 0.08); color: var(--text-muted); padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
        .btn-mini-view:hover { background: rgba(var(--edge-rgb), 0.06); border-color: rgba(var(--edge-rgb), 0.18); color: var(--text-main); }

        /* Ver Detalles del Recibo */
        .view-receipt-modal { max-width: 420px; }
        .vr-breakdown { display: flex; flex-direction: column; gap: 0.75rem; margin: 1.25rem 0; }
        .vr-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--text-muted); }
        .vr-row span { display: flex; align-items: center; gap: 0.5rem; }
        .vr-row strong { color: var(--text-secondary); font-weight: 700; }
        .vr-row.vr-row-final { padding-top: 0.75rem; border-top: 1px solid rgba(var(--edge-rgb), 0.07); font-size: 0.92rem; }
        .vr-row.vr-row-final strong { font-size: 1.1rem; }
        .vr-mora { color: #f43f5e !important; }
        .vr-paid { color: #10b981 !important; }
        .vr-total-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.1rem; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.18); border-radius: 12px; font-weight: 700; color: var(--text-tertiary); }
        .vr-total-value { font-size: 1.4rem; font-weight: 900; color: #818cf8; }
        .vr-meta-row { display: flex; justify-content: space-between; align-items: center; margin-top: 0.85rem; font-size: 0.82rem; color: var(--text-dim); }
        .vr-divider { height: 1px; background: rgba(var(--edge-rgb), 0.07); margin: 1.5rem 0 1.1rem; }
        .vr-section-title { font-size: 0.75rem; font-weight: 800; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }
        .vr-paid-banner { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.25); border-radius: 10px; padding: 0.7rem; margin-top: 1rem; font-weight: 700; font-size: 0.85rem; }
        .vr-next-installment { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed rgba(var(--edge-rgb), 0.08); font-size: 0.8rem; color: var(--text-dim); font-weight: 600; }
        .empty-state-table { padding: 5rem 0 !important; text-align: center; }
        .empty-icon-box { margin: 0 auto 1.5rem; width: 64px; height: 64px; border-radius: 20px; background: rgba(var(--edge-rgb), 0.02); display: flex; align-items: center; justify-content: center; color: var(--text-very-faint); }
        .empty-state-table p { color: var(--text-faint); font-weight: 600; }

        /* Modal */
        .modal-root { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .modal-overlay-new { position: absolute; inset: 0; cursor: pointer; }
        .modal-content-premium { position: relative; width: 100%; max-width: 500px; padding: 2.5rem; z-index: 1; }
        .modal-header-pro { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .modal-header-pro h3 { font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.25rem; }
        .modal-header-pro p { color: var(--text-dim); font-size: 0.9rem; }
        .btn-close-modal { background: transparent; border: none; color: var(--text-faint); cursor: pointer; padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-close-modal:hover { background: rgba(var(--edge-rgb), 0.05); color: var(--text-main); }
        .pmt-hints-row { display: flex; gap: 0.6rem; margin-bottom: 1.5rem; }
        .pmt-hint-btn { display: flex; flex-direction: column; align-items: flex-start; gap: 0.2rem; flex: 1; padding: 0.7rem 1rem; border-radius: 12px; border: 1.5px solid rgba(16,185,129,0.3); background: rgba(16,185,129,0.08); cursor: pointer; transition: all 0.15s; }
        .pmt-hint-btn:hover { background: rgba(16,185,129,0.16); border-color: rgba(16,185,129,0.55); transform: translateY(-1px); }
        .pmt-hint-btn:active { transform: translateY(0); }
        .pmt-hint-label { font-size: 0.72rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; }
        .pmt-hint-value { font-size: 1rem; font-weight: 800; color: #10b981; }
        .pmt-hint-total { border-color: rgba(99,102,241,0.35); background: rgba(99,102,241,0.08); }
        .pmt-hint-total:hover { background: rgba(99,102,241,0.16); border-color: rgba(99,102,241,0.55); }
        .pmt-hint-total .pmt-hint-value { color: #818cf8; }
        .mora-mandatory-notice { display: flex; align-items: center; gap: 0.6rem; background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.25); color: #fca5a5; font-size: 0.8rem; font-weight: 600; padding: 0.7rem 1rem; border-radius: 10px; margin-bottom: 1rem; line-height: 1.4; }
        .field-group-modal { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .field-group-modal label { font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .input-icon-box { position: relative; display: flex; align-items: center; }
        .input-icon-box svg { position: absolute; left: 1.25rem; color: var(--text-faint); z-index: 1; }
        .input-pro-modal { width: 100%; background: var(--bg-surface-4); border: 1px solid var(--border); color: var(--text-main); padding: 1rem 1.25rem 1rem 2.75rem; border-radius: 12px; outline: none; font-size: 1.25rem; font-weight: 700; transition: border-color 0.2s; }
        .input-pro-modal:focus { border-color: var(--primary); }
        .limit-hint { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
        .limit-hint span { font-size: 0.75rem; font-weight: 700; color: var(--text-faint); background: rgba(var(--edge-rgb), 0.03); padding: 0.2rem 0.5rem; border-radius: 4px; }
        .limit-hint-min { color: #f43f5e !important; background: rgba(244,63,94,0.08) !important; }
        .form-row-modal { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1rem; }
        .select-pro-modal { width: 100%; background: var(--bg-surface-4); border: 1px solid var(--border); color: var(--text-main); padding: 1rem; border-radius: 12px; outline: none; font-weight: 600; appearance: none; }
        .select-pro-modal option { background: var(--bg-page); }
        .modal-footer-pro { display: flex; gap: 1rem; margin-top: 2rem; }
        .btn-cancel-pro { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 1rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-cancel-pro:hover { background: rgba(var(--edge-rgb), 0.03); color: var(--text-main); }
        .btn-confirm-pro { flex: 2; display: flex; align-items: center; justify-content: center; gap: 0.5rem; white-space: nowrap; background: var(--primary); color: white; border: none; padding: 1rem; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 16px -4px rgba(99,102,241,0.4); }
        .btn-confirm-pro:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
        .btn-confirm-pro:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Bank accounts display section */
        .bank-section { margin-bottom: 2.5rem; }
        .bank-accounts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; }
        .bank-account-display-card { padding: 1.5rem; border: 1px solid rgba(99,102,241,0.15) !important; }
        .badc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .badc-bank { font-size: 1rem; font-weight: 800; color: var(--text-secondary); }
        .badc-type { font-size: 0.7rem; font-weight: 700; background: rgba(99,102,241,0.12); color: #818cf8; padding: 0.25rem 0.6rem; border-radius: 5px; text-transform: uppercase; }
        .badc-number-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.875rem; gap: 1rem; }
        .badc-number { font-family: monospace; font-size: 1.25rem; font-weight: 800; color: var(--text-main); letter-spacing: 0.05em; }
        .badc-copy { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); color: #818cf8; padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .badc-copy:hover { background: rgba(99,102,241,0.15); color: var(--text-main); }
        .badc-copy.copied { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #10b981; }
        .badc-copy-sm { padding: 0.3rem 0.5rem; }
        .badc-holder { display: flex; flex-direction: column; gap: 0.2rem; padding-top: 0.875rem; border-top: 1px solid rgba(var(--edge-rgb), 0.05); }
        .badc-holder-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-faint); }
        .badc-holder-name { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
        .badc-iban-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.6rem; flex-wrap: wrap; }
        .badc-iban { font-family: monospace; font-size: 0.8rem; font-weight: 600; color: var(--text-dim); flex: 1; }

        /* Transfer panel */
        .transfer-panel-wrapper { margin-bottom: 1.25rem; }
        .transfer-panel { background: rgba(99,102,241,0.04); border: 1px solid rgba(99,102,241,0.15); border-radius: 12px; padding: 1rem 1.25rem; }
        .transfer-panel-header { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #818cf8; margin-bottom: 0.875rem; }
        .transfer-no-accounts { font-size: 0.82rem; color: var(--text-faint); font-weight: 500; text-align: center; padding: 0.5rem 0; }
        .transfer-accounts-list { display: flex; flex-direction: column; gap: 0.875rem; }
        .transfer-account-card { background: var(--bg-surface-5); border: 1px solid rgba(var(--edge-rgb), 0.06); border-radius: 10px; padding: 0.875rem 1rem; }
        .tac-bank-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
        .tac-bank { font-size: 0.875rem; font-weight: 800; color: var(--text-secondary); }
        .tac-type { font-size: 0.7rem; font-weight: 700; background: rgba(99,102,241,0.1); color: #818cf8; padding: 0.2rem 0.5rem; border-radius: 4px; text-transform: uppercase; }
        .tac-number-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.4rem; }
        .tac-number { font-family: monospace; font-size: 1rem; font-weight: 700; color: var(--text-main); letter-spacing: 0.04em; flex: 1; }
        .tac-iban { font-size: 0.8rem; }
        .tac-copy-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); color: #818cf8; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .tac-copy-btn:hover { background: rgba(99,102,241,0.15); }
        .tac-copy-btn.copied { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25); color: #10b981; }
        .tac-holder-row { display: flex; align-items: center; gap: 0.4rem; }
        .tac-iban-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem; flex-wrap: wrap; }
        .tac-holder-label { font-size: 0.72rem; font-weight: 700; color: var(--text-faint); }
        .tac-holder { font-size: 0.82rem; font-weight: 600; color: var(--text-muted); }

        .state-screen { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; color: var(--text-faint); font-weight: 600; text-align: center; }
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
          .p-m-date { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.8rem; font-weight: 700; }
          .p-m-main { display: flex; justify-content: space-between; align-items: center; }
          .empty-state-mobile { padding: 3rem; text-align: center; color: var(--text-faint); font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
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
          .modal-footer-pro { flex-direction: column-reverse; }
          .btn-cancel-pro, .btn-confirm-pro { flex: none; width: 100%; }
        }
      `}} />
        </div>
    );
}
