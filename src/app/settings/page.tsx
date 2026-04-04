"use client";

import React, { useState, useEffect } from "react";
import { 
    Building2, Save, ArrowLeft, RefreshCcw, 
    AtSign, MapPin, Phone, FileText, CheckCircle2 
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SettingsPage() {
    const [config, setConfig] = useState({
        brand: "",
        name: "",
        slogan: "",
        address: "",
        phone: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (!data.error) setConfig(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (e) {
            alert("Error al conectar con la base de datos");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
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
                    <p className="header-subtitle">Gestión de identidad corporativa y datos para documentos oficiales</p>
                </div>
            </header>

            <div className="settings-grid">
                {/* Visual Preview Card */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card preview-card"
                >
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
                    <p className="preview-hint">Esta información aparecerá automáticamente en todos los contratos (A4) y recibos (80mm) generados.</p>
                </motion.div>

                {/* Form Card */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card form-card"
                >
                    <form onSubmit={handleSave} className="settings-form">
                        <div className="form-section">
                            <div className="section-header">
                                <Building2 size={18} className="icon-accent" />
                                <h3>Identidad de Marca</h3>
                            </div>
                            
                            <div className="field-group">
                                <label>Nombre Comercial (Logo)</label>
                                <div className="input-box">
                                    <FileText size={16} />
                                    <input 
                                        type="text" 
                                        className="input-pro"
                                        placeholder="Ej: FACT-PREST"
                                        value={config.brand}
                                        onChange={e => setConfig({...config, brand: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label>Razón Social (Nombre Legal)</label>
                                <div className="input-box">
                                    <Building2 size={16} />
                                    <input 
                                        type="text" 
                                        className="input-pro"
                                        placeholder="Ej: FACT-PREST SRL"
                                        value={config.name}
                                        onChange={e => setConfig({...config, name: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label>Slogan Publicitario</label>
                                <div className="input-box">
                                    <AtSign size={16} />
                                    <input 
                                        type="text" 
                                        className="input-pro"
                                        placeholder="Ej: Soluciones Financieras"
                                        value={config.slogan}
                                        onChange={e => setConfig({...config, slogan: e.target.value})}
                                    />
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
                                <div className="input-box">
                                    <MapPin size={16} />
                                    <input 
                                        type="text" 
                                        className="input-pro"
                                        placeholder="Calle Principal #1..."
                                        value={config.address}
                                        onChange={e => setConfig({...config, address: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label>Teléfono de Contacto</label>
                                <div className="input-box">
                                    <Phone size={16} />
                                    <input 
                                        type="text" 
                                        className="input-pro"
                                        placeholder="809-xxx-xxxx"
                                        value={config.phone}
                                        onChange={e => setConfig({...config, phone: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <footer className="form-footer">
                            <button 
                                type="submit" 
                                className={`btn-save-pro ${success ? "success" : ""}`}
                                disabled={saving}
                            >
                                {saving ? (
                                    <RefreshCcw size={18} className="spin" />
                                ) : success ? (
                                    <CheckCircle2 size={18} />
                                ) : (
                                    <Save size={18} />
                                )}
                                <span>{saving ? "Guardando..." : success ? "¡Cambios Guardados!" : "Guardar Configuración"}</span>
                            </button>
                        </footer>
                    </form>
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .settings-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; padding-bottom: 5rem; }
                .settings-header { margin-bottom: 3rem; }
                .btn-back-minimal { display: flex; align-items: center; gap: 0.6rem; color: #64748b; font-size: 0.85rem; font-weight: 700; text-decoration: none; margin-bottom: 2rem; transition: color 0.2s; }
                .btn-back-minimal:hover { color: white; }
                .header-title { font-size: 2.25rem; font-weight: 800; color: white; margin-bottom: 0.5rem; }
                .header-subtitle { color: #64748b; font-size: 1rem; }

                .settings-grid { display: grid; grid-template-columns: 400px 1fr; gap: 2.5rem; }
                
                .section-title-sm { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; margin-bottom: 1.5rem; }

                .preview-card { padding: 2rem; }
                .mockup-receipt { background: white; color: black; border-radius: 8px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
                .mockup-header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 1.5rem; }
                .m-brand { font-size: 1.2rem; font-weight: 900; }
                .m-name { font-size: 0.7rem; font-weight: 800; }
                .m-detail { font-size: 0.6rem; color: #666; }
                .mockup-line { height: 6px; background: #eee; border-radius: 3px; margin-bottom: 0.75rem; }
                .mockup-line.short { width: 60%; }
                .preview-hint { font-size: 0.8rem; color: #64748b; margin-top: 1.5rem; text-align: center; font-style: italic; }

                .form-card { padding: 3rem; }
                .form-section { margin-bottom: 3rem; }
                .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
                .section-header h3 { font-size: 1.1rem; font-weight: 700; color: white; }
                .icon-accent { color: #6366f1; }

                .field-group { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
                .field-group label { font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                .input-box { position: relative; display: flex; align-items: center; }
                .input-box svg { position: absolute; left: 1rem; color: #475569; }
                .input-pro { width: 100%; background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.08); color: white; padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 10px; outline: none; font-size: 0.95rem; transition: all 0.2s; }
                .input-pro:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }

                .form-footer { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); }
                .btn-save-pro { background: #6366f1; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.3s; width: 100%; justify-content: center; font-size: 1rem; }
                .btn-save-pro:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4); }
                .btn-save-pro.success { background: #10b981; }
                .btn-save-pro:disabled { opacity: 0.7; cursor: not-allowed; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                .state-screen { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; color: #475569; font-weight: 600; text-align: center; }
                .spinner-pro { width: 48px; height: 48px; border: 4px solid rgba(99, 102, 241, 0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }

                @media (max-width: 1024px) {
                    .settings-grid { grid-template-columns: 1fr; }
                    .preview-card { order: -1; }
                }
            `}} />
        </div>
    );
}
