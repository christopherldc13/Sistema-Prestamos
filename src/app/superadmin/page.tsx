"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck, UserPlus, CheckCircle, Ban, Users,
    DollarSign, AlertTriangle, KeyRound, X, Calendar, Phone, Search,
    Building2, TrendingUp, Clock, Trash2, Zap
} from "lucide-react";
import { PLANS, getPlan, type PlanId } from "@/lib/plans";

interface UserStats {
    clients: number;
    loans: number;
    activeLoans: number;
    overdueLoans: number;
    portfolio: number;
    pendingBalance: number;
}

interface AdminUser {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    licenseExpiresAt?: string;
    subscriptionPlan?: string;
    createdAt: string;
    stats: UserStats;
}

interface GlobalStats {
    totalAdmins: number;
    activeAdmins: number;
    inactiveAdmins: number;
    totalClients: number;
    totalLoans: number;
    activeLoans: number;
    overdueLoans: number;
    totalPortfolio: number;
    pendingBalance: number;
    expiringCount: number;
    expiredCount: number;
}

type ModalType = "create" | "resetPassword" | "editLicense" | "editPlan" | null;

function getLicenseStatus(expiresAt?: string) {
    if (!expiresAt) return "none";
    const now = new Date();
    const exp = new Date(expiresAt);
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return "expired";
    if (diff <= 30) return "expiring";
    return "active";
}

