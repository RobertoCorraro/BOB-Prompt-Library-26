import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Braces, History, RotateCcw, Clock } from 'lucide-react';
import { triggerHaptic } from '../lib/utils';
import { DEFAULT_COLOR } from '../lib/constants';

export default function AdminModal({ isOpen, onClose, onSave, onDelete, initialData, categories, types, promptTags, revisions = [] }) {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        type: '',
        tags: []
    });

    const [showHistory, setShowHistory] = useState(false);

    const textareaRef = useRef(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                tags: initialData.tags || []
            });
        } else {
            setFormData({
                title: '',
                content: '',
                category: categories[0] || '',
                type: types[0] || '',
                tags: []
            });
        }
        setShowHistory(false); // Reset history view on open
    }, [initialData, isOpen, categories, types]);

    if (!isOpen) return null;

    const handleClose = () => {
        triggerHaptic('light');
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        triggerHaptic('success');
        onSave(formData, false); // Standard save
    };

    const handleSaveRevision = () => {
        triggerHaptic('success');
        onSave(formData, true); // Save as revision
    };

    const handleDelete = () => {
        triggerHaptic('warning');
        onDelete(initialData.id);
    };

    const toggleTag = (tagName) => {
        triggerHaptic('light');
        setFormData(prev => {
            const currentTags = prev.tags || [];
            if (currentTags.includes(tagName)) {
                return { ...prev, tags: currentTags.filter(t => t !== tagName) };
            } else {
                return { ...prev, tags: [...currentTags, tagName] };
            }
        });
    };

    const insertVariablePlaceholder = () => {
        triggerHaptic('light');
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.content;

        const placeholder = "{{variabile}}";
        const newText = text.substring(0, start) + placeholder + text.substring(end);

        setFormData({ ...formData, content: newText });

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 2, start + 2 + "variabile".length);
        }, 0);
    };

    const handleRestore = (rev) => {
        triggerHaptic('warning');
        if (confirm('Vuoi ripristinare questa versione? Le modifiche non salvate andranno perse.')) {
            setFormData({
                ...formData,
                title: rev.title,
                content: rev.content,
                category: rev.category,
                type: rev.type,
                tags: rev.tags || []
            });
            setShowHistory(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            onClick={handleClose}
        >
            <div
                className="bg-white w-full sm:rounded-2xl rounded-t-2xl shadow-xl sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-slate-800">
                            {initialData ? 'Modifica Prompt' : 'Nuovo Prompt'}
                        </h2>
                        {initialData && (
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${showHistory
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                title="Storico Revisioni"
                            >
                                <History className="w-4 h-4" />
                                {revisions.length > 0 && <span>{revisions.length}</span>}
                            </button>
                        )}
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Main Form */}
                    <form onSubmit={handleSubmit} className={`flex-1 p-6 space-y-4 overflow-y-auto transition-opacity duration-200 ${showHistory ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Titolo</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                placeholder="Es: Generatore di idee..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                                >
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tag Associati</label>
                            {promptTags && promptTags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {promptTags.map(tag => {
                                        const isSelected = (formData.tags || []).includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTag(tag)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${isSelected
                                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">Nessun tag disponibile. Aggiungili dalle impostazioni.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Contenuto Prompt</label>
                            <textarea
                                ref={textareaRef}
                                required
                                rows={8}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-y font-mono text-sm"
                                placeholder="Inserisci qui il prompt..."
                            />
                            <div className="flex justify-start mt-2">
                                <button
                                    type="button"
                                    onClick={insertVariablePlaceholder}
                                    className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md transition-all border border-transparent hover:border-indigo-100"
                                    title="Inserisci segnaposto variabile"
                                >
                                    <Braces className="w-3.5 h-3.5" />
                                    <span>Inserisci Variabile</span>
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* History Sidebar */}
                    {showHistory && (
                        <div className="absolute inset-y-0 right-0 w-3/4 max-w-sm bg-slate-50 border-l border-slate-200 shadow-xl overflow-y-auto p-4 animate-in slide-in-from-right duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                    <History className="w-4 h-4" /> Storico Revisioni
                                </h3>
                                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {revisions.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">Nessuna revisione salvata.</p>
                            ) : (
                                <div className="space-y-3">
                                    {revisions.map(rev => (
                                        <div key={rev.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(rev.versionDate).toLocaleString()}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRestore(rev)}
                                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1"
                                                >
                                                    <RotateCcw className="w-3 h-3" /> Ripristina
                                                </button>
                                            </div>
                                            <p className="text-xs font-medium text-slate-800 line-clamp-1">{rev.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 font-mono bg-slate-50 p-1 rounded">
                                                {rev.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0">
                    {initialData ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Elimina</span>
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                        >
                            Annulla
                        </button>

                        {initialData && (
                            <button
                                type="button"
                                onClick={handleSaveRevision}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-all text-sm font-medium"
                                title="Salva modifiche e archivia versione precedente"
                            >
                                <History className="w-4 h-4" />
                                Salva Revisione
                            </button>
                        )}

                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md shadow-indigo-200 transition-all transform active:scale-95 text-sm font-medium"
                        >
                            <Save className="w-4 h-4" />
                            Salva
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
