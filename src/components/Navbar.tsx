"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, User, LayoutDashboard, Users, CreditCard, BarChart3, Menu, X, Settings } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (!session) return null;

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="glass-nav">
      <div className="nav-container">
        <Link href="/" className="nav-brand">
          Fact-Prest
        </Link>

        {/* Desktop Links */}
        <ul className="nav-links desktop-only">
          <li>
            <Link href="/">
              <LayoutDashboard size={18} /> Dashboard
            </Link>
          </li>
          <li>
            <Link href="/clients">
              <Users size={18} /> Clientes
            </Link>
          </li>
          <li>
            <Link href="/loans">
              <CreditCard size={18} /> Préstamos
            </Link>
          </li>
          <li>
            <Link href="/reports">
              <BarChart3 size={18} /> Reportes
            </Link>
          </li>
          <li>
            <Link href="/settings">
              <Settings size={18} /> Configuración
            </Link>
          </li>
        </ul>

        <div className="nav-user-actions desktop-only">
          <div className="user-info">
            <User size={18} />
            <span>{session.user?.name || "Administrador"}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-logout">
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-toggle" onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="mobile-menu">
          <ul className="mobile-links">
            <li>
              <Link href="/" onClick={toggleMenu}>
                <LayoutDashboard size={20} /> Dashboard
              </Link>
            </li>
            <li>
              <Link href="/clients" onClick={toggleMenu}>
                <Users size={20} /> Clientes
              </Link>
            </li>
            <li>
              <Link href="/loans" onClick={toggleMenu}>
                <CreditCard size={20} /> Préstamos
              </Link>
            </li>
            <li>
              <Link href="/reports" onClick={toggleMenu}>
                <BarChart3 size={20} /> Reportes
              </Link>
            </li>
            <li>
              <Link href="/settings" onClick={toggleMenu}>
                <Settings size={20} /> Configuración
              </Link>
            </li>
            <li className="mobile-user-row">
              <User size={20} />
              <span>{session.user?.name || "Admin"}</span>
            </li>
            <li>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-logout-mobile">
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
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
          gap: 1rem;
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
        .btn-logout:hover {
          background: rgba(244, 63, 94, 0.2);
        }
        .mobile-toggle {
          display: none;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
        }
        .mobile-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #0f172a;
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
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
        .mobile-user-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            color: #f8fafc;
            border-top: 1px solid rgba(255,255,255,0.1);
            margin-top: 0.5rem;
        }
        .btn-logout-mobile {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(244, 63, 94, 0.1);
            color: #f43f5e;
            border: 1px solid rgba(244, 63, 94, 0.2);
            padding: 0.75rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
        }

        @media (max-width: 900px) {
          .desktop-only { display: none; }
          .mobile-toggle { display: block; }
        }
      `}</style>
    </nav>
  );
}
