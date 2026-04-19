"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  LogOut, User, LayoutDashboard, Users, CreditCard,
  BarChart3, Menu, X, Settings, AlertTriangle, Clock,
  ShieldAlert, ShieldCheck, Zap, ChevronDown
} from "lucide-react";
import { getPlan, type PlanId } from "@/lib/plans";

function getLicenseInfo(expiresAt: string | null) {
  if (!expiresAt) return null;
  const now = new Date();
  const exp = new Date(expiresAt);
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { daysLeft, expired: daysLeft < 0, expDate: exp };
}

export function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [licenseExpiresAt, setLicenseExpiresAt] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<PlanId>("basic");
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session && (session.user as any)?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.licenseExpiresAt) setLicenseExpiresAt(d.licenseExpiresAt);
        if (d?.subscriptionPlan) setSubscriptionPlan(d.subscriptionPlan as PlanId);
      })
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const plan = isAdmin ? getPlan(subscriptionPlan) : null;

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
                  {!isSuperadmin && (
                    <>
                      <Link href="/plans" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <Zap size={15} /> Mis Planes
                      </Link>
                      <Link href="/subscription" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <ShieldCheck size={15} /> Suscripción
                      </Link>
                      <Link href="/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <Settings size={15} /> Configuración
                      </Link>
                      <div className="dropdown-divider" />
                    </>
                  )}
                  <button
                    className="dropdown-item dropdown-logout"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut size={15} /> Cerrar Sesión
                  </button>
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
            background: rgba(15, 23, 42, 0.92);
            backdrop-filter: blur(14px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
            background: linear-gradient(135deg, #6366f1, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
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
            color: #94a3b8;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.88rem;
            transition: all 0.2s;
            padding: 0.45rem 0.7rem;
            border-radius: 8px;
            white-space: nowrap;
          }
          .nav-links :global(a:hover) {
            color: #f8fafc;
            background: rgba(255, 255, 255, 0.07);
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
            background: rgba(255,255,255,0.04);
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

          /* User dropdown trigger */
          .user-menu-wrap {
            position: relative;
          }
          .user-trigger {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 0.4rem 0.75rem 0.4rem 0.5rem;
            cursor: pointer;
            color: #f8fafc;
            transition: all 0.2s;
          }
          .user-trigger:hover {
            background: rgba(255,255,255,0.09);
            border-color: rgba(255,255,255,0.18);
          }
          .user-avatar {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: linear-gradient(135deg, #6366f1, #a855f7);
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
            color: #64748b;
            transition: transform 0.2s;
            flex-shrink: 0;
          }
          .chevron.open { transform: rotate(180deg); }

          /* Dropdown panel */
          .user-dropdown {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            background: rgba(15, 23, 42, 0.98);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 12px;
            padding: 0.5rem;
            min-width: 180px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
            z-index: 100;
          }
          .dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.6rem 0.75rem;
            border-radius: 8px;
            color: #94a3b8;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.15s;
            background: transparent;
            border: none;
            cursor: pointer;
            width: 100%;
            text-align: left;
          }
          .dropdown-item:hover {
            background: rgba(255,255,255,0.07);
            color: #f8fafc;
          }
          .dropdown-divider {
            height: 1px;
            background: rgba(255,255,255,0.08);
            margin: 0.25rem 0.5rem;
          }
          .dropdown-logout {
            color: #f87171;
          }
          .dropdown-logout:hover {
            background: rgba(244,63,94,0.1);
            color: #f43f5e;
          }

          /* Mobile */
          .mobile-toggle {
            display: none;
            background: transparent;
            border: none;
            color: white;
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
            background: rgba(15, 23, 42, 0.98);
            backdrop-filter: blur(16px);
            padding: 1.25rem 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
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
            color: #94a3b8;
            padding: 0.75rem;
            border-radius: 8px;
            font-weight: 500;
            text-decoration: none;
          }
          .mobile-links :global(a:hover) {
            background: rgba(255,255,255,0.05);
            color: #f8fafc;
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
            color: #f8fafc;
            border-top: 1px solid rgba(255,255,255,0.1);
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
            ? <>Tu licencia venció el <strong>{licInfo!.expDate.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</strong>. Contacta a tu proveedor para renovar.</>
            : licInfo!.daysLeft <= 7
              ? <>⚠️ Tu licencia vence en <strong>{licInfo!.daysLeft} día{licInfo!.daysLeft !== 1 ? "s" : ""}</strong>. Renueva pronto para no perder el acceso.</>
              : <>Tu licencia vence el <strong>{licInfo!.expDate.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</strong> — quedan {licInfo!.daysLeft} días.</>
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