export default function SuperadminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

    const [modal, setModal] = useState<ModalType>(null);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const [createForm, setCreateForm] = useState({
        name: "", email: "", password: "", phone: "",
        licenseExpiresAt: "", role: "admin"
    });
    const [resetPassword, setResetPassword] = useState("");
    const [newExpiry, setNewExpiry] = useState("");
    const [selectedPlan, setSelectedPlan] = useState<PlanId>("basic");

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        if (session && (session.user as any).role !== "superadmin") router.push("/");
        if (session && (session.user as any).role === "superadmin") {
            fetchAll();
        }
    }, [session, status, router]);

    const fetchAll = async () => {
        setLoading(true);
        const [usersRes, statsRes] = await Promise.all([
            fetch("/api/superadmin/users"),
            fetch("/api/superadmin/stats"),
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (statsRes.ok) setGlobalStats(await statsRes.json());
        setLoading(false);
    };

    const showMsg = (text: string, type: "success" | "error" = "success") => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 3500);
    };

    const toggleStatus = async (u: AdminUser) => {
        await fetch(`/api/superadmin/users/${u.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !u.isActive }),
        });
        showMsg(u.isActive ? `"${u.name}" suspendido` : `"${u.name}" reactivado`);
        fetchAll();
    };

    const deleteUser = async (u: AdminUser) => {
        if (!confirm(`¿Eliminar permanentemente a "${u.name || u.email}"? Esta acción no se puede deshacer.`)) return;
        const res = await fetch(`/api/superadmin/users/${u.id}`, { method: "DELETE" });
        if (res.ok) { showMsg("Usuario eliminado"); fetchAll(); }
        else { const d = await res.json(); showMsg(d.error || "Error eliminando", "error"); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/superadmin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createForm),
        });
        if (res.ok) {
            showMsg("Licencia creada exitosamente");
            setCreateForm({ name: "", email: "", password: "", phone: "", licenseExpiresAt: "", role: "admin" });
            setModal(null);
            fetchAll();
        } else {
            const d = await res.json();
            showMsg(d.error || "Error creando licencia", "error");
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        const res = await fetch(`/api/superadmin/users/${selectedUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword: resetPassword }),
        });
        if (res.ok) {
            showMsg("Contraseña restablecida correctamente");
            setModal(null); setResetPassword("");
        } else {
            showMsg("Error al restablecer contraseña", "error");
        }
    };

    const handleChangePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        const res = await fetch(`/api/superadmin/users/${selectedUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscriptionPlan: selectedPlan }),
        });
        if (res.ok) {
            showMsg(`Plan actualizado a ${getPlan(selectedPlan).name}`);
            setModal(null); fetchAll();
        } else {
            showMsg("Error al actualizar el plan", "error");
        }
    };

    const handleUpdateLicense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        const res = await fetch(`/api/superadmin/users/${selectedUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ licenseExpiresAt: newExpiry || null }),
        });
        const data = await res.json();
        if (res.ok) {
            showMsg("Licencia actualizada");
            setModal(null); fetchAll();
        } else if (res.status === 422) {
            showMsg("Corre 'npx prisma generate && npx prisma db push' para activar licencias", "error");
        } else {
            showMsg(data.error || "Error al actualizar licencia", "error");
        }
    };

    const filtered = users
        .filter(u => filterStatus === "all" ? true : filterStatus === "active" ? u.isActive : !u.isActive)
        .filter(u =>
            (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

    if (loading || status === "loading") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                <div className="sa-spinner" />
            </div>
        );
    }

    return (
        <div className="sa-wrapper">
            {/* Toast */}
            <AnimatePresence>
                {msg && (
                    <motion.div
                        className={`sa-toast ${msg.type === "error" ? "toast-error" : "toast-success"}`}
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    >
                        {msg.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                        {msg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="sa-header">
                <div className="sa-title-box">
                    <ShieldCheck size={34} color="#c084fc" />
                    <div>
                        <h1>Panel Maestro</h1>
                        <p>Control de licencias y franquicias SaaS</p>
                    </div>
                </div>
                <button className="sa-btn-new" onClick={() => setModal("create")}>
                    <UserPlus size={18} /> Nueva Licencia
                </button>
            </header>

            {/* Global KPIs */}
            {globalStats && (
                <div className="sa-kpi-grid">
                    {[
                        { label: "Admins Activos", value: globalStats.activeAdmins, sub: `${globalStats.inactiveAdmins} suspendidos`, icon: <Users size={20} />, color: "#6366f1" },
                        { label: "Clientes Totales", value: globalStats.totalClients, sub: "Todos los inquilinos", icon: <Building2 size={20} />, color: "#10b981" },
                        { label: "Cartera Global", value: `$${globalStats.totalPortfolio.toLocaleString()}`, sub: `$${globalStats.pendingBalance.toLocaleString()} pendiente`, icon: <DollarSign size={20} />, color: "#a855f7" },
                        { label: "Licencias Vencidas", value: globalStats.expiredCount, sub: `${globalStats.expiringCount} por vencer`, icon: <AlertTriangle size={20} />, color: globalStats.expiredCount > 0 ? "#ef4444" : "#64748b" },
                    ].map((k, i) => (
                        <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="sa-kpi-card">
                            <div className="sa-kpi-icon" style={{ background: `${k.color}18`, color: k.color }}>{k.icon}</div>
                            <div className="sa-kpi-body">
                                <span className="sa-kpi-val">{k.value}</span>
                                <span className="sa-kpi-label">{k.label}</span>
                                <span className="sa-kpi-sub">{k.sub}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="sa-filters">
                <div className="sa-search-box">
                    <Search size={16} />
                    <input
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm("")}><X size={14} /></button>}
                </div>
                <div className="sa-filter-tabs">
                    {(["all", "active", "inactive"] as const).map(f => (
                        <button key={f} className={`sa-tab ${filterStatus === f ? "active" : ""}`} onClick={() => setFilterStatus(f)}>
                            {f === "all" ? "Todos" : f === "active" ? "Activos" : "Suspendidos"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="sa-card">
                <div className="sa-card-header">
                    <h2>Inquilinos ({filtered.length})</h2>
                </div>
                <div className="sa-table-scroll">
                    <table className="sa-table">
                        <thead>
                            <tr>
                                <th>Empresa / Admin</th>
                                <th>Contacto</th>
                                <th>Cartera</th>
                                <th>Préstamos</th>
                                <th>Plan</th>
                                <th>Licencia</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => {
                                const licStatus = getLicenseStatus(u.licenseExpiresAt);
                                return (
                                    <tr key={u.id}>
                                        <td data-label="Empresa">
                                            <div className="sa-cell-name">
                                                <div className="sa-avatar" style={{ background: u.role === "superadmin" ? "rgba(168,85,247,0.15)" : "rgba(99,102,241,0.12)" }}>
                                                    {(u.name || u.email)[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="sa-cell-main">{u.name || "Sin nombre"}</div>
                                                    <div className="sa-cell-sub">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Contacto">
                                            <span className="sa-cell-sub">{u.phone || "—"}</span>
                                        </td>
                                        <td data-label="Cartera">
                                            {u.role === "superadmin" ? <span className="sa-cell-sub">—</span> : (
                                                <div>
                                                    <div className="sa-cell-main">${(u.stats?.portfolio || 0).toLocaleString()}</div>
                                                    <div className="sa-cell-sub">{u.stats?.clients || 0} clientes</div>
                                                </div>
                                            )}
                                        </td>
                                        <td data-label="Préstamos">
                                            {u.role === "superadmin" ? <span className="sa-cell-sub">—</span> : (
                                                <div>
                                                    <div className="sa-cell-main">{u.stats?.loans || 0} total</div>
                                                    {(u.stats?.overdueLoans || 0) > 0 && (
                                                        <div className="sa-overdue-tag">{u.stats.overdueLoans} vencidos</div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td data-label="Plan">
                                            {u.role === "superadmin" ? (
                                                <span className="sa-badge badge-super">Maestro</span>
                                            ) : (() => {
                                                const p = getPlan(u.subscriptionPlan ?? "basic");
                                                return (
                                                    <button
                                                        className="sa-plan-btn"
                                                        style={{ borderColor: p.color + "55", color: p.color }}
                                                        onClick={() => { setSelectedUser(u); setSelectedPlan((u.subscriptionPlan ?? "basic") as PlanId); setModal("editPlan"); }}
                                                    >
                                                        <Zap size={11} /> {p.name}
                                                    </button>
                                                );
                                            })()}
                                        </td>
                                        <td data-label="Licencia">
                                            {u.role === "superadmin" ? (
                                                <span className="sa-badge badge-super">Permanente</span>
                                            ) : !u.licenseExpiresAt ? (
                                                <button className="sa-link-btn" onClick={() => { setSelectedUser(u); setNewExpiry(""); setModal("editLicense"); }}>
                                                    <Clock size={12} /> Sin expiración
                                                </button>
                                            ) : (
                                                <button className={`sa-license-btn lic-${licStatus}`} onClick={() => { setSelectedUser(u); setNewExpiry(u.licenseExpiresAt?.split("T")[0] || ""); setModal("editLicense"); }}>
                                                    <Calendar size={12} />
                                                    {new Date(u.licenseExpiresAt).toLocaleDateString("es-MX")}
                                                </button>
                                            )}
                                        </td>
                                        <td data-label="Estado">
                                            {u.role === "superadmin" ? (
                                                <span className="sa-shield"><ShieldCheck size={14} /> Protegido</span>
                                            ) : (
                                                <button onClick={() => toggleStatus(u)} className={`sa-status-btn ${u.isActive ? "btn-active" : "btn-suspended"}`}>
                                                    {u.isActive ? <><CheckCircle size={13} /> ACTIVO</> : <><Ban size={13} /> SUSPENDIDO</>}
                                                </button>
                                            )}
                                        </td>
                                        <td data-label="Acciones">
                                            {u.role !== "superadmin" && (
                                                <div className="sa-actions">
                                                    <button className="sa-action-btn" title="Restablecer contraseña"
                                                        onClick={() => { setSelectedUser(u); setResetPassword(""); setModal("resetPassword"); }}>
                                                        <KeyRound size={15} />
                                                    </button>
                                                    <button className="sa-action-btn delete" title="Eliminar usuario" onClick={() => deleteUser(u)}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} className="sa-empty">No hay resultados que coincidan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* ── Modals ── */}
            <AnimatePresence>
                {modal && (
                    <div className="sa-modal-backdrop" onClick={() => setModal(null)}>
                        <motion.div
                            className="sa-modal glass-card"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* CREATE */}
                            {modal === "create" && (
                                <>
                                    <div className="sa-modal-header">
                                        <div className="sa-modal-title"><UserPlus size={20} color="#818cf8" /> Vender Nueva Licencia</div>
                                        <button className="sa-close-btn" onClick={() => setModal(null)}><X size={20} /></button>
                                    </div>
                                    <form onSubmit={handleCreate} className="sa-form">
                                        <div className="sa-form-row">
                                            <div className="sa-form-group">
                                                <label>Nombre Comercial / Empresa</label>
                                                <input type="text" value={createForm.name}
                                                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                                    placeholder="Préstamos Express SRL" required />
                                            </div>
                                            <div className="sa-form-group">
                                                <label>Teléfono</label>
                                                <input type="text" value={createForm.phone}
                                                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                                                    placeholder="809-000-0000" />
                                            </div>
                                        </div>
                                        <div className="sa-form-row">
                                            <div className="sa-form-group">
                                                <label>Email de Acceso</label>
                                                <input type="email" value={createForm.email}
                                                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                                    placeholder="contacto@empresa.com" required />
                                            </div>
                                            <div className="sa-form-group">
                                                <label>Contraseña Inicial</label>
                                                <input type="password" value={createForm.password}
                                                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                                    placeholder="••••••••" required />
                                            </div>
                                        </div>
                                        <div className="sa-form-group">
                                            <label>Fecha de Expiración de Licencia (opcional)</label>
                                            <input type="date" value={createForm.licenseExpiresAt}
                                                onChange={e => setCreateForm({ ...createForm, licenseExpiresAt: e.target.value })} />
                                        </div>
                                        <button type="submit" className="sa-btn-primary">Crear Licencia e Inquilino</button>
                                    </form>
                                </>
                            )}

                            {/* RESET PASSWORD */}
                            {modal === "resetPassword" && selectedUser && (
                                <>
                                    <div className="sa-modal-header">
                                        <div className="sa-modal-title"><KeyRound size={20} color="#f59e0b" /> Restablecer Contraseña</div>
                                        <button className="sa-close-btn" onClick={() => setModal(null)}><X size={20} /></button>
                                    </div>
                                    <p className="sa-modal-sub">Cambiando contraseña de <strong>{selectedUser.name || selectedUser.email}</strong></p>
                                    <form onSubmit={handleResetPassword} className="sa-form">
                                        <div className="sa-form-group">
                                            <label>Nueva Contraseña</label>
                                            <input type="password" value={resetPassword}
                                                onChange={e => setResetPassword(e.target.value)}
                                                placeholder="Nueva contraseña segura" minLength={6} required />
                                        </div>
                                        <button type="submit" className="sa-btn-warning">Restablecer Contraseña</button>
                                    </form>
                                </>
                            )}

                            {/* EDIT PLAN */}
                            {modal === "editPlan" && selectedUser && (
                                <>
                                    <div className="sa-modal-header">
                                        <div className="sa-modal-title"><Zap size={20} color="#a855f7" /> Cambiar Plan</div>
                                        <button className="sa-close-btn" onClick={() => setModal(null)}><X size={20} /></button>
                                    </div>
                                    <p className="sa-modal-sub">Plan de <strong>{selectedUser.name || selectedUser.email}</strong></p>
                                    <form onSubmit={handleChangePlan} className="sa-form">
                                        <div className="sa-plan-options">
                                            {(["basic", "intermediate", "premium"] as PlanId[]).map(pid => {
                                                const p = PLANS[pid];
                                                return (
                                                    <label key={pid} className={`sa-plan-option ${selectedPlan === pid ? "selected" : ""}`} style={selectedPlan === pid ? { borderColor: p.color, background: p.color + "15" } : {}}>
                                                        <input type="radio" name="plan" value={pid} checked={selectedPlan === pid} onChange={() => setSelectedPlan(pid)} />
                                                        <div className="sa-plan-opt-body">
                                                            <span className="sa-plan-opt-name" style={{ color: selectedPlan === pid ? p.color : undefined }}>{p.name}</span>
                                                            <span className="sa-plan-opt-desc">{p.tagline}</span>
                                                            <span className="sa-plan-opt-price">{p.price}{p.priceNote}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <button type="submit" className="sa-btn-primary">Aplicar Plan</button>
                                    </form>
                                </>
                            )}

                            {/* EDIT LICENSE */}
                            {modal === "editLicense" && selectedUser && (
                                <>
                                    <div className="sa-modal-header">
                                        <div className="sa-modal-title"><Calendar size={20} color="#10b981" /> Gestionar Licencia</div>
                                        <button className="sa-close-btn" onClick={() => setModal(null)}><X size={20} /></button>
                                    </div>
                                    <p className="sa-modal-sub">Licencia de <strong>{selectedUser.name || selectedUser.email}</strong></p>
                                    <form onSubmit={handleUpdateLicense} className="sa-form">
                                        <div className="sa-form-group">
                                            <label>Nueva Fecha de Expiración</label>
                                            <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} />
                                            <span className="sa-form-hint">Dejar vacío para licencia sin expiración</span>
                                        </div>
                                        <button type="submit" className="sa-btn-success">Actualizar Licencia</button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: SA_STYLES }} />
        </div>
    );
}

const SA_STYLES = `
.sa-wrapper { max-width: 1300px; margin: 0 auto; padding-bottom: 4rem; }

/* Toast */
.sa-toast { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1.25rem; border-radius: 12px; font-size: 0.9rem; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
.toast-success { background: rgba(16,185,129,0.15); color: #4ade80; border: 1px solid rgba(16,185,129,0.3); }
.toast-error   { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }

/* Header */
.sa-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.sa-title-box { display: flex; align-items: center; gap: 1rem; }
.sa-title-box h1 { font-size: 1.9rem; font-weight: 800; color: white; margin: 0; }
.sa-title-box p  { color: rgba(255,255,255,0.4); font-size: 0.9rem; margin: 0; }
.sa-btn-new { display: flex; align-items: center; gap: 0.6rem; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(79,70,229,0.3); }
.sa-btn-new:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(79,70,229,0.4); }

/* KPI Grid */
.sa-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2rem; }
.sa-kpi-card { background: rgba(15,23,42,0.5); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; backdrop-filter: blur(20px); transition: transform 0.2s; }
.sa-kpi-card:hover { transform: translateY(-3px); }
.sa-kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sa-kpi-body { display: flex; flex-direction: column; gap: 0.1rem; }
.sa-kpi-val   { font-size: 1.6rem; font-weight: 800; color: white; line-height: 1; }
.sa-kpi-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; }
.sa-kpi-sub   { font-size: 0.75rem; color: #475569; }

/* Filters */
.sa-filters { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.sa-search-box { flex: 1; min-width: 240px; display: flex; align-items: center; gap: 0.75rem; background: rgba(15,23,42,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.65rem 1rem; color: #94a3b8; }
.sa-search-box input { background: transparent; border: none; outline: none; color: white; font-size: 0.9rem; flex: 1; }
.sa-search-box button { background: transparent; border: none; color: #475569; cursor: pointer; }
.sa-filter-tabs { display: flex; gap: 0.5rem; }
.sa-tab { background: transparent; border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; padding: 0.55rem 1rem; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.sa-tab.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #818cf8; }

/* Card */
.sa-card { background: rgba(15,23,42,0.4); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; backdrop-filter: blur(20px); }
.sa-card-header { padding: 1.25rem 1.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
.sa-card-header h2 { font-size: 1rem; font-weight: 700; color: white; margin: 0; }

/* Table */
.sa-table-scroll { overflow-x: auto; }
.sa-table { width: 100%; border-collapse: collapse; min-width: 900px; }
.sa-table th { text-align: left; padding: 0.9rem 1.5rem; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; background: rgba(0,0,0,0.1); }
.sa-table td { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
.sa-table tr:last-child td { border-bottom: none; }
.sa-table tr:hover td { background: rgba(255,255,255,0.02); }

.sa-cell-name { display: flex; align-items: center; gap: 0.75rem; }
.sa-avatar { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; color: white; flex-shrink: 0; }
.sa-cell-main { font-weight: 600; color: white; font-size: 0.9rem; }
.sa-cell-sub  { color: #64748b; font-size: 0.82rem; margin-top: 0.1rem; }
.sa-overdue-tag { font-size: 0.7rem; font-weight: 700; color: #f87171; background: rgba(248,113,113,0.1); padding: 0.15rem 0.45rem; border-radius: 4px; margin-top: 0.2rem; display: inline-block; }
.sa-empty { text-align: center; padding: 4rem; color: #475569; font-size: 0.9rem; font-weight: 600; }

/* Badges */
.sa-badge { padding: 0.3rem 0.7rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.03em; }
.badge-super { background: rgba(168,85,247,0.12); color: #d8b4fe; border: 1px solid rgba(168,85,247,0.25); }
.sa-shield { display: inline-flex; align-items: center; gap: 0.4rem; color: #64748b; font-size: 0.8rem; font-weight: 600; }

/* Status */
.sa-status-btn { display: inline-flex; align-items: center; gap: 0.4rem; border: none; padding: 0.4rem 0.85rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-active    { background: rgba(34,197,94,0.12); color: #4ade80; }
.btn-active:hover { background: rgba(34,197,94,0.22); }
.btn-suspended { background: rgba(239,68,68,0.12); color: #fca5a5; }
.btn-suspended:hover { background: rgba(239,68,68,0.22); }

/* License */
.sa-license-btn, .sa-link-btn { display: inline-flex; align-items: center; gap: 0.35rem; border: none; border-radius: 8px; padding: 0.35rem 0.7rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.sa-link-btn { background: transparent; color: #475569; text-decoration: underline; }
.sa-link-btn:hover { color: white; }
.lic-active   { background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
.lic-expiring { background: rgba(245,158,11,0.1); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
.lic-expired  { background: rgba(239,68,68,0.1);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }

/* Actions */
.sa-actions { display: flex; align-items: center; gap: 0.5rem; }
.sa-action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #94a3b8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.sa-action-btn:hover { background: rgba(99,102,241,0.15); color: #818cf8; border-color: rgba(99,102,241,0.3); }
.sa-action-btn.delete:hover { background: rgba(239,68,68,0.15); color: #fca5a5; border-color: rgba(239,68,68,0.3); }

/* Modal */
.sa-modal-backdrop { position: fixed; inset: 0; background: rgba(2,6,23,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
.sa-modal { width: 100%; max-width: 600px; padding: 2rem; background: rgba(15,23,42,0.95); border-color: rgba(255,255,255,0.1); }
.sa-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.sa-modal-title { display: flex; align-items: center; gap: 0.75rem; font-size: 1.2rem; font-weight: 700; color: white; }
.sa-close-btn { background: transparent; border: none; color: #64748b; cursor: pointer; transition: color 0.2s; }
.sa-close-btn:hover { color: white; }
.sa-modal-sub { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
.sa-modal-sub strong { color: white; }

/* Form */
.sa-form { display: flex; flex-direction: column; gap: 1.25rem; }
.sa-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.sa-form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.sa-form-group label { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.04em; }
.sa-form-group input { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 0.75rem 1rem; border-radius: 10px; color: white; font-size: 0.92rem; outline: none; transition: all 0.2s; }
.sa-form-group input:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,0.12); }
.sa-form-hint { font-size: 0.75rem; color: #475569; }
.sa-btn-primary { background: linear-gradient(135deg,#4f46e5,#7c3aed); color: white; border: none; padding: 0.9rem; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 0.5rem; transition: all 0.2s; }
.sa-btn-primary:hover { transform: translateY(-1px); }
.sa-btn-warning { background: linear-gradient(135deg,#d97706,#b45309); color: white; border: none; padding: 0.9rem; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 0.5rem; }
.sa-btn-success { background: linear-gradient(135deg,#059669,#047857); color: white; border: none; padding: 0.9rem; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 0.5rem; }

/* Plan button in table */
.sa-plan-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(255,255,255,0.04); border: 1px solid; padding: 0.3rem 0.7rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s; text-transform: uppercase; letter-spacing: 0.04em; }
.sa-plan-btn:hover { opacity: 0.75; }

/* Plan options in modal */
.sa-plan-options { display: flex; flex-direction: column; gap: 0.75rem; }
.sa-plan-option { display: flex; align-items: center; gap: 1rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem 1.25rem; cursor: pointer; transition: all 0.2s; background: rgba(0,0,0,0.2); }
.sa-plan-option input[type="radio"] { accent-color: #a855f7; width: 16px; height: 16px; flex-shrink: 0; }
.sa-plan-opt-body { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; }
.sa-plan-opt-name { font-weight: 700; font-size: 0.95rem; color: white; }
.sa-plan-opt-desc { font-size: 0.78rem; color: #64748b; }
.sa-plan-opt-price { font-size: 0.82rem; font-weight: 600; color: #94a3b8; margin-top: 0.25rem; }

.sa-spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1100px) { .sa-kpi-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) {
    .sa-title-box h1 { font-size: 1.4rem; }
    .sa-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .sa-btn-new { width: 100%; justify-content: center; }
    .sa-kpi-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .sa-filters { flex-direction: column; align-items: stretch; }
    .sa-search-box { min-width: 0; }
    .sa-form-row { grid-template-columns: 1fr; }
    .sa-table th, .sa-table td { padding: 0.75rem 1rem; }
}
@media (max-width: 480px) { .sa-kpi-grid { grid-template-columns: 1fr; } }
`;
