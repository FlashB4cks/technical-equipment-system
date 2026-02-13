'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DashboardChartsProps {
    equipment: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function DashboardCharts({ equipment }: DashboardChartsProps) {
    // Helper: Normalize string (trim + lowercase)
    const normalize = (str: string) => (str || '').trim().toLowerCase();

    // Helper: Title Case
    const toTitleCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

    // Process data for Status Chart
    const statusCounts = equipment.reduce((acc: any, item: any) => {
        let status = normalize(item.status);
        if (!status || status === 'unknown') status = 'active'; // Default fallback

        // Normalize specific synonyms if needed
        if (status === 'listo') status = 'ready';
        if (status === 'en espera') status = 'pending';
        if (status === 'en mantenimiento') status = 'maintenance';
        if (status === 'diagnosticando') status = 'diagnosing';

        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const statusData = Object.keys(statusCounts).map((key) => {
        // Map back to Display Name
        const map: Record<string, string> = {
            'pending': 'En Espera',
            'diagnosing': 'Diagnosticando',
            'maintenance': 'En Mantenimiento',
            'ready': 'Listo',
            'delivered': 'Entregado',
            'completed': 'Completado',
            'active': 'Activo',
            'scheduled': 'Programado',
            'in progress': 'En Progreso'
        };
        const name = map[key] || toTitleCase(key);
        return { name, value: statusCounts[key], key }; // keep raw key for color check
    });

    // Process data for Type Chart
    const typeCounts = equipment.reduce((acc: any, item: any) => {
        const type = normalize(item.type) || 'otros';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const typeData = Object.keys(typeCounts).map(key => ({
        name: toTitleCase(key),
        value: typeCounts[key]
    }));

    const getStatusColor = (key: string) => {
        // key is already normalized from statusCounts keys
        if (key.includes('espera') || key.includes('pending')) return '#fbbf24'; // amber-400
        if (key.includes('mantenimiento') || key.includes('revisión') || key.includes('maintenance') || key.includes('diagnosing') || key.includes('diagnosticando')) return '#fb923c'; // orange-400
        if (key.includes('listo') || key.includes('ready') || key.includes('entregado') || key.includes('completado') || key.includes('activo') || key.includes('active')) return '#4ade80'; // green-400
        return '#60a5fa'; // blue-400 default
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Status Chart */}
            <div className="glass-card p-6 flex flex-col items-center">
                <h3 className="text-xl font-bold text-white mb-4">Distribución por Estado</h3>
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                                {statusData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.key)} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Type Chart */}
            <div className="glass-card p-6 flex flex-col items-center">
                <h3 className="text-xl font-bold text-white mb-4">Equipos por Tipo</h3>
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={typeData}>
                            <XAxis dataKey="name" stroke="#ccc" tick={{ fill: '#ccc' }} />
                            <YAxis stroke="#ccc" tick={{ fill: '#ccc' }} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="value" fill="#8884d8">
                                {typeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
