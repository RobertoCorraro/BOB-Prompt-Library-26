import React from 'react';
import { ShieldAlert, LogIn, X } from 'lucide-react';
import { triggerHaptic } from '../lib/utils';
import Modal from './Modal';

export default function AuthGuardModal({ isOpen, onClose, onLogin }) {
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
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            labelledBy="authguard-title"
            overlayClassName="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
            panelClassName="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300"
        >
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                    </div>

                    <h3 id="authguard-title" className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Accedi
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        Attenzione, devi fare log-in per apportare modifiche.
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

                <button
                    onClick={handleClose}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                    <X className="w-4 h-4" />
                    <span>CHIUDI</span>
                </button>
        </Modal>
    );
}
