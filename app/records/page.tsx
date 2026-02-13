'use client'

import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, ArrowUpDown, Eye } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default function RecordsPage() {
    const [equipment, setEquipment] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetch('/api/equipment')
            .then(res => res.json())
            .then(data => {
                setEquipment(data);
                setLoading(false);
            });
    }, []);

    const filteredAndSortedEquipment = equipment
        .filter(item => {
            const matchesSearch =
                item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.type.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'All' ? true :
                statusFilter === 'Pending' ? (item.status === 'Pending' || item.status === 'Active') :
                    statusFilter === 'InProgress' ? (item.status === 'Maintenance' || item.status === 'Diagnosing') :
                        statusFilter === 'Completed' ? (item.status === 'Ready' || item.status === 'Delivered' || item.status === 'Completed') : true;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            const dateA = new Date(a.entryDate || a.createdAt || 0).getTime();
            const dateB = new Date(b.entryDate || b.createdAt || 0).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });



    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Calendar className="text-purple-400" />
                Historial de Registros
            </h1>

            <div className="glass-card p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <Search className="text-gray-400" size={18} />
                    <input
                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400"
                        placeholder="Buscar por modelo, serie..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <Filter className="text-gray-400" size={18} />
                    <select
                        className="bg-transparent border-none outline-none text-white w-full appearance-none"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="All" className="text-black">Todos los Estados</option>
                        <option value="Pending" className="text-black">En Espera</option>
                        <option value="InProgress" className="text-black">En Taller</option>
                        <option value="Completed" className="text-black">Completados</option>
                    </select>
                </div>

                <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="btn-secondary flex items-center justify-center gap-2"
                >
                    <ArrowUpDown size={18} />
                    {sortOrder === 'desc' ? 'Más Recientes' : 'Más Antiguos'}
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-sm">
                            <th className="p-4">Fecha Ingreso</th>
                            <th className="p-4">Equipo / Modelo</th>
                            <th className="p-4">Serial</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredAndSortedEquipment.map(item => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors text-sm text-gray-300">
                                <td className="p-4 font-mono">
                                    {new Date(item.entryDate || item.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    <p className="font-bold text-white">{item.type}</p>
                                    <p className="text-xs text-gray-500">{item.model}</p>
                                </td>
                                <td className="p-4 font-mono">{item.serialNumber}</td>
                                <td className="p-4"><StatusBadge status={item.status} /></td>
                                <td className="p-4">
                                    <Link href={`/equipment/${item.id}`} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                        <Eye size={16} /> Ver
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAndSortedEquipment.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">No se encontraron registros.</div>
                )}
            </div>
        </div>
    );
}
