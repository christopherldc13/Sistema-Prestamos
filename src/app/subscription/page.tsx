"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, CheckCircle2, ShieldCheck } from "lucide-react";

export default function SubscriptionPage() {
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const accounts = [
    {
      id: "popular-corr",
      bankName: "Banco Popular",
      type: "Cuenta Corriente",
      accountNumber: "855402731",
      holder: "Christopher Lantigua de la Cruz",
      bgColor: "#0d5ea6",
      logoUrl: "https://popularenlinea.com/_catalogs/masterpage/popularenlinea/shared/images/BPD-logo.png"
    },
    {
      id: "banreservas",
      bankName: "Banreservas",
      type: "Cuenta de Ahorro",
      accountNumber: "9607489377",
      holder: "Christopher Lantigua de la Cruz",
      bgColor: "#0076c8",
      logoUrl: "https://acceso.rexi.do/media/2222738/logos-br-rgb_2.png"
    },
    {
      id: "bhd",
      bankName: "Banco BHD",
      type: "Cuenta Móvil (RD$)",
      accountNumber: "39599510017",
      holder: "Christopher Lantigua de la Cruz",
      bgColor: "#159354",
      logoUrl: "https://sb.gob.do/media/lddpcf23/bhd.svg"
    },
    {
      id: "qik-pesos",
      bankName: "Banco Qik",
      type: "Cuenta en Pesos",
      accountNumber: "1000449179",
      holder: "Christopher Lantigua de la Cruz",
      bgColor: "#323b4e",
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzKfAhr6u8-VOrYmy6EMT-gSO4WxUeB5mQsA&s"
    },
    {
      id: "alaver",
      bankName: "ALAVER",
      type: "Cuenta de Ahorro",
      accountNumber: "410040044784",
      formattedNumber: "410040044784",
      holder: "Christopher Lantigua de la Cruz",
      bgColor: "#0066b8",
      logoUrl: "https://alaver.com.do/wp-content/uploads/2025/04/alaver.jpg"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="sub-wrapper">
      <div className="sub-header-section">
        <ShieldCheck size={48} color="#10b981" className="shield-icon" />
        <h1 className="sub-title">Pago de Suscripción Fact-Prest</h1>
        <p className="sub-desc">
          Transfiere el monto de tu licencia a cualquiera de las siguientes cuentas autorizadas para mantener tu sistema activo.
        </p>
      </div>

      <motion.div
        className="cards-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {accounts.map(acc => (
          <motion.div key={acc.id} variants={itemVariants} className="bank-card-wrapper">
            <div className="bank-card">
              <div className="card-accent" style={{ background: acc.bgColor }} />
              <div className="card-top">
                <div className="bank-info">
                  <h3>{acc.bankName}</h3>
                  <span style={{ color: acc.bgColor }}>{acc.type}</span>
                </div>
                <div className="bank-logo-wrap">
                  <img
                    src={acc.logoUrl}
                    alt={acc.bankName}
                    className="bank-logo-img"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </div>

              <div className="card-divider" />

              <div className="card-middle">
                <div>
                  <label>Número de Cuenta</label>
                  <p className="acc-number">{acc.formattedNumber || acc.accountNumber}</p>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(acc.accountNumber, acc.id)}
                  title="Copiar número"
                >
                  {copiedAccount === acc.id ? <CheckCircle2 size={18} color="#16a34a" /> : <Copy size={18} />}
                </button>
              </div>

              <div className="card-bottom">
                <label>Beneficiario</label>
                <p>{acc.holder}</p>
              </div>
            </div>

            {copiedAccount === acc.id && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="copy-toast">
                ¡Copiado!
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .sub-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 0 4rem 0;
          animation: fadeIn 0.4s ease-out;
        }

        .sub-header-section {
          text-align: center;
          margin-bottom: 3.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .shield-icon {
          filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.4));
        }

        .sub-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .sub-desc {
          font-size: 1.05rem;
          color: var(--text-muted);
          max-width: 600px;
          line-height: 1.5;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .bank-card-wrapper {
          position: relative;
        }

        .bank-card {
          background: var(--bg-card);
          border-radius: 16px;
          padding: 1.75rem;
          color: var(--text-main);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 3px var(--shadow-soft);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          border: 1px solid rgba(var(--edge-rgb), 0.08);
        }

        .bank-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px var(--shadow-soft);
          border-color: rgba(var(--edge-rgb), 0.16);
        }

        .card-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          z-index: 1;
        }

        .bank-logo-wrap {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid rgba(var(--edge-rgb), 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .bank-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 7px;
        }

        .bank-info h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.01em;
        }

        .bank-info span {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .card-divider {
          height: 1px;
          background: rgba(var(--edge-rgb), 0.07);
        }

        .card-middle {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          position: relative;
          z-index: 1;
        }

        .card-middle label, .card-bottom label {
          display: block;
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-faint);
          margin-bottom: 0.35rem;
        }

        .acc-number {
          font-size: 1.35rem;
          font-family: 'SF Mono', 'Roboto Mono', 'Courier New', monospace;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: var(--text-main);
          margin: 0;
        }

        .copy-btn {
          background: rgba(var(--edge-rgb), 0.05);
          border: 1px solid rgba(var(--edge-rgb), 0.1);
          color: var(--text-muted);
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.1s;
          flex-shrink: 0;
        }

        .copy-btn:hover {
          background: rgba(var(--edge-rgb), 0.09);
          border-color: rgba(var(--edge-rgb), 0.18);
          color: var(--text-main);
        }

        .copy-btn:active {
          transform: scale(0.95);
        }

        .card-bottom {
          position: relative;
          z-index: 1;
        }

        .card-bottom p {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.01em;
        }

        .copy-toast {
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: #4ade80;
          color: #064e3b;
          font-weight: 700;
          padding: 0.4rem 1rem;
          border-radius: 99px;
          font-size: 0.85rem;
          box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
          z-index: 10;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .sub-title { font-size: 1.75rem; }
          .sub-desc { font-size: 0.95rem; padding: 0 1rem; }
          .cards-grid { grid-template-columns: 1fr; padding: 0 1rem; }
        }
      `}} />
    </div>
  );
}
