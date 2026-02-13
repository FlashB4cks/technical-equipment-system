'use client';
'use client';
import { useState, useEffect, useRef } from 'react';
import { Package, Plus, ArrowUpRight, ArrowDownLeft, Search, BarChart3, Trash2, AlertTriangle, Save, CheckSquare, Square, Upload, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function WarehousePage() {
    const { data: session } = useSession();
    // @ts-ignore
    const isAdmin = session?.user?.role === 'ADMIN';

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Bulk Selection & Import
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Movement Form State
    const [movementModal, setMovementModal] = useState<{ open: boolean, type: 'IN' | 'OUT', item: any | null }>({
        open: false, type: 'IN', item: null
    });
    const [movementData, setMovementData] = useState({
        quantity: 1,
        reason: '',
        referenceDocument: '',
        gerencia: '',
        subArea: '',
        receiver: ''
    });

    // Edit Item Modal State
    const [editModal, setEditModal] = useState<{ open: boolean, item: any | null }>({ open: false, item: null });
    const [editData, setEditData] = useState({
        name: '', category: '', quantity: 0, minQuantity: 5, unit: ''
    });

    // New Item Form
    const [newItemData, setNewItemData] = useState({
        name: '', category: 'Consumibles', quantity: 0, minQuantity: 5, unit: 'unidades'
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/warehouse/items');
            if (res.ok) {
                setItems(await res.json());
            }
        } catch (error) {
            toast.error('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/warehouse/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItemData)
            });
            if (res.ok) {
                toast.success('Ítem creado exitosamente');
                setShowAddModal(false);
                setNewItemData({ name: '', category: 'Consumibles', quantity: 0, minQuantity: 5, unit: 'unidades' });
                fetchItems();
            } else {
                toast.error('Error al crear ítem');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const handleEditClick = (item: any) => {
        setEditData({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            minQuantity: item.minQuantity,
            unit: item.unit
        });
        setEditModal({ open: true, item });
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModal.item) return;

        try {
            const res = await fetch(`/api/warehouse/items/${editModal.item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });

            if (res.ok) {
                toast.success('Ítem actualizado (Ajuste registrado)');
                setEditModal({ open: false, item: null });
                fetchItems();
            } else {
                toast.error('Error al actualizar');
            }
        } catch (e) { toast.error('Error de conexión'); }
    };

    const handleMovement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!movementModal.item) return;

        try {
            const res = await fetch('/api/warehouse/movements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: movementModal.item.id,
                    type: movementModal.type,
                    quantity: movementData.quantity,
                    reason: movementData.reason,
                    referenceDocument: movementData.referenceDocument,
                    gerencia: movementData.gerencia,
                    subArea: movementData.subArea,
                    receiver: movementData.receiver
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(movementModal.type === 'IN' ? 'Ingreso registrado' : 'Salida registrada');
                setMovementModal({ ...movementModal, open: false });
                setMovementData({ quantity: 1, reason: '', referenceDocument: '', gerencia: '', subArea: '', receiver: '' });
                fetchItems();
            } else {
                toast.error(data.error || 'Error al registrar movimiento');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este ítem?')) return;
        try {
            const res = await fetch(`/api/warehouse/items/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Ítem eliminado');
                fetchItems();
            } else {
                toast.error('Error al eliminar');
            }
        } catch (e) { toast.error('Error de conexión'); }
    };

    // Bulk Actions
    const toggleSelection = (id: number) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!confirm(`¿Estás seguro de eliminar ${selectedItems.length} ítems?`)) return;

        try {
            const res = await fetch('/api/warehouse/items', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedItems })
            });

            if (res.ok) {
                toast.success('Ítems eliminados');
                setSelectedItems([]);
                setIsSelectionMode(false);
                fetchItems();
            } else {
                toast.error('Error al eliminar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data: any[] = XLSX.utils.sheet_to_json(ws);

                let successCount = 0;
                for (const item of data) {
                    await fetch('/api/warehouse/items', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: item['Nombre'] || item['Name'] || item['Item'],
                            category: item['Categoria'] || item['Category'] || 'Consumibles',
                            quantity: item['Cantidad'] || item['Stock'] || item['Quantity'] || 0,
                            minQuantity: item['Minimo'] || item['Min'] || 5,
                            unit: item['Unidad'] || item['Unit'] || 'unidades'
                        })
                    });
                    successCount++;
                }
                fetchItems();
                toast.success(`Importados ${successCount} ítems`);
            } catch (error) {
                toast.error('Error al importar');
            }
        };
        reader.readAsBinaryString(file);
    };

    const exportToExcel = () => {
        const data = filteredItems.map(i => ({
            ID: i.id,
            Nombre: i.name,
            Categoria: i.category,
            Stock: i.quantity,
            Unidad: i.unit,
            Minimo: i.minQuantity
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet([]);

        // Add Header Row with Styles
        const headers = ["ID", "Nombre", "Categoría", "Stock", "Unidad", "Mínimo"];
        XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F46E5" } }, // Blue-600
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
            }
        };

        // Apply Header Styles
        const range = XLSX.utils.decode_range(ws["!ref"] || "A1:F1");
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!ws[address]) continue;
            ws[address].s = headerStyle;
        }

        // Add Data
        XLSX.utils.sheet_add_json(ws, data, { origin: "A2", skipHeader: true });

        // Apply Borders and Center Alignment to Data
        const dataStyle = {
            border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
            },
            alignment: { vertical: "center" }
        };

        // Update range to cover all data
        const fullRange = XLSX.utils.decode_range(ws["!ref"] || "A1:F1");
        for (let R = 1; R <= fullRange.e.r; ++R) {
            for (let C = 0; C <= fullRange.e.c; ++C) {
                const address = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[address]) continue;
                ws[address].s = dataStyle;
            }
        }

        // Set Column Widths
        ws["!cols"] = [
            { wch: 5 },  // ID
            { wch: 30 }, // Nombre
            { wch: 15 }, // Categoría
            { wch: 10 }, // Stock
            { wch: 10 }, // Unidad
            { wch: 10 }  // Mínimo
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Bodega");
        XLSX.writeFile(wb, "inventario_bodega.xlsx");
        toast.success('Excel exportado con formato');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Inventario de Bodega", 14, 20);

        const tableData = filteredItems.map(i => [
            i.id, i.name, i.category, i.quantity, i.unit
        ]);

        autoTable(doc, {
            head: [['ID', 'Nombre', 'Categoría', 'Stock', 'Unidad']],
            body: tableData,
            startY: 30,
        });

        doc.save("inventario_bodega.pdf");
        toast.success('PDF exportado');
    };

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Chart Data
    const categoryData = filteredItems.reduce((acc: any, item: any) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {});

    // Low Stock Items
    const lowStockItems = items.filter(i => i.quantity <= i.minQuantity);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Total Ítems</p>
                        <p className="text-2xl font-bold text-blue-400">{items.length}</p>
                    </div>
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Package size={24} /></div>
                </div>
                <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Bajo Stock</p>
                        <p className="text-2xl font-bold text-red-400">{lowStockItems.length}</p>
                    </div>
                    <div className="p-2 bg-red-500/20 rounded-lg text-red-400"><AlertTriangle size={24} /></div>
                </div>
                <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Valor Total</p>
                        <p className="text-base text-gray-500">N/A (Sin Costos)</p>
                    </div>
                    <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><BarChart3 size={24} /></div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Levels Bar Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Niveles de Stock (Top 10)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[...items].sort((a, b) => b.quantity - a.quantity).slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="name" stroke="#888" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                                <YAxis stroke="#888" />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                                <Bar dataKey="quantity" fill="#8884d8">
                                    {items.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.quantity <= entry.minQuantity ? '#ef4444' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Pie Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Distribución por Categoría</h3>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={Object.keys(categoryData).map(k => ({ name: k, value: categoryData[k] }))}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {Object.keys(categoryData).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Bodega</h1>
                    <p className="text-gray-400">Gestión de insumos y repuestos</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto flex-wrap">
                    {/* Admin Bulk Actions */}
                    {isAdmin && (
                        <>
                            {isSelectionMode ? (
                                <>
                                    <button onClick={() => setIsSelectionMode(false)} className="glass p-2 rounded-lg hover:bg-white/10 text-gray-400">Cancelar</button>
                                    <button
                                        onClick={() => setSelectedItems(selectedItems.length === filteredItems.length ? [] : filteredItems.map(i => i.id))}
                                        className="glass p-2 rounded-lg hover:bg-white/10 text-blue-400"
                                    >
                                        {selectedItems.length === filteredItems.length ? 'Deseleccionar' : 'Todos'}
                                    </button>
                                    <button onClick={handleBulkDelete} disabled={selectedItems.length === 0} className="bg-red-500/20 text-red-400 border border-red-500/50 p-2 rounded-lg hover:bg-red-500/30 flex items-center gap-2">
                                        <Trash2 size={20} /> ({selectedItems.length})
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setIsSelectionMode(true)} className="glass p-2 rounded-lg hover:bg-white/10 text-purple-400" title="Seleccionar">
                                    <CheckSquare size={20} />
                                </button>
                            )}
                        </>
                    )}

                    <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={handleImport} />
                    <button onClick={() => fileInputRef.current?.click()} className="glass p-2 rounded-lg hover:bg-white/10 text-yellow-400" title="Importar Excel"><Upload size={20} /></button>
                    <button onClick={exportToExcel} className="glass p-2 rounded-lg hover:bg-white/10 text-green-400" title="Exportar Excel"><Download size={20} /></button>
                    <button onClick={exportToPDF} className="glass p-2 rounded-lg hover:bg-white/10 text-red-400" title="Exportar PDF"><Download size={20} /></button>

                    <div className="w-full md:w-64 bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                        <Search className="text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar ítem..."
                            className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className={`glass-card p-4 relative group ${item.quantity <= item.minQuantity ? 'border-red-500/50' : ''} ${selectedItems.includes(item.id) ? 'border-blue-500 bg-blue-500/10' : ''}`}>
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                            <div className="absolute top-2 right-2 z-20 cursor-pointer text-white" onClick={() => toggleSelection(item.id)}>
                                {selectedItems.includes(item.id) ? <CheckSquare size={24} className="text-blue-500" /> : <Square size={24} className="text-gray-400" />}
                            </div>
                        )}

                        {/* Admin Actions: Edit & Delete */}
                        {isAdmin && !isSelectionMode && (
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                    onClick={() => handleEditClick(item)}
                                    className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-white/10 rounded transition-colors"
                                    title="Editar / Ajustar"
                                >
                                    <Save size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-2">
                            <div className={`p-2 rounded-lg ${item.quantity <= item.minQuantity ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                <Package size={24} />
                            </div>
                            <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">ID: {item.id}</span>
                        </div>

                        <h3 className="text-lg font-bold text-white truncate">{item.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">{item.category}</p>

                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs text-gray-400">Stock Actual</p>
                                <p className={`text-2xl font-bold ${item.quantity <= item.minQuantity ? 'text-red-400' : 'text-white'}`}>
                                    {item.quantity} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                                </p>
                            </div>
                            {item.quantity <= item.minQuantity && (
                                <div className="text-red-400 flex items-center gap-1 text-xs">
                                    <AlertTriangle size={12} /> Bajo Stock
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            <button
                                onClick={() => setMovementModal({ open: true, type: 'IN', item })}
                                className="flex items-center justify-center gap-2 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors text-sm"
                            >
                                <ArrowDownLeft size={16} /> Ingreso
                            </button>
                            <button
                                onClick={() => setMovementModal({ open: true, type: 'OUT', item })}
                                className="flex items-center justify-center gap-2 py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors text-sm"
                            >
                                <ArrowUpRight size={16} /> Salida
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white mb-4">Nuevo Ítem de Bodega</h2>
                        <form onSubmit={handleCreateItem} className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400">Nombre</label>
                                <input required className="input-field w-full" value={newItemData.name} onChange={e => setNewItemData({ ...newItemData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Categoría</label>
                                    <select className="input-field w-full" value={newItemData.category} onChange={e => setNewItemData({ ...newItemData, category: e.target.value })}>
                                        <option value="Consumibles" className="text-black">Consumibles</option>
                                        <option value="Repuestos" className="text-black">Repuestos</option>
                                        <option value="Herramientas" className="text-black">Herramientas</option>
                                        <option value="Periféricos" className="text-black">Periféricos</option>
                                        <option value="Otros" className="text-black">Otros</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Unidad</label>
                                    <input className="input-field w-full" placeholder="pzas, cajas..." value={newItemData.unit} onChange={e => setNewItemData({ ...newItemData, unit: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Stock Inicial</label>
                                    <input type="number" min="0" className="input-field w-full" value={newItemData.quantity} onChange={e => setNewItemData({ ...newItemData, quantity: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Alerta Mínimo</label>
                                    <input type="number" min="1" className="input-field w-full" value={newItemData.minQuantity} onChange={e => setNewItemData({ ...newItemData, minQuantity: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal (New) */}
            {editModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white mb-4">Editar / Ajustar Stock</h2>
                        <form onSubmit={handleUpdateItem} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Nombre</label>
                                    <input required className="input-field w-full" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Categoría</label>
                                    <input required className="input-field w-full" value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Stock (Ajuste Directo)</label>
                                    <input type="number" min="0" className="input-field w-full font-bold text-yellow-400" value={editData.quantity} onChange={e => setEditData({ ...editData, quantity: parseInt(e.target.value) })} />
                                    <p className="text-xs text-yellow-500/70 mt-1">Cambiar esto registrará un &quot;Ajuste Manual&quot;</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Mínimo</label>
                                    <input type="number" min="0" className="input-field w-full" value={editData.minQuantity} onChange={e => setEditData({ ...editData, minQuantity: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setEditModal({ open: false, item: null })} className="text-gray-400 hover:text-white px-4 py-2">Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Movement Modal (Check-in / Check-out) */}
            {movementModal.open && movementModal.item && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                        <div className={`p-3 rounded-full w-fit mb-4 ${movementModal.type === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {movementModal.type === 'IN' ? <ArrowDownLeft size={32} /> : <ArrowUpRight size={32} />}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">
                            {movementModal.type === 'IN' ? 'Ingreso de Stock' : 'Salida de Stock'}
                        </h2>
                        <p className="text-gray-400 text-sm mb-4">
                            {movementModal.item.name} (Stock Actual: {movementModal.item.quantity})
                        </p>

                        <form onSubmit={handleMovement} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Cantidad</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={movementModal.type === 'OUT' ? movementModal.item.quantity : undefined}
                                        required
                                        autoFocus
                                        className="input-field w-full text-2xl font-bold text-center"
                                        value={movementData.quantity}
                                        onChange={e => setMovementData({ ...movementData, quantity: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">
                                        {movementModal.type === 'IN' ? 'Constancia Salida Almacén' : 'No. Oficio'}
                                    </label>
                                    <input
                                        required
                                        className="input-field w-full"
                                        placeholder={movementModal.type === 'IN' ? 'Ej. CSA-2024-001' : 'Ej. OF-2024-100'}
                                        value={movementData.referenceDocument}
                                        onChange={e => setMovementData({ ...movementData, referenceDocument: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Extra fields for OUT */}
                            {movementModal.type === 'OUT' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-400">Gerencia Destino</label>
                                            <input required className="input-field w-full" placeholder="Ej. Informática" value={movementData.gerencia} onChange={e => setMovementData({ ...movementData, gerencia: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400">Sub-Área</label>
                                            <input required className="input-field w-full" placeholder="Ej. Soporte" value={movementData.subArea} onChange={e => setMovementData({ ...movementData, subArea: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Recibido Por (Persona)</label>
                                        <input required className="input-field w-full" placeholder="Nombre completo" value={movementData.receiver} onChange={e => setMovementData({ ...movementData, receiver: e.target.value })} />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="text-sm text-gray-400">Razón / Observaciones</label>
                                <textarea
                                    required
                                    placeholder={movementModal.type === 'IN' ? 'Ej. Compra de consumibles' : 'Ej. Entrega para mantenimiento'}
                                    className="input-field w-full min-h-[60px]"
                                    value={movementData.reason}
                                    onChange={e => setMovementData({ ...movementData, reason: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => { setMovementModal({ ...movementModal, open: false }); setMovementData({ quantity: 1, reason: '', referenceDocument: '', gerencia: '', subArea: '', receiver: '' }) }} className="text-gray-400 hover:text-white px-4 py-2">Cancelar</button>
                                <button type="submit" className={`btn-primary ${movementModal.type === 'IN' ? 'bg-green-600 hover:bg-green-500' : 'bg-orange-600 hover:bg-orange-500'}`}>
                                    Confirmar {movementModal.type === 'IN' ? 'Ingreso' : 'Salida'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
