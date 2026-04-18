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
      gradient: "linear-gradient(135deg, #053b7c, #0d5ea6)",
      logoUrl: "https://popularenlinea.com/_catalogs/masterpage/popularenlinea/shared/images/BPD-logo.png"
    },
    {
      id: "popular-ahorro",
      bankName: "Banco Popular",
      type: "Cuenta de Ahorro",
      accountNumber: "852519743",
      holder: "Christopher Lantigua de la Cruz",
      gradient: "linear-gradient(135deg, #064085, #116cb7)",
      logoUrl: "https://popularenlinea.com/_catalogs/masterpage/popularenlinea/shared/images/BPD-logo.png"
    },
    {
      id: "banreservas",
      bankName: "Banreservas",
      type: "Cuenta de Ahorro",
      accountNumber: "9607489377",
      holder: "Christopher Lantigua de la Cruz",
      gradient: "linear-gradient(135deg, #00519a, #0076c8)",
      logoUrl: "https://acceso.rexi.do/media/2222738/logos-br-rgb_2.png"
    },
    {
      id: "bhd",
      bankName: "Banco BHD",
      type: "Cuenta Móvil (RD$)",
      accountNumber: "39599510017",
      holder: "Christopher Lantigua de la Cruz",
      gradient: "linear-gradient(135deg, #0b6839, #159354)",
      logoUrl: "https://sb.gob.do/media/lddpcf23/bhd.svg"
    },
    {
      id: "qik-pesos",
      bankName: "Banco Qik",
      type: "Cuenta en Pesos",
      accountNumber: "1000449179",
      holder: "Christopher Lantigua de la Cruz",
      gradient: "linear-gradient(135deg, #242b3b, #323b4e)",
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzKfAhr6u8-VOrYmy6EMT-gSO4WxUeB5mQsA&s"
    },
    {
      id: "alaver",
      bankName: "ALAVER",
      type: "Cuenta de Ahorro",
      accountNumber: "410040044784",
      formattedNumber: "410040044784",
      holder: "Lantigua de la Cruz Christopher",
      gradient: "linear-gradient(135deg, #004c8f, #0066b8)",
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
            <div className="bank-card" style={{ background: acc.gradient }}>
              <div className="card-top">
                <div className="bank-info">
                  <h3>{acc.bankName}</h3>
                  <span>{acc.type}</span>
                </div>
                <img
                  src={acc.logoUrl}
                  alt={acc.bankName}
                  className="bank-logo-img"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

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
                  {copiedAccount === acc.id ? <CheckCircle2 size={20} color="#4ade80" /> : <Copy size={20} />}
                </button>
              </div>

              <div className="card-bottom">
                <label>Beneficiario</label>
                <p>{acc.holder}</p>
              </div>

              <div className="card-overlay" />
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
          color: white;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .sub-desc {
          font-size: 1.05rem;
          color: #94a3b8;
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
          border-radius: 20px;
          padding: 1.75rem;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid rgba(255,255,255,0.05); /* Slight border for depth */
        }

        .bank-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .card-overlay {
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%);
          pointer-events: none;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          z-index: 1;
        }

        .bank-logo-img {
          width: 68px;
          height: 68px;
          object-fit: contain;
          border-radius: 14px;
          background: white;
          padding: 8px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .bank-info h3 {
          font-size: 1.35rem;
          font-weight: 800;
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .bank-info span {
          background: rgba(0,0,0,0.25);
          padding: 0.25rem 0.6rem;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-middle {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          position: relative;
          z-index: 1;
          margin-top: 0.5rem;
        }

        .card-middle label, .card-bottom label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.3rem;
        }

        .acc-number {
          font-size: 1.5rem;
          font-family: monospace;
          font-weight: 600;
          letter-spacing: 0.05em;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .copy-btn {
          background: rgba(255,255,255,0.15);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }

        .copy-btn:hover {
          background: rgba(255,255,255,0.25);
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
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
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
