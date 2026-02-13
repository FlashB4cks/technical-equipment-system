'use client'

import { LayoutDashboard, Users, MapPin, Monitor, Menu, X, FileText, LogOut, Shield, User, Building, Package } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

const navItems = [
    { name: 'Inventario', href: '/', icon: Monitor },
    { name: 'Taller', href: '/workshop', icon: LayoutDashboard },
    { name: 'Registros', href: '/records', icon: FileText },
    { name: 'Áreas', href: '/areas', icon: MapPin },
    { name: 'Técnicos', href: '/technicians', icon: Users },
    { name: 'Usuarios', href: '/users', icon: Shield, adminOnly: true },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = useSession();

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="lg:hidden fixed top-4 right-4 z-50 p-2 glass rounded-full text-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 transition-transform duration-300 ease-in-out glass border-r border-white/10
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="flex items-center justify-center h-20 border-b border-white/10 mb-2">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        TechControl
                    </h1>
                </div>

                {/* User Profile Info */}
                {session?.user && (
                    <div className="mx-4 mb-4 p-3 glass rounded-xl flex items-center gap-3 border border-white/5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            // @ts-ignore
                            session.user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                            <User size={20} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">
                                {session.user.name || 'Usuario'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                                {/* @ts-ignore */}
                                {session.user.role === 'ADMIN' ? 'Administrador' : 'Técnico'}
                            </p>
                        </div>
                    </div>
                )}

                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        // @ts-ignore
                        if (item.adminOnly && session?.user?.role !== 'ADMIN') {
                            return null;
                        }

                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}

                    <Link href="/warehouse" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${pathname === '/warehouse' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <Package size={20} />
                        <span className="font-medium">Bodega</span>
                    </Link>

                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-white/5 hover:text-red-300 transition-all duration-200 mt-4 border-t border-white/10"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </nav>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
