import React from 'react';
import { X, Copy, Zap, Clock, Tag, Type, Calendar, Edit2, Trash2, CopyPlus, Star, Check } from 'lucide-react';
import { triggerHaptic, extractVariables } from '../lib/utils';

export default function PromptViewModal({
    isOpen,
    onClose,
    prompt,
    onCopy,
    onCompile,
    onEdit,
    onDelete,
    onDuplicate,
    onToggleFavorite
}) {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen || !prompt) return null;

    const handleCopy = () => {
        triggerHaptic('success');
        const variables = extractVariables(prompt.content);
        let contentToCopy = prompt.content;

        if (variables.length > 0) {
            const variablesBlock = `#Variabili utili\n${variables.map(v => `- {{${v}}}: _____`).join('\n')}\n\n`;
            contentToCopy = variablesBlock + contentToCopy;
        }

        navigator.clipboard.writeText(contentToCopy);
        onCopy(prompt.title);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEdit = () => {
        triggerHaptic('light');
        onClose();
        onEdit(prompt);
    };

    const handleDelete = () => {
        triggerHaptic('warning');
        if (window.confirm('Sei sicuro di voler eliminare questo prompt?')) {
            onDelete(prompt.id);
            onClose();
        }
    };

    const handleDuplicate = () => {
        triggerHaptic('light');
        onDuplicate(prompt);
        onClose();
    };

    const handleToggleFavorite = () => {
        triggerHaptic('light');
        onToggleFavorite(prompt.id, prompt.is_favorite);
    };

    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div
                className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded">
                                {prompt.category}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                {prompt.type}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate">{prompt.title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Content Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Contenuto del Prompt</label>
                            <button
                                onClick={handleCopy}
                                className="text-violet-600 dark:text-violet-400 text-xs font-bold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                            >
                                <Copy className="w-3.5 h-3.5" /> COPIA TESTO
                            </button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                            <pre className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed text-base">
                                {prompt.content}
                            </pre>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Etichette (Tag)</label>
                            <div className="flex flex-wrap gap-2">
                                {prompt.tags && prompt.tags.length > 0 ? (
                                    prompt.tags.map(tag => (
                                        <span key={tag} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-600">
                                            #{tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-slate-400 text-xs italic">Nessun tag</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Info Temporali</label>
                            <div className="flex flex-col gap-1 text-xs text-slate-500">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Creato il: {new Date(prompt.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                {prompt.updated_at && (
                                    <span className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" /> Ultima modifica: {new Date(prompt.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 sm:gap-3">
                    {/* Primary Actions */}
                    <button
                        onClick={handleCopy}
                        className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-95 ${copied
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
                        <span>{copied ? 'Copiato!' : 'Copia'}</span>
                    </button>

                    <button
                        onClick={() => { onClose(); onCompile(prompt); }}
                        className="flex-1 min-w-[140px] bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Zap className="w-4.5 h-4.5 fill-current" />
                        <span>Usa Prompt</span>
                    </button>

                    {/* Secondary Actions Row */}
                    <div className="w-full flex gap-2">
                        <button
                            onClick={handleToggleFavorite}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all active:scale-95 ${prompt.is_favorite
                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-500'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Star className={`w-4 h-4 ${prompt.is_favorite ? 'fill-current' : ''}`} />
                            <span>{prompt.is_favorite ? 'Preferito' : 'Salva'}</span>
                        </button>

                        <button
                            onClick={handleEdit}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all active:scale-95"
                        >
                            <Edit2 className="w-4 h-4" />
                            <span>Modifica</span>
                        </button>

                        {onDuplicate && (
                            <button
                                onClick={handleDuplicate}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all active:scale-95"
                            >
                                <CopyPlus className="w-4 h-4" />
                                <span>Duplica</span>
                            </button>
                        )}

                        <button
                            onClick={handleDelete}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-bold transition-all active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Elimina</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
