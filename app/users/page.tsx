'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, User, Shield, Mail, Trash2, Search, Lock, Pencil, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function UsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            // @ts-ignore
            if (session?.user?.role !== 'ADMIN') {
                toast.error('Acceso no autorizado');
                router.push('/');
                return;
            }
            fetchUsers();
        }
    }, [status, session, router]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                toast.error('Error al cargar usuarios');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setName('');
        setEmail('');
        setPassword('');
        setRole('USER');
        setIsModalOpen(true);
    };

    const openEditModal = (user: UserData) => {
        setEditingUser(user);
        setName(user.name);
        setEmail(user.email);
        setPassword(''); // Don't populate password
        setRole(user.role);
        setIsModalOpen(true);
    };

    const handleDelete = async (userId: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Usuario eliminado');
                setUsers(users.filter(u => u.id !== userId));
            } else {
                const data = await response.json();
                toast.error(data.error || 'Error al eliminar');
            }
        } catch (error) {
            toast.error('Error al procesar la solicitud');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            const body: any = {
                name,
                email,
                role,
            };

            if (password) {
                body.password = password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado');
                fetchUsers(); // Refresh list to ensure consistency
                setIsModalOpen(false);
            } else {
                toast.error(data.error || 'Error al guardar usuario');
            }
        } catch (error) {
            toast.error('Error al procesar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Cargando usuarios...</div>;
    }

    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Gestión de Usuarios</h1>
                    <p className="text-gray-400">Administra el acceso y roles del sistema</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            {/* Search and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="glass-card p-4 flex items-center justify-between">
                    <span className="text-gray-400">Total Usuarios</span>
                    <span className="text-2xl font-bold text-white">{users.length}</span>
                </div>
            </div>

            {/* Users List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="glass-card p-6 space-y-4 relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => openEditModal(user)}
                                className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                title="Editar"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(user.id)}
                                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    {user.role === 'ADMIN' ? <Shield size={20} /> : <User size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{user.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'ADMIN'
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                        {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <Mail size={16} />
                                <span>{user.email}</span>
                            </div>
                            <div className="text-xs pt-2 border-t border-white/5">
                                Registrado: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nombre Completo</label>
                                <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                    <User className="text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Correo Electrónico</label>
                                <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                    <Mail className="text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="usuario@ejemplo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                                </label>
                                <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                    <Lock className="text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={editingUser ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Rol</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setRole('USER')}
                                        className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${role === 'USER'
                                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <User size={24} />
                                        <span className="text-sm font-medium">Usuario</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('ADMIN')}
                                        className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${role === 'ADMIN'
                                            ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <Shield size={24} />
                                        <span className="text-sm font-medium">Admin</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 btn-primary"
                                >
                                    {isSubmitting ? 'Guardando...' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


