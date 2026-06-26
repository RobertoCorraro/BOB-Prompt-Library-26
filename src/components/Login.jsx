import React, { useState, useEffect } from 'react';
import { BookOpen, Lock, User, AlertCircle, X } from 'lucide-react';
import { pb, isPocketBaseConfigured } from '../lib/pocketbase';

export default function Login({ onLogin, onClose }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('checking');

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && onClose) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        async function checkConnection() {
            if (!isPocketBaseConfigured) {
                setConnectionStatus('error');
                return;
            }
            try {
                await pb.health.check();
                setConnectionStatus('connected');
            } catch (err) {
                console.error('PocketBase connection check failed:', err);
                setConnectionStatus('error');
            }
        }
        checkConnection();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await onLogin(username, password);
            if (!success) {
                setError('Credenziali non valide. Riprova.');
                setPassword('');
            }
        } catch (err) {
            setError('Si è verificato un errore. Riprova più tardi.');
        }

        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md relative">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}

                {/* Logo and Title */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-600 to-blue-600 rounded-2xl shadow-xl mb-4 transform hover:scale-105 transition-transform duration-300">
                        <BookOpen className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        BOB Prompt Library
                    </h1>
                    <p className="text-slate-600 text-sm">
                        Accedi per gestire i tuoi prompt AI
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom duration-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="username"
                                    type="email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white dark:bg-slate-800 text-base text-slate-900 dark:text-white"
                                    placeholder="la-tua@email.com"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white dark:bg-slate-800 text-base text-slate-900 dark:text-white"
                                    placeholder="Inserisci password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in slide-in-from-top duration-300">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || connectionStatus !== 'connected'}
                            className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Accesso in corso...</span>
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5" />
                                    <span>Accedi</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Connection Status — Semaforo PocketBase */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                        {connectionStatus === 'checking' && (
                            <span className="flex items-center gap-1.5 text-slate-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                                Verifica connessione...
                            </span>
                        )}
                        {connectionStatus === 'connected' && (
                            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Connesso a PocketBase
                            </span>
                        )}
                        {connectionStatus === 'error' && (
                            <span className="flex items-center gap-1.5 text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {isPocketBaseConfigured ? 'PocketBase non raggiungibile' : 'VITE_POCKETBASE_URL non configurato'}
                            </span>
                        )}
                    </div>

                    {/* Bottom Close Button for Mobile */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-full mt-6 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            <span>CHIUDI</span>
                        </button>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    BOB Prompt Library © 2025
                </p>
            </div>
        </div>
    );
}
