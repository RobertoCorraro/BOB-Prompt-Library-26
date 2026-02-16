import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Braces, History, RotateCcw, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { triggerHaptic } from '../lib/utils';
import { DEFAULT_COLOR } from '../lib/constants';
import { supabase } from '../lib/supabase';

export default function AdminModal({ isOpen, onClose, onSave, onDelete, initialData, categories, types, promptTags, revisions = [] }) {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        type: '',
        tags: []
    });

    const [showHistory, setShowHistory] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

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
        setShowHistory(false);
        setIsFullscreen(false); // Reset fullscreen on open
    }, [initialData, isOpen, categories, types]);

    if (!isOpen) return null;

    const handleClose = () => {
        triggerHaptic('light');
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        triggerHaptic('success');

        try {
            const { data, error } = await supabase.from('prompts').insert([
                {
                    title: formData.title,
                    content: formData.content,
                    category: formData.category,
                    type: formData.type,
                    tags: formData.tags,
                },
            ]);

            if (error) {
                console.error('Errore durante il salvataggio:', error);
                alert('Errore durante il salvataggio del prompt.');
            } else {
                console.log('Prompt salvato con successo:', data);
                alert('Prompt salvato con successo!');
                onSave(formData, false); // Standard save
            }
        } catch (err) {
            console.error('Errore imprevisto:', err);
            alert('Si è verificato un errore imprevisto.');
        }
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
            className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 ${isFullscreen ? 'p-0 sm:p-0' : ''}`}
            onClick={handleClose}
        >
            <div
                className={`bg-white dark:bg-slate-900 w-full sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 transition-all ${isFullscreen
                    ? 'h-full sm:h-full max-w-none rounded-none sm:rounded-none'
                    : 'sm:max-w-lg max-h-[90vh]'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px] sm:max-w-none">
                            {initialData ? 'Modifica' : 'Nuovo'} <span className="hidden sm:inline">Prompt</span>
                        </h2>
                        {/* History Button */}
                        {initialData && (
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${showHistory
                                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                                    }`}
                                title="Storico Revisioni"
                            >
                                <History className="w-4 h-4" />
                                <span className="hidden sm:inline">{revisions.length > 0 && revisions.length}</span>
                            </button>
                        )}
                        {/* Fullscreen Button */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${isFullscreen
                                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                                }`}
                            title={isFullscreen ? "Riduci" : "Schermo Intero"}
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Main Form */}
                    <form onSubmit={handleSubmit} className={`flex-1 p-6 space-y-4 overflow-y-auto transition-opacity duration-200 flex flex-col ${showHistory ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>

                        {/* Non-editor fields: Hide if fullscreen */}
                        <div className={`space-y-4 ${isFullscreen ? 'hidden' : 'block'}`}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titolo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/20 outline-none transition-all text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                    placeholder="Es: Generatore di idee..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/20 outline-none transition-all bg-white dark:bg-slate-800 text-base text-slate-900 dark:text-slate-100"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/20 outline-none transition-all bg-white dark:bg-slate-800 text-base text-slate-900 dark:text-slate-100"
                                    >
                                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tag Associati</label>
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
                                                        ? 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-200 hover:text-violet-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-violet-700 dark:hover:text-violet-400'
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
                        </div>

                        {/* Editor Area: Flex grow in fullscreen */}
                        <div className={`flex flex-col ${isFullscreen ? 'flex-1 h-full' : ''}`}>
                            <label className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ${isFullscreen ? 'hidden' : 'block'}`}>Contenuto Prompt</label>
                            <textarea
                                ref={textareaRef}
                                required
                                rows={isFullscreen ? undefined : 12} // Increased default height
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/20 outline-none transition-all resize-y font-mono text-base leading-relaxed bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${isFullscreen ? 'flex-1 resize-none p-4 text-base' : ''
                                    }`}
                                placeholder="Inserisci qui il prompt..."
                            />
                            <div className="flex justify-start mt-2">
                                <button
                                    type="button"
                                    onClick={insertVariablePlaceholder}
                                    className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 px-2 py-1 rounded-md transition-all border border-transparent hover:border-violet-100"
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
                            {/* ... existing history sidebar content ... */}
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
                                                    className="text-violet-600 hover:text-violet-800 text-xs font-medium flex items-center gap-1"
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
                <div className={`flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 ${isFullscreen ? 'hidden sm:flex' : ''}`}> {/* Show footer in fullscreen on desktop, usually useful. Mobile maybe hide to maximize space? Let's keep it visible so user can save. */}
                    {/* Actually, user might want to save while in fullscreen. Let's keep it. */}

                    {initialData ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className={`flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium ${isFullscreen ? 'hidden' : ''}`}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Elimina</span>
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-3 ml-auto">
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
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg transition-all text-sm font-medium"
                                title="Salva modifiche e archivia versione precedente"
                            >
                                <History className="w-4 h-4" />
                                Salva Revisione
                            </button>
                        )}

                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-md shadow-violet-200 transition-all transform active:scale-95 text-sm font-medium"
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
