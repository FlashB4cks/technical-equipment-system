'use client'

import { useState, useEffect } from 'react';
import { Plus, Trash2, Building, Pencil } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function GerenciasPage() {
    const { data: session } = useSession();
    const [gerencias, setGerencias] = useState<any[]>([]);
    const [newGerencia, setNewGerencia] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    // @ts-ignore
    const isAdmin = session?.user?.role === 'ADMIN';

    useEffect(() => {
        fetchGerencias();
    }, []);

    const fetchGerencias = async () => {
        const res = await fetch('/api/gerencias');
        const data = await res.json();
        setGerencias(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGerencia) return;

        // Since we only implemented POST/GET for Gerencias in this sprint (simplified plan), 
        // we'll focus on Creation first. If Update/Delete are needed, we'd need to add them to the API.
        // For now, let's assume Basic Creation is the goal as per plan.

        try {
            const res = await fetch('/api/gerencias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newGerencia }),
            });

            if (res.ok) {
                toast.success('Gerencia creada');
                setNewGerencia('');
                fetchGerencias();
            } else {
                toast.error('Error al crear');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white">Gestión de Gerencias</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form - Only for Admin */}
                {isAdmin && (
                    <div className="glass-card h-fit md:col-span-1">
                        <h2 className="text-lg font-bold mb-4 text-purple-400">
                            Nueva Gerencia
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nombre de la gerencia"
                                className="input-field"
                                value={newGerencia}
                                onChange={e => setNewGerencia(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2">
                                    <Plus size={18} />
                                    <span>Agregar</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List */}
                <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'md:col-span-2' : 'md:col-span-3'}`}>
                    {gerencias.map((gerencia) => (
                        <div key={gerencia.id} className="glass p-4 rounded-lg flex justify-between items-center group hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <Building size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{gerencia.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {gerencia.areas?.length || 0} Áreas
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {gerencias.length === 0 && <p className="text-gray-400 text-center">No hay gerencias registradas.</p>}
                </div>
            </div>
        </div>
    );
}
