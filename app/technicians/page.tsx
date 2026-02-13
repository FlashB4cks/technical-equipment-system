'use client'

import { useState, useEffect } from 'react';
import { Plus, Users, User, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function TechniciansPage() {
    const { data: session } = useSession();
    const [technicians, setTechnicians] = useState<any[]>([]);
    // Areas fetch removed
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [editingId, setEditingId] = useState<number | null>(null);

    // @ts-ignore
    const isAdmin = session?.user?.role === 'ADMIN';

    useEffect(() => {
        fetchTechnicians();
        // Area fetch removed
    }, []);

    const fetchTechnicians = async () => {
        const res = await fetch('/api/technicians');
        const data = await res.json();
        setTechnicians(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) return;

        // Validation for new user
        if (!editingId && (!form.email || !form.password)) {
            toast.error('Email y contraseña son requeridos para nuevos técnicos');
            return;
        }

        if (editingId) {
            const res = await fetch('/api/technicians', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: form.name, id: editingId }),
            });
            if (res.ok) {
                toast.success('Técnico actualizado');
            } else {
                toast.error('Error (No autorizado)');
            }
        } else {
            const res = await fetch('/api/technicians', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast.success('Técnico y Usuario creados');
            } else {
                toast.error('Error (Email duplicado o no autorizado)');
            }
        }

        setForm({ name: '', email: '', password: '' });
        setEditingId(null);
        fetchTechnicians();
    };

    const handleEdit = (tech: any) => {
        setForm({ name: tech.name, email: '', password: '' });
        setEditingId(tech.id);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este técnico?')) return;

        try {
            const res = await fetch('/api/technicians', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                toast.success('Técnico eliminado');
                fetchTechnicians();
            } else {
                toast.error('Error al eliminar (No autorizado)');
            }
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white">Gestión de Técnicos</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form - Admin Only */}
                {isAdmin && (
                    <div className="glass-card h-fit md:col-span-1">
                        <h2 className="text-lg font-bold mb-4 text-purple-400">
                            {editingId ? 'Editar Técnico' : 'Nuevo Técnico'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                className="input-field"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />

                            {!editingId && (
                                <>
                                    <input
                                        type="email"
                                        placeholder="Correo electrónico"
                                        className="input-field"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Contraseña por defecto"
                                        className="input-field"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        required
                                    />
                                </>
                            )}

                            <div className="flex gap-2">
                                <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2">
                                    <Plus size={18} />
                                    <span>{editingId ? 'Guardar' : 'Crear'}</span>
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => { setEditingId(null); setForm({ name: '', email: '', password: '' }); }}
                                        className="glass p-2 rounded-lg text-gray-400 hover:text-white"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* List */}
                <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'md:col-span-2' : 'md:col-span-3'}`}>
                    {technicians.map((tech) => (
                        <div key={tech.id} className="glass p-4 rounded-lg flex justify-between items-center group hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{tech.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {tech._count?.assignedEquipment || 0} Equipos asignados
                                    </p>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(tech)}
                                        className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tech.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {technicians.length === 0 && <p className="text-gray-400 text-center">No hay técnicos registrados.</p>}
                </div>
            </div>
        </div>
    );
}
