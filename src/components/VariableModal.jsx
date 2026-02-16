import React, { useState, useEffect } from 'react';
import { X, Copy, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/utils';
import { clsx } from 'clsx';

export default function VariableModal({ isOpen, onClose, prompt, variables }) {
    const [values, setValues] = useState({});

    // Reset values when modal opens or prompt/variables change
    useEffect(() => {
        if (isOpen) {
            const initialValues = {};
            variables.forEach(v => {
                initialValues[v] = '';
            });
            setValues(initialValues);
        }
    }, [isOpen, variables]);

    if (!isOpen || !prompt) return null;

    const handleClose = () => {
        triggerHaptic('light');
        onClose();
    };

    const handleInputChange = (variable, value) => {
        setValues(prev => ({
            ...prev,
            [variable]: value
        }));
    };

    const handleCopy = () => {
        triggerHaptic('success');

        // Replace all instances of variables with values
        let content = prompt.content;
        variables.forEach(v => {
            const val = values[v] || ''; // Use empty string if undefined, or keep placeholder? User likely wants empty string if left blank.
            // Regex to replace all occurrences of {{variable}}
            // We escape the variable name just in case it has special regex chars
            const escapedVar = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\{\\{${escapedVar}\\}\\}`, 'g');
            content = content.replace(regex, val);
        });

        navigator.clipboard.writeText(content);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="bg-white dark:bg-slate-900 w-full sm:rounded-2xl rounded-t-2xl shadow-xl sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 rounded-lg">
                            <Zap className="w-5 h-5 fill-violet-600 dark:fill-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">Compila Prompt</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{prompt.title}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Inserisci i valori per le variabili. Il prompt verrà compilato e copiato automaticamente.
                    </p>

                    <div className="space-y-3">
                        {variables.map(variable => (
                            <div key={variable}>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                    {variable}
                                </label>
                                <input
                                    type="text"
                                    value={values[variable] || ''}
                                    onChange={(e) => handleInputChange(variable, e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-500/20 outline-none transition-all bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 text-base"
                                    placeholder={`Valore per ${variable}...`}
                                    autoFocus={variables.indexOf(variable) === 0}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sticky bottom-0 pb-safe">
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-violet-200 transition-all active:scale-[0.98]"
                    >
                        <Copy className="w-5 h-5" />
                        <span>Copia Prompt Compilato</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
