"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  LogOut, User, LayoutDashboard, Users, CreditCard,
  BarChart3, Menu, X, Settings, AlertTriangle, Clock,
  ShieldAlert, ShieldCheck, Zap, ChevronDown, ChevronRight,
  Sun, Moon
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useUserPlan } from "@/components/UserPlanProvider";

function getLicenseInfo(expiresAt: string | null) {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt);
  // Compare as UTC dates (strip time) to avoid timezone offset shifting the day count
  const nowUTC = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const expUTC = Date.UTC(exp.getUTCFullYear(), exp.getUTCMonth(), exp.getUTCDate());
  const daysLeft = Math.round((expUTC - nowUTC) / (1000 * 60 * 60 * 24));
  return { daysLeft, expired: daysLeft < 0, expDate: exp };
}

export function Navbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { plan: userPlan, licenseExpiresAt } = useUserPlan();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session && (session.user as any)?.role === "admin";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const plan = isAdmin ? userPlan : null;

  if (!session) return null;

  const licInfo = isAdmin ? getLicenseInfo(licenseExpiresAt) : null;
  const showBanner = licInfo && (licInfo.expired || licInfo.daysLeft <= 30);
  const isSuperadmin = (session.user as any)?.role === "superadmin";

  return (
    <>
      <nav className="glass-nav">
        <div className="nav-container">
          {/* Brand */}
          <Link href="/" className="nav-brand">Fact-Prest</Link>

          {/* Desktop primary links */}
          <ul className="nav-links desktop-only">
            {isSuperadmin ? (
              <li><Link href="/superadmin"><LayoutDashboard size={17} /> Panel Maestro</Link></li>
            ) : (
              <>
                <li><Link href="/"><LayoutDashboard size={17} /> Dashboard</Link></li>
                <li><Link href="/clients"><Users size={17} /> Clientes</Link></li>
                <li><Link href="/loans"><CreditCard size={17} /> Préstamos</Link></li>
                <li><Link href="/reports"><BarChart3 size={17} /> Reportes</Link></li>
              </>
            )}
          </ul>

          {/* Desktop right-side actions */}
          <div className="nav-right desktop-only">
            {/* Plan chip */}
            {plan && (
              <div className="plan-chip" style={{ borderColor: plan.color + "55", color: plan.color }}>
                <Zap size={11} />
                {plan.name}
              </div>
            )}

            {/* License chip */}
            {licInfo && (
              <div className={`license-chip ${licInfo.expired ? "chip-expired" : licInfo.daysLeft <= 7 ? "chip-critical" : "chip-warning"}`}>
                {licInfo.expired
                  ? <><ShieldAlert size={13} /> Vencida</>
                  : <><Clock size={13} /> {licInfo.daysLeft}d</>}
              </div>
            )}

            {/* Theme toggle */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo noche"}
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* User dropdown */}
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                className="user-trigger"
                onClick={() => setUserMenuOpen(v => !v)}
              >
                <div className="user-avatar">
                  <User size={15} />
                </div>
                <span className="user-name">
                  {session.user?.name || "Admin"}
                  {isSuperadmin && <span className="superadmin-tag">Maestro</span>}
                </span>
                <ChevronDown size={14} className={`chevron ${userMenuOpen ? "open" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  {/* User header */}
                  <div className="dd-header">
                    <div className="dd-avatar-ring">
                      <div className="dd-avatar"><User size={18} /></div>
                    </div>
                    <div className="dd-info">
                      <p className="dd-name">{session.user?.name || "Admin"}</p>
                      <p className="dd-role">{isSuperadmin ? "Super Admin" : "Administrador"}</p>
                    </div>
                    {plan && !isSuperadmin && (
                      <div className="dd-plan-badge" style={{ borderColor: plan.color + "50", color: plan.color }}>
                        <Zap size={9} />{plan.name}
                      </div>
                    )}
                  </div>

                  {!isSuperadmin && (
                    <div className="dd-group">
                      <div className="dd-section-label">Cuenta</div>
                      <Link href="/plans" className="dd-item" onClick={() => setUserMenuOpen(false)}>
                        <div className="dd-icon dd-icon-yellow"><Zap size={14} /></div>
                        <span className="dd-item-text">Mis Planes</span>
                        <ChevronRight size={13} className="dd-item-arrow" />
                      </Link>
                      <Link href="/subscription" className="dd-item" onClick={() => setUserMenuOpen(false)}>
                        <div className="dd-icon dd-icon-green"><ShieldCheck size={14} /></div>
                        <span className="dd-item-text">Suscripción</span>
                        <ChevronRight size={13} className="dd-item-arrow" />
                      </Link>
                      <Link href="/settings" className="dd-item" onClick={() => setUserMenuOpen(false)}>
                        <div className="dd-icon dd-icon-slate"><Settings size={14} /></div>
                        <span className="dd-item-text">Configuración</span>
                        <ChevronRight size={13} className="dd-item-arrow" />
                      </Link>
                    </div>
                  )}

                  <div className="dd-footer">
                    <button className="dd-logout" onClick={() => signOut({ callbackUrl: "/login" })}>
                      <LogOut size={15} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="mobile-menu">
            <ul className="mobile-links">
              {isSuperadmin ? (
                <li><Link href="/superadmin" onClick={() => setIsOpen(false)}><LayoutDashboard size={20} /> Panel Maestro</Link></li>
              ) : (
                <>
                  <li><Link href="/" onClick={() => setIsOpen(false)}><LayoutDashboard size={20} /> Dashboard</Link></li>
                  <li><Link href="/clients" onClick={() => setIsOpen(false)}><Users size={20} /> Clientes</Link></li>
                  <li><Link href="/loans" onClick={() => setIsOpen(false)}><CreditCard size={20} /> Préstamos</Link></li>
                  <li><Link href="/reports" onClick={() => setIsOpen(false)}><BarChart3 size={20} /> Reportes</Link></li>
                  <li><Link href="/plans" onClick={() => setIsOpen(false)}><Zap size={20} /> Planes</Link></li>
                  <li><Link href="/subscription" onClick={() => setIsOpen(false)}><ShieldCheck size={20} /> Suscripción</Link></li>
                  <li><Link href="/settings" onClick={() => setIsOpen(false)}><Settings size={20} /> Configuración</Link></li>
                </>
              )}
              {licInfo && (
                <li className={`mobile-license-row ${licInfo.expired ? "chip-expired" : "chip-warning"}`}>
                  {licInfo.expired
                    ? <><ShieldAlert size={16} /> Licencia vencida — contacta al proveedor</>
                    : <><Clock size={16} /> Tu licencia vence en {licInfo.daysLeft} días</>}
                </li>
              )}
              <li>
                <button className="mobile-theme-toggle" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                  <span>{theme === "dark" ? "Modo claro" : "Modo noche"}</span>
                </button>
              </li>
              <li className="mobile-user-row">
                <User size={20} />
                <span>{session.user?.name || "Admin"}{isSuperadmin && " (Maestro)"}</span>
              </li>
              <li>
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-logout-mobile">
                  <LogOut size={20} /><span>Cerrar Sesión</span>
                </button>
              </li>
            </ul>
          </div>
        )}

        <style jsx>{`
          .glass-nav {
            background: var(--bg-surface-92);
            backdrop-filter: blur(14px);
            border-bottom: 1px solid rgba(var(--edge-rgb), 0.08);
            position: sticky;
            top: 0;
            z-index: 1000;
          }
          .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            gap: 2rem;
            padding: 0 1.5rem;
            height: 60px;
          }
          .nav-brand {
            font-size: 1.45rem;
            font-weight: 800;
            color: var(--primary);
            text-decoration: none;
            flex-shrink: 0;
            letter-spacing: -0.02em;
          }
          .nav-links {
            display: flex;
            gap: 0.25rem;
            list-style: none;
            margin: 0;
            padding: 0;
            flex: 1;
          }
          .nav-links :global(a) {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            color: var(--text-muted);
            text-decoration: none;
            font-weight: 500;
            font-size: 0.88rem;
            transition: all 0.2s;
            padding: 0.45rem 0.7rem;
            border-radius: 8px;
            white-space: nowrap;
          }
          .nav-links :global(a:hover) {
            color: var(--text-main);
            background: rgba(var(--edge-rgb), 0.07);
          }

          /* Right actions area */
          .nav-right {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            flex-shrink: 0;
            margin-left: auto;
          }

          /* Plan chip */
          .plan-chip {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.28rem 0.65rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 700;
            background: rgba(var(--edge-rgb), 0.04);
            border: 1px solid;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            white-space: nowrap;
          }

          /* License chip */
          .license-chip {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.28rem 0.65rem;
            border-radius: 20px;
            font-size: 0.72rem;
            font-weight: 700;
            white-space: nowrap;
          }
          .chip-warning  { background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
          .chip-critical { background: rgba(239,68,68,0.12);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); animation: pulse-chip 2s infinite; }
          .chip-expired  { background: rgba(239,68,68,0.15);  color: #ef4444; border: 1px solid rgba(239,68,68,0.4); animation: pulse-chip 1.5s infinite; }
          @keyframes pulse-chip { 0%,100%{opacity:1} 50%{opacity:0.6} }

          /* Theme toggle */
          .theme-toggle-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 9px;
            background: var(--bg-hover);
            border: 1px solid var(--border-soft-8);
            color: var(--text-muted);
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
          }
          .theme-toggle-btn:hover {
            background: var(--bg-hover-strong);
            color: var(--text-main);
            border-color: var(--border);
          }
          .mobile-theme-toggle {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: var(--bg-hover);
            border: none;
            color: var(--text-secondary);
            padding: 0.75rem;
            border-radius: 8px;
            font-weight: 500;
            font-size: 1rem;
            cursor: pointer;
            font-family: inherit;
          }

          /* User dropdown trigger */
          .user-menu-wrap {
            position: relative;
          }
          .user-trigger {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(var(--edge-rgb), 0.05);
            border: 1px solid rgba(var(--edge-rgb), 0.1);
            border-radius: 10px;
            padding: 0.4rem 0.75rem 0.4rem 0.5rem;
            cursor: pointer;
            color: var(--text-main);
            transition: all 0.2s;
          }
          .user-trigger:hover {
            background: rgba(var(--edge-rgb), 0.09);
            border-color: rgba(var(--edge-rgb), 0.18);
          }
          .user-avatar {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .user-name {
            font-size: 0.85rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            white-space: nowrap;
          }
          .superadmin-tag {
            font-size: 0.65rem;
            background: rgba(168,85,247,0.2);
            color: #c084fc;
            border: 1px solid rgba(168,85,247,0.3);
            border-radius: 4px;
            padding: 0.1rem 0.35rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
          .chevron {
            color: var(--text-dim);
            transition: transform 0.2s;
            flex-shrink: 0;
          }
          .chevron.open { transform: rotate(180deg); }

          /* ── Dropdown panel ── */
          .user-dropdown {
            position: absolute;
            top: calc(100% + 12px);
            right: 0;
            width: 250px;
            background: var(--bg-elevated);
            border: 1px solid rgba(var(--edge-rgb), 0.09);
            border-radius: 18px;
            padding: 0;
            overflow: hidden;
            box-shadow: 0 28px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(var(--edge-rgb), 0.04);
            z-index: 100;
            animation: dd-in 0.16s cubic-bezier(.22,.68,0,1.2);
          }
          @keyframes dd-in {
            from { opacity:0; transform:translateY(-8px) scale(.96); }
            to   { opacity:1; transform:translateY(0)    scale(1);   }
          }

          /* Header */
          .dd-header {
            position: relative;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 11px;
            padding: 16px 14px;
            background: rgba(99,102,241,0.12);
            border-bottom: 1px solid rgba(var(--edge-rgb), 0.07);
          }
          .dd-avatar-ring {
            width: 44px;
            height: 44px;
            border-radius: 13px;
            padding: 2px;
            background: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 4px 16px rgba(99,102,241,0.45);
          }
          .dd-avatar {
            width: 100%;
            height: 100%;
            border-radius: 11px;
            background: #111827;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #c7d2fe;
          }
          .dd-info { display:flex; flex-direction:column; gap:2px; min-width:0; }
          .dd-name {
            margin: 0;
            font-size: 0.9rem;
            font-weight: 800;
            color: var(--text-main);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            letter-spacing: -0.01em;
          }
          .dd-role {
            margin: 0;
            font-size: 0.66rem;
            font-weight: 700;
            color: #a5b4fc;
            text-transform: uppercase;
            letter-spacing: 0.09em;
          }
          .dd-plan-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            display: flex;
            align-items: center;
            gap: 3px;
            font-size: 0.6rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding: 3px 7px;
            border-radius: 20px;
            border: 1px solid;
            background: var(--bg-surface-5);
          }

          /* Item group */
          .dd-group { padding: 8px; display: flex; flex-direction: column; gap: 1px; }

          /* Section label */
          .dd-section-label {
            font-size: 0.64rem;
            font-weight: 800;
            color: var(--text-faint);
            text-transform: uppercase;
            letter-spacing: 0.11em;
            padding: 6px 8px 5px;
          }

          /* Items */
          .dd-item {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 11px;
            padding: 9px 8px;
            border-radius: 11px;
            color: var(--text-tertiary);
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 600;
            transition: background 0.15s, transform 0.15s;
            cursor: pointer;
            width: 100%;
          }
          .dd-item:hover { background: rgba(var(--edge-rgb), 0.055); transform: translateX(2px); }
          .dd-item-text { line-height:1; flex: 1; }
          .dd-item-arrow {
            color: var(--text-faint);
            opacity: 0;
            transform: translateX(-4px);
            transition: opacity 0.15s, transform 0.15s;
            flex-shrink: 0;
          }
          .dd-item:hover .dd-item-arrow { opacity: 1; transform: translateX(0); }

          /* Icons */
          .dd-icon {
            width: 30px;
            height: 30px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .dd-icon-yellow { background: rgba(250,204,21,.15); color:#fbbf24; }
          .dd-icon-green  { background: rgba(34,197,94,.15);  color:#4ade80; }
          .dd-icon-slate  { background: rgba(148,163,184,.15); color:var(--text-tertiary); }

          /* Footer / logout */
          .dd-footer { padding: 8px; padding-top: 2px; border-top: 1px solid rgba(var(--edge-rgb), 0.06); margin-top: 2px; }
          .dd-logout {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px;
            border-radius: 11px;
            color: #fb7185;
            font-size: 0.85rem;
            font-weight: 700;
            background: rgba(244,63,94,.1);
            border: 1px solid rgba(244,63,94,.16);
            cursor: pointer;
            width: 100%;
            margin-top: 6px;
            transition: background 0.15s, border-color 0.15s;
          }
          .dd-logout:hover { background: rgba(244,63,94,.22); border-color: rgba(244,63,94,.35); }

          /* Mobile */
          .mobile-toggle {
            display: none;
            background: transparent;
            border: none;
            color: var(--text-main);
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            margin-left: auto;
          }
          .mobile-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-surface-98);
            backdrop-filter: blur(16px);
            padding: 1.25rem 1rem;
            border-bottom: 1px solid rgba(var(--edge-rgb), 0.1);
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
          }
          .mobile-links {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .mobile-links :global(a) {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--text-muted);
            padding: 0.75rem;
            border-radius: 8px;
            font-weight: 500;
            text-decoration: none;
          }
          .mobile-links :global(a:hover) {
            background: rgba(var(--edge-rgb), 0.05);
            color: var(--text-main);
          }
          .mobile-license-row {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.75rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 700;
          }
          .mobile-user-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 0.75rem 0.75rem;
            color: var(--text-main);
            border-top: 1px solid rgba(var(--edge-rgb), 0.1);
            margin-top: 0.5rem;
            font-weight: 600;
          }
          .btn-logout-mobile {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            background: rgba(244, 63, 94, 0.1);
            color: #f43f5e;
            border: 1px solid rgba(244, 63, 94, 0.2);
            padding: 0.85rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 0.5rem;
          }

          @media (max-width: 900px) {
            .desktop-only { display: none !important; }
            .mobile-toggle { display: block; }
            .nav-brand { font-size: 1.3rem; }
            .nav-container { gap: 0; }
          }
        `}</style>
      </nav>

      {/* License banner */}
      {showBanner && (
        <div className={`license-banner ${licInfo!.expired ? "banner-expired" : licInfo!.daysLeft <= 7 ? "banner-critical" : "banner-warning"}`}>
          <AlertTriangle size={16} />
          {licInfo!.expired
            ? <>Tu licencia venció el <strong>{licInfo!.expDate.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</strong>. Contacta a tu proveedor para renovar.</>
            : licInfo!.daysLeft <= 7
              ? <>⚠️ Tu licencia vence en <strong>{licInfo!.daysLeft} día{licInfo!.daysLeft !== 1 ? "s" : ""}</strong>. Renueva pronto para no perder el acceso.</>
              : <>Tu licencia vence el <strong>{licInfo!.expDate.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</strong> — quedan {licInfo!.daysLeft} días.</>
          }
          <style>{`
            .license-banner {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.6rem;
              padding: 0.65rem 1.5rem;
              font-size: 0.85rem;
              font-weight: 600;
              text-align: center;
            }
            .banner-warning  { background: rgba(245,158,11,0.12); color: #fbbf24; border-bottom: 1px solid rgba(245,158,11,0.2); }
            .banner-critical { background: rgba(239,68,68,0.12);  color: #fca5a5; border-bottom: 1px solid rgba(239,68,68,0.3); }
            .banner-expired  { background: rgba(239,68,68,0.18);  color: #ef4444; border-bottom: 1px solid rgba(239,68,68,0.4); animation: pulse-banner 2s infinite; }
            @keyframes pulse-banner { 0%,100%{opacity:1} 50%{opacity:0.7} }
          `}</style>
        </div>
      )}
    </>
  );
}
