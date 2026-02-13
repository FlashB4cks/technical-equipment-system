'use client'

import { useEffect, useState, useRef } from 'react';
import { Plus, Download, Upload, Search, Laptop, Monitor, Printer, MapPin, Users, Clock, Wrench, CheckCircle, Trash2, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';
import DashboardCharts from '@/components/DashboardCharts';
import { useSession } from 'next-auth/react';

interface Equipment {
  id: number;
  type: string;
  model: string;
  serialNumber: string;
  status: string;
  entryDate?: string;
  createdAt?: string;
  area?: { name: string };
  technician?: { name: string };
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Selection
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Lookup Data for Import
  const [areas, setAreas] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  // @ts-ignore
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchEquipment();
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    const [resAreas, resTechs] = await Promise.all([
      fetch('/api/areas'),
      fetch('/api/technicians')
    ]);
    if (resAreas.ok) setAreas(await resAreas.json());
    if (resTechs.ok) setTechnicians(await resTechs.json());
  };

  const fetchEquipment = async () => {
    try {
      const res = await fetch('/api/equipment');
      const data = await res.json();
      setEquipment(data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredEquipment.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredEquipment.map(e => e.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`¿Estás seguro de eliminar ${selectedItems.length} equipos?`)) return;

    try {
      const res = await fetch('/api/equipment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedItems })
      });

      if (res.ok) {
        toast.success('Equipos eliminados');
        setSelectedItems([]);
        setIsSelectionMode(false);
        fetchEquipment();
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
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;

        // Helper to find value case-insensitive
        const findValue = (item: any, keys: string[]) => {
          const itemKeys = Object.keys(item);
          for (const searchKey of keys) {
            // Exact match first
            if (item[searchKey] !== undefined) return item[searchKey];
            // Case insensitive match
            const foundKey = itemKeys.find(k => k.toLowerCase() === searchKey.toLowerCase());
            if (foundKey && item[foundKey] !== undefined) return item[foundKey];
          }
          return null;
        };

        // Process and upload each item
        for (const item of data as any[]) {
          // Find IDs maps
          const areaName = findValue(item, ['Area', 'Departamento', 'Ubicacion']);
          const techName = findValue(item, ['Tecnico', 'Technician', 'Asignado']);

          const rawType = findValue(item, ['Tipo', 'Type', 'Categoria']) || 'Unknown';
          const type = String(rawType).trim();

          const rawModel = findValue(item, ['Modelo', 'Model', 'Dispositivo']) || 'Unknown';
          const model = String(rawModel).trim();

          const rawSerial = findValue(item, ['Serial', 'SN', 'Serie', 'No. Serie', 'Numero de Serie', 'S/N', 'Etiqueta']);
          const serial = rawSerial ? String(rawSerial).trim() : Math.random().toString();

          const rawStatus = findValue(item, ['Estado', 'Status', 'Condicion']) || 'Active';
          const status = String(rawStatus).trim();

          const areaId = areas.find(a => a.name.toLowerCase() === areaName?.toString().toLowerCase())?.id;
          const technicianId = technicians.find(t => t.name.toLowerCase() === techName?.toString().toLowerCase())?.id;

          await fetch('/api/equipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: type,
              model: model,
              serialNumber: serial.toString(),
              status: status,
              areaId: areaId,
              technicianId: technicianId
            })
          });
          successCount++;
        }
        fetchEquipment();
        toast.success(`Importación completada: ${successCount} equipos procesados`);
      } catch (error) {
        console.error(error);
        toast.error('Error al importar archivo');
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredEquipment = equipment.filter(item =>
    item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.area?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    false
  );

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('printer') || t.includes('impresora')) return <Printer className="text-purple-400" />;
    if (t.includes('laptop') || t.includes('portatil')) return <Laptop className="text-blue-400" />;
    return <Monitor className="text-cyan-400" />;
  };

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      'Pending': 'En Espera',
      'Diagnosing': 'Diagnosticando',
      'Maintenance': 'En Mantenimiento',
      'Ready': 'Listo',
      'Delivered': 'Entregado',
      'Completed': 'Completado',
      'Active': 'Activo',
      'Scheduled': 'Programado',
      'In Progress': 'En Progreso'
    };
    return map[status] || status;
  };

  const exportToExcel = () => {
    const data = equipment.map(e => ({
      ID: e.id,
      Tipo: e.type,
      Modelo: e.model,
      'No. Serie': e.serialNumber,
      Estado: translateStatus(e.status),
      'Fecha Ingreso': new Date(e.entryDate || e.createdAt || Date.now()).toLocaleDateString(),
      Area: e.area?.name || 'N/A',
      Tecnico: e.technician?.name || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Apply column widths
    const wscols = [
      { wch: 5 },  // ID
      { wch: 15 }, // Tipo
      { wch: 20 }, // Modelo
      { wch: 20 }, // Serial
      { wch: 15 }, // Estado
      { wch: 15 }, // Fecha
      { wch: 15 }, // Area
      { wch: 15 }  // Tecnico
    ];
    ws['!cols'] = wscols;

    // Style the header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:H1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[address]) continue;
      ws[address].s = {
        fill: { fgColor: { rgb: "3F51B5" } }, // Indigo background
        font: { sz: 12, bold: true, color: { rgb: "FFFFFF" } }, // White text
        alignment: { horizontal: "center" }
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Equipos");
    XLSX.writeFile(wb, "inventario_equipos.xlsx");
    toast.success('Excel exportado');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add banner style header
    doc.setFillColor(63, 81, 181); // Indigo color
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Inventario de Equipos", 14, 18);

    // Reset text color for table
    doc.setTextColor(0, 0, 0);

    const tableData = equipment.map(e => [
      e.id,
      e.type,
      e.model,
      e.serialNumber,
      translateStatus(e.status),
      new Date(e.entryDate || e.createdAt || Date.now()).toLocaleDateString(),
      e.area?.name || 'N/A',
      e.technician?.name || 'N/A'
    ]);

    autoTable(doc, {
      head: [['ID', 'Tipo', 'Modelo', 'No. Serie', 'Estado', 'Fecha Ing.', 'Area', 'Tecnico']],
      body: tableData,
      startY: 35,
      headStyles: {
        fillColor: [63, 81, 181], // Indigo
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    doc.save("inventario_equipos.pdf");
    toast.success('PDF exportado');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">En Espera</p>
            <p className="text-2xl font-bold text-yellow-400">{equipment.filter(e => e.status === 'Pending' || e.status === 'Active').length}</p>
          </div>
          <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
            <Clock size={24} />
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">En Revisión</p>
            <p className="text-2xl font-bold text-orange-400">{equipment.filter(e => e.status === 'Maintenance' || e.status === 'Diagnosing').length}</p>
          </div>
          <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
            <Wrench size={24} />
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Completados</p>
            <p className="text-2xl font-bold text-green-400">{equipment.filter(e => e.status === 'Ready' || e.status === 'Delivered').length}</p>
          </div>
          <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
            <CheckCircle size={24} />
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Equipos</p>
            <p className="text-2xl font-bold text-blue-400">{equipment.length}</p>
          </div>
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <Laptop size={24} />
          </div>
        </div>
      </div>

      <DashboardCharts equipment={equipment} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventario</h1>
          <p className="text-gray-400">Gestión de todos los equipos registrados</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Admin Bulk Actions */}
          {isAdmin && (
            <>
              {isSelectionMode ? (
                <>
                  <button
                    onClick={() => setIsSelectionMode(false)}
                    className="glass p-2 rounded-lg hover:bg-white/10 text-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSelectAll}
                    className="glass p-2 rounded-lg hover:bg-white/10 text-blue-400"
                  >
                    {selectedItems.length === filteredEquipment.length ? 'Deseleccionar' : 'Todos'}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedItems.length === 0}
                    className="bg-red-500/20 text-red-400 border border-red-500/50 p-2 rounded-lg hover:bg-red-500/30 flex items-center gap-2"
                  >
                    <Trash2 size={20} />
                    Eliminar ({selectedItems.length})
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="glass p-2 rounded-lg hover:bg-white/10 text-purple-400"
                  title="Seleccionar Equipos"
                >
                  <CheckSquare size={20} />
                </button>
              )}
            </>
          )}

          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept=".xlsx, .xls"
            onChange={handleImport}
          />
          <button onClick={() => fileInputRef.current?.click()} className="glass p-2 rounded-lg hover:bg-white/10 text-yellow-400" title="Importar Excel">
            <Upload size={20} />
          </button>
          <button onClick={exportToExcel} className="glass p-2 rounded-lg hover:bg-white/10 text-green-400" title="Exportar Excel">
            <Download size={20} />
          </button>
          <button onClick={exportToPDF} className="glass p-2 rounded-lg hover:bg-white/10 text-red-400" title="Exportar PDF">
            <Download size={20} />
          </button>
          <Link href="/equipment/new" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            <span className="hidden sm:inline">Nuevo Equipo</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por modelo, serie, área..."
          className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Equipment List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Cargando equipos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <div key={item.id} className="relative group">
              {/* Selection Checkbox */}
              {isSelectionMode && (
                <div
                  className="absolute top-4 right-4 z-20 cursor-pointer"
                  onClick={() => toggleSelection(item.id)}
                >
                  {selectedItems.includes(item.id) ? (
                    <div className="bg-blue-500 text-white rounded p-1">
                      <CheckSquare size={24} />
                    </div>
                  ) : (
                    <div className="bg-white/10 text-gray-400 rounded p-1 hover:bg-white/20">
                      <Square size={24} />
                    </div>
                  )}
                </div>
              )}

              <Link href={`/equipment/${item.id}`} className="block h-full">
                <div className={`glass-card flex flex-col gap-3 h-full hover:border-blue-500/50 transition-all cursor-pointer ${selectedItems.includes(item.id) ? 'border-blue-500 bg-blue-500/10' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-white/5 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      {getIcon(item.type)}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{item.model}</h3>
                    <p className="text-sm text-gray-400">No. Serie: {item.serialNumber}</p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-blue-400/70" />
                      <span>{item.area?.name || 'Sin Asignar'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-purple-400/70" />
                      <span>{item.technician?.name || 'Sin Asignar'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {filteredEquipment.length === 0 && !loading && (
        <div className="text-center py-10 glass-card">
          <p className="text-gray-400">No se encontraron equipos.</p>
        </div>
      )}
    </div>
  );
}
