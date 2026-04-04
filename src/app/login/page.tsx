"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Lock, Mail, ChevronRight, AlertCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Las credenciales no coinciden.");
                setLoading(false);
            } else {
                window.location.href = "/";
            }
        } catch (err) {
            setError("Error de conexión.");
            setLoading(false);
        }
    };

    return (
        <div className="login-viewer">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card login-card-fixed"
            >
                <header className="login-header">
                    <div className="login-icon-box">
                        <ShieldCheck size={28} />
                    </div>
                    <h1 className="login-title">Fact-Prest</h1>
                    <p className="login-subtitle">Gestión inteligente de préstamos</p>
                </header>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="login-error"
                        >
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-group">
                        <label>Correo Electrónico</label>
                        <div className="login-input-pro">
                            <Mail size={16} />
                            <input
                                type="email"
                                placeholder="usuario@factprest.com"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="login-group">
                        <label>Contraseña</label>
                        <div className="login-input-pro">
                            <Lock size={16} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn-pro" disabled={loading}>
                        {loading ? <span className="loader-icon"></span> : "Entrar al Sistema"}
                        {!loading && <ChevronRight size={18} />}
                    </button>
                </form>

                <p className="login-footer">© 2026 Fact-Prest System</p>
            </motion.div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .login-viewer {
          position: fixed;
          inset: 0;
          background-color: var(--bg-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          z-index: 9999;
        }

        .login-card-fixed {
          width: 90%;
          max-width: 400px;
          padding: 3rem 2.5rem;
          border: 1px solid var(--border);
        }

        .login-header { text-align: center; margin-bottom: 2.5rem; }
        
        .login-icon-box { 
          width: 48px; height: 48px; 
          background: var(--primary); 
          border-radius: 12px; 
          display: flex; align-items: center; justify-content: center; 
          margin: 0 auto 1.25rem; color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .login-title { 
          font-size: 2rem; font-weight: 800; 
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.25rem;
          letter-spacing: -0.03em;
        }
        .login-subtitle { color: var(--text-muted); font-size: 0.9rem; }

        .login-error { 
          display: flex; align-items: center; gap: 0.5rem; 
          background: rgba(244, 63, 94, 0.1); 
          color: #f87171; padding: 0.75rem 1rem; border-radius: 10px; 
          margin-bottom: 1.5rem; font-size: 0.8rem;
          border: 1px solid rgba(244, 63, 94, 0.2);
        }

        .login-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .login-group label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.6rem; font-weight: 600; }
        .login-input-pro { position: relative; display: flex; align-items: center; }
        .login-input-pro svg { position: absolute; left: 1rem; color: #475569; }
        .login-input-pro input { 
          width: 100%; 
          background: rgba(0, 0, 0, 0.2); 
          border: 1px solid var(--border); 
          border-radius: 10px; 
          padding: 0.875rem 1rem 0.875rem 3rem; 
          color: white; font-size: 0.95rem; outline: none;
          transition: all 0.2s ease;
        }
        .login-input-pro input:focus { border-color: var(--primary); background: rgba(0, 0, 0, 0.4); }

        .login-btn-pro { 
          margin-top: 0.5rem; background: var(--primary); color: white; border: none; 
          padding: 1rem; border-radius: 10px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem; 
          transition: all 0.2s ease;
        }
        .login-btn-pro:hover { background: var(--primary-hover); transform: translateY(-1px); }

        .login-footer { margin-top: 2.5rem; text-align: center; color: #334155; font-size: 0.75rem; font-weight: 500; }

        .loader-icon { 
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.2); 
          border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 480px) {
          .login-card-fixed { padding: 2.5rem 1.5rem; }
          .login-title { font-size: 1.75rem; }
        }
      `}} />
        </div>
    );
}
