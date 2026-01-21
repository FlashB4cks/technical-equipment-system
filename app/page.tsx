'use client'

import { useEffect, useState, useRef } from 'react';
import { Plus, Download, Upload, Search, Laptop, Monitor, Printer, MapPin, Users, Clock, Wrench, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';

interface Equipment {
  id: number;
  type: string;
  model: string;
  serialNumber: string;
  status: string;
  area?: { name: string };
  technician?: { name: string };
}

export default function Dashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

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

        // Process and upload each item
        for (const item of data as any[]) {
          await fetch('/api/equipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: item.Tipo || item.Type || 'Unknown',
              model: item.Modelo || item.Model || 'Unknown',
              serialNumber: item.Serial || item.SN || Math.random().toString(),
              status: 'Active'
            })
          });
        }
        fetchEquipment();
        toast.success('Importación completada con éxito');
      } catch (error) {
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

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(equipment.map(e => ({
      Tipo: e.type,
      Modelo: e.model,
      Serial: e.serialNumber,
      Estado: e.status,
      Area: e.area?.name || 'N/A',
      Tecnico: e.technician?.name || 'N/A'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Equipos");
    XLSX.writeFile(wb, "inventario_equipos.xlsx");
    toast.success('Excel exportado');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventario de Equipos", 14, 20);

    const tableData = equipment.map(e => [
      e.id,
      e.type,
      e.model,
      e.serialNumber,
      e.area?.name || 'N/A',
      e.technician?.name || 'N/A'
    ]);

    autoTable(doc, {
      head: [['ID', 'Tipo', 'Modelo', 'Serial', 'Area', 'Tecnico']],
      body: tableData,
      startY: 30,
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventario</h1>
          <p className="text-gray-400">Gestión de todos los equipos registrados</p>
        </div>

        <div className="flex gap-2">
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
            <span>Nuevo Equipo</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por modelo, serie, área..."
          className="input-field pl-10"
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
            <Link key={item.id} href={`/equipment/${item.id}`} className="block">
              <div className="glass-card flex flex-col gap-3 group hover:border-blue-500/50 transition-all cursor-pointer">
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
