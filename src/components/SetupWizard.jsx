import React, { useState } from 'react';
import { BookOpen, Lock, User, Mail, AlertCircle, CheckCircle, Rocket, LogIn } from 'lucide-react';
import { pb } from '../lib/pocketbase';

export default function SetupWizard({ onSetupComplete, onGoToLogin }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '' });
    const [error, setError] = useState('');
    const [isEmailDuplicate, setIsEmailDuplicate] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
        setIsEmailDuplicate(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsEmailDuplicate(false);

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
                name: form.name || 'Admin',
                emailVisibility: true,
            });
            await pb.collection('users').authWithPassword(form.email, form.password);
            setStep(3);
        } catch (err) {
            console.error('Setup error:', err);
            const data = err?.response?.data;

            // Intercetta email duplicata
            if (
                data?.email?.code === 'validation_not_unique' ||
                data?.email?.message?.toLowerCase().includes('unique')
            ) {
                setIsEmailDuplicate(true);
                return;
            }

            if (data?.email?.message) setError('Email: ' + data.email.message);
            else if (data?.password?.message) setError('Password: ' + data.password.message);
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
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                                ${step >= s ? 'bg-sky-600 text-white shadow-md shadow-sky-200' : 'bg-slate-200 text-slate-400'}`}>
                                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                            </div>
                            {s < 3 && <div className={`w-10 h-0.5 transition-all duration-500 ${step > s ? 'bg-sky-600' : 'bg-slate-200'}`} />}
                        </div>
                    ))}
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8">

                    {/* STEP 1 — Benvenuto */}
                    {step === 1 && (
                        <div className="text-center space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Benvenuto! 👋</h2>
                                <p className="text-slate-500 text-sm mt-2">
                                    È il primo avvio dell’applicazione. Dovrai creare l’account
                                    amministratore che userai per accedere e gestire i prompt.
                                </p>
                            </div>
                            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-left space-y-2">
                                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Cosa succederà</p>
                                <ul className="text-sm text-slate-600 space-y-1.5">
                                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />Creazione account admin su PocketBase</li>
                                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />Login automatico dopo la configurazione</li>
                                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />Nessuna credenziale salvata nel codice</li>
                                </ul>
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Rocket className="w-5 h-5" />
                                Inizia la configurazione
                            </button>
                            {/* Hai già un account? */}
                            <button
                                onClick={onGoToLogin}
                                className="w-full py-2.5 text-sm text-slate-500 hover:text-sky-600 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <LogIn className="w-4 h-4" />
                                Ho già un account — Accedi
                            </button>
                        </div>
                    )}

                    {/* STEP 2 — Form registrazione */}
                    {step === 2 && (
                        <>
                            {/* Banner email duplicata */}
                            {isEmailDuplicate ? (
                                <div className="space-y-5">
                                    <div className="flex flex-col items-center text-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <AlertCircle className="w-8 h-8 text-amber-500" />
                                        <div>
                                            <p className="font-bold text-slate-800">Account già esistente</p>
                                            <p className="text-sm text-slate-600 mt-1">
                                                L’email <span className="font-mono font-semibold text-sky-700">{form.email}</span> è già registrata su PocketBase.
                                                Usa le tue credenziali esistenti per accedere.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onGoToLogin}
                                        className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        Vai al Login
                                    </button>
                                    <button
                                        onClick={() => { setIsEmailDuplicate(false); setForm({ ...form, email: '', password: '', passwordConfirm: '' }); }}
                                        className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        Usa un’altra email
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Crea il tuo account</h2>
                                        <p className="text-slate-500 text-sm mt-1">Queste credenziali verranno salvate su PocketBase.</p>
                                    </div>

                                    {/* Nome */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome (opzionale)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-slate-400" /></div>
                                            <input name="name" type="text" value={form.name} onChange={handleChange}
                                                className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white text-slate-900 text-sm"
                                                placeholder="Roberto" />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-slate-400" /></div>
                                            <input name="email" type="email" value={form.email} onChange={handleChange}
                                                className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white text-slate-900 text-sm"
                                                placeholder="admin@esempio.com" required />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password * <span className="text-slate-400 font-normal">(min 8 caratteri)</span></label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-slate-400" /></div>
                                            <input name="password" type="password" value={form.password} onChange={handleChange}
                                                className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white text-slate-900 text-sm"
                                                placeholder="••••••••" required />
                                        </div>
                                    </div>

                                    {/* Conferma Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Conferma Password *</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-slate-400" /></div>
                                            <input name="passwordConfirm" type="password" value={form.passwordConfirm} onChange={handleChange}
                                                className={`block w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white text-slate-900 text-sm ${
                                                    form.passwordConfirm && form.password !== form.passwordConfirm ? 'border-red-400 bg-red-50' : 'border-slate-300'
                                                }`}
                                                placeholder="••••••••" required />
                                        </div>
                                        {form.passwordConfirm && form.password !== form.passwordConfirm && (
                                            <p className="text-xs text-red-500 mt-1">Le password non coincidono</p>
                                        )}
                                    </div>

                                    {/* Errore generico */}
                                    {error && (
                                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-1">
                                        <button type="button" onClick={() => setStep(1)}
                                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                                            Indietro
                                        </button>
                                        <button type="submit" disabled={isLoading}
                                            className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Creazione...</span></>
                                            ) : 'Crea Account'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}

                    {/* STEP 3 — Successo */}
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
                                Vai all’app
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">BOB Prompt Library © 2025</p>
            </div>
        </div>
    );
}
