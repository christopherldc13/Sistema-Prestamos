"use client";

import React, { useState, useEffect } from "react";
import {
    CreditCard,
    Calendar,
    Percent,
    Clock,
    User,
    ChevronLeft,
    Info,
    DollarSign,
    CheckCircle2,
    Calculator,
    TrendingUp,
    Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateLoanPage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        clientId: "",
        amount: "",
        interestRate: "10",
        term: "1",
        termUnit: "months",
        interestType: "simple",
        startDate: new Date().toISOString().split('T')[0],
    });

    const [calculation, setCalculation] = useState({
        total: 0,
        interestOnly: 0,
        installment: 0
    });

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch("/api/clients");
                const data = await res.json();
                if (Array.isArray(data)) setClients(data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchClients();
    }, []);

    useEffect(() => {
        const p = parseFloat(formData.amount) || 0;
        const r = parseFloat(formData.interestRate) / 100 || 0;
        const t = parseInt(formData.term) || 0;

        let total = 0;
        if (p === 0) {
            total = 0;
        } else if (formData.interestType === "simple") {
            total = p + (p * r * t);
        } else {
            total = p * Math.pow((1 + r), t);
        }

        setCalculation({
            total: parseFloat(total.toFixed(2)),
            interestOnly: parseFloat(Math.max(0, total - p).toFixed(2)),
            installment: t > 0 ? parseFloat((total / t).toFixed(2)) : total
        });
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
        } catch (e) {
            alert("Error de conexión con el servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                {/* Configuration Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card config-form-card"
                >
                    <form onSubmit={handleSubmit} className="premium-form">
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
                                        <option value="">Buscar prestatario...</option>
                                        {clients.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.fullName} — ID: {c.idNumber}</option>
                                        ))}
                                    </select>
                                    <ChevronLeft size={16} className="chevron-down-abs" />
                                </div>
                            </div>
                        </section>

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
                                            value={formData.amount ? parseFloat(formData.amount).toLocaleString('en-US') : ""}
                                            onChange={e => {
                                                const val = e.target.value.replace(/,/g, "");
                                                if (!isNaN(parseFloat(val)) || val === "") {
                                                    setFormData({ ...formData, amount: val });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="field-group-pro">
                                    <label>
                                        <Percent size={14} /> Tasa de Interés (% {
                                            formData.termUnit === 'months' ? 'mensual' :
                                                formData.termUnit === 'weeks' ? 'semanal' : 'diaria'
                                        })
                                    </label>
                                    <input
                                        type="number"
                                        className="input-pro-text"
                                        placeholder="P. ej. 10"
                                        required
                                        value={formData.interestRate}
                                        onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row-adaptive">
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
                                            onChange={e => setFormData({ ...formData, termUnit: e.target.value })}
                                        >
                                            <option value="days">Días</option>
                                            <option value="weeks">Semanas</option>
                                            <option value="months">Meses</option>
                                        </select>
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
                        </section>

                        <section className="form-section-block">
                            <h3 className="section-subtitle">Método de Cálculo</h3>
                            <div className="segmented-control">
                                <button
                                    type="button"
                                    className={`segment-btn ${formData.interestType === 'simple' ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, interestType: 'simple' })}
                                >
                                    Interés Simple
                                </button>
                                <button
                                    type="button"
                                    className={`segment-btn ${formData.interestType === 'compound' ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, interestType: 'compound' })}
                                >
                                    Interés Compuesto
                                </button>
                            </div>
                            <p className="method-hint">
                                {formData.interestType === 'simple'
                                    ? "El interés se calcula solo sobre el capital inicial en cada periodo."
                                    : "El interés se capitaliza, calculándose sobre el capital más intereses acumulados."}
                            </p>
                        </section>

                        <button
                            type="submit"
                            className="btn-submit-loan"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Procesando..." : "Crear Préstamo Ahora"}
                            {!isSubmitting && <CheckCircle2 size={18} />}
                        </button>
                    </form>
                </motion.div>

                {/* Live Summary Section */}
                <aside className="summary-sticky-area">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card summary-card-pro"
                    >
                        <div className="summary-header">
                            <div className="icon-badge">
                                <Calculator size={20} />
                            </div>
                            <h3>Proyección del Crédito</h3>
                        </div>

                        <div className="projection-body">
                            <div className="proj-item">
                                <div className="p-label">
                                    <Wallet size={14} /> Capital Solicitado
                                </div>
                                <div className="p-value">${(parseFloat(formData.amount || "0")).toLocaleString()}</div>
                            </div>
                            <div className="proj-item">
                                <div className="p-label">
                                    <TrendingUp size={14} /> Rendimiento de Interés
                                </div>
                                <div className="p-value highlight-gold">+${calculation.interestOnly.toLocaleString()}</div>
                            </div>

                            <div className="calculation-formula-box">
                                <span className="formula-label">Fórmula Aplicada:</span>
                                <span className="formula-text">I = C({(parseFloat(formData.amount || "0")).toLocaleString()}) × r({(parseFloat(formData.interestRate) / 100).toFixed(2)}) × t({formData.term})</span>
                            </div>

                            <div className="proj-divider"></div>

                            <div className="proj-item total-focus">
                                <div className="p-label">Total a Devolver</div>
                                <div className="p-value-total">${calculation.total.toLocaleString()}</div>
                            </div>

                            <div className="suggested-box">
                                <div className="suggest-header">Cuota Sugerida</div>
                                <div className="suggest-val">
                                    <span className="cur">$</span>
                                    {calculation.installment.toLocaleString()}
                                    <span className="per"> / {
                                        formData.termUnit === 'months' ? 'mes' :
                                            formData.termUnit === 'weeks' ? 'semana' : 'día'
                                    }</span>
                                </div>
                            </div>
                        </div>

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

        .loan-create-grid { display: grid; grid-template-columns: 1fr 420px; gap: 2.5rem; align-items: start; }
        
        .config-form-card { padding: 2.5rem; }
        .section-subtitle { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
        .form-section-block { margin-bottom: 2.5rem; position: relative; }
        .form-section-block:not(:last-child):after { content: ''; position: absolute; bottom: -1.25rem; left: 0; width: 100%; height: 1px; background: rgba(255,255,255,0.03); }

        .field-group-pro { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .field-group-pro label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
        
        .select-wrapper { position: relative; width: 100%; }
        .select-pro-input { width: 100%; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); color: white; padding: 1rem 1.25rem; border-radius: 12px; outline: none; appearance: none; font-size: 1rem; transition: border-color 0.2s; }
        .select-pro-input:focus { border-color: var(--primary); }
        .select-pro-input option { background: #0f172a; }
        .chevron-down-abs { position: absolute; right: 1.25rem; top: 50%; transform: translateY(-50%) rotate(-90deg); color: #475569; pointer-events: none; }

        .form-row-adaptive { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        
        .input-with-symbol { position: relative; width: 100%; }
        .input-with-symbol .symbol { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: #475569; font-weight: 700; }
        .input-with-symbol .input-pro-text { padding-left: 2.5rem; }
        
        .input-pro-text { width: 100%; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); color: white; padding: 1rem 1.25rem; border-radius: 12px; outline: none; font-size: 1rem; transition: border-color 0.2s; }
        .input-pro-text:focus { border-color: var(--primary); }

        .split-input-group { display: flex; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .split-input-group .input-pro-text { border: none; width: 60%; background: transparent; }
        .select-pro-unit { background: rgba(255,255,255,0.03); border: none; color: #94a3b8; font-weight: 700; width: 40%; outline: none; text-align: center; border-left: 1px solid var(--border); cursor: pointer; }

        .segmented-control { display: flex; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border); border-radius: 12px; padding: 4px; gap: 4px; margin-bottom: 0.75rem; }
        .segment-btn { flex: 1; border: none; background: transparent; color: #64748b; padding: 0.75rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
        .segment-btn.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
        .method-hint { font-size: 0.8rem; color: #475569; line-height: 1.4; padding-left: 0.5rem; }

        .btn-submit-loan { width: 100%; background: #6366f1; color: white; border: none; padding: 1.25rem; border-radius: 14px; font-size: 1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; transition: all 0.3s; margin-top: 1rem; box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4); }
        .btn-submit-loan:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.5); }
        .btn-submit-loan:disabled { opacity: 0.6; cursor: not-allowed; }

        .summary-card-pro { padding: 2rem; position: sticky; top: 1rem; }
        .summary-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .icon-badge { width: 40px; height: 40px; border-radius: 10px; background: rgba(99, 102, 241, 0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; }
        .summary-header h3 { font-size: 1.15rem; font-weight: 800; color: white; }

        .projection-body { display: flex; flex-direction: column; gap: 1.5rem; }
        .proj-item { display: flex; justify-content: space-between; align-items: center; }
        .p-label { color: #64748b; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        .p-value { color: #f8fafc; font-weight: 700; font-size: 1.1rem; }
        .highlight-gold { color: #f59e0b; }
        .proj-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 0.5rem 0; }
        
        .total-focus { background: rgba(99, 102, 241, 0.03); padding: 1rem; border-radius: 12px; margin: 0 -0.5rem; }
        .total-focus .p-label { color: #cbd5e1; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; }
        .p-value-total { color: #6366f1; font-size: 2rem; font-weight: 900; }

        .suggested-box { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02)); padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.1); margin-top: 0.5rem; }
        .suggest-header { font-size: 0.75rem; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .suggest-val { font-size: 2.25rem; font-weight: 900; color: white; display: flex; align-items: baseline; gap: 0.25rem; }
        .suggest-val .cur { font-size: 1.25rem; color: #10b981; }
        .suggest-val .per { font-size: 0.9rem; color: #475569; font-weight: 700; }

        .calculation-formula-box { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; margin-top: -0.5rem; border: 1px dashed rgba(255,255,255,0.1); }
        .formula-label { font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .formula-text { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }

        .summary-footer { display: flex; gap: 0.75rem; margin-top: 2rem; background: rgba(15, 23, 42, 0.3); padding: 1rem; border-radius: 10px; color: #475569; font-size: 0.8rem; line-height: 1.4; }
        
        @media (max-width: 1100px) {
          .loan-create-grid { grid-template-columns: 1fr; }
          .summary-sticky-area { position: relative; top: 0; }
        }
        @media (max-width: 640px) {
          .form-row-adaptive { grid-template-columns: 1fr; gap: 0; }
          .title-pro { font-size: 1.75rem; }
          .config-form-card { padding: 1.5rem; }
        }
      `}} />
        </div>
    );
}
