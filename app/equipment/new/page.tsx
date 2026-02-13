'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function NewEquipmentPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Data Loading State
    const [areas, setAreas] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [gerencias, setGerencias] = useState<any[]>([]);

    // UI State
    const [selectedGerencia, setSelectedGerencia] = useState('');

    // Derived state for filtering areas
    const filteredAreas = selectedGerencia
        ? areas.filter(a => a.gerenciaId === parseInt(selectedGerencia))
        : areas;

    const [formData, setFormData] = useState({
        type: '',
        model: '',
        serialNumber: '',
        reportedFailure: '',
        reportedBy: '',
        personInCharge: '',
        addedBy: '',
        areaId: '',
        technicianId: ''
    });

    // @ts-ignore
    const isAdmin = session?.user?.role === 'ADMIN';

    useEffect(() => {
        if (session?.user?.name) {
            // @ts-ignore
            setFormData(prev => ({ ...prev, addedBy: session.user.name }));
        }
    }, [session]);

    useEffect(() => {
        const initData = async () => {
            try {
                const [areasRes, techniciansRes, gerenciasRes] = await Promise.all([
                    fetch('/api/areas'),
                    fetch('/api/technicians'),
                    fetch('/api/gerencias')
                ]);

                if (areasRes.ok) setAreas(await areasRes.json());
                if (techniciansRes.ok) setTechnicians(await techniciansRes.json());
                if (gerenciasRes.ok) setGerencias(await gerenciasRes.json());

                // Auto-assign logic for non-admins to set themselves as technician
                // @ts-ignore
                if (status === 'authenticated' && !isAdmin && session?.user?.id) {
                    // @ts-ignore
                    const sessionUserId = parseInt(session.user.id);
                    // access technician list from state or wait for next render? 
                    // Better to use the fetched data directly here
                    const techs = await techniciansRes.clone().json().catch(() => []);
                    const myTech = techs.find((t: any) => t.userId === sessionUserId);

                    if (myTech) {
                        setFormData(prev => ({ ...prev, technicianId: myTech.id.toString() }));
                    }
                }
            } catch (error) {
                console.error("Error loading initial data", error);
                toast.error("Error cargando datos del formulario");
            }
        };

        if (status === 'authenticated') {
            initData();
        }
    }, [status, isAdmin, session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            type: formData.type.trim(),
            model: formData.model.trim(),
            serialNumber: formData.serialNumber.trim()
        };

        const res = await fetch('/api/equipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast.success('Equipo registrado exitosamente');
            router.push('/');
        } else {
            toast.error('Error al guardar el equipo');
        }
    };

    if (status === 'loading') return <div className="p-8 text-center text-gray-400">Cargando...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                <span>Volver al Inventario</span>
            </Link>

            <div className="glass-card">
                <h1 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Registrar Nuevo Equipo</h1>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Selectors Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-lg border border-white/5">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Gerencia</label>
                            <select
                                className="input-field appearance-none w-full"
                                value={selectedGerencia}
                                onChange={e => {
                                    setSelectedGerencia(e.target.value);
                                    setFormData({ ...formData, areaId: '' }); // Reset area on gerencia change
                                }}
                            >
                                <option value="" className="text-black">Seleccionar Gerencia</option>
                                {gerencias.map(g => (
                                    <option key={g.id} value={g.id} className="text-black">{g.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Área / Sub-área</label>
                            <select
                                className="input-field appearance-none w-full"
                                value={formData.areaId}
                                onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                                disabled={!selectedGerencia && filteredAreas.length > 0}
                            >
                                <option value="" className="text-black">Seleccionar Área</option>
                                {filteredAreas.map(area => (
                                    <option key={area.id} value={area.id} className="text-black">{area.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Quien reporta la falla</label>
                            <input
                                type="text"
                                placeholder="Nombre del solicitante"
                                className="input-field"
                                value={formData.reportedBy}
                                onChange={e => setFormData({ ...formData, reportedBy: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Encargado del Equipo</label>
                            <input
                                type="text"
                                placeholder="Responsable del activo"
                                className="input-field"
                                value={formData.personInCharge}
                                onChange={e => setFormData({ ...formData, personInCharge: e.target.value })}
                            />
                        </div>
                    </div>

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

                    {/* Technician - Admin Only */}
                    {isAdmin && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Técnico Responsable (Opcional)</label>
                            <select
                                className="input-field appearance-none w-full"
                                value={formData.technicianId}
                                onChange={e => setFormData({ ...formData, technicianId: e.target.value })}
                            >
                                <option value="" className="text-black">Sin Asignar</option>
                                {technicians.map(tech => (
                                    <option key={tech.id} value={tech.id} className="text-black">{tech.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!isAdmin && (
                        <div className="hidden">
                            <input type="hidden" value={formData.technicianId} />
                        </div>
                    )}


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
