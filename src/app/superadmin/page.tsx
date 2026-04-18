"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, UserPlus, Power, CheckCircle, Ban } from "lucide-react";

export default function SuperadminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });
    const [msg, setMsg] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        if (session && (session.user as any).role !== "superadmin") {
            router.push("/");
        }
        if (session && (session.user as any).role === "superadmin") {
            fetchUsers();
        }
    }, [session, status, router]);

    const fetchUsers = async () => {
        const res = await fetch("/api/superadmin/users");
        if (res.ok) {
            const data = await res.json();
            setUsers(data);
        }
        setLoading(false);
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        await fetch(`/api/superadmin/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !currentStatus })
        });
        fetchUsers();
    };

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/superadmin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        });
        if (res.ok) {
            setMsg("Usuario creado exitosamente");
            setForm({ name: "", email: "", password: "", role: "admin" });
            fetchUsers();
        } else {
            const data = await res.json();
            setMsg(data.error || "Error creando usuario");
        }
        setTimeout(() => setMsg(""), 3000);
    };

    if (loading || status === "loading") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "white" }}>
                <span className="loader-icon" style={{ width: 30, height: 30, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }}></span>
            </div>
        );
    }

    return (
        <div className="superadmin-wrapper">
            <header className="sa-header">
                <div className="sa-title-box">
                    <ShieldCheck size={36} color="#c084fc" />
                    <div>
                        <h1>Panel Maestro</h1>
                        <p>Gestión Global de Franquicias (SaaS)</p>
                    </div>
                </div>
            </header>

            <div className="sa-grid">
                {/* Formulario Crear Instancia */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="sa-card sa-form-card">
                    <div className="sa-card-header">
                        <UserPlus size={20} color="#818cf8"/>
                        <h2>Vender Nueva Licencia</h2>
                    </div>
                    <form onSubmit={createUser} className="sa-form">
                        <div className="sa-form-group">
                            <label>Nombre Comercial / Empresa</label>
                            <input 
                                type="text" 
                                value={form.name} 
                                onChange={e => setForm({...form, name: e.target.value})} 
                                placeholder="Ej: Préstamos Express SRL" 
                                required 
                            />
                        </div>
                        <div className="sa-form-group">
                            <label>Email de Acceso</label>
                            <input 
                                type="email" 
                                value={form.email} 
                                onChange={e => setForm({...form, email: e.target.value})} 
                                placeholder="contacto@empresa.com" 
                                required 
                            />
                        </div>
                        <div className="sa-form-group">
                            <label>Contraseña Maestra</label>
                            <input 
                                type="password" 
                                value={form.password} 
                                onChange={e => setForm({...form, password: e.target.value})} 
                                placeholder="••••••••" 
                                required 
                            />
                        </div>
                        <button type="submit" className="sa-btn-primary">Crear Licencia e Inquilino</button>
                    </form>
                    {msg && <div className="sa-msg">{msg}</div>}
                </motion.div>

                {/* Lista de Inquilinos */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="sa-card sa-table-card">
                    <div className="sa-card-header">
                        <h2>Inquilinos Activos ({users.length})</h2>
                    </div>
                    <div className="sa-table-responsive">
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>Empresa</th>
                                    <th>Email</th>
                                    <th>Sistema Rango</th>
                                    <th style={{ textAlign: "right" }}>Control de Suscripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u: any) => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="sa-cell-main">{u.name || "Sin Nombre"}</div>
                                        </td>
                                        <td className="sa-cell-sub">{u.email}</td>
                                        <td>
                                            <span className={`sa-badge ${u.role === "superadmin" ? "badge-super" : "badge-admin"}`}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            {u.role === "superadmin" ? (
                                                <span className="sa-shield">
                                                    <ShieldCheck size={16} /> Protegido
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => toggleStatus(u.id, u.isActive)}
                                                    className={`sa-btn-toggle ${u.isActive ? "btn-active" : "btn-suspended"}`}
                                                >
                                                    {u.isActive ? (
                                                        <><CheckCircle size={14}/> ACTIVO</>
                                                    ) : (
                                                        <><Ban size={14}/> SUSPENDIDO</>
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .superadmin-wrapper {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding-bottom: 3rem;
                    animation: fadeIn 0.4s ease-out;
                }
                .sa-header {
                    margin-bottom: 2rem;
                }
                .sa-title-box {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .sa-title-box h1 {
                    font-size: 2rem;
                    font-weight: 800;
                    color: white;
                    margin: 0;
                    letter-spacing: -0.02em;
                }
                .sa-title-box p {
                    color: rgba(255,255,255,0.5);
                    font-size: 0.95rem;
                    margin: 0;
                }
                
                .sa-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }
                @media (min-width: 1024px) {
                    .sa-grid { grid-template-columns: 350px 1fr; }
                }

                .sa-card {
                    background: rgba(15, 23, 42, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }

                .sa-card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.25rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    padding-bottom: 1rem;
                }
                .sa-card-header h2 {
                    font-size: 1.15rem;
                    font-weight: 600;
                    color: white;
                    margin: 0;
                }

                .sa-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .sa-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .sa-form-group label {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.6);
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
                .sa-form-group input {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    color: white;
                    font-size: 0.95rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .sa-form-group input:focus {
                    border-color: #818cf8;
                    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15);
                }

                .sa-btn-primary {
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    color: white;
                    border: none;
                    padding: 0.85rem;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: transform 0.1s, box-shadow 0.2s;
                    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
                    margin-top: 0.5rem;
                }
                .sa-btn-primary:active {
                    transform: scale(0.98);
                }
                .sa-msg {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: rgba(34, 197, 94, 0.1);
                    color: #4ade80;
                    font-size: 0.85rem;
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid rgba(34, 197, 94, 0.2);
                }

                .sa-table-responsive {
                    overflow-x: auto;
                }
                .sa-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0 8px;
                }
                .sa-table th {
                    text-align: left;
                    padding: 0 1rem 0.5rem 1rem;
                    color: rgba(255,255,255,0.5);
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                }
                .sa-table td {
                    background: rgba(255,255,255,0.02);
                    padding: 1rem;
                    border-top: 1px solid rgba(255,255,255,0.02);
                    border-bottom: 1px solid rgba(255,255,255,0.02);
                }
                .sa-table tr td:first-child {
                    border-left: 1px solid rgba(255,255,255,0.02);
                    border-top-left-radius: 10px;
                    border-bottom-left-radius: 10px;
                }
                .sa-table tr td:last-child {
                    border-right: 1px solid rgba(255,255,255,0.02);
                    border-top-right-radius: 10px;
                    border-bottom-right-radius: 10px;
                }
                .sa-table tr:hover td {
                    background: rgba(255,255,255,0.04);
                }

                .sa-cell-main {
                    font-weight: 600;
                    color: white;
                    font-size: 0.95rem;
                }
                .sa-cell-sub {
                    color: #94a3b8;
                    font-size: 0.9rem;
                }

                .sa-badge {
                    padding: 0.35rem 0.6rem;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.03em;
                }
                .badge-super {
                    background: rgba(168, 85, 247, 0.15);
                    color: #d8b4fe;
                    border: 1px solid rgba(168, 85, 247, 0.3);
                }
                .badge-admin {
                    background: rgba(59, 130, 246, 0.15);
                    color: #93c5fd;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .sa-shield {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    color: #64748b;
                    font-size: 0.8rem;
                    font-weight: 600;
                    background: rgba(0,0,0,0.3);
                    padding: 0.35rem 0.75rem;
                    border-radius: 20px;
                }

                .sa-btn-toggle {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    border: none;
                    padding: 0.4rem 0.85rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-active {
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ade80;
                    box-shadow: 0 0 10px rgba(34, 197, 94, 0.1);
                }
                .btn-active:hover {
                    background: rgba(34, 197, 94, 0.25);
                }
                .btn-suspended {
                    background: rgba(239, 68, 68, 0.15);
                    color: #fca5a5;
                    box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);
                }
                .btn-suspended:hover {
                    background: rgba(239, 68, 68, 0.25);
                }

                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}}/>
        </div>
    );
}
