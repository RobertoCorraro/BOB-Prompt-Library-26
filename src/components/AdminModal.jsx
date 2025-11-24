import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

const CATEGORIES = ['Psicologia', 'Marketing', 'Business', 'Copywriting', 'Coding'];
const TYPES = ['Prompt parziale', 'Prompt template', 'System Prompt'];

export default function AdminModal({ isOpen, onClose, onSave, onDelete, initialData }) {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: CATEGORIES[0],
        type: TYPES[0]
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                title: '',
                content: '',
                category: CATEGORIES[0],
                type: TYPES[0]
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">
                        {initialData ? 'Modifica Prompt' : 'Nuovo Prompt'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                            >
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contenuto Prompt</label>
                        <textarea
                            required
                            rows={6}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none font-mono text-sm"
                            placeholder="Inserisci qui il prompt..."
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                        {initialData ? (
                            <button
                                type="button"
                                onClick={() => onDelete(initialData.id)}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4" />
                                Elimina
                            </button>
                        ) : (
                            <div /> /* Spacer */
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md shadow-indigo-200 transition-all transform active:scale-95 text-sm font-medium"
                            >
                                <Save className="w-4 h-4" />
                                Salva
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
