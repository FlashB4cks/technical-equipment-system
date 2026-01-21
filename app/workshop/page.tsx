'use client'

import { useState, useEffect } from 'react';
import { Wrench, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';

export default function WorkshopPage() {
    const [equipment, setEquipment] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [selectedEq, setSelectedEq] = useState<any>(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [resolution, setResolution] = useState('');
    const [techId, setTechId] = useState('');

    useEffect(() => {
        fetchEquipment();
        fetch('/api/technicians').then(res => res.json()).then(setTechnicians);
    }, []);

    const fetchEquipment = async () => {
        const res = await fetch('/api/equipment');
        const data = await res.json();
        // Exclude Delivered, Ready, Completed
        setEquipment(data.filter((e: any) =>
            e.status !== 'Delivered' &&
            e.status !== 'Ready' &&
            e.status !== 'Completed'
        ));
    };

    const handleMaintenance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEq) return;

        const isFinishing = selectedEq.status === 'Maintenance' || selectedEq.status === 'Diagnosing';
        const newStatus = isFinishing ? 'Completed' : 'Maintenance';

        await fetch('/api/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                diagnosis: isFinishing ? 'Cierre de Mantenimiento' : diagnosis,
                resolution: isFinishing ? resolution : null,
                equipmentId: selectedEq.id,
                technicianId: techId || null,
                status: newStatus
            })
        });

        toast.success(isFinishing ? 'Mantenimiento finalizado' : 'Diagnóstico guardado');
        setDiagnosis('');
        setResolution('');
        setSelectedEq(null);
        fetchEquipment();
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Wrench className="text-orange-400" />
                Taller y Diagnóstico
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Waiting List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-300">Equipos en Espera / Mantenimiento</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {equipment.map(item => (
                            <div key={item.id} className="glass p-4 rounded-lg flex justify-between items-center group hover:bg-white/5 transition-colors">
                                <div>
                                    <h3 className="font-bold text-white">{item.type} - {item.model}</h3>
                                    <p className="text-sm text-gray-400">No. Serie: {item.serialNumber}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StatusBadge status={item.status} />
                                        {item.reportedFailure && (
                                            <span className="text-xs text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded">
                                                <AlertTriangle size={10} />
                                                Falla Reportada
                                            </span>
                                        )}
                                    </div>

                                </div>
                                <button
                                    onClick={() => setSelectedEq(item)}
                                    className={`text-sm px-3 py-1 rounded transition-colors ${item.status === 'Maintenance' ? 'bg-green-600 hover:bg-green-700 text-white' : 'btn-primary'
                                        }`}
                                >
                                    {item.status === 'Maintenance' ? 'Finalizar' : 'Diagnosticar'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Diagnosis Form */}
                <div className="lg:col-span-1">
                    <div className="glass-card sticky top-4">
                        <h2 className="text-lg font-bold mb-4 text-orange-400">
                            {selectedEq ?
                                (selectedEq.status === 'Maintenance' ? `Finalizar: ${selectedEq.model}` : `Diagnosticar: ${selectedEq.model}`)
                                : 'Selecciona un equipo'}
                        </h2>

                        {selectedEq && (
                            <div className="space-y-4">
                                {selectedEq.reportedFailure && (
                                    <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                        <p className="text-xs text-red-400 font-bold mb-1 flex items-center gap-1">
                                            <FileText size={12} />
                                            Falla Reportada por Usuario:
                                        </p>
                                        <p className="text-sm text-gray-300 italic">"{selectedEq.reportedFailure}"</p>
                                    </div>
                                )}

                                <form onSubmit={handleMaintenance} className="space-y-4">
                                    {selectedEq.status !== 'Maintenance' && (
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Diagnóstico Inicial / Falla Encontrada</label>
                                            <textarea
                                                className="input-field min-h-[100px]"
                                                required
                                                value={diagnosis}
                                                onChange={e => setDiagnosis(e.target.value)}
                                                placeholder="Describe el problema técnico encontrado..."
                                            />
                                        </div>
                                    )}

                                    {selectedEq.status === 'Maintenance' && (
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Veredicto Final / Solución</label>
                                            <textarea
                                                className="input-field min-h-[100px]"
                                                required
                                                value={resolution}
                                                onChange={e => setResolution(e.target.value)}
                                                placeholder="Describe qué se reparó, qué piezas se cambiaron o el resultado final..."
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Técnico Responsable</label>
                                        <select
                                            className="input-field text-white/90"
                                            value={techId}
                                            onChange={e => setTechId(e.target.value)}
                                        >
                                            <option value="" className="text-black">Seleccionar...</option>
                                            {technicians.map(t => (
                                                <option key={t.id} value={t.id} className="text-black">{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button type="submit" className={`w-full py-2 rounded-lg font-bold transition-all ${selectedEq.status === 'Maintenance'
                                        ? 'bg-green-600 hover:bg-green-500 text-white'
                                        : 'btn-primary'
                                        }`}>
                                        {selectedEq.status === 'Maintenance' ? 'Completar y Marcar Listo' : 'Iniciar Mantenimiento'}
                                    </button>
                                </form>
                            </div>
                        )}
                        {!selectedEq && <p className="text-gray-500 text-sm">Haz clic en una acción de la lista para comenzar.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
