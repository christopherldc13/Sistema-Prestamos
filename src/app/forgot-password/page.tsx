"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ForgotPasswordPage() {
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setSent(true);
            } else {
                const data = await res.json().catch(() => null);
                setError(data?.error || "Error de conexión. Intenta nuevamente.");
            }
        } catch {
            setError("Error de conexión. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-viewer">
            <button
                className="login-theme-toggle"
                onClick={toggleTheme}
                title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo noche"}
                aria-label="Cambiar tema"
            >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="glass-card login-card-fixed"
            >
                <Link href="/login" className="fp-back-link"><ArrowLeft size={14} /> Volver al inicio de sesión</Link>

                <header className="login-header">
                    <motion.div
                        className="login-icon-box"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                    >
                        <ShieldCheck size={26} />
                    </motion.div>
                    <h1 className="login-title">Recuperar Contraseña</h1>
                    <p className="login-subtitle">Te enviaremos un enlace para restablecerla</p>
                </header>

                <AnimatePresence mode="wait">
                    {sent ? (
                        <motion.div
                            key="sent"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="fp-sent-box"
                        >
                            <CheckCircle2 size={32} color="#10b981" />
                            <p>Si <strong>{email}</strong> tiene una cuenta registrada, te enviamos un correo con un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.</p>
                            <Link href="/login" className="login-btn-pro fp-back-btn">Volver al inicio de sesión</Link>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        key="error"
                                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                        animate={{ height: "auto", opacity: 1, marginBottom: "1.5rem" }}
                                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="login-error"
                                    >
                                        <AlertCircle size={14} />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="login-form">
                                <div className="login-group">
                                    <label htmlFor="email">Correo Electrónico</label>
                                    <div className="login-input-wrap">
                                        <Mail size={16} className="input-icon" />
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="usuario@factprest.com"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    type="submit"
                                    className="login-btn-pro"
                                    disabled={loading}
                                    whileHover={{ translateY: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? <span className="loader-icon" /> : <span>Enviar enlace</span>}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="login-footer">© 2026 Fact-Prest System</p>
            </motion.div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .login-viewer {
          position: fixed; inset: 0; background: var(--bg-dark);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; z-index: 9999;
        }
        .login-theme-toggle {
          position: absolute; top: 1.5rem; right: 1.5rem; z-index: 2;
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(var(--edge-rgb), 0.06); border: 1px solid rgba(var(--edge-rgb), 0.1);
          color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        }
        .login-theme-toggle:hover { background: rgba(var(--edge-rgb), 0.1); color: var(--text-main); }

        .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; animation: float 8s ease-in-out infinite; pointer-events: none; }
        .orb-1 { width: 420px; height: 420px; background: radial-gradient(circle, #6366f1, transparent); top: -100px; left: -100px; animation-delay: 0s; }
        .orb-2 { width: 350px; height: 350px; background: radial-gradient(circle, #a855f7, transparent); bottom: -80px; right: -80px; animation-delay: -3s; }
        .orb-3 { width: 260px; height: 260px; background: radial-gradient(circle, #3b82f6, transparent); top: 50%; left: 60%; animation-delay: -5s; }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(20px, -20px) scale(1.05); }
          66%       { transform: translate(-15px, 15px) scale(0.97); }
        }

        .login-card-fixed {
          position: relative; width: 90%; max-width: 400px; padding: 2.75rem 2.5rem;
          border: 1px solid rgba(var(--edge-rgb), 0.08);
          box-shadow: 0 0 0 1px rgba(99,102,241,0.1), 0 24px 64px rgba(0,0,0,0.5);
          z-index: 1;
        }

        .fp-back-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.78rem; font-weight: 600; color: var(--text-faint);
          text-decoration: none; margin-bottom: 1.5rem; transition: color 0.2s;
        }
        .fp-back-link:hover { color: var(--text-main); }

        .login-header { text-align: center; margin-bottom: 2rem; }
        .login-icon-box {
          width: 52px; height: 52px; background: linear-gradient(135deg, #6366f1, #a855f7);
          border-radius: 14px; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.25rem; color: white; box-shadow: 0 4px 20px rgba(99,102,241,0.45);
        }
        .login-title {
          font-size: 1.6rem; font-weight: 800;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 0.25rem; letter-spacing: -0.03em;
        }
        .login-subtitle { color: var(--text-muted); font-size: 0.875rem; }

        .login-error {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(244,63,94,0.1); color: #f87171;
          padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.8rem;
          border: 1px solid rgba(244,63,94,0.2); overflow: hidden;
        }

        .login-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .login-group label {
          display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted);
          margin-bottom: 0.5rem; letter-spacing: 0.02em; text-transform: uppercase;
        }
        .login-input-wrap { position: relative; display: flex; align-items: center; }
        .login-input-wrap .input-icon {
          position: absolute; left: 1rem; color: var(--text-faint); pointer-events: none;
          z-index: 1; transition: color 0.2s;
        }
        .login-input-wrap:focus-within .input-icon { color: #818cf8; }
        .login-input-wrap input {
          width: 100%; background: var(--bg-surface-4); border: 1px solid rgba(var(--edge-rgb), 0.08);
          border-radius: 10px; padding: 0.875rem 1rem 0.875rem 3rem; color: var(--text-main);
          font-size: 0.95rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .login-input-wrap input::placeholder { color: var(--text-very-faint); }
        .login-input-wrap input:focus {
          border-color: #6366f1; background: var(--bg-surface-6); box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
        }

        .login-btn-pro {
          margin-top: 0.5rem; background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; border: none; padding: 1rem; border-radius: 10px; font-weight: 700;
          font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; transition: box-shadow 0.2s, opacity 0.2s; box-shadow: 0 4px 16px rgba(99,102,241,0.3);
          text-decoration: none;
        }
        .login-btn-pro:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(99,102,241,0.5); }
        .login-btn-pro:disabled { opacity: 0.7; cursor: not-allowed; }

        .fp-sent-box {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          gap: 1rem; padding: 0.5rem 0 1rem;
        }
        .fp-sent-box p { color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; }
        .fp-sent-box strong { color: var(--text-main); }
        .fp-back-btn { width: 100%; margin-top: 0.5rem; }

        .login-footer { margin-top: 2.25rem; text-align: center; color: var(--text-very-faint); font-size: 0.75rem; font-weight: 500; }

        .loader-icon {
          width: 18px; height: 18px; border: 2px solid rgba(var(--edge-rgb), 0.2);
          border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 480px) {
          .login-card-fixed { padding: 2.25rem 1.5rem; }
          .login-title { font-size: 1.4rem; }
        }
      `}} />
        </div>
    );
}
