"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  LogOut, User, LayoutDashboard, Users, CreditCard,
  BarChart3, Menu, X, Settings, AlertTriangle, Clock, ShieldAlert, ShieldCheck
} from "lucide-react";

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
  const [licenseExpiresAt, setLicenseExpiresAt] = useState<string | null>(null);

  const isAdmin = session && (session.user as any)?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.licenseExpiresAt) setLicenseExpiresAt(d.licenseExpiresAt); })
      .catch(() => {});
  }, [isAdmin]);

  if (!session) return null;

  const licInfo = isAdmin ? getLicenseInfo(licenseExpiresAt) : null;
  const showBanner = licInfo && (licInfo.expired || licInfo.daysLeft <= 30);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <nav className="glass-nav">
        <div className="nav-container">
          <Link href="/" className="nav-brand">Fact-Prest</Link>

          {/* Desktop Links */}
          <ul className="nav-links desktop-only">
            {(session.user as any)?.role === "superadmin" ? (
              <li><Link href="/superadmin"><LayoutDashboard size={18} /> Panel Maestro</Link></li>
            ) : (
              <>
                <li><Link href="/"><LayoutDashboard size={18} /> Dashboard</Link></li>
                <li><Link href="/clients"><Users size={18} /> Clientes</Link></li>
                <li><Link href="/loans"><CreditCard size={18} /> Préstamos</Link></li>
                <li><Link href="/reports"><BarChart3 size={18} /> Reportes</Link></li>
                <li><Link href="/settings"><Settings size={18} /> Configuración</Link></li>
                <li><Link href="/subscription"><ShieldCheck size={18} /> Suscripción</Link></li>
              </>
            )}
          </ul>

          <div className="nav-user-actions desktop-only">
            {/* License chip — solo para admins con licencia configurada */}
            {licInfo && (
              <div className={`license-chip ${licInfo.expired ? "chip-expired" : licInfo.daysLeft <= 7 ? "chip-critical" : "chip-warning"}`}>
                {licInfo.expired
                  ? <><ShieldAlert size={13} /> Licencia vencida</>
                  : <><Clock size={13} /> Vence en {licInfo.daysLeft}d</>}
              </div>
            )}
            <div className="user-info">
              <User size={18} />
              <span>{session.user?.name || "Administrador"} {(session.user as any)?.role === "superadmin" && "(Maestro)"}</span>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-logout">
              <LogOut size={18} /><span>Salir</span>
            </button>
          </div>

          <button className="mobile-toggle" onClick={toggleMenu}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="mobile-menu">
            <ul className="mobile-links">
              {(session.user as any)?.role === "superadmin" ? (
                <li><Link href="/superadmin" onClick={toggleMenu}><LayoutDashboard size={20} /> Panel Maestro</Link></li>
              ) : (
                <>
                  <li><Link href="/" onClick={toggleMenu}><LayoutDashboard size={20} /> Dashboard</Link></li>
                  <li><Link href="/clients" onClick={toggleMenu}><Users size={20} /> Clientes</Link></li>
                  <li><Link href="/loans" onClick={toggleMenu}><CreditCard size={20} /> Préstamos</Link></li>
                  <li><Link href="/reports" onClick={toggleMenu}><BarChart3 size={20} /> Reportes</Link></li>
                  <li><Link href="/settings" onClick={toggleMenu}><Settings size={20} /> Configuración</Link></li>
                  <li><Link href="/subscription" onClick={toggleMenu}><ShieldCheck size={20} /> Suscripción</Link></li>
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
                <span>{session.user?.name || "Admin"} {(session.user as any)?.role === "superadmin" && "(Maestro)"}</span>
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
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
            padding: 0.75rem 0;
          }
          .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 1.5rem;
          }
          .nav-brand {
            font-size: 1.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-decoration: none;
          }
          .nav-links {
            display: flex;
            gap: 1rem;
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .nav-links :global(a) {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #94a3b8;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.2s;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
          }
          .nav-links :global(a:hover) {
            color: #f8fafc;
            background: rgba(255, 255, 255, 0.05);
          }
          .nav-user-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .user-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #f8fafc;
            font-weight: 600;
            font-size: 0.85rem;
          }
          .btn-logout {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(244, 63, 94, 0.1);
            color: #f43f5e;
            border: 1px solid rgba(244, 63, 94, 0.2);
            padding: 0.4rem 0.8rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.8rem;
            transition: all 0.2s;
          }
          .btn-logout:hover { background: rgba(244, 63, 94, 0.2); }

          /* License chip */
          .license-chip {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.35rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
          }
          .chip-warning  { background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
          .chip-critical { background: rgba(239,68,68,0.12);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); animation: pulse-chip 2s infinite; }
          .chip-expired  { background: rgba(239,68,68,0.15);  color: #ef4444; border: 1px solid rgba(239,68,68,0.4); animation: pulse-chip 1.5s infinite; }
          @keyframes pulse-chip { 0%,100%{opacity:1} 50%{opacity:0.6} }

          .mobile-toggle {
            display: none;
            background: transparent;
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
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
            display: flex;
            flex-direction: column;
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
            .desktop-only { display: none; }
            .mobile-toggle { display: block; }
            .nav-brand { font-size: 1.35rem; }
          }
        `}</style>
      </nav>

      {/* Banner de alerta de licencia — debajo del navbar, visible en todas las páginas */}
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
