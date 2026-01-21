'use client'

import { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';

export default function AreasPage() {
    const [areas, setAreas] = useState<any[]>([]);
    const [newArea, setNewArea] = useState('');

    useEffect(() => {
        fetchAreas();
    }, []);

    const fetchAreas = async () => {
        const res = await fetch('/api/areas');
        const data = await res.json();
        setAreas(data);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newArea) return;

        await fetch('/api/areas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newArea }),
        });
        setNewArea('');
        fetchAreas();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white">Gestión de Áreas</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form */}
                <div className="glass-card h-fit md:col-span-1">
                    <h2 className="text-lg font-bold mb-4 text-blue-400">Nueva Área</h2>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Nombre del área"
                            className="input-field"
                            value={newArea}
                            onChange={e => setNewArea(e.target.value)}
                        />
                        <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2">
                            <Plus size={18} />
                            <span>Agregar</span>
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="md:col-span-2 grid grid-cols-1 gap-4">
                    {areas.map((area) => (
                        <div key={area.id} className="glass p-4 rounded-lg flex justify-between items-center group hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{area.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {area._count?.equipment} Equipos • {area._count?.technicians} Técnicos
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {areas.length === 0 && <p className="text-gray-400 text-center">No hay áreas registradas.</p>}
                </div>
            </div>
        </div>
    );
}
