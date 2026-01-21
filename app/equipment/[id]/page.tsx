'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2, ArrowLeft, History, PenTool, AlertTriangle, FileText, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function EquipmentDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<any>(null);
    const [areas, setAreas] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);

    useEffect(() => {
        Promise.all([
            fetch(`/api/equipment/${params.id}`).then(res => res.json()),
            fetch('/api/areas').then(res => res.json()),
            fetch('/api/technicians').then(res => res.json())
        ]).then(([eqData, areasData, techsData]) => {
            if (eqData.error) {
                toast.error('Equipo no encontrado');
                router.push('/');
                return;
            }
            setData(eqData);
            setAreas(areasData);
            setTechnicians(techsData);
            setLoading(false);
        });
    }, [params.id, router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/equipment/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: data.type,
                    model: data.model,
                    serialNumber: data.serialNumber,
                    status: data.status,
                    reportedFailure: data.reportedFailure,
                    areaId: data.areaId,
                    technicianId: data.technicianId
                })
            });

            if (res.ok) {
                toast.success('Equipo actualizado correctamente');
                router.refresh(); // Refresh server components if any
            } else {
                toast.error('Error al actualizar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar este equipo y todo su historial? Esta acción no se puede deshacer.')) return;

        try {
            const res = await fetch(`/api/equipment/${params.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Equipo eliminado');
                router.push('/');
            } else {
                toast.error('Error al eliminar');
            }
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    if (loading) return <div className="text-center text-gray-400 py-10">Cargando detalles...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span>Volver</span>
                </Link>
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                    <Trash2 size={18} />
                    <span>Eliminar Equipo</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Edit Form */}
                <div className="lg:col-span-2 glass-card">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                        <PenTool className="text-blue-400" />
                        <h1 className="text-2xl font-bold text-white">Editar Información</h1>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                                <input className="input-field"
                                    value={data.type} onChange={e => setData({ ...data, type: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Modelo</label>
                                <input className="input-field"
                                    value={data.model} onChange={e => setData({ ...data, model: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Serial</label>
                                <input className="input-field"
                                    value={data.serialNumber} onChange={e => setData({ ...data, serialNumber: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Estado Actual</label>
                                <select className="input-field appearance-none"
                                    value={data.status} onChange={e => setData({ ...data, status: e.target.value })}>
                                    <option value="Pending" className="text-black">En Espera</option>
                                    <option value="Diagnosing" className="text-black">Diagnosticando</option>
                                    <option value="Maintenance" className="text-black">Mantenimiento</option>
                                    <option value="Ready" className="text-black">Listo / Completado</option>
                                    <option value="Delivered" className="text-black">Entregado</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Falla Reportada (Original)</label>
                            <textarea className="input-field min-h-[80px]"
                                value={data.reportedFailure || ''} onChange={e => setData({ ...data, reportedFailure: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Área</label>
                                <select className="input-field appearance-none"
                                    value={data.areaId || ''} onChange={e => setData({ ...data, areaId: e.target.value })}>
                                    <option value="" className="text-black">Sin Asignar</option>
                                    {areas.map(a => <option key={a.id} value={a.id} className="text-black">{a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Técnico</label>
                                <select className="input-field appearance-none"
                                    value={data.technicianId || ''} onChange={e => setData({ ...data, technicianId: e.target.value })}>
                                    <option value="" className="text-black">Sin Asignar</option>
                                    {technicians.map(t => <option key={t.id} value={t.id} className="text-black">{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={saving} className="btn-primary w-full flex justify-center gap-2">
                                <Save size={20} />
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* History Timeline */}
                <div className="lg:col-span-1">
                    <div className="glass-card h-full">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                            <History className="text-purple-400" />
                            <h2 className="text-xl font-bold text-white">Historial</h2>
                        </div>

                        <div className="space-y-6 relative ml-2">
                            {/* Vertical Line */}
                            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-white/10"></div>

                            {data.maintenances && data.maintenances.length > 0 ? (
                                data.maintenances.map((m: any, idx: number) => (
                                    <div key={m.id} className="relative pl-8">
                                        <div className={`absolute left-0 top-1 p-1 rounded-full border-2 border-slate-900 ${m.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'
                                            }`}></div>

                                        <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-gray-400 font-mono">
                                                    {new Date(m.date).toLocaleDateString()}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.status === 'Completed' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                                                    }`}>
                                                    {m.status === 'Completed' ? 'Finalizado' : m.status}
                                                </span>
                                            </div>

                                            {m.diagnosis && (
                                                <div className="mb-2">
                                                    <p className="text-xs text-orange-300 font-bold mb-0.5">Diagnóstico:</p>
                                                    <p className="text-sm text-gray-300">{m.diagnosis}</p>
                                                </div>
                                            )}

                                            {m.resolution && (
                                                <div className="mt-2 pt-2 border-t border-white/5">
                                                    <p className="text-xs text-green-300 font-bold mb-0.5">Solución:</p>
                                                    <p className="text-sm text-gray-300">{m.resolution}</p>
                                                </div>
                                            )}

                                            {m.technician && (
                                                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                                    <CheckCircle size={10} />
                                                    {m.technician.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm italic pl-4">Sin historial registrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
