import React, { useState, useEffect } from 'react';
import { BookOpen, Lock, User, Mail, AlertCircle, CheckCircle, X, ArrowLeft } from 'lucide-react';
import { pb, isPocketBaseConfigured, isSmtpConfigured } from '../lib/pocketbase';

export default function Login({ onLogin, onClose, onBack, initialMode = 'login' }) {
    const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'reset'
    const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '' });
    const [error, setError] = useState('');
    const [isEmailDuplicate, setIsEmailDuplicate] = useState(false);
    const [resetSent, setResetSent] = useState(false);
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

    const switchMode = (next) => {
        setMode(next);
        setError('');
        setIsEmailDuplicate(false);
        setResetSent(false);
        setForm((f) => ({ ...f, password: '', passwordConfirm: '' }));
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
        setIsEmailDuplicate(false);
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const success = await onLogin(form.email, form.password);
            if (!success) {
                setError('Credenziali non valide. Riprova.');
                setForm((f) => ({ ...f, password: '' }));
            }
        } catch (err) {
            setError('Si è verificato un errore. Riprova più tardi.');
        }
        setIsLoading(false);
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.passwordConfirm) {
            setError('Le password non coincidono.');
            return;
        }
        if (form.password.length < 8) {
            setError('La password deve essere di almeno 8 caratteri.');
            return;
        }

        setIsLoading(true);
        try {
            await pb.collection('users').create({
                email: form.email,
                password: form.password,
                passwordConfirm: form.passwordConfirm,
                name: form.name || undefined,
                emailVisibility: true,
            });
            const success = await onLogin(form.email, form.password);
            if (!success) {
                setError('Account creato, ma il login automatico è fallito. Prova ad accedere manualmente.');
                switchMode('login');
            }
        } catch (err) {
            const data = err?.response?.data || err?.data;
            if (
                data?.email?.code === 'validation_not_unique' ||
                data?.email?.message?.toLowerCase().includes('unique')
            ) {
                setIsEmailDuplicate(true);
            } else if (data?.password?.message) {
                setError('Password: ' + data.password.message);
            } else {
                setError('Errore durante la registrazione. Controlla i dati e riprova.');
            }
        }
        setIsLoading(false);
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await pb.collection('users').requestPasswordReset(form.email);
            setResetSent(true);
        } catch (err) {
            setError('Impossibile inviare la richiesta. Riprova più tardi o contatta chi gestisce il servizio.');
        }
        setIsLoading(false);
    };

    const titles = {
        login: { h: 'BOB Prompt Library', p: 'Accedi per gestire i tuoi prompt AI' },
        register: { h: 'Crea un account', p: 'Registrati per iniziare a usare BOB Prompt Library' },
        reset: { h: 'Reimposta password', p: 'Ti invieremo un link per impostarne una nuova' },
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md relative">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute -top-12 left-0 p-2 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Indietro
                    </button>
                )}
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
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl shadow-xl mb-4 transform hover:scale-105 transition-transform duration-300">
                        <BookOpen className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {titles[mode].h}
                    </h1>
                    <p className="text-slate-600 text-sm">{titles[mode].p}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom duration-700">

                    {/* ── LOGIN ─────────────────────────────────────────── */}
                    {mode === 'login' && (
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <Field icon={User} label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="la-tua@email.com" autoFocus />
                            <Field icon={Lock} label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Inserisci password" />

                            {error && <ErrorBox message={error} />}

                            <SubmitButton isLoading={isLoading} disabled={connectionStatus !== 'connected'} loadingLabel="Accesso in corso..." label="Accedi" icon={Lock} />

                            <div className="flex items-center justify-between text-sm pt-1">
                                <button type="button" onClick={() => switchMode('reset')} className="text-slate-500 hover:text-violet-600 transition-colors">
                                    Password dimenticata?
                                </button>
                                <button type="button" onClick={() => switchMode('register')} className="text-violet-600 font-medium hover:text-violet-700 transition-colors">
                                    Registrati
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── REGISTER ──────────────────────────────────────── */}
                    {mode === 'register' && (
                        isEmailDuplicate ? (
                            <div className="space-y-5">
                                <div className="flex flex-col items-center text-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <AlertCircle className="w-8 h-8 text-amber-500" />
                                    <div>
                                        <p className="font-bold text-slate-800">Account già esistente</p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            L'email <span className="font-mono font-semibold text-violet-700">{form.email}</span> è già registrata.
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => switchMode('login')} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-md transition-all">
                                    Vai al Login
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleRegisterSubmit} className="space-y-5">
                                <Field icon={User} label="Nome (opzionale)" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Roberto" required={false} />
                                <Field icon={Mail} label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="la-tua@email.com" autoFocus />
                                <Field icon={Lock} label="Password (min 8 caratteri)" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
                                <Field icon={Lock} label="Conferma password" name="passwordConfirm" type="password" value={form.passwordConfirm} onChange={handleChange} placeholder="••••••••" />

                                {error && <ErrorBox message={error} />}

                                <SubmitButton isLoading={isLoading} disabled={connectionStatus !== 'connected'} loadingLabel="Creazione account..." label="Crea account" icon={User} />

                                <button type="button" onClick={() => switchMode('login')} className="w-full text-sm text-slate-500 hover:text-violet-600 transition-colors">
                                    Hai già un account? Accedi
                                </button>
                            </form>
                        )
                    )}

                    {/* ── RESET PASSWORD ────────────────────────────────── */}
                    {mode === 'reset' && (
                        resetSent ? (
                            <div className="text-center space-y-5">
                                {isSmtpConfigured ? (
                                    <>
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
                                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                                        </div>
                                        <p className="text-slate-600 text-sm">
                                            Se l'indirizzo <span className="font-mono font-semibold">{form.email}</span> è registrato, riceverai a breve un'email con le istruzioni per reimpostare la password.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full">
                                            <AlertCircle className="w-10 h-10 text-amber-600" />
                                        </div>
                                        <div className="text-left bg-amber-50 border border-amber-200 rounded-xl p-4">
                                            <p className="font-bold text-slate-800 text-sm">Invio email non ancora attivo</p>
                                            <p className="text-slate-600 text-sm mt-1.5">
                                                Questo servizio non ha ancora un provider email (SMTP) configurato, quindi nessuna email verrà effettivamente inviata. Chiedi a chi amministra l'app di configurare l'SMTP su PocketBase, oppure di reimpostarti la password manualmente dal pannello admin.
                                            </p>
                                        </div>
                                    </>
                                )}
                                <button onClick={() => switchMode('login')} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-md transition-all">
                                    Torna al Login
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleResetSubmit} className="space-y-6">
                                <Field icon={Mail} label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="la-tua@email.com" autoFocus />

                                {error && <ErrorBox message={error} />}

                                <SubmitButton isLoading={isLoading} disabled={connectionStatus !== 'connected'} loadingLabel="Invio in corso..." label="Invia link di reset" icon={Mail} />

                                <button type="button" onClick={() => switchMode('login')} className="w-full text-sm text-slate-500 hover:text-violet-600 transition-colors">
                                    Torna al Login
                                </button>
                            </form>
                        )
                    )}

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

                <p className="text-center text-xs text-slate-500 mt-6">
                    BOB Prompt Library © 2025
                </p>
            </div>
        </div>
    );
}

function Field({ icon: Icon, label, name, type, value, onChange, placeholder, autoFocus, required = true }) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all bg-white dark:bg-slate-800 text-base text-slate-900 dark:text-white"
                    placeholder={placeholder}
                    required={required}
                    autoFocus={autoFocus}
                />
            </div>
        </div>
    );
}

function ErrorBox({ message }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in slide-in-from-top duration-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
        </div>
    );
}

function SubmitButton({ isLoading, disabled, loadingLabel, label, icon: Icon }) {
    return (
        <button
            type="submit"
            disabled={isLoading || disabled}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {isLoading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{loadingLabel}</span>
                </>
            ) : (
                <>
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                </>
            )}
        </button>
    );
}
