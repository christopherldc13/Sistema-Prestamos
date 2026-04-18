"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    CreditCard, Calendar, Percent, Clock, User, ChevronLeft,
    Info, DollarSign, CheckCircle2, Calculator, TrendingUp,
    Wallet, AlertCircle, Table2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    calculateLoan,
    type RateFrequency,
    type TermUnit,
    type InterestType,
} from "@/lib/loan-calculator";

const RATE_FREQ_LABELS: Record<RateFrequency, string> = {
    daily: "Diaria",
    monthly: "Mensual",
    annual: "Anual",
};

const TERM_UNIT_LABELS: Record<TermUnit, string> = {
    days: "día",
    weeks: "semana",
    months: "mes",
};

export default function CreateLoanPage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);

    const [formData, setFormData] = useState({
        clientId: "",
        amount: "",
        interestRate: "10",
        rateFrequency: "monthly" as RateFrequency,
        term: "12",
        termUnit: "months" as TermUnit,
        interestType: "compound" as InterestType,
        startDate: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        fetch("/api/clients")
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setClients(d); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const calc = useMemo(() => {
        const p = parseFloat(formData.amount) || 0;
        if (p <= 0) return null;
        try {
            return calculateLoan({
                amount: p,
                annualOrPeriodicRate: parseFloat(formData.interestRate) || 0,
                rateFrequency: formData.rateFrequency,
                term: parseInt(formData.term) || 1,
                termUnit: formData.termUnit,
                interestType: formData.interestType,
                startDate: new Date(formData.startDate),
            });
        } catch {
            return null;
        }
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientId) return alert("Por favor, selecciona un cliente.");
        if (parseFloat(formData.amount) <= 0) return alert("El monto debe ser mayor a 0.");

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                router.push("/loans");
            } else {
                const err = await res.json();
                alert(err.error || "Error al crear préstamo");
            }
        } catch {
            alert("Error de conexión con el servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fmtCurrency = (n: number) =>
        n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const rateLabel = `% ${RATE_FREQ_LABELS[formData.rateFrequency]}`;
    const periodLabel = TERM_UNIT_LABELS[formData.termUnit];
    const interestPct = calc && parseFloat(formData.amount) > 0
        ? ((calc.totalInterest / parseFloat(formData.amount)) * 100).toFixed(1)
        : "0";

    return (
        <div className="loan-create-wrapper">
            <Link href="/loans" className="btn-back-soft">
                <ChevronLeft size={16} /> Regresar a Cartera
            </Link>

            <header className="loan-create-header">
                <h1 className="title-pro">Configurar Nuevo Crédito</h1>
                <p className="subtitle-pro">Define los términos y condiciones del financiamiento</p>
            </header>

            <div className="loan-create-grid">
                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card config-form-card"
                >
                    <form onSubmit={handleSubmit} className="premium-form">

                        {/* Beneficiario */}
                        <section className="form-section-block">
                            <h3 className="section-subtitle">Beneficiario</h3>
                            <div className="field-group-pro">
                                <label><User size={14} /> Seleccionar Cliente</label>
                                <div className="select-wrapper">
                                    <select
                                        className="select-pro-input"
                                        required
                                        value={formData.clientId}
                                        onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                    >
                                        <option value="">{loading ? "Cargando clientes..." : "Buscar prestatario..."}</option>
                                        {clients.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.fullName} — ID: {c.idNumber}</option>
                                        ))}
                                    </select>
                                    <ChevronLeft size={16} className="chevron-down-abs" />
                                </div>
                            </div>
                        </section>

                        {/* Condiciones */}
                        <section className="form-section-block">
                            <h3 className="section-subtitle">Condiciones del Crédito</h3>

                            <div className="form-row-adaptive">
                                <div className="field-group-pro">
                                    <label><DollarSign size={14} /> Monto del Capital</label>
                                    <div className="input-with-symbol">
                                        <span className="symbol">$</span>
                                        <input
                                            type="text"
                                            className="input-pro-text"
                                            placeholder="0,000.00"
                                            required
                                            value={formData.amount ? parseFloat(formData.amount).toLocaleString("en-US") : ""}
                                            onChange={e => {
                                                const val = e.target.value.replace(/,/g, "");
                                                if (!isNaN(parseFloat(val)) || val === "")
                                                    setFormData({ ...formData, amount: val });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="field-group-pro">
                                    <label><Calendar size={14} /> Fecha de Desembolso</label>
                                    <input
                                        type="date"
                                        className="input-pro-text"
                                        required
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row-adaptive">
                                <div className="field-group-pro">
                                    <label><Percent size={14} /> Tasa de Interés ({rateLabel})</label>
                                    <div className="split-input-group">
                                        <input
                                            type="number"
                                            className="input-pro-text"
                                            placeholder="10"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={formData.interestRate}
                                            onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                                        />
                                        <select
                                            className="select-pro-unit"
                                            value={formData.rateFrequency}
                                            onChange={e => setFormData({ ...formData, rateFrequency: e.target.value as RateFrequency })}
                                        >
                                            <option value="daily">% Diaria</option>
                                            <option value="monthly">% Mensual</option>
                                            <option value="annual">% Anual</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="field-group-pro">
                                    <label><Clock size={14} /> Plazo de Pago</label>
                                    <div className="split-input-group">
                                        <input
                                            type="number"
                                            className="input-pro-text"
                                            min="1"
                                            value={formData.term}
                                            onChange={e => setFormData({ ...formData, term: e.target.value })}
                                        />
                                        <select
                                            className="select-pro-unit"
                                            value={formData.termUnit}
                                            onChange={e => setFormData({ ...formData, termUnit: e.target.value as TermUnit })}
                                        >
                                            <option value="days">Días</option>
                                            <option value="weeks">Semanas</option>
                                            <option value="months">Meses</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Método de cálculo */}
                        <section className="form-section-block">
                            <h3 className="section-subtitle">Método de Cálculo</h3>
                            <div className="segmented-control">
                                <button
                                    type="button"
                                    className={`segment-btn ${formData.interestType === "simple" ? "active" : ""}`}
                                    onClick={() => setFormData({ ...formData, interestType: "simple" })}
                                >
                                    Interés Simple
                                </button>
                                <button
                                    type="button"
                                    className={`segment-btn ${formData.interestType === "compound" ? "active" : ""}`}
                                    onClick={() => setFormData({ ...formData, interestType: "compound" })}
                                >
                                    Amortización Francesa
                                </button>
                            </div>
                            <p className="method-hint">
                                {formData.interestType === "simple"
                                    ? "Interés fijo calculado sobre el capital inicial. Cuotas iguales que incluyen capital e interés proporcional."
                                    : "Sistema francés: cuota fija donde cada pago cubre interés sobre saldo y amortiza capital (PMT). El interés disminuye con el tiempo."}
                            </p>
                        </section>

                        <button type="submit" className="btn-submit-loan" disabled={isSubmitting}>
                            {isSubmitting ? "Procesando..." : "Crear Préstamo Ahora"}
                            {!isSubmitting && <CheckCircle2 size={18} />}
                        </button>
                    </form>
                </motion.div>

                {/* Summary Sticky */}
                <aside className="summary-sticky-area">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card summary-card-pro"
                    >
                        <div className="summary-header">
                            <div className="icon-badge"><Calculator size={20} /></div>
                            <h3>Proyección del Crédito</h3>
                        </div>

                        {calc ? (
                            <div className="projection-body">
                                <div className="proj-item">
                                    <div className="p-label"><Wallet size={14} /> Capital Solicitado</div>
                                    <div className="p-value">${fmtCurrency(parseFloat(formData.amount || "0"))}</div>
                                </div>
                                <div className="proj-item">
                                    <div className="p-label"><TrendingUp size={14} /> Interés Total ({interestPct}%)</div>
                                    <div className="p-value highlight-gold">+${fmtCurrency(calc.totalInterest)}</div>
                                </div>

                                <div className="calculation-formula-box">
                                    <span className="formula-label">Tasa Periódica Aplicada</span>
                                    <span className="formula-text">
                                        {(calc.periodicRate * 100).toFixed(4)}% por {periodLabel}
                                        {" "}({RATE_FREQ_LABELS[formData.rateFrequency].toLowerCase()} → {formData.termUnit === "months" ? "mensual" : formData.termUnit === "weeks" ? "semanal" : "diaria"})
                                    </span>
                                </div>

                                <div className="proj-divider"></div>

                                <div className="proj-item total-focus">
                                    <div className="p-label">Total a Devolver</div>
                                    <div className="p-value-total">${fmtCurrency(calc.totalToPay)}</div>
                                </div>

                                <div className="suggested-box">
                                    <div className="suggest-header">Cuota Fija ({formData.interestType === "compound" ? "PMT" : "Simple"})</div>
                                    <div className="suggest-val">
                                        <span className="cur">$</span>
                                        {fmtCurrency(calc.installmentAmount)}
                                        <span className="per"> / {periodLabel}</span>
                                    </div>
                                </div>

                                <div className="due-date-box">
                                    <Calendar size={14} />
                                    <div>
                                        <span className="due-label">Vencimiento:</span>
                                        <span className="due-val">
                                            {calc.dueDate.toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" })}
                                        </span>
                                    </div>
                                </div>

                                {/* Toggle tabla de amortización */}
                                <button
                                    type="button"
                                    className="btn-toggle-schedule"
                                    onClick={() => setShowSchedule(v => !v)}
                                >
                                    <Table2 size={14} />
                                    {showSchedule ? "Ocultar" : "Ver"} Tabla de Amortización ({calc.schedule.length} cuotas)
                                </button>

                                <AnimatePresence>
                                    {showSchedule && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="schedule-table-wrapper"
                                        >
                                            <table className="schedule-table">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Fecha</th>
                                                        <th>Capital</th>
                                                        <th>Interés</th>
                                                        <th>Cuota</th>
                                                        <th>Saldo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {calc.schedule.map(row => (
                                                        <tr key={row.installmentNumber}>
                                                            <td>{row.installmentNumber}</td>
                                                            <td>{new Date(row.dueDate + "T12:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "2-digit" })}</td>
                                                            <td className="num">${fmtCurrency(row.principalPayment)}</td>
                                                            <td className="num interest">${fmtCurrency(row.interestPayment)}</td>
                                                            <td className="num total">${fmtCurrency(row.totalPayment)}</td>
                                                            <td className="num bal">${fmtCurrency(row.balance)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="empty-calc">
                                <AlertCircle size={32} color="#334155" />
                                <p>Ingresa el monto del capital para ver la proyección</p>
                            </div>
                        )}

                        <footer className="summary-footer">
                            <Info size={14} />
                            <p>Esta es una proyección informativa antes de registrar el contrato.</p>
                        </footer>
                    </motion.div>
                </aside>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .loan-create-wrapper { width: 100%; max-width: 1300px; margin: 0 auto; padding-bottom: 5rem; }
        .btn-back-soft { display: inline-flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.85rem; font-weight: 600; text-decoration: none; margin-bottom: 1.5rem; transition: color 0.2s; }
        .btn-back-soft:hover { color: white; }

        .loan-create-header { margin-bottom: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1.5rem; }
        .title-pro { font-size: 2.25rem; font-weight: 800; color: white; letter-spacing: -0.02em; }
        .subtitle-pro { color: #64748b; font-size: 0.95rem; margin-top: 0.25rem; }

        .loan-create-grid { display: grid; grid-template-columns: 1fr 440px; gap: 2.5rem; align-items: start; }

        .config-form-card { padding: 2.5rem; }
        .section-subtitle { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
        .form-section-block { margin-bottom: 2.5rem; position: relative; }
        .form-section-block:not(:last-child):after { content: ''; position: absolute; bottom: -1.25rem; left: 0; width: 100%; height: 1px; background: rgba(255,255,255,0.03); }

        .field-group-pro { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .field-group-pro label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; color: #94a3b8; }

        .select-wrapper { position: relative; width: 100%; }
        .select-pro-input { width: 100%; background: rgba(15,23,42,0.4); border: 1px solid var(--border); color: white; padding: 1rem 1.25rem; border-radius: 12px; outline: none; appearance: none; font-size: 1rem; transition: border-color 0.2s; }
        .select-pro-input:focus { border-color: var(--primary); }
        .select-pro-input option { background: #0f172a; }
        .chevron-down-abs { position: absolute; right: 1.25rem; top: 50%; transform: translateY(-50%) rotate(-90deg); color: #475569; pointer-events: none; }

        .form-row-adaptive { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

        .input-with-symbol { position: relative; width: 100%; }
        .input-with-symbol .symbol { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: #475569; font-weight: 700; }
        .input-with-symbol .input-pro-text { padding-left: 2.5rem; }

        .input-pro-text { width: 100%; background: rgba(15,23,42,0.4); border: 1px solid var(--border); color: white; padding: 1rem 1.25rem; border-radius: 12px; outline: none; font-size: 1rem; transition: border-color 0.2s; }
        .input-pro-text:focus { border-color: var(--primary); }

        .split-input-group { display: flex; background: rgba(15,23,42,0.4); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .split-input-group .input-pro-text { border: none; width: 55%; background: transparent; }
        .select-pro-unit { background: rgba(255,255,255,0.03); border: none; color: #94a3b8; font-weight: 700; width: 45%; outline: none; text-align: center; border-left: 1px solid var(--border); cursor: pointer; font-size: 0.8rem; }

        .segmented-control { display: flex; background: rgba(15,23,42,0.6); border: 1px solid var(--border); border-radius: 12px; padding: 4px; gap: 4px; margin-bottom: 0.75rem; }
        .segment-btn { flex: 1; border: none; background: transparent; color: #64748b; padding: 0.75rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
        .segment-btn.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
        .method-hint { font-size: 0.8rem; color: #475569; line-height: 1.5; padding-left: 0.5rem; }

        .btn-submit-loan { width: 100%; background: #6366f1; color: white; border: none; padding: 1.25rem; border-radius: 14px; font-size: 1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; transition: all 0.3s; margin-top: 1rem; box-shadow: 0 10px 20px -5px rgba(99,102,241,0.4); }
        .btn-submit-loan:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(99,102,241,0.5); }
        .btn-submit-loan:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Summary panel */
        .summary-card-pro { padding: 2rem; position: sticky; top: 1rem; }
        .summary-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .icon-badge { width: 40px; height: 40px; border-radius: 10px; background: rgba(99,102,241,0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; }
        .summary-header h3 { font-size: 1.15rem; font-weight: 800; color: white; }

        .projection-body { display: flex; flex-direction: column; gap: 1.25rem; }
        .proj-item { display: flex; justify-content: space-between; align-items: center; }
        .p-label { color: #64748b; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        .p-value { color: #f8fafc; font-weight: 700; font-size: 1.1rem; }
        .highlight-gold { color: #f59e0b; }
        .proj-divider { height: 1px; background: rgba(255,255,255,0.05); }

        .total-focus { background: rgba(99,102,241,0.03); padding: 1rem; border-radius: 12px; margin: 0 -0.5rem; }
        .total-focus .p-label { color: #cbd5e1; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; }
        .p-value-total { color: #6366f1; font-size: 2rem; font-weight: 900; }

        .suggested-box { background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02)); padding: 1.25rem; border-radius: 14px; border: 1px solid rgba(16,185,129,0.1); }
        .suggest-header { font-size: 0.7rem; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.4rem; }
        .suggest-val { font-size: 2rem; font-weight: 900; color: white; display: flex; align-items: baseline; gap: 0.25rem; }
        .suggest-val .cur { font-size: 1.1rem; color: #10b981; }
        .suggest-val .per { font-size: 0.85rem; color: #475569; font-weight: 700; }

        .calculation-formula-box { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; border: 1px dashed rgba(255,255,255,0.08); }
        .formula-label { font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .formula-text { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }

        .due-date-box { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.02); padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); color: #64748b; font-size: 0.85rem; }
        .due-date-box > div { display: flex; flex-direction: column; gap: 0.1rem; }
        .due-label { font-size: 0.7rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; }
        .due-val { color: #cbd5e1; font-weight: 700; font-size: 0.9rem; }

        .btn-toggle-schedule { width: 100%; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); color: #818cf8; padding: 0.75rem; border-radius: 10px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; }
        .btn-toggle-schedule:hover { background: rgba(99,102,241,0.12); }

        .schedule-table-wrapper { overflow: hidden; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); max-height: 320px; overflow-y: auto; }
        .schedule-table { width: 100%; border-collapse: collapse; font-size: 0.72rem; }
        .schedule-table th { background: rgba(15,23,42,0.6); padding: 0.6rem 0.5rem; text-align: left; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; position: sticky; top: 0; }
        .schedule-table td { padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); color: #94a3b8; }
        .schedule-table tr:hover td { background: rgba(255,255,255,0.01); }
        .schedule-table td.num { text-align: right; font-family: monospace; color: #cbd5e1; }
        .schedule-table td.interest { color: #f59e0b; }
        .schedule-table td.total { color: #10b981; font-weight: 700; }
        .schedule-table td.bal { color: #64748b; }

        .empty-calc { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2.5rem 1rem; color: #334155; font-size: 0.85rem; text-align: center; }

        .summary-footer { display: flex; gap: 0.75rem; margin-top: 1.5rem; background: rgba(15,23,42,0.3); padding: 1rem; border-radius: 10px; color: #475569; font-size: 0.8rem; line-height: 1.4; }

        @media (max-width: 1100px) {
          .loan-create-grid { grid-template-columns: 1fr; }
          .summary-sticky-area { position: relative; top: 0; }
        }
        @media (max-width: 768px) {
          .form-row-adaptive { grid-template-columns: 1fr; gap: 0; }
          .title-pro { font-size: 1.6rem; line-height: 1.2; }
          .config-form-card, .summary-card-pro { padding: 1.25rem; }
          .loan-create-header { padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .segmented-control { flex-direction: column; }
          .schedule-table-wrapper { max-height: 250px; }
          .split-input-group { flex-direction: column; border-radius: 8px; }
          .split-input-group .input-pro-text { width: 100%; border-bottom: 1px solid var(--border); border-radius: 8px 8px 0 0; }
          .split-input-group .select-pro-unit { width: 100%; border-left: none; padding: 0.75rem; border-radius: 0 0 8px 8px; }
        }
      `}} />
        </div>
    );
}
