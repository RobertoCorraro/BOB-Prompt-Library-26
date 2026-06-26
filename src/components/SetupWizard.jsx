import React, { useState } from 'react';
import { BookOpen, Lock, User, Mail, AlertCircle, CheckCircle, Rocket } from 'lucide-react';
import { pb } from '../lib/pocketbase';

/**
 * SetupWizard — mostrato al primo avvio quando non esistono utenti in PocketBase.
 * Crea l'account admin tramite PocketBase Auth.
 */
export default function SetupWizard({ onSetupComplete }) {
    const [step, setStep] = useState(1); // 1 = benvenuto, 2 = form, 3 = successo
    const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
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
            // 1. Crea l'utente nella collection "users" di PocketBase
            await pb.collection('users').create({
                email: form.email,
                password: form.password,
                passwordConfirm: form.passwordConfirm,
                name: form.name || 'Admin',
                emailVisibility: true,
            });

            // 2. Effettua subito il login per ottenere il token
            await pb.collection('users').authWithPassword(form.email, form.password);

            setStep(3);
        } catch (err) {
            console.error('Setup error:', err);
            const msg = err?.response?.data;
            if (msg?.email?.message) setError('Email: ' + msg.email.message);
            else if (msg?.password?.message) setError('Password: ' + msg.password.message);
            else setError('Errore durante la registrazione. Controlla i dati e riprova.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-gradient-to-br from-sky-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-600 to-blue-600 rounded-2xl shadow-xl mb-4">
                        <BookOpen className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                        BOB Prompt Library
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Configurazione iniziale</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`flex items-center gap-2`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                                ${ step >= s
                                    ? 'bg-sky-600 text-white shadow-md shadow-sky-200'
                                    : 'bg-slate-200 text-slate-400'
                                }`}>
                                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`w-10 h-0.5 transition-all duration-500 ${ step > s ? 'bg-sky-600' : 'bg-slate-200' }`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8">

                    {/* ── STEP 1: Benvenuto ── */}
                    {step === 1 && (
                        <div className="text-center space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Benvenuto! 👋</h2>
                                <p className="text-slate-500 text-sm mt-2">
                                    È il primo avvio dell'applicazione. Dovrai creare l'account
                                    amministratore che userai per accedere e gestire i prompt.
                                </p>
                            </div>
                            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-left space-y-2">
                                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Cosa succederà</p>
                                <ul className="text-sm text-slate-600 space-y-1.5">
                                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Creazione account admin su PocketBase</li>
                                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Login automatico dopo la configurazione</li>
                                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Nessuna credenziale salvata nel codice</li>
                                </ul>
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Rocket className="w-5 h-5" />
                                Inizia la configurazione
                            </button>
                        </div>
                    )}

                    {/* ── STEP 2: Form registrazione ── */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Crea il tuo account</h2>
                                <p className="text-slate-500 text-sm mt-1">Queste credenziali verranno salvate su PocketBase.</p>
                            </div>

                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome (opzionale)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        name="name"
                                        type="text"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white text-slate-900 text-sm"
                                        placeholder="Roberto"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white text-slate-900 text-sm"
                                        placeholder="admin@esempio.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password * <span className="text-slate-400 font-normal">(min 8 caratteri)</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        name="password"
                                        type="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white text-slate-900 text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Conferma Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Conferma Password *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        name="passwordConfirm"
                                        type="password"
                                        value={form.passwordConfirm}
                                        onChange={handleChange}
                                        className={`block w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white text-slate-900 text-sm ${
                                            form.passwordConfirm && form.password !== form.passwordConfirm
                                                ? 'border-red-400 bg-red-50'
                                                : 'border-slate-300'
                                        }`}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                {form.passwordConfirm && form.password !== form.passwordConfirm && (
                                    <p className="text-xs text-red-500 mt-1">Le password non coincidono</p>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Indietro
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Creazione account...</span>
                                        </>
                                    ) : (
                                        'Crea Account'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── STEP 3: Successo ── */}
                    {step === 3 && (
                        <div className="text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
                                <CheckCircle className="w-10 h-10 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Configurazione completata!</h2>
                                <p className="text-slate-500 text-sm mt-2">
                                    Il tuo account è stato creato con successo su PocketBase.
                                    Sei già loggato e pronto ad usare BOB Prompt Library.
                                </p>
                            </div>
                            <button
                                onClick={onSetupComplete}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Rocket className="w-5 h-5" />
                                Vai all'app
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    BOB Prompt Library © 2025
                </p>
            </div>
        </div>
    );
}
