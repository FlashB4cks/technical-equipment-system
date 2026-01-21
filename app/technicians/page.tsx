'use client'

import { useState, useEffect } from 'react';
import { Plus, Users, User } from 'lucide-react';

export default function TechniciansPage() {
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [form, setForm] = useState({ name: '', areaId: '' });

    useEffect(() => {
        fetchTechnicians();
        fetch('/api/areas').then(res => res.json()).then(setAreas);
    }, []);

    const fetchTechnicians = async () => {
        const res = await fetch('/api/technicians');
        const data = await res.json();
        setTechnicians(data);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) return;

        await fetch('/api/technicians', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        setForm({ name: '', areaId: '' });
        fetchTechnicians();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white">Gestión de Técnicos</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form */}
                <div className="glass-card h-fit md:col-span-1">
                    <h2 className="text-lg font-bold mb-4 text-purple-400">Nuevo Técnico</h2>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            className="input-field"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />

                        <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2">
                            <Plus size={18} />
                            <span>Agregar</span>
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="md:col-span-2 grid grid-cols-1 gap-4">
                    {technicians.map((tech) => (
                        <div key={tech.id} className="glass p-4 rounded-lg flex justify-between items-center group hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{tech.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {tech.area?.name || 'Sin área'} • {tech._count?.assignedEquipment || 0} Equipos asignados
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {technicians.length === 0 && <p className="text-gray-400 text-center">No hay técnicos registrados.</p>}
                </div>
            </div>
        </div>
    );
}
