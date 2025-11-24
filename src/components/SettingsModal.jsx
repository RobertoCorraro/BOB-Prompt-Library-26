import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, title, items, onAddItem, onDeleteItem, isLoading }) {
    const [newItemName, setNewItemName] = useState('');

    if (!isOpen) return null;

    const handleAdd = (e) => {
        e.preventDefault();
        if (newItemName.trim()) {
            onAddItem(newItemName.trim());
            setNewItemName('');
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Gestisci {title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder={`Nuova ${title.slice(0, -1)}...`}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newItemName.trim() || isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        </button>
                    </form>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {items.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-4">Nessun elemento presente.</p>
                        ) : (
                            items.map((item) => (
                                <div key={item.id || item} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                                    <span className="font-medium text-slate-700">{item.name || item}</span>
                                    <button
                                        onClick={() => onDeleteItem(item.id || item)}
                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Elimina"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
