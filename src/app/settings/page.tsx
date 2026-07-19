"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Building2, Save, ArrowLeft, RefreshCcw,
    AtSign, MapPin, Phone, FileText, CheckCircle2,
    Lock, Eye, EyeOff, ShieldAlert, Zap, Percent,
    DollarSign, CalendarClock, Trash2, AlertTriangle, PlusCircle, Edit3, X
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPlan, type PlanFeatures } from "@/lib/plans";

type Tab = "brand" | "security" | "latefees";

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("brand");
    const [plan, setPlan] = useState<PlanFeatures>(getPlan("basic"));

    const [config, setConfig] = useState({ brand: "", name: "", slogan: "", address: "", phone: "", lateFeeRules: [] as any[] });
    const [loadingBrand, setLoadingBrand] = useState(true);
    const [savingBrand, setSavingBrand] = useState(false);
    const [brandSuccess, setBrandSuccess] = useState(false);

    const [newRule, setNewRule] = useState({
        limitByAmount: false,
        minAmount: "0",
        maxAmount: "",
        minDays: "1",
        maxDays: "",
        type: "percentage" as "percentage" | "fixed",
        value: "",
    });
    const [ruleError, setRuleError] = useState("");
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

    const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [savingPass, setSavingPass] = useState(false);
    const [passMsg, setPassMsg] = useState<{ text: string; ok: boolean } | null>(null);

    useEffect(() => {
        fetch("/api/settings")
            .then(r => r.json())
            .then(d => {
                if (!d.error) {
                    const { bankAccounts: _accs, ...rest } = d;
                    setConfig({
                        brand: rest.brand || "",
                        name: rest.name || "",
                        slogan: rest.slogan || "",
                        address: rest.address || "",
                        phone: rest.phone || "",
                        lateFeeRules: rest.lateFeeRules || []
                    });
                }
            })
            .catch(console.error)
            .finally(() => setLoadingBrand(false));
        fetch("/api/me")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.subscriptionPlan) setPlan(getPlan(d.subscriptionPlan)); })
            .catch(() => {});
    }, []);

    const saveConfig = async (updatedConfig: typeof config) => {
        setSavingBrand(true);
        setBrandSuccess(false);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedConfig),
            });
            if (res.ok) {
                setBrandSuccess(true);
                setTimeout(() => setBrandSuccess(false), 2500);
                return true;
            }
            setRuleError("No se pudo guardar el cambio. Intenta de nuevo.");
            return false;
        } catch {
            setRuleError("Error de conexión al guardar.");
            return false;
        } finally {
            setSavingBrand(false);
        }
    };

    const handleSaveBrand = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveConfig(config);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPass !== passwords.confirm) {
            setPassMsg({ text: "Las contraseñas nuevas no coinciden", ok: false });
            return;
        }
        setSavingPass(true);
        setPassMsg(null);
        try {
            const res = await fetch("/api/settings/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
            });
            const data = await res.json();
            if (res.ok) {
                setPassMsg({ text: "Contraseña actualizada correctamente", ok: true });
                setPasswords({ current: "", newPass: "", confirm: "" });
            } else {
                setPassMsg({ text: data.error || "Error al cambiar contraseña", ok: false });
            }
        } catch { setPassMsg({ text: "Error de conexión", ok: false }); }
        finally { setSavingPass(false); }
    };

    const resetRuleForm = () => {
        setEditingRuleId(null);
        setRuleError("");
        setNewRule({ limitByAmount: false, minAmount: "0", maxAmount: "", minDays: "1", maxDays: "", type: "percentage", value: "" });
    };

    const handleEditRule = (rule: any) => {
        setRuleError("");
        setEditingRuleId(rule.id);
        setNewRule({
            limitByAmount: !!(rule.minAmount > 0 || rule.maxAmount !== null),
            minAmount: String(rule.minAmount ?? 0),
            maxAmount: rule.maxAmount !== null && rule.maxAmount !== undefined ? String(rule.maxAmount) : "",
            minDays: String(rule.minDays),
            maxDays: rule.maxDays !== null && rule.maxDays !== undefined ? String(rule.maxDays) : "",
            type: rule.type,
            value: String(rule.value),
        });
    };

    const handleSaveRule = async () => {
        setRuleError("");

        const minD = parseInt(newRule.minDays);
        const maxD = newRule.maxDays ? parseInt(newRule.maxDays) : null;
        const val = parseFloat(newRule.value);
        const minA = newRule.limitByAmount ? parseFloat(newRule.minAmount || "0") : 0;
        const maxA = newRule.limitByAmount && newRule.maxAmount ? parseFloat(newRule.maxAmount) : null;

        if (isNaN(minD) || minD < 1) return setRuleError("El día mínimo es obligatorio y debe ser 1 o mayor.");
        if (maxD !== null && maxD < minD) return setRuleError("El día máximo debe ser mayor o igual al mínimo.");
        if (isNaN(val) || val <= 0) return setRuleError("Ingresa un valor de cargo válido.");
        if (newRule.limitByAmount && isNaN(minA)) return setRuleError("Ingresa un monto mínimo válido.");
        if (maxA !== null && maxA < minA) return setRuleError("El monto máximo debe ser mayor o igual al mínimo.");

        const rule = {
            id: editingRuleId || Math.random().toString(36).substring(7),
            minAmount: minA,
            maxAmount: maxA,
            minDays: minD,
            maxDays: maxD,
            type: newRule.type,
            value: val,
        };

        const baseRules = editingRuleId
            ? config.lateFeeRules.filter(r => r.id !== editingRuleId)
            : config.lateFeeRules;

        const updatedRules = [...baseRules, rule].sort((a, b) => {
            if (a.minAmount !== b.minAmount) return a.minAmount - b.minAmount;
            return a.minDays - b.minDays;
        });
        const updatedConfig = { ...config, lateFeeRules: updatedRules };

        setConfig(updatedConfig);
        const saved = await saveConfig(updatedConfig);
        if (!saved) return; // deja la regla en el formulario para reintentar, no limpiar en error

        if (editingRuleId) {
            resetRuleForm();
        } else {
            setNewRule(r => ({ ...r, minDays: String(maxD ? maxD + 1 : minD + 1), maxDays: "", value: "" }));
        }
    };

    const handleDeleteRule = async (idx: number) => {
        const target = config.lateFeeRules[idx];
        const updatedRules = [...config.lateFeeRules];
        updatedRules.splice(idx, 1);
        const updatedConfig = { ...config, lateFeeRules: updatedRules };

        setConfig(updatedConfig);
        await saveConfig(updatedConfig);
        if (editingRuleId && target?.id === editingRuleId) resetRuleForm();
    };

    const rulePreview = useMemo(() => {
        const val = parseFloat(newRule.value);
        if (isNaN(val) || val <= 0) return null;

        const dayPart = newRule.maxDays
            ? `entre ${newRule.minDays} y ${newRule.maxDays} días de atraso`
            : `a partir de ${newRule.minDays} día${newRule.minDays === "1" ? "" : "s"} de atraso`;

        const amountPart = newRule.limitByAmount
            ? (newRule.maxAmount
                ? `de $${Number(newRule.minAmount || 0).toLocaleString()} a $${Number(newRule.maxAmount).toLocaleString()}`
                : `desde $${Number(newRule.minAmount || 0).toLocaleString()} en adelante`)
            : "de cualquier monto";

        const chargePart = newRule.type === "percentage" ? `${val}% del valor de la cuota` : `RD$${val.toLocaleString()} fijos`;

        return `Las cuotas de préstamos ${amountPart}, ${dayPart}, generarán ${chargePart} de mora.`;
    }, [newRule]);

    if (loadingBrand) return (
        <div className="state-screen">
            <div className="spinner-pro"></div>
            <p>Cargando parámetros del sistema...</p>
        </div>
    );

    return (
        <div className="settings-wrapper">
            <header className="settings-header">
                <Link href="/" className="btn-back-minimal">
                    <ArrowLeft size={16} /> Volver al Inicio
                </Link>
                <div className="header-text">
                    <h1 className="header-title">Configuración del Sistema</h1>
                    <p className="header-subtitle">Identidad corporativa y seguridad de cuenta</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="settings-tabs">
                <button className={`stab ${activeTab === "brand" ? "active" : ""}`} onClick={() => setActiveTab("brand")}>
                    <Building2 size={16} /> Identidad de Marca
                    {!plan.hasCustomBranding && <Lock size={12} className="tab-lock-icon" />}
                </button>
                <button className={`stab ${activeTab === "latefees" ? "active" : ""}`} onClick={() => setActiveTab("latefees")}>
                    <ShieldAlert size={16} /> Reglas de Mora
                </button>
                <button className={`stab ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
                    <Lock size={16} /> Seguridad
                </button>
            </div>

            {/* Brand tab — bloqueado para plan básico */}
            {activeTab === "brand" && !plan.hasCustomBranding && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="plan-gate-block">
                    <div className="plan-gate-icon"><Lock size={32} /></div>
                    <h2>Identidad de Marca no disponible</h2>
                    <p>La personalización de tu marca está disponible en el Plan <strong>Intermedio</strong> o superior. Actualiza para agregar tu nombre comercial, slogan y dirección en todos tus documentos.</p>
                    <button className="plan-gate-btn" onClick={() => router.push("/plans")}>
                        <Zap size={16} /> Ver Planes Disponibles
                    </button>
                </motion.div>
            )}

            {activeTab === "brand" && plan.hasCustomBranding && (
                <div className="settings-grid">
                    {/* Visual Preview */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card preview-card">
                        <h3 className="section-title-sm">Vista Previa de Documentos</h3>
                        <div className="mockup-receipt">
                            <header className="mockup-header">
                                <span className="m-brand">{config.brand || "TU MARCA"}</span>
                                <span className="m-name">{config.name || "RAZÓN SOCIAL SRL"}</span>
                                <span className="m-detail">{config.slogan || "Tu slogan corporativo"}</span>
                                <span className="m-detail">{config.address || "Dirección de la empresa"}</span>
                                <span className="m-detail">{config.phone || "TEL: 809-000-0000"}</span>
                            </header>
                            <div className="mockup-body">
                                <div className="mockup-line"></div>
                                <div className="mockup-line short"></div>
                                <div className="mockup-line"></div>
                            </div>
                        </div>
                        <p className="preview-hint">Esta información aparecerá en todos los contratos A4 y recibos 80mm generados.</p>
                    </motion.div>

                    {/* Brand Form */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card form-card">
                        <form onSubmit={handleSaveBrand} className="settings-form">
                            <div className="form-section">
                                <div className="section-header">
                                    <Building2 size={18} className="icon-accent" />
                                    <h3>Identidad de Marca</h3>
                                </div>
                                <div className="field-group">
                                    <label>Nombre Comercial (Logo)</label>
                                    <div className="input-box"><FileText size={16} />
                                        <input type="text" className="input-pro" placeholder="FACT-PREST" value={config.brand}
                                            onChange={e => setConfig({ ...config, brand: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="field-group">
                                    <label>Razón Social (Nombre Legal)</label>
                                    <div className="input-box"><Building2 size={16} />
                                        <input type="text" className="input-pro" placeholder="FACT-PREST SRL" value={config.name}
                                            onChange={e => setConfig({ ...config, name: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="field-group">
                                    <label>Slogan Publicitario</label>
                                    <div className="input-box"><AtSign size={16} />
                                        <input type="text" className="input-pro" placeholder="Soluciones Financieras" value={config.slogan}
                                            onChange={e => setConfig({ ...config, slogan: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="form-section">
                                <div className="section-header">
                                    <MapPin size={18} className="icon-accent" />
                                    <h3>Ubicación y Contacto</h3>
                                </div>
                                <div className="field-group">
                                    <label>Dirección Física</label>
                                    <div className="input-box"><MapPin size={16} />
                                        <input type="text" className="input-pro" placeholder="Calle Principal #1..." value={config.address}
                                            onChange={e => setConfig({ ...config, address: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="field-group">
                                    <label>Teléfono de Contacto</label>
                                    <div className="input-box"><Phone size={16} />
                                        <input type="text" className="input-pro" placeholder="809-xxx-xxxx" value={config.phone}
                                            onChange={e => setConfig({ ...config, phone: e.target.value })} required />
                                    </div>
                                </div>
                            </div>
                            <footer className="form-footer">
                                <button type="submit" className={`btn-save-pro ${brandSuccess ? "success" : ""}`} disabled={savingBrand}>
                                    {savingBrand ? <RefreshCcw size={18} className="spin" /> : brandSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                                    <span>{savingBrand ? "Guardando..." : brandSuccess ? "¡Cambios Guardados!" : "Guardar Configuración"}</span>
                                </button>
                            </footer>
                        </form>
                    </motion.div>
                </div>
            )}

            {activeTab === "latefees" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card form-card">
                    <div className="section-header" style={{ marginBottom: "1.5rem" }}>
                        <ShieldAlert size={18} className="icon-accent" />
                        <h3>Reglas de Mora (Cargos por Atraso)</h3>
                    </div>
                    <p className="preview-hint" style={{ textAlign: "left", marginBottom: "2rem", marginTop: "-0.5rem" }}>
                        Define tramos de días de atraso y el cargo que se sugiere para cada uno — monto fijo o porcentaje de la cuota.
                        El sistema evalúa las reglas de la más específica a la más general y aplica la primera que coincida con los días de atraso de la cuota.
                    </p>

                    {/* Reglas existentes */}
                    {config.lateFeeRules.length === 0 ? (
                        <div className="empty-state-list mora-empty">
                            <div className="empty-icon-box"><ShieldAlert size={28} /></div>
                            <p>No hay reglas de mora configuradas.</p>
                            <span>Las cuotas atrasadas no generarán ningún cargo automático hasta que agregues al menos una regla abajo.</span>
                        </div>
                    ) : (
                        <div className="rule-cards-grid">
                            {config.lateFeeRules.map((rule, idx) => (
                                <div key={rule.id} className={`rule-card ${editingRuleId === rule.id ? "editing" : ""}`}>
                                    <div className="rule-card-actions">
                                        <button type="button" className="rule-card-edit" title="Editar regla" onClick={() => handleEditRule(rule)}>
                                            <Edit3 size={14} />
                                        </button>
                                        <button type="button" className="rule-card-delete" title="Eliminar regla" onClick={() => handleDeleteRule(idx)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="rule-card-days">
                                        <CalendarClock size={14} />
                                        <span>{rule.minDays} {rule.maxDays ? `– ${rule.maxDays} días` : 'días en adelante'}</span>
                                    </div>
                                    <div className={`rule-card-value ${rule.type}`}>
                                        {rule.type === 'percentage' ? <Percent size={20} /> : <DollarSign size={20} />}
                                        <span>{rule.type === 'percentage' ? `${rule.value}%` : `RD$${rule.value.toLocaleString()}`}</span>
                                    </div>
                                    <div className="rule-card-amount">
                                        Préstamos ${rule.minAmount?.toLocaleString()} {rule.maxAmount ? `– $${rule.maxAmount.toLocaleString()}` : 'en adelante'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Formulario para añadir o editar una regla */}
                    <div className={`add-rule-box ${editingRuleId ? "editing" : ""}`}>
                        <div className="add-rule-box-header">
                            <h4>{editingRuleId ? <Edit3 size={15} /> : <PlusCircle size={15} />} {editingRuleId ? "Editar Regla" : "Añadir Nueva Regla"}</h4>
                            {editingRuleId && (
                                <button type="button" className="btn-cancel-edit" onClick={resetRuleForm}>
                                    <X size={14} /> Cancelar
                                </button>
                            )}
                        </div>

                        <div className="rule-inputs rule-inputs-days">
                            <div className="field-group" style={{ marginBottom: 0 }}>
                                <label>Día Mínimo de Atraso</label>
                                <input type="number" className="input-pro" placeholder="Ej: 1" min="1"
                                    value={newRule.minDays}
                                    onChange={e => setNewRule(r => ({ ...r, minDays: e.target.value }))} />
                            </div>
                            <div className="field-group" style={{ marginBottom: 0 }}>
                                <label>Día Máximo <span className="label-opt">(vacío = en adelante)</span></label>
                                <input type="number" className="input-pro" placeholder="Ej: 5" min="1"
                                    value={newRule.maxDays}
                                    onChange={e => setNewRule(r => ({ ...r, maxDays: e.target.value }))} />
                            </div>
                            <div className="field-group" style={{ marginBottom: 0 }}>
                                <label>Tipo de Cargo</label>
                                <select className="input-pro" style={{ height: "46px" }}
                                    value={newRule.type}
                                    onChange={e => setNewRule(r => ({ ...r, type: e.target.value as "percentage" | "fixed" }))}>
                                    <option value="percentage">Porcentaje (%)</option>
                                    <option value="fixed">Monto Fijo (RD$)</option>
                                </select>
                            </div>
                            <div className="field-group" style={{ marginBottom: 0 }}>
                                <label>Valor</label>
                                <input type="number" className="input-pro" placeholder="Ej: 10" step="0.01" min="0.01"
                                    value={newRule.value}
                                    onChange={e => setNewRule(r => ({ ...r, value: e.target.value }))} />
                            </div>
                        </div>

                        <label className="amount-toggle">
                            <input type="checkbox" checked={newRule.limitByAmount}
                                onChange={e => setNewRule(r => ({ ...r, limitByAmount: e.target.checked }))} />
                            <span>Aplicar solo a un rango específico de monto de préstamo</span>
                        </label>

                        {newRule.limitByAmount && (
                            <div className="rule-inputs rule-inputs-amount">
                                <div className="field-group" style={{ marginBottom: 0 }}>
                                    <label>Monto Préstamo Mín. ($)</label>
                                    <input type="number" className="input-pro" placeholder="Ej: 0" min="0"
                                        value={newRule.minAmount}
                                        onChange={e => setNewRule(r => ({ ...r, minAmount: e.target.value }))} />
                                </div>
                                <div className="field-group" style={{ marginBottom: 0 }}>
                                    <label>Monto Préstamo Máx. <span className="label-opt">(vacío = en adelante)</span></label>
                                    <input type="number" className="input-pro" placeholder="Ej: 10000" min="0"
                                        value={newRule.maxAmount}
                                        onChange={e => setNewRule(r => ({ ...r, maxAmount: e.target.value }))} />
                                </div>
                            </div>
                        )}

                        {rulePreview && (
                            <div className="rule-preview-box">
                                <ShieldAlert size={14} />
                                <span>{rulePreview}</span>
                            </div>
                        )}

                        {ruleError && (
                            <div className="rule-error-box">
                                <AlertTriangle size={14} />
                                <span>{ruleError}</span>
                            </div>
                        )}

                        <button type="button" className={`btn-save-pro btn-add-rule ${brandSuccess ? "success" : ""}`} onClick={handleSaveRule} disabled={savingBrand}>
                            {savingBrand ? <RefreshCcw size={16} className="spin" /> : brandSuccess ? <CheckCircle2 size={16} /> : editingRuleId ? <CheckCircle2 size={16} /> : <PlusCircle size={16} />}
                            <span>{savingBrand ? "Guardando..." : brandSuccess ? "¡Guardada!" : editingRuleId ? "Guardar Cambios" : "Añadir Regla"}</span>
                        </button>
                    </div>

                    <footer className="form-footer" style={{ marginTop: "2rem" }}>
                        <button type="button" className={`btn-save-pro ${brandSuccess ? "success" : ""}`} onClick={handleSaveBrand} disabled={savingBrand}>
                            {savingBrand ? <RefreshCcw size={18} className="spin" /> : brandSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                            <span>{savingBrand ? "Guardando..." : brandSuccess ? "¡Cambios Guardados!" : "Guardar Reglas"}</span>
                        </button>
                    </footer>
                </motion.div>
            )}

            {activeTab === "security" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="security-layout">
                    <div className="glass-card security-hint-card">
                        <ShieldAlert size={32} color="#6366f1" />
                        <h3>Seguridad de Cuenta</h3>
                        <p>Cambia tu contraseña periódicamente para mantener tu cuenta segura. Usa al menos 8 caracteres con letras y números.</p>
                    </div>

                    <div className="glass-card form-card">
                        <div className="section-header" style={{ marginBottom: "2rem" }}>
                            <Lock size={18} className="icon-accent" />
                            <h3>Cambiar Contraseña</h3>
                        </div>
                        <form onSubmit={handleChangePassword} className="settings-form">
                            <div className="field-group">
                                <label>Contraseña Actual</label>
                                <div className="input-box">
                                    <Lock size={16} />
                                    <input type={showCurrent ? "text" : "password"} className="input-pro" placeholder="Tu contraseña actual"
                                        value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} required />
                                    <button type="button" className="eye-btn" onClick={() => setShowCurrent(!showCurrent)}>
                                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="field-group">
                                <label>Nueva Contraseña</label>
                                <div className="input-box">
                                    <Lock size={16} />
                                    <input type={showNew ? "text" : "password"} className="input-pro" placeholder="Mínimo 6 caracteres"
                                        value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} minLength={6} required />
                                    <button type="button" className="eye-btn" onClick={() => setShowNew(!showNew)}>
                                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="field-group">
                                <label>Confirmar Nueva Contraseña</label>
                                <div className="input-box">
                                    <Lock size={16} />
                                    <input type="password" className="input-pro" placeholder="Repite la nueva contraseña"
                                        value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} required />
                                </div>
                            </div>

                            {passMsg && (
                                <div className={`pass-msg ${passMsg.ok ? "msg-ok" : "msg-err"}`}>
                                    {passMsg.ok ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                                    {passMsg.text}
                                </div>
                            )}

                            <footer className="form-footer">
                                <button type="submit" className="btn-save-pro" disabled={savingPass}>
                                    {savingPass ? <RefreshCcw size={18} className="spin" /> : <Lock size={18} />}
                                    <span>{savingPass ? "Actualizando..." : "Actualizar Contraseña"}</span>
                                </button>
                            </footer>
                        </form>
                    </div>
                </motion.div>
            )}

            <style dangerouslySetInnerHTML={{ __html: SETTINGS_STYLES }} />
        </div>
    );
}

const SETTINGS_STYLES = `
.settings-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; padding-bottom: 5rem; }
.settings-header { margin-bottom: 2rem; }
.btn-back-minimal { display: flex; align-items: center; gap: 0.6rem; color: var(--text-dim); font-size: 0.85rem; font-weight: 700; text-decoration: none; margin-bottom: 1.5rem; transition: color 0.2s; }
.btn-back-minimal:hover { color: var(--text-main); }
.header-title { font-size: 2rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.4rem; }
.header-subtitle { color: var(--text-dim); font-size: 0.95rem; }

/* Tabs */
.settings-tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(var(--edge-rgb), 0.06); padding-bottom: 1px; }
.stab { display: flex; align-items: center; gap: 0.5rem; background: transparent; border: none; color: var(--text-dim); padding: 0.75rem 1.25rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s; }
.stab:hover { color: var(--text-main); }
.stab.active { color: #6366f1; border-bottom-color: #6366f1; }
.tab-lock-icon { color: #f59e0b; margin-left: 0.25rem; }

/* Plan gate */
.plan-gate-block { max-width: 480px; margin: 4rem auto; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.25rem; padding: 3rem; background: var(--bg-surface-5); border: 1px dashed rgba(var(--edge-rgb), 0.1); border-radius: 20px; }
.plan-gate-icon { width: 64px; height: 64px; border-radius: 16px; background: rgba(245,158,11,0.1); color: #f59e0b; display: flex; align-items: center; justify-content: center; }
.plan-gate-block h2 { font-size: 1.3rem; font-weight: 800; color: var(--text-main); margin: 0; }
.plan-gate-block p { color: var(--text-dim); font-size: 0.92rem; line-height: 1.6; margin: 0; }
.plan-gate-block p strong { color: #3b82f6; }
.plan-gate-btn { display: flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg,#7c3aed,#a855f7); color: white; border: none; padding: 0.75rem 1.75rem; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: opacity 0.2s; }
.plan-gate-btn:hover { opacity: 0.85; }

/* Grid */
.settings-grid { display: grid; grid-template-columns: 380px 1fr; gap: 2rem; }
.section-title-sm { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-faint); letter-spacing: 0.1em; margin-bottom: 1.5rem; }
.preview-card { padding: 2rem; }
.mockup-receipt { background: white; color: black; border-radius: 8px; padding: 1.75rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
.mockup-header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 1.25rem; }
.m-brand { font-size: 1.1rem; font-weight: 900; }
.m-name { font-size: 0.65rem; font-weight: 800; }
.m-detail { font-size: 0.58rem; color: #666; }
.mockup-line { height: 5px; background: #eee; border-radius: 3px; margin-bottom: 0.6rem; }
.mockup-line.short { width: 60%; }
.preview-hint { font-size: 0.78rem; color: var(--text-dim); margin-top: 1.25rem; text-align: center; font-style: italic; line-height: 1.5; }

/* Form */
.form-card { padding: 2.5rem; }
.settings-form { display: flex; flex-direction: column; gap: 0; }
.form-section { margin-bottom: 2.5rem; }
.section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(var(--edge-rgb), 0.05); padding-bottom: 0.875rem; }
.section-header h3 { font-size: 1rem; font-weight: 700; color: var(--text-main); }
.icon-accent { color: #6366f1; }
.field-group { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem; }
.field-group label { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.input-box { position: relative; display: flex; align-items: center; }
.input-box > svg:first-child { position: absolute; left: 1rem; color: var(--text-faint); pointer-events: none; }
.input-pro { width: 100%; background: var(--bg-surface-4); border: 1px solid rgba(var(--edge-rgb), 0.08); color: var(--text-main); padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 10px; outline: none; font-size: 0.92rem; transition: all 0.2s; }
.input-pro:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.eye-btn { position: absolute; right: 1rem; background: transparent; border: none; color: var(--text-faint); cursor: pointer; transition: color 0.2s; padding: 0; }
.eye-btn:hover { color: var(--text-main); }

.form-footer { padding-top: 2rem; border-top: 1px solid rgba(var(--edge-rgb), 0.05); }
.btn-save-pro { background: #6366f1; color: white; border: none; padding: 0.95rem 2rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.3s; width: 100%; justify-content: center; font-size: 0.95rem; }
.btn-save-pro:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(99,102,241,0.4); }
.btn-save-pro.success { background: #10b981; }
.btn-save-pro:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

/* Security */
.security-layout { display: grid; grid-template-columns: 300px 1fr; gap: 2rem; }
.security-hint-card { padding: 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; }
.security-hint-card h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-main); }
.security-hint-card p { font-size: 0.85rem; color: var(--text-dim); line-height: 1.6; }
.pass-msg { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1rem; border-radius: 10px; font-size: 0.88rem; font-weight: 600; }
.msg-ok  { background: rgba(16,185,129,0.1); color: #4ade80; border: 1px solid rgba(16,185,129,0.2); }
.msg-err { background: rgba(239,68,68,0.1); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.state-screen { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; color: var(--text-faint); font-weight: 600; }
.spinner-pro { width: 44px; height: 44px; border: 4px solid rgba(99,102,241,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }

.btn-mini-delete { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-mini-delete:hover { background: rgba(239,68,68,0.2); }

/* Reglas de Mora */
.empty-state-list.mora-empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.6rem; padding: 2.5rem 1.5rem; background: var(--bg-surface-35); border: 1px dashed rgba(var(--edge-rgb), 0.08); border-radius: 14px; margin-bottom: 1.75rem; }
.empty-icon-box { width: 56px; height: 56px; border-radius: 14px; background: rgba(99,102,241,0.1); color: #818cf8; display: flex; align-items: center; justify-content: center; margin-bottom: 0.25rem; }
.mora-empty p { color: var(--text-tertiary); font-weight: 700; font-size: 0.92rem; margin: 0; }
.mora-empty span { color: var(--text-dim); font-size: 0.82rem; max-width: 420px; line-height: 1.5; }

.rule-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.9rem; margin-bottom: 1.75rem; }
.rule-card { position: relative; background: var(--bg-surface-45); border: 1px solid rgba(var(--edge-rgb), 0.07); border-radius: 14px; padding: 1.1rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; transition: border-color 0.2s, box-shadow 0.2s; }
.rule-card:hover { border-color: rgba(99,102,241,0.3); }
.rule-card.editing { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.rule-card-actions { position: absolute; top: 0.6rem; right: 0.6rem; display: flex; gap: 0.15rem; }
.rule-card-edit, .rule-card-delete { background: transparent; border: none; color: var(--text-faint); cursor: pointer; padding: 0.3rem; border-radius: 6px; transition: all 0.2s; }
.rule-card-edit:hover { color: #818cf8; background: rgba(99,102,241,0.1); }
.rule-card-delete:hover { color: #f43f5e; background: rgba(244,63,94,0.1); }
.rule-card-days { display: flex; align-items: center; gap: 0.45rem; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
.rule-card-value { display: flex; align-items: center; gap: 0.5rem; font-size: 1.4rem; font-weight: 900; color: #f59e0b; }
.rule-card-value.fixed { color: #34d399; }
.rule-card-amount { font-size: 0.75rem; color: var(--text-dim); padding-top: 0.4rem; border-top: 1px solid rgba(var(--edge-rgb), 0.05); }

.add-rule-box { background: var(--bg-surface-4); padding: 1.5rem; border-radius: 14px; border: 1px solid rgba(var(--edge-rgb), 0.06); transition: border-color 0.2s; }
.add-rule-box.editing { border-color: rgba(99,102,241,0.3); }
.add-rule-box-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
.add-rule-box h4 { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-main); margin: 0; font-weight: 700; }
.btn-cancel-edit { display: flex; align-items: center; gap: 0.3rem; background: transparent; border: 1px solid var(--border); color: var(--text-muted); font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.7rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.btn-cancel-edit:hover { color: var(--text-main); border-color: rgba(var(--edge-rgb), 0.2); }
.rule-inputs { display: grid; gap: 1rem; align-items: end; }
.rule-inputs-days { grid-template-columns: 1fr 1fr 1fr 1fr; margin-bottom: 1.1rem; }
.rule-inputs-amount { grid-template-columns: 1fr 1fr; margin-top: 1.1rem; }
.label-opt { text-transform: none; font-weight: 500; color: var(--text-faint); letter-spacing: 0; }

.amount-toggle { display: flex; align-items: center; gap: 0.6rem; font-size: 0.83rem; color: var(--text-muted); cursor: pointer; user-select: none; }
.amount-toggle input { width: 16px; height: 16px; accent-color: #6366f1; cursor: pointer; }

.rule-preview-box { display: flex; align-items: flex-start; gap: 0.6rem; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); color: #a5b4fc; font-size: 0.82rem; line-height: 1.5; padding: 0.8rem 1rem; border-radius: 10px; margin-top: 1.1rem; }
.rule-error-box { display: flex; align-items: center; gap: 0.6rem; background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.2); color: #fca5a5; font-size: 0.82rem; padding: 0.8rem 1rem; border-radius: 10px; margin-top: 1.1rem; }
.btn-add-rule { width: auto; padding: 0.8rem 1.75rem; margin-top: 1.25rem; }

@media (max-width: 1024px) {
    .settings-grid { grid-template-columns: 1fr; }
    .security-layout { grid-template-columns: 1fr; }
    .preview-card { order: -1; }
}
@media (max-width: 640px) {
    .header-title { font-size: 1.6rem; }
    .form-card { padding: 1.5rem; }
    .rule-inputs-days, .rule-inputs-amount { grid-template-columns: 1fr 1fr; }
    .rule-cards-grid { grid-template-columns: 1fr 1fr; }
}
`;
