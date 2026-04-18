"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, Mail, ChevronRight, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

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
                if (res.error.includes("desactivada")) {
                    setError("Su cuenta está suspendida. Contacte al administrador para más información.");
                } else {
                    setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
                }
                triggerShake();
                setLoading(false);
            } else {
                router.push("/");
            }
        } catch {
            setError("Error de conexión. Intenta nuevamente.");
            triggerShake();
            setLoading(false);
        }
    };

    return (
        <div className="login-viewer">
            {/* Animated background orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`glass-card login-card-fixed${shake ? " shake" : ""}`}
            >
                <header className="login-header">
                    <motion.div
                        className="login-icon-box"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                        <ShieldCheck size={26} />
                    </motion.div>
                    <h1 className="login-title">Fact-Prest</h1>
                    <p className="login-subtitle">Gestión inteligente de préstamos</p>
                </header>

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

                    <div className="login-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="login-input-wrap">
                            <Lock size={16} className="input-icon" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(v => !v)}
                                tabIndex={-1}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        className="login-btn-pro"
                        disabled={loading}
                        whileHover={{ translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? (
                            <span className="loader-icon" />
                        ) : (
                            <>
                                <span>Entrar al Sistema</span>
                                <ChevronRight size={18} />
                            </>
                        )}
                    </motion.button>
                </form>

                <p className="login-footer">© 2026 Fact-Prest System</p>
            </motion.div>

            <style dangerouslySetInnerHTML={{
                __html: `
        /* ── Layout ── */
        .login-viewer {
          position: fixed;
          inset: 0;
          background: var(--bg-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          z-index: 9999;
        }

        /* ── Animated background orbs ── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          animation: float 8s ease-in-out infinite;
          pointer-events: none;
        }
        .orb-1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, #6366f1, transparent);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, #a855f7, transparent);
          bottom: -80px; right: -80px;
          animation-delay: -3s;
        }
        .orb-3 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, #3b82f6, transparent);
          top: 50%; left: 60%;
          animation-delay: -5s;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(20px, -20px) scale(1.05); }
          66%       { transform: translate(-15px, 15px) scale(0.97); }
        }

        /* ── Card ── */
        .login-card-fixed {
          position: relative;
          width: 90%;
          max-width: 400px;
          padding: 2.75rem 2.5rem;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 0 0 1px rgba(99,102,241,0.1), 0 24px 64px rgba(0,0,0,0.5);
          z-index: 1;
        }

        /* ── Shake on error ── */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
        .shake { animation: shake 0.45s ease; }

        /* ── Header ── */
        .login-header { text-align: center; margin-bottom: 2rem; }

        .login-icon-box {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.25rem;
          color: white;
          box-shadow: 0 4px 20px rgba(99,102,241,0.45);
        }

        .login-title {
          font-size: 2rem; font-weight: 800;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.25rem;
          letter-spacing: -0.03em;
        }
        .login-subtitle { color: var(--text-muted); font-size: 0.875rem; }

        /* ── Error banner ── */
        .login-error {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(244,63,94,0.1);
          color: #f87171;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.8rem;
          border: 1px solid rgba(244,63,94,0.2);
          overflow: hidden;
        }

        /* ── Form ── */
        .login-form { display: flex; flex-direction: column; gap: 1.25rem; }

        .login-group label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        /* ── Input wrapper ── */
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-wrap .input-icon {
          position: absolute;
          left: 1rem;
          color: #475569;
          pointer-events: none;
          z-index: 1;
          transition: color 0.2s;
        }
        .login-input-wrap:focus-within .input-icon { color: #818cf8; }

        .login-input-wrap input {
          width: 100%;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.875rem 3rem 0.875rem 3rem;
          color: white;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .login-input-wrap input::placeholder { color: #334155; }
        .login-input-wrap input:focus {
          border-color: #6366f1;
          background: rgba(0,0,0,0.4);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
        }

        /* ── Show/hide password button ── */
        .toggle-password {
          position: absolute;
          right: 0.875rem;
          background: none;
          border: none;
          color: #475569;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: color 0.2s;
        }
        .toggle-password:hover { color: #94a3b8; }

        /* ── Submit button ── */
        .login-btn-pro {
          margin-top: 0.5rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
        }
        .login-btn-pro:hover:not(:disabled) {
          box-shadow: 0 6px 24px rgba(99,102,241,0.5);
        }
        .login-btn-pro:disabled { opacity: 0.7; cursor: not-allowed; }

        /* ── Footer ── */
        .login-footer {
          margin-top: 2.25rem;
          text-align: center;
          color: #1e293b;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* ── Loader spinner ── */
        .loader-icon {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .login-card-fixed { padding: 2.25rem 1.5rem; }
          .login-title { font-size: 1.75rem; }
        }
      `}} />
        </div>
    );
}
