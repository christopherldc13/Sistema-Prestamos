"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    User,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    Calendar,
    DollarSign,
    FileText,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function ClientDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({ fullName: "", idNumber: "", phone: "", address: "", email: "" });

    const fetchDetails = async () => {
        try {
            const res = await fetch(`/api/clients/${id}`);
            if (res.ok) {
                const data = await res.json();
                setClient(data);
            }
        } catch (error) {
            console.error("Error fetching client:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleOpenEdit = () => {
        setEditForm({
            fullName: client.fullName || "",
            idNumber: client.idNumber || "",
            phone: client.phone || "",
            address: client.address || "",
            email: client.email || "",
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch(`/api/clients/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            if (res.ok) {
                setIsEditModalOpen(false);
                await fetchDetails();
            } else {
                const error = await res.json();
                alert(error.error || "Error al actualizar el cliente");
            }
        } catch {
            alert("Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader-spinner"></div>
                <span>Obteniendo perfil del cliente...</span>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="error-container">
                <AlertCircle size={48} color="#f43f5e" />
                <h2>Cliente no encontrado</h2>
                <button onClick={() => router.push("/clients")} className="btn-back">
                    Volver al listado
                </button>
            </div>
        );
    }

    return (
        <div className="details-wrapper">
            <header className="details-header">
                <button onClick={() => router.back()} className="btn-icon-back">
                    <ChevronLeft size={20} /> Volver
                </button>
                <div className="header-actions">
                    <button className="btn-edit-pro" onClick={handleOpenEdit}>Editar Perfil</button>
                    <Link href={`/loans/create?clientId=${client.id}`} className="btn-add-loan-pro">
                        <Plus size={18} /> Nuevo Préstamo
                    </Link>
                </div>
            </header>

            <div className="details-grid">
                {/* Profile Card */}
                <aside className="profile-section">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card profile-card-fixed"
                    >
                        <div className="profile-avatar">
                            <User size={40} />
                        </div>
                        <h1 className="profile-name">{client.fullName}</h1>
                        <span className="profile-id">ID: {client.idNumber}</span>

                        <div className="profile-info-list">
                            <div className="info-item">
                                <Phone size={16} />
                                <div>
                                    <label>Teléfono</label>
                                    <p>{client.phone}</p>
                                </div>
                            </div>
                            {client.email && (
                                <div className="info-item">
                                    <Mail size={16} />
                                    <div>
                                        <label>Email</label>
                                        <p>{client.email}</p>
                                    </div>
                                </div>
                            )}
                            <div className="info-item">
                                <MapPin size={16} />
                                <div>
                                    <label>Dirección</label>
                                    <p>{client.address}</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <Calendar size={16} />
                                <div>
                                    <label>Registrado el</label>
                                    <p>{new Date(client.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="client-stats-mini">
                            <div className="mini-stat">
                                <span className="val">{client.loans?.length || 0}</span>
                                <span className="lab">Préstamos</span>
                            </div>
                            <div className="mini-stat">
                                <span className="val" style={{ color: '#10b981' }}>
                                    {client.loans?.filter((l: any) => l.status === 'paid').length || 0}
                                </span>
                                <span className="lab">Saldados</span>
                            </div>
                        </div>
                    </motion.div>
                </aside>

                {/* History Section */}
                <main className="history-section">
                    <h2 className="section-title">Historial de Créditos</h2>

                    <div className="loans-stack">
                        {client.loans && client.loans.length > 0 ? (
                            client.loans.map((loan: any) => (
                                <motion.div
                                    key={loan.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card loan-history-item"
                                >
                                    <div className="loan-item-top">
                                        <div className="loan-id-box">
                                            <CreditCard size={18} />
                                            <span>Préstamo #{loan.id.slice(-6)}</span>
                                        </div>
                                        <div className={`status-badge ${loan.status}`}>
                                            {loan.status === 'active' && <Clock size={12} />}
                                            {loan.status === 'paid' && <CheckCircle2 size={12} />}
                                            {loan.status === 'overdue' && <AlertCircle size={12} />}
                                            {loan.status === 'active' ? 'Activo' : 
                                             loan.status === 'paid' ? 'Pagado' : 
                                             loan.status === 'overdue' ? 'Vencido' : loan.status}
                                        </div>
                                    </div>

                                    <div className="loan-item-details">
                                        <div className="data-col">
                                            <label>Monto Prestado</label>
                                            <p className="val-big">${loan.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="data-col">
                                            <label>Saldo Pendiente</label>
                                            <p className="val-big pending">${loan.remainingBalance.toLocaleString()}</p>
                                        </div>
                                        <div className="data-col">
                                            <label>Interés ({loan.interestRate}%)</label>
                                            <p>{loan.interestType === 'simple' ? 'Simple' : 'Compuesto'}</p>
                                        </div>
                                        <div className="data-col">
                                            <label>Cuotas</label>
                                            <p>{loan.term} {loan.termUnit === 'months' ? 'meses' : loan.termUnit === 'biweekly' ? 'quincenas' : loan.termUnit === 'weeks' ? 'semanas' : 'días'}</p>
                                        </div>
                                    </div>

                                    <div className="loan-item-footer">
                                        <Link href={`/loans/${loan.id}`} className="btn-view-loan">
                                            <FileText size={14} /> Gestionar Crédito
                                        </Link>
                                        <div className="progress-bar-container">
                                            {(() => {
                                                const progress = ((loan.totalToPay - loan.remainingBalance) / loan.totalToPay) * 100;
                                                return (
                                                    <>
                                                        <div className="progress-label">Progreso: {Math.round(progress)}%</div>
                                                        <div className="progress-track">
                                                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="empty-history glass-card">
                                <DollarSign size={32} />
                                <p>Este cliente no tiene créditos registrados aún.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card modal-sheet"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Editar Cliente</h2>
                                <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEdit} className="modal-form">
                                <div className="form-row-pro">
                                    <div className="field-group">
                                        <label>Nombre Completo</label>
                                        <input
                                            className="input-field"
                                            placeholder="Ej: Juan Pérez"
                                            required
                                            value={editForm.fullName}
                                            onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label>Cédula o ID</label>
                                        <input
                                            className="input-field"
                                            placeholder="001-0000000-0"
                                            required
                                            value={editForm.idNumber}
                                            onChange={e => setEditForm({ ...editForm, idNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-row-pro">
                                    <div className="field-group">
                                        <label>Teléfono</label>
                                        <input
                                            className="input-field"
                                            placeholder="809-000-0000"
                                            required
                                            value={editForm.phone}
                                            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label>Email (Opcional)</label>
                                        <input
                                            className="input-field"
                                            placeholder="usuario@servidor.com"
                                            type="email"
                                            value={editForm.email}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="field-group full-width">
                                    <label>Dirección Física</label>
                                    <textarea
                                        className="input-field area-fix"
                                        placeholder="Calle, sector, ciudad..."
                                        required
                                        value={editForm.address}
                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="modal-footer-btn">
                                    <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                                    <button type="submit" className="btn-save-pro" disabled={isSaving}>
                                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .details-wrapper { width: 100%; max-width: 1400px; margin: 0 auto; padding-bottom: 4rem; }
                .details-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .btn-icon-back { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 0.6rem 1rem; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
                .header-actions { display: flex; gap: 1rem; }
                .btn-edit-pro { background: transparent; border: 1px solid var(--border); color: var(--text-main); padding: 0.75rem 1.25rem; border-radius: 10px; font-weight: 600; cursor: pointer; }

                .modal-backdrop { position: fixed; inset: 0; background: var(--modal-backdrop); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
                .modal-sheet { width: 100%; max-width: 680px; max-height: 95vh; overflow-y: auto; padding: 2.5rem; background: var(--bg-page); border-color: rgba(var(--edge-rgb), 0.1); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                .modal-header h2 { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
                .close-btn { background: transparent; border: none; color: var(--text-dim); cursor: pointer; }
                .modal-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-row-pro { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .field-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; }
                .area-fix { min-height: 100px; resize: none; grid-column: span 2; }
                .modal-footer-btn { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
                .btn-cancel { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; display: flex; justify-content: center; }
                .btn-save-pro { background: #6366f1; color: white; border: none; padding: 0.75rem 2rem; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; }
                .btn-save-pro:disabled { opacity: 0.7; cursor: not-allowed; }
                .btn-add-loan-pro { background: var(--primary); color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; text-decoration: none; }

                .details-grid { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; align-items: start; }
                
                .profile-card-fixed { padding: 2.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; }
                .profile-avatar { width: 80px; height: 80px; background: rgba(99, 102, 241, 0.1); color: #6366f1; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
                .profile-name { font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.25rem; }
                .profile-id { font-size: 0.85rem; font-weight: 700; color: #6366f1; background: rgba(99, 102, 241, 0.05); padding: 0.25rem 0.75rem; border-radius: 6px; margin-bottom: 2rem; }
                
                .profile-info-list { width: 100%; display: flex; flex-direction: column; gap: 1.25rem; text-align: left; }
                .info-item { display: flex; align-items: flex-start; gap: 1rem; color: var(--text-muted); }
                .info-item svg { flex-shrink: 0; margin-top: 0.15rem; }
                .info-item > div { min-width: 0; flex: 1; }
                .info-item label { display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-faint); }
                .info-item p { color: var(--text-main); font-weight: 500; font-size: 0.95rem; word-break: break-all; }

                .client-stats-mini { display: grid; grid-template-columns: 1fr 1fr; width: 100%; gap: 1rem; margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid rgba(var(--edge-rgb), 0.05); }
                .mini-stat { display: flex; flex-direction: column; gap: 0.25rem; }
                .mini-stat .val { font-size: 1.25rem; font-weight: 800; color: var(--text-main); }
                .mini-stat .lab { font-size: 0.75rem; color: var(--text-dim); font-weight: 600; }

                .section-title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.5rem; }
                .loans-stack { display: flex; flex-direction: column; gap: 1.25rem; }
                .loan-history-item { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .loan-item-top { display: flex; justify-content: space-between; align-items: center; }
                .loan-id-box { display: flex; align-items: center; gap: 0.75rem; color: var(--text-main); font-weight: 700; font-size: 1rem; }
                .status-badge { display: flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .status-badge.active { background: rgba(99,102,241,0.1); color: #818cf8; }
                .status-badge.paid { background: rgba(16,185,129,0.1); color: #10b981; }
                .status-badge.overdue { background: rgba(244,63,94,0.1); color: #f43f5e; }

                .loan-item-details { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
                .data-col label { display: block; font-size: 0.7rem; font-weight: 700; color: var(--text-faint); text-transform: uppercase; margin-bottom: 0.5rem; }
                .data-col p { color: var(--text-main); font-weight: 600; }
                .val-big { font-size: 1.25rem; font-weight: 800 !important; }
                .val-big.pending { color: #f59e0b; }

                .loan-item-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1rem; border-top: 1px solid rgba(var(--edge-rgb), 0.05); }
                .btn-view-loan { display: flex; align-items: center; gap: 0.5rem; color: #6366f1; font-weight: 700; font-size: 0.85rem; text-decoration: none; }
                .progress-bar-container { width: 220px; }
                .progress-label { font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.5rem; text-align: right; }
                .progress-track { width: 100%; height: 6px; background: rgba(var(--edge-rgb), 0.05); border-radius: 10px; overflow: hidden; }
                .progress-fill { height: 100%; background: #10b981; border-radius: 10px; }

                .empty-history { padding: 4rem; text-align: center; color: var(--text-faint); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                
                .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; gap: 1rem; color: var(--text-muted); }
                .loader-spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 1024px) {
                  .details-grid { grid-template-columns: 1fr; }
                  .profile-section { position: relative; }
                  .loan-item-details { grid-template-columns: 1fr 1fr; gap: 1rem; }
                }
                @media (max-width: 640px) {
                  .details-header { flex-direction: column; align-items: stretch; gap: 0.75rem; margin-bottom: 1.5rem; }
                  .btn-icon-back { align-self: flex-start; }
                  .header-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; width: 100%; }
                  .btn-edit-pro, .btn-add-loan-pro { width: 100%; justify-content: center; padding: 0.75rem 0.5rem; font-size: 0.85rem; white-space: nowrap; }
                }
                @media (max-width: 480px) {
                   .loan-item-footer { flex-direction: column; align-items: flex-start; gap: 1rem; }
                   .progress-bar-container { width: 100%; }
                   .form-row-pro { grid-template-columns: 1fr; gap: 1rem; }
                   .area-fix { grid-column: span 1; }
                   .modal-sheet { padding: 1.5rem; margin-top: 1rem; }
                   .modal-footer-btn { flex-direction: column; gap: 0.75rem; }
                   .modal-footer-btn button { width: 100%; }
                }
            `}} />
        </div>
    );
}
