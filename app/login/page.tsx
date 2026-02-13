'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError('Credenciales inválidas');
            } else {
                toast.success('Bienvenido');
                router.refresh(); // Ensure server components re-render with new session
                // Use window.location.href to force a full page load, verifying cookies are sent
                window.location.href = callbackUrl;
            }
        } catch (error) {
            setError('Error al iniciar sesión');
        } finally {
            // Don't reset loading if we are navigating away, to prevent button flickering
            if (!loading) setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="glass-card p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">TechControl</h1>
                    <p className="text-gray-400 mt-2">Sistema de Gestión de Equipos</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 mb-6">
                        <AlertTriangle size={18} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Correo Electrónico</label>
                        <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                            <Mail className="text-gray-400" size={18} />
                            <input
                                type="email"
                                required
                                className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400"
                                placeholder="admin@techcontrol.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Contraseña</label>
                        <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                            <Lock className="text-gray-400" size={18} />
                            <input
                                type="password"
                                required
                                className="bg-transparent border-none outline-none text-white w-full placeholder-gray-400"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3 flex justify-center items-center gap-2"
                    >
                        {loading ? 'Entrando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
            <p className="text-center text-gray-500 text-sm mt-6">
                © 2026 TechControl System
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Background Effects (reused from globals) */}
            <Suspense fallback={<div>Cargando...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
