import React from 'react';
import { ShieldAlert, LogIn, X } from 'lucide-react';
import { triggerHaptic } from '../lib/utils';

export default function AuthGuardModal({ isOpen, onClose, onLogin }) {
    if (!isOpen) return null;

    const handleClose = () => {
        triggerHaptic('light');
        onClose();
    };

    const handleLoginClick = () => {
        triggerHaptic('success');
        onClose();
        onLogin();
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={handleClose}
        >
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Azionare Sicura
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        Attenzione, devi accedere al tuo account per apportare modifiche.
                    </p>

                    <button
                        onClick={handleLoginClick}
                        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-violet-200 dark:shadow-none transition-all active:scale-[0.98] mb-3"
                    >
                        <LogIn className="w-5 h-5" />
                        <span>ACCEDI</span>
                    </button>

                    <button
                        onClick={handleClose}
                        className="w-full text-slate-500 dark:text-slate-500 font-medium py-3 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                        Continua come ospite
                    </button>
                </div>

                {/* Close Button top-right */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
