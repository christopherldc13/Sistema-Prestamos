"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Lock, Mail, ChevronRight, AlertCircle, ShieldCheck, Eye, EyeOff, Sun, Moon, BarChart3, ReceiptText, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

// useSearchParams debe leerse dentro de un límite Suspense en el App Router,
// por eso vive en un componente aparte en vez de en LoginPage directamente.
function GoogleErrorReader({ onError }: { onError: (msg: string) => void }) {
    const searchParams = useSearchParams();
    useEffect(() => {
        const err = searchParams.get("error");
        if (!err) return;
        if (err === "NoAccount") {
            onError("Ese correo de Google no tiene una cuenta registrada. Contacta al administrador.");
        } else if (err === "Suspended") {
            onError("Su cuenta ha sido desactivada. Contacte al administrador.");
        } else if (err === "AccessDenied") {
            onError("No se pudo iniciar sesión con Google.");
        }
    }, [searchParams, onError]);
    return null;
}

const FEATURES = [
    { icon: ReceiptText, text: "Control de cobros, abonos y mora en tiempo real" },
    { icon: BarChart3, text: "Reportes claros de tu cartera y rentabilidad" },
    { icon: ShieldAlert, text: "Contratos y recibos generados automáticamente" },
];

export default function LoginPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [shake, setShake] = useState(false);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError("");
        await signIn("google", { callbackUrl: "/" });
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
            <Suspense fallback={null}>
                <GoogleErrorReader onError={setError} />
            </Suspense>

            {/* ── Left brand panel ── */}
            <div className="login-brand-panel">
                <div className="brand-pattern" aria-hidden="true" />
                <div className="brand-panel-inner">
                    <div className="brand-mark">
                        <span className="brand-mark-icon"><ShieldCheck size={20} /></span>
                        <span className="brand-mark-name">Fact-Prest</span>
                    </div>

                    <h1 className="brand-headline">Toma el control total de tu cartera de préstamos</h1>
                    <p className="brand-subtext">
                        La plataforma para gestionar clientes, préstamos y cobros con claridad y seguridad.
                    </p>

                    <ul className="brand-features">
                        {FEATURES.map((f, i) => (
                            <li key={i}>
                                <span className="brand-feature-icon"><f.icon size={16} /></span>
                                <span>{f.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="brand-panel-footer">© 2026 Fact-Prest System</p>
            </div>

            {/* ── Right form panel ── */}
            <div className="login-form-panel">
                <button
                    className="login-theme-toggle"
                    onClick={toggleTheme}
                    title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo noche"}
                    aria-label="Cambiar tema"
                >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`login-card${shake ? " shake" : ""}`}
                >
                    <div className="login-card-mobile-mark">
                        <span className="brand-mark-icon"><ShieldCheck size={20} /></span>
                        <span className="brand-mark-name">Fact-Prest</span>
                    </div>

                    <header className="login-header">
                        <h2 className="login-title">Bienvenido de nuevo</h2>
                        <p className="login-subtitle">Inicia sesión para continuar en tu cuenta</p>
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
                            <Link href="/forgot-password" className="login-forgot-link">¿Olvidaste tu contraseña?</Link>
                        </div>

                        <button
                            type="submit"
                            className="login-btn-pro"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loader-icon" />
                            ) : (
                                <>
                                    <span>Entrar al Sistema</span>
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-divider"><span>o continúa con</span></div>

                    <button
                        type="button"
                        className="login-btn-google"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                    >
                        {googleLoading ? (
                            <span className="loader-icon loader-icon-dark" />
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                                    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.62z"/>
                                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
                                    <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z"/>
                                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"/>
                                </svg>
                                <span>Continuar con Google</span>
                            </>
                        )}
                    </button>

                    <p className="login-footer">© 2026 Fact-Prest System</p>
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        /* ── Layout ── */
        .login-viewer {
          position: fixed;
          inset: 0;
          display: flex;
          z-index: 9999;
          overflow: hidden;
        }

        /* ── Left brand panel (solid color, brand-fixed regardless of theme) ── */
        .login-brand-panel {
          position: relative;
          width: 44%;
          min-width: 420px;
          background: #3730a3;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 3.25rem;
          overflow: hidden;
        }
        .brand-pattern {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23ffffff' fill-opacity='0.09'/%3E%3C/svg%3E");
          background-size: 22px 22px;
          pointer-events: none;
        }
        .brand-panel-inner {
          position: relative;
          z-index: 1;
          max-width: 440px;
          margin-top: 2.5rem;
        }

        .brand-mark { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 3rem; }
        .brand-mark-icon {
          width: 34px; height: 34px;
          background: #ffffff;
          color: #3730a3;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .brand-mark-name { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em; }

        .brand-headline {
          font-size: 2.1rem;
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
        }
        .brand-subtext {
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(255,255,255,0.72);
          margin-bottom: 2.75rem;
        }

        .brand-features { list-style: none; display: flex; flex-direction: column; gap: 1.1rem; }
        .brand-features li { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: rgba(255,255,255,0.92); }
        .brand-feature-icon {
          width: 30px; height: 30px;
          background: rgba(255,255,255,0.12);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .brand-panel-footer {
          position: relative;
          z-index: 1;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.5);
        }

        /* ── Right form panel ── */
        .login-form-panel {
          position: relative;
          flex: 1;
          background: var(--bg-page);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: 2rem;
        }

        .login-theme-toggle {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 2;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(var(--edge-rgb), 0.06);
          border: 1px solid rgba(var(--edge-rgb), 0.1);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .login-theme-toggle:hover {
          background: rgba(var(--edge-rgb), 0.1);
          color: var(--text-main);
        }

        /* ── Card ── */
        .login-card {
          position: relative;
          width: 100%;
          max-width: 380px;
          padding: 1rem 0;
        }

        .login-card-mobile-mark { display: none; align-items: center; gap: 0.55rem; margin-bottom: 2rem; }

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
        .login-header { margin-bottom: 2rem; }
        .login-title {
          font-size: 1.6rem; font-weight: 800;
          color: var(--text-main);
          margin-bottom: 0.35rem;
          letter-spacing: -0.02em;
        }
        .login-subtitle { color: var(--text-muted); font-size: 0.875rem; }

        /* ── Error banner ── */
        .login-error {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(220,38,38,0.1);
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.8rem;
          border: 1px solid rgba(220,38,38,0.2);
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
          color: var(--text-faint);
          pointer-events: none;
          z-index: 1;
          transition: color 0.2s;
        }
        .login-input-wrap:focus-within .input-icon { color: #3730a3; }

        .login-input-wrap input {
          width: 100%;
          background: var(--bg-surface-4);
          border: 1px solid rgba(var(--edge-rgb), 0.12);
          border-radius: 10px;
          padding: 0.875rem 3rem 0.875rem 3rem;
          color: var(--text-main);
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .login-input-wrap input::placeholder { color: var(--text-very-faint); }
        .login-input-wrap input:focus {
          border-color: #3730a3;
          background: var(--bg-surface-6);
          box-shadow: 0 0 0 3px rgba(55,48,163,0.14);
        }

        /* ── Show/hide password button ── */
        .toggle-password {
          position: absolute;
          right: 0.875rem;
          background: none;
          border: none;
          color: var(--text-faint);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: color 0.2s;
        }
        .toggle-password:hover { color: var(--text-muted); }

        .login-forgot-link {
          display: inline-block;
          margin-top: 0.6rem;
          font-size: 0.78rem;
          font-weight: 600;
          color: #4338ca;
          text-decoration: none;
          transition: color 0.2s;
        }
        .login-forgot-link:hover { color: #3730a3; text-decoration: underline; }

        /* ── Submit button ── */
        .login-btn-pro {
          margin-top: 0.5rem;
          background: #3730a3;
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
          transition: background 0.15s;
        }
        .login-btn-pro:hover:not(:disabled) { background: #322e91; }
        .login-btn-pro:active:not(:disabled) { background: #2b2780; }
        .login-btn-pro:disabled { opacity: 0.7; cursor: not-allowed; }

        /* ── Google sign-in ── */
        .login-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
          color: var(--text-very-faint);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .login-divider::before, .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(var(--edge-rgb), 0.1);
        }
        .login-btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          background: var(--bg-elevated);
          color: var(--text-main);
          border: 1px solid var(--border);
          padding: 0.9rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .login-btn-google:hover:not(:disabled) {
          border-color: rgba(var(--edge-rgb), 0.25);
          background: var(--bg-surface-4);
        }
        .login-btn-google:disabled { opacity: 0.7; cursor: not-allowed; }

        /* ── Footer ── */
        .login-footer {
          margin-top: 2.25rem;
          text-align: center;
          color: var(--text-very-faint);
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* ── Loader spinner ── */
        .loader-icon {
          width: 18px; height: 18px;
          border: 2px solid rgba(var(--edge-rgb), 0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        .loader-icon-dark { border-top-color: var(--text-main); }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .login-brand-panel { display: none; }
          .login-form-panel { padding: 1.5rem; }
          .login-card-mobile-mark { display: flex; }
        }
        @media (max-width: 480px) {
          .login-title { font-size: 1.4rem; }
        }
      `}} />
        </div>
    );
}
