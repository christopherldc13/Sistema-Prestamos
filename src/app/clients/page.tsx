"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Search, Phone, Mail, MapPin, MoreVertical, CreditCard, ChevronRight, X, UserCircle, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Client {
    id: string;
    fullName: string;
    idNumber: string;
    phone: string;
    email?: string;
    address: string;
    loans?: any[];
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentClientId, setCurrentClientId] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [newClient, setNewClient] = useState({
        fullName: "",
        idNumber: "",
        phone: "",
        address: "",
        email: "",
    });

    const fetchClients = async () => {
        try {
            const res = await fetch("/api/clients");
            const data = await res.json();
            if (Array.isArray(data)) {
                setClients(data);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleOpenCreateModal = () => {
        setIsEditMode(false);
        setNewClient({ fullName: "", idNumber: "", phone: "", address: "", email: "" });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (client: Client) => {
        setIsEditMode(true);
        setCurrentClientId(client.id);
        setNewClient({
            fullName: client.fullName,
            idNumber: client.idNumber,
            phone: client.phone,
            address: client.address,
            email: client.email || "",
        });
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEditMode ? `/api/clients/${currentClientId}` : "/api/clients";
        const method = isEditMode ? "PATCH" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newClient),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setNewClient({ fullName: "", idNumber: "", phone: "", address: "", email: "" });
                fetchClients();
            } else {
                const error = await res.json();
                alert(error.error || "Error al procesar solicitud");
            }
        } catch (error) {
            alert("Error de conexión");
        }
    };

    const handleDeleteClient = async (id: string, fullName: string) => {
        if (!confirm(`¿Estás seguro de eliminar a ${fullName}?`)) return;

        try {
            const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchClients();
            } else {
                const error = await res.json();
                alert(error.error || "No se pudo eliminar el cliente");
            }
        } catch (error) {
            alert("Error de conexión");
        }
        setActiveMenu(null);
    };

    const filteredClients = clients.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.idNumber.includes(searchTerm)
    );

    return (
        <div className="clients-wrapper" onClick={() => setActiveMenu(null)}>
            <header className="clients-header">
                <div className="header-text">
                    <h1 className="title-pro">Gestión de Clientes</h1>
                    <p className="subtitle-pro">Central de administración de prestatarios</p>
                </div>
                <button className="btn-add-client" onClick={(e) => { e.stopPropagation(); handleOpenCreateModal(); }}>
                    <UserPlus size={18} />
                    <span>Nuevo Registro</span>
                </button>
            </header>

            <div className="search-filter-section">
                <div className="search-box-pro glass-card">
                    <Search size={18} className="search-icon-dim" />
                    <input
                        type="text"
                        placeholder="Filtrar por nombre o identificación..."
                        className="search-input-pro"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm("")}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="clients-grid-adaptive">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="state-msg">
                            <div className="spinner-mini"></div>
                            <span>Cargando base de datos...</span>
                        </div>
                    ) : filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                            <motion.div
                                key={client.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="glass-card client-card-pro"
                            >
                                <div className="card-top">
                                    <div className="avatar-placeholder">
                                        <UserCircle size={28} />
                                    </div>
                                    <div className="name-box">
                                        <h3>{client.fullName}</h3>
                                        <span className="id-badge">ID: {client.idNumber}</span>
                                    </div>

                                    <div className="menu-container">
                                        <button
                                            className="more-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenu(activeMenu === client.id ? null : client.id);
                                            }}
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        <AnimatePresence>
                                            {activeMenu === client.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    className="dropdown-menu glass-card"
                                                >
                                                    <button className="menu-item" onClick={(e) => { e.stopPropagation(); handleOpenEditModal(client); }}>
                                                        <Edit size={14} /> Editar Perfil
                                                    </button>
                                                    <button className="menu-item delete" onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id, client.fullName); }}>
                                                        <Trash2 size={14} /> Eliminar
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="card-mid">
                                    <div className="info-row">
                                        <Phone size={14} />
                                        <span>{client.phone}</span>
                                    </div>
                                    {client.email && (
                                        <div className="info-row">
                                            <Mail size={14} />
                                            <span>{client.email}</span>
                                        </div>
                                    )}
                                    <div className="info-row">
                                        <MapPin size={14} />
                                        <span className="address-text">{client.address}</span>
                                    </div>
                                </div>

                                <footer className="card-bottom">
                                    <div className="loan-stats">
                                        <CreditCard size={14} />
                                        <span>{client.loans?.length || 0} Préstamos</span>
                                    </div>
                                    <Link href={`/clients/${client.id}`} className="view-link" onClick={(e) => e.stopPropagation()}>
                                        Detalles <ChevronRight size={14} />
                                    </Link>
                                </footer>
                            </motion.div>
                        ))
                    ) : (
                        <div className="state-msg">
                            <p>No se encontraron registros que coincidan.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card modal-sheet"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>{isEditMode ? "Editar Cliente" : "Nuevo Cliente"}</h2>
                                <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-row-pro">
                                    <div className="field-group">
                                        <label>Nombre Completo</label>
                                        <input
                                            className="input-field"
                                            placeholder="Ej: Juan Pérez"
                                            required
                                            value={newClient.fullName}
                                            onChange={e => setNewClient({ ...newClient, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label>Cédula o ID</label>
                                        <input
                                            className="input-field"
                                            placeholder="001-0000000-0"
                                            required
                                            value={newClient.idNumber}
                                            onChange={e => setNewClient({ ...newClient, idNumber: e.target.value })}
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
                                            value={newClient.phone}
                                            onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label>Email (Opcional)</label>
                                        <input
                                            className="input-field"
                                            placeholder="usuario@servidor.com"
                                            type="email"
                                            value={newClient.email}
                                            onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="field-group full-width">
                                    <label>Dirección Física</label>
                                    <textarea
                                        className="input-field area-fix"
                                        placeholder="Calle, sector, ciudad..."
                                        required
                                        value={newClient.address}
                                        onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="modal-footer-btn">
                                    <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                    <button type="submit" className="btn-save-pro">
                                        {isEditMode ? "Guardar Cambios" : "Registrar Cliente"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
        .clients-wrapper { width: 100%; max-width: 1400px; margin: 0 auto; padding-bottom: 2rem; position: relative; }
        .clients-header { 
          display: flex; justify-content: space-between; align-items: flex-end; 
          margin-bottom: 2.5rem; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1.5rem;
        }
        .title-pro { font-size: 2.25rem; font-weight: 800; color: white; letter-spacing: -0.02em; }
        .subtitle-pro { color: #64748b; font-size: 0.95rem; margin-top: 0.25rem; }
        
        .btn-add-client {
          background: var(--primary); color: white; border: none; 
          padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700; 
          display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s;
        }
        .btn-add-client:hover { background: var(--primary-hover); transform: translateY(-2px); }

        .search-filter-section { margin-bottom: 2rem; }
        .search-box-pro { 
          display: flex; align-items: center; padding: 0.5rem 1.25rem; 
          background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border);
        }
        .search-icon-dim { color: #475569; margin-right: 1rem; }
        .search-input-pro { background: transparent; border: none; color: white; width: 100%; outline: none; font-size: 1rem; padding: 0.75rem 0; }
        .clear-search { background: rgba(255,255,255,0.05); border: none; color: #94a3b8; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .clients-grid-adaptive { 
          display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; 
        }
        .client-card-pro { 
          display: flex; flex-direction: column; padding: 1.5rem; gap: 1.5rem; 
          position: relative; z-index: 10;
        }
        .client-card-pro:hover { border-color: rgba(99, 102, 241, 0.4); }

        .card-top { display: flex; align-items: center; gap: 1rem; position: relative; }
        .avatar-placeholder { width: 48px; height: 48px; border-radius: 14px; background: rgba(99, 102, 241, 0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; opacity: 0.8; }
        .name-box h3 { font-size: 1.15rem; font-weight: 700; color: white; margin-bottom: 0.2rem; }
        .id-badge { font-size: 0.75rem; font-weight: 700; color: #6366f1; background: rgba(99, 102, 241, 0.05); padding: 0.2rem 0.6rem; border-radius: 6px; }
        
        .menu-container { margin-left: auto; position: relative; }
        .more-btn { background: transparent; border: none; color: #475569; cursor: pointer; padding: 4px; }
        .dropdown-menu {
          position: absolute; top: 100%; right: 0; min-width: 160px;
          background: #1e293b; border-color: rgba(255,255,255,0.1);
          z-index: 100; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
        }
        .menu-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.6rem 0.75rem; color: #94a3b8; font-size: 0.85rem;
          font-weight: 600; border: none; background: transparent;
          width: 100%; cursor: pointer; border-radius: 6px; text-align: left;
        }
        .menu-item:hover { background: rgba(255,255,255,0.05); color: white; }
        .menu-item.delete:hover { background: rgba(244, 63, 94, 0.1); color: #f43f5e; }

        .card-mid { display: flex; flex-direction: column; gap: 0.75rem; color: #94a3b8; font-size: 0.9rem; }
        .info-row { display: flex; align-items: center; gap: 0.75rem; }
        .address-text { line-height: 1.4; word-break: break-word; }

        .card-bottom { 
          display: flex; justify-content: space-between; align-items: center; 
          margin-top: auto; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.05); 
        }
        .loan-stats { display: flex; align-items: center; gap: 0.5rem; color: #10b981; font-weight: 700; font-size: 0.85rem; }
        .view-link { 
            display: flex; align-items: center; gap: 0.35rem; color: #6366f1; 
            font-size: 0.85rem; font-weight: 700; cursor: pointer; z-index: 20; position: relative;
        }
        .view-link:hover { text-decoration: underline; }

        .modal-backdrop { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1.5rem; }
        .modal-sheet { width: 100%; max-width: 680px; padding: 2.5rem; background: #0f172a; border-color: rgba(255,255,255,0.1); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .modal-header h2 { font-size: 1.5rem; font-weight: 800; color: white; }
        .close-btn { background: transparent; border: none; color: #64748b; cursor: pointer; }

        .modal-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row-pro { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .field-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .area-fix { min-height: 100px; resize: none; grid-column: span 2; }
        
        .modal-footer-btn { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
        .btn-cancel { background: transparent; border: 1px solid var(--border); color: #94a3b8; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; }
        .btn-save-pro { background: #6366f1; color: white; border: none; padding: 0.75rem 2rem; border-radius: 10px; font-weight: 700; cursor: pointer; }

        .state-msg { grid-column: 1 / -1; text-align: center; padding: 6rem; color: #475569; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .spinner-mini { width: 24px; height: 24px; border: 3px solid rgba(99, 102, 241, 0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .clients-header { flex-direction: column; align-items: flex-start; }
          .title-pro { font-size: 1.75rem; }
          .clients-grid-adaptive { grid-template-columns: 1fr; }
          .form-row-pro { grid-template-columns: 1fr; }
          .modal-sheet { padding: 1.5rem; }
        }
      `}} />
        </div>
    );
}
