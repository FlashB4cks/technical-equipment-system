'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function NewEquipmentPage() {
    const router = useRouter();
    const [areas, setAreas] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        type: '',
        model: '',
        serialNumber: '',
        reportedFailure: '',
        areaId: '',
        technicianId: ''
    });

    useEffect(() => {
        fetch('/api/areas').then(res => res.json()).then(setAreas);
        fetch('/api/technicians').then(res => res.json()).then(setTechnicians);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/equipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            toast.success('Equipo registrado exitosamente');
            // Redirigir al inventario, no editar
            router.push('/');
        } else {
            toast.error('Error al guardar el equipo');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                <span>Volver al Inventario</span>
            </Link>

            <div className="glass-card">
                <h1 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Registrar Nuevo Equipo</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Tipo de Equipo</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej. Laptop, Impresora..."
                                className="input-field"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Modelo</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej. Dell Latitude 5420"
                                className="input-field"
                                value={formData.model}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Número de Serie</label>
                        <input
                            type="text"
                            required
                            placeholder="SN-123456789"
                            className="input-field"
                            value={formData.serialNumber}
                            onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Falla Reportada (Inicial)</label>
                        <textarea
                            placeholder="Describe la falla que reporta el usuario..."
                            className="input-field min-h-[80px]"
                            value={formData.reportedFailure}
                            onChange={e => setFormData({ ...formData, reportedFailure: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Área Asignada (Opcional)</label>
                            <select
                                className="input-field appearance-none"
                                value={formData.areaId}
                                onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                            >
                                <option value="" className="text-black">Sin Asignar (En Espera)</option>
                                {areas.map(area => (
                                    <option key={area.id} value={area.id} className="text-black">{area.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Técnico Responsable (Opcional)</label>
                            <select
                                className="input-field appearance-none"
                                value={formData.technicianId}
                                onChange={e => setFormData({ ...formData, technicianId: e.target.value })}
                            >
                                <option value="" className="text-black">Sin Asignar</option>
                                {technicians.map(tech => (
                                    <option key={tech.id} value={tech.id} className="text-black">{tech.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2">
                            <Save size={20} />
                            <span>Guardar Equipo</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
