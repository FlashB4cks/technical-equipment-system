'use client'

import { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Pencil, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function AreasPage() {
    // ... (keep props)
    const { data: session } = useSession();
    const [areas, setAreas] = useState<any[]>([]);
    const [newArea, setNewArea] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    // @ts-ignore
    const isAdmin = session?.user?.role === 'ADMIN';

    const [gerencias, setGerencias] = useState<any[]>([]);
    const [selectedGerencia, setSelectedGerencia] = useState('');

    // Standalone Gerencia State
    const [isCreatingGerencia, setIsCreatingGerencia] = useState(false);
    const [newGerenciaName, setNewGerenciaName] = useState('');

    const [isEditingGerencia, setIsEditingGerencia] = useState(false);
    const [editingGerenciaName, setEditingGerenciaName] = useState('');

    useEffect(() => {
        fetchAreas();
        fetchGerencias();
    }, []);

    // ... (fetch functions)
    const fetchGerencias = async () => {
        const res = await fetch('/api/gerencias');
        if (res.ok) setGerencias(await res.json());
    };

    const fetchAreas = async () => {
        const res = await fetch('/api/areas');
        const data = await res.json();
        setAreas(data);
    };

    const handleCreateGerencia = async () => {
        if (!newGerenciaName.trim()) return;
        try {
            const res = await fetch('/api/gerencias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newGerenciaName })
            });
            if (res.ok) {
                const savedG = await res.json();
                setGerencias([...gerencias, savedG]);
                setSelectedGerencia(savedG.id.toString());
                setIsCreatingGerencia(false);
                setNewGerenciaName('');
                toast.success('Gerencia creada');
            } else {
                toast.error('Error al crear gerencia');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    // Need API support for PUT Gerencia, assuming we might need to add it or it exists? 
    // Plan mentioned only POST, but user asked for EDIT. I need to ensure API supports it or add it.
    // For now, I will implement the handler and if API fails I'll fix the API in next step.
    const handleUpdateGerencia = async () => {
        if (!editingGerenciaName.trim() || !selectedGerencia) return;
        try {
            const res = await fetch('/api/gerencias', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: parseInt(selectedGerencia), name: editingGerenciaName })
            });
            if (res.ok) {
                const updatedG = await res.json();
                setGerencias(gerencias.map(g => g.id === updatedG.id ? updatedG : g));
                setIsEditingGerencia(false);
                setEditingGerenciaName('');
                toast.success('Gerencia actualizada');
            } else {
                toast.error('Error al actualizar (Implementar API si falta)');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newArea) return;

        // Simplify submit - just use selectedGerencia
        // ... (rest of logic)

        const payload = {
            name: newArea,
            gerenciaId: selectedGerencia || null
        };

        if (editingId) {
            // Update
            const res = await fetch('/api/areas', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, id: editingId }),
            });
            if (res.ok) {
                toast.success('Área actualizada');
            } else {
                toast.error('Error al actualizar (Permisos insuficientes)');
            }
        } else {
            // Create
            const res = await fetch('/api/areas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toast.success('Área creada');
            } else {
                toast.error('Error al crear (Permisos insuficientes)');
            }
        }

        setNewArea('');
        setSelectedGerencia('');
        setIsCreatingGerencia(false);
        setNewGerenciaName('');
        setEditingId(null);
        fetchAreas();
    };

    const handleEdit = (area: any) => {
        setNewArea(area.name);
        setSelectedGerencia(area.gerenciaId?.toString() || '');
        setEditingId(area.id);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar esta área?')) return;

        try {
            const res = await fetch('/api/areas', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                toast.success('Área eliminada');
                fetchAreas();
            } else {
                toast.error('No se puede eliminar (posiblemente tenga equipos asociados)');
            }
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white">Gestión de Áreas</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form - Only for Admin */}
                {isAdmin && (
                    <div className="glass-card h-fit md:col-span-1">
                        <h2 className="text-lg font-bold mb-4 text-blue-400">
                            {editingId ? 'Editar Área' : 'Nueva Área'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Gerencia</label>
                                <div className="flex gap-2">
                                    {isCreatingGerencia ? (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Nombre nueva gerencia"
                                                className="input-field flex-1"
                                                value={newGerenciaName}
                                                onChange={e => setNewGerenciaName(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCreateGerencia}
                                                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50"
                                                title="Guardar Gerencia"
                                            >
                                                <Save size={20} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCreatingGerencia(false);
                                                    setNewGerenciaName('');
                                                }}
                                                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white border border-white/10"
                                                title="Cancelar"
                                            >
                                                <X size={20} />
                                            </button>
                                        </>
                                    ) : isEditingGerencia ? (
                                        <>
                                            <input
                                                type="text"
                                                className="input-field flex-1"
                                                value={editingGerenciaName}
                                                onChange={e => setEditingGerenciaName(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handleUpdateGerencia}
                                                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50"
                                                title="Actualizar Gerencia"
                                            >
                                                <Save size={20} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditingGerencia(false);
                                                    setEditingGerenciaName('');
                                                }}
                                                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white border border-white/10"
                                                title="Cancelar"
                                            >
                                                <X size={20} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <select
                                                className="input-field flex-1"
                                                value={selectedGerencia}
                                                onChange={e => setSelectedGerencia(e.target.value)}
                                            >
                                                <option value="" className="text-black">Sin Gerencia</option>
                                                {gerencias.map(g => (
                                                    <option key={g.id} value={g.id} className="text-black">{g.name}</option>
                                                ))}
                                            </select>

                                            {selectedGerencia && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const g = gerencias.find(i => i.id.toString() === selectedGerencia);
                                                        if (g) {
                                                            setEditingGerenciaName(g.name);
                                                            setIsEditingGerencia(true);
                                                        }
                                                    }}
                                                    className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50"
                                                    title="Editar Gerencia Seleccionada"
                                                >
                                                    <Pencil size={20} />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCreatingGerencia(true);
                                                    setNewGerenciaName('');
                                                }}
                                                className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/50"
                                                title="Nueva Gerencia"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="Nombre del área"
                                className="input-field"
                                value={newArea}
                                onChange={e => setNewArea(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2">
                                    <Plus size={18} />
                                    <span>{editingId ? 'Guardar' : 'Agregar'}</span>
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setNewArea('');
                                            setSelectedGerencia('');
                                            setIsCreatingGerencia(false);
                                            setNewGerenciaName('');
                                        }}
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
                <div className={`space-y-4 ${isAdmin ? 'md:col-span-2' : 'md:col-span-3'}`}>
                    {areas.length === 0 ? (
                        <p className="text-gray-400 text-center">No hay áreas registradas.</p>
                    ) : (
                        Object.entries(
                            areas.reduce((acc: any, area) => {
                                const key = area.gerencia?.name || 'Otras Áreas / Sin Gerencia';
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(area);
                                return acc;
                            }, {})
                        ).sort((a: any, b: any) => {
                            if (a[0] === 'Otras Áreas / Sin Gerencia') return 1;
                            if (b[0] === 'Otras Áreas / Sin Gerencia') return -1;
                            return a[0].localeCompare(b[0]);
                        }).map(([groupName, groupAreas]: [string, any]) => (
                            <GerenciaGroup key={groupName} name={groupName} areas={groupAreas} isAdmin={isAdmin} onEdit={handleEdit} onDelete={handleDelete} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function GerenciaGroup({ name, areas, isAdmin, onEdit, onDelete }: any) {
    const [isOpen, setIsOpen] = useState(false); // Default collapsed as requested to save space

    return (
        <div className="glass overflow-hidden rounded-xl border border-white/5">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${isOpen ? 'bg-blue-500' : 'bg-gray-600'}`}>
                        {isOpen ? <ChevronDown size={16} className="text-white" /> : <ChevronRight size={16} className="text-white" />}
                    </div>
                    <h3 className="text-lg font-bold text-white text-left">
                        {name}
                        <span className="text-sm font-normal text-gray-400 ml-2">({areas.length} áreas)</span>
                    </h3>
                </div>
                {!isOpen && (
                    <div className="flex -space-x-2">
                        {areas.slice(0, 3).map((a: any) => (
                            <div key={a.id} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-[10px] text-gray-400">
                                {a.name.substring(0, 2).toUpperCase()}
                            </div>
                        ))}
                        {areas.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-[10px] text-gray-400">
                                +{areas.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="p-4 bg-black/20 grid grid-cols-1 gap-3">
                    {areas.map((area: any) => (
                        <div key={area.id} className="glass p-3 rounded-lg flex justify-between items-center group hover:bg-white/5 transition-colors border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{area.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {area._count?.equipment} Equipos • {area._count?.technicians} Técnicos
                                    </p>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(area); }}
                                        className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors bg-white/5 rounded-md"
                                        title="Editar"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(area.id); }}
                                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors bg-white/5 rounded-md"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
