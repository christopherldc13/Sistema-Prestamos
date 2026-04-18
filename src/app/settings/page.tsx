"use client";

import React, { useState, useEffect } from "react";
import {
    Building2, Save, ArrowLeft, RefreshCcw,
    AtSign, MapPin, Phone, FileText, CheckCircle2,
    Lock, Eye, EyeOff, ShieldAlert, Landmark, Plus, Trash2, Copy, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Tab = "brand" | "security" | "accounts";

interface BankAccount {
    id: string;
    bank: string;
    type: string;
    number: string;
    holder: string;
    iban?: string;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("brand");

    const [config, setConfig] = useState({ brand: "", name: "", slogan: "", address: "", phone: "" });
    const [loadingBrand, setLoadingBrand] = useState(true);
    const [savingBrand, setSavingBrand] = useState(false);
    const [brandSuccess, setBrandSuccess] = useState(false);

    // Cuentas bancarias
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [savingAccounts, setSavingAccounts] = useState(false);
    const [accountsSuccess, setAccountsSuccess] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [newAccount, setNewAccount] = useState<Omit<BankAccount, "id">>({
        bank: "", type: "Corriente", number: "", holder: "", iban: ""
    });
    const [showAddForm, setShowAddForm] = useState(false);

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
                    const { bankAccounts: accs, ...rest } = d;
                    setConfig(rest);
                    if (Array.isArray(accs)) setBankAccounts(accs);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingBrand(false));
    }, []);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const addAccount = () => {
        if (!newAccount.bank || !newAccount.number || !newAccount.holder) return;
        const acc: BankAccount = { ...newAccount, id: Date.now().toString() };
        setBankAccounts(prev => [...prev, acc]);
        setNewAccount({ bank: "", type: "Corriente", number: "", holder: "", iban: "" });
        setShowAddForm(false);
    };

    const removeAccount = (id: string) => {
        setBankAccounts(prev => prev.filter(a => a.id !== id));
    };

    const saveAccounts = async () => {
        setSavingAccounts(true);
        setAccountsSuccess(false);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...config, bankAccounts }),
            });
            if (res.ok) { setAccountsSuccess(true); setTimeout(() => setAccountsSuccess(false), 3000); }
        } catch { alert("Error de conexión"); }
        finally { setSavingAccounts(false); }
    };

    const handleSaveBrand = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingBrand(true);
        setBrandSuccess(false);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...config, bankAccounts }),
            });
            if (res.ok) { setBrandSuccess(true); setTimeout(() => setBrandSuccess(false), 3000); }
        } catch { alert("Error de conexión"); }
        finally { setSavingBrand(false); }
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
                </button>
                <button className={`stab ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
                    <Lock size={16} /> Seguridad
                </button>
            </div>

            {activeTab === "brand" && (
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
.btn-back-minimal { display: flex; align-items: center; gap: 0.6rem; color: #64748b; font-size: 0.85rem; font-weight: 700; text-decoration: none; margin-bottom: 1.5rem; transition: color 0.2s; }
.btn-back-minimal:hover { color: white; }
.header-title { font-size: 2rem; font-weight: 800; color: white; margin-bottom: 0.4rem; }
.header-subtitle { color: #64748b; font-size: 0.95rem; }

/* Tabs */
.settings-tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 1px; }
.stab { display: flex; align-items: center; gap: 0.5rem; background: transparent; border: none; color: #64748b; padding: 0.75rem 1.25rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s; }
.stab:hover { color: white; }
.stab.active { color: #6366f1; border-bottom-color: #6366f1; }

/* Grid */
.settings-grid { display: grid; grid-template-columns: 380px 1fr; gap: 2rem; }
.section-title-sm { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; margin-bottom: 1.5rem; }
.preview-card { padding: 2rem; }
.mockup-receipt { background: white; color: black; border-radius: 8px; padding: 1.75rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
.mockup-header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 1.25rem; }
.m-brand { font-size: 1.1rem; font-weight: 900; }
.m-name { font-size: 0.65rem; font-weight: 800; }
.m-detail { font-size: 0.58rem; color: #666; }
.mockup-line { height: 5px; background: #eee; border-radius: 3px; margin-bottom: 0.6rem; }
.mockup-line.short { width: 60%; }
.preview-hint { font-size: 0.78rem; color: #64748b; margin-top: 1.25rem; text-align: center; font-style: italic; line-height: 1.5; }

/* Form */
.form-card { padding: 2.5rem; }
.settings-form { display: flex; flex-direction: column; gap: 0; }
.form-section { margin-bottom: 2.5rem; }
.section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.875rem; }
.section-header h3 { font-size: 1rem; font-weight: 700; color: white; }
.icon-accent { color: #6366f1; }
.field-group { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem; }
.field-group label { font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.input-box { position: relative; display: flex; align-items: center; }
.input-box > svg:first-child { position: absolute; left: 1rem; color: #475569; pointer-events: none; }
.input-pro { width: 100%; background: rgba(15,23,42,0.4); border: 1px solid rgba(255,255,255,0.08); color: white; padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 10px; outline: none; font-size: 0.92rem; transition: all 0.2s; }
.input-pro:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
.eye-btn { position: absolute; right: 1rem; background: transparent; border: none; color: #475569; cursor: pointer; transition: color 0.2s; padding: 0; }
.eye-btn:hover { color: white; }

.form-footer { padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); }
.btn-save-pro { background: #6366f1; color: white; border: none; padding: 0.95rem 2rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.3s; width: 100%; justify-content: center; font-size: 0.95rem; }
.btn-save-pro:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(99,102,241,0.4); }
.btn-save-pro.success { background: #10b981; }
.btn-save-pro:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

/* Security */
.security-layout { display: grid; grid-template-columns: 300px 1fr; gap: 2rem; }
.security-hint-card { padding: 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; }
.security-hint-card h3 { font-size: 1.1rem; font-weight: 700; color: white; }
.security-hint-card p { font-size: 0.85rem; color: #64748b; line-height: 1.6; }
.pass-msg { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1rem; border-radius: 10px; font-size: 0.88rem; font-weight: 600; }
.msg-ok  { background: rgba(16,185,129,0.1); color: #4ade80; border: 1px solid rgba(16,185,129,0.2); }
.msg-err { background: rgba(239,68,68,0.1); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.state-screen { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; color: #475569; font-weight: 600; }
.spinner-pro { width: 44px; height: 44px; border: 4px solid rgba(99,102,241,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }

/* Accounts */
.accounts-layout { display: grid; grid-template-columns: 300px 1fr; gap: 2rem; }
.accounts-hint-card { padding: 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.75rem; }
.accounts-hint-card h3 { font-size: 1.1rem; font-weight: 700; color: white; }
.accounts-hint-card p { font-size: 0.82rem; color: #64748b; line-height: 1.6; }
.accounts-hint-card strong { color: #818cf8; }

.accounts-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
.account-card { display: flex; align-items: flex-start; gap: 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 1rem 1.25rem; }
.acc-bank-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(99,102,241,0.15); color: #818cf8; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; flex-shrink: 0; }
.acc-info { flex: 1; min-width: 0; }
.acc-bank-name { font-weight: 700; color: white; font-size: 0.95rem; }
.acc-type-badge { display: inline-block; font-size: 0.7rem; font-weight: 700; background: rgba(99,102,241,0.12); color: #818cf8; border-radius: 4px; padding: 0.1rem 0.45rem; margin: 0.2rem 0; }
.acc-number { font-size: 1rem; font-weight: 800; color: #f8fafc; font-family: monospace; letter-spacing: 0.05em; }
.acc-iban { font-size: 0.72rem; color: #475569; margin-top: 0.1rem; word-break: break-all; }
.acc-holder { font-size: 0.8rem; color: #64748b; margin-top: 0.25rem; }
.acc-actions { display: flex; flex-direction: column; gap: 0.5rem; flex-shrink: 0; }
.acc-copy-btn, .acc-del-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #94a3b8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.acc-copy-btn:hover { background: rgba(99,102,241,0.15); color: #818cf8; }
.acc-del-btn:hover { background: rgba(239,68,68,0.15); color: #fca5a5; }
.acc-empty { text-align: center; padding: 2rem; color: #475569; font-size: 0.88rem; border: 1px dashed rgba(255,255,255,0.08); border-radius: 10px; }

.add-account-form { background: rgba(99,102,241,0.04); border: 1px solid rgba(99,102,241,0.15); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.25rem; overflow: hidden; }
.add-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.full-col { grid-column: span 2; }
.add-form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.btn-cancel-sm { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #64748b; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
.btn-add-confirm { background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.4); color: #818cf8; padding: 0.6rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: all 0.2s; }
.btn-add-confirm:hover { background: rgba(99,102,241,0.3); }

.accounts-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); gap: 1rem; flex-wrap: wrap; }
.btn-add-account { display: flex; align-items: center; gap: 0.5rem; background: transparent; border: 1px dashed rgba(99,102,241,0.4); color: #818cf8; padding: 0.7rem 1.25rem; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.88rem; transition: all 0.2s; }
.btn-add-account:hover { background: rgba(99,102,241,0.08); border-style: solid; }

@media (max-width: 1024px) {
    .settings-grid { grid-template-columns: 1fr; }
    .security-layout { grid-template-columns: 1fr; }
    .accounts-layout { grid-template-columns: 1fr; }
    .preview-card { order: -1; }
}
@media (max-width: 640px) {
    .header-title { font-size: 1.6rem; }
    .form-card { padding: 1.5rem; }
    .add-form-grid { grid-template-columns: 1fr; }
    .full-col { grid-column: span 1; }
}
`;
