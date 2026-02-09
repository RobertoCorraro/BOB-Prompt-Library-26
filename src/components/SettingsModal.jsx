import React, { useState } from 'react';
import { X, Plus, Trash2, Loader2, Check, Pencil, Save, RotateCcw } from 'lucide-react';
import { COLOR_PALETTE, DEFAULT_COLOR } from '../lib/constants';
import { triggerHaptic } from '../lib/utils';

export default function SettingsModal({ isOpen, onClose, title, items, onAddItem, onUpdateItem, onDeleteItem, isLoading }) {
    const [newItemName, setNewItemName] = useState('');
    const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
    const [editingItem, setEditingItem] = useState(null); // The item currently being edited

    if (!isOpen) return null;

    const handleClose = () => {
        triggerHaptic('light');
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        triggerHaptic('success');
        if (editingItem) {
            // Update existing
            onUpdateItem(editingItem.id, { name: newItemName.trim(), color: selectedColor });
            setEditingItem(null);
        } else {
            // Add new
            onAddItem({ name: newItemName.trim(), color: selectedColor });
        }

        // Reset form
        setNewItemName('');
        setSelectedColor(DEFAULT_COLOR);
    };

    const startEditing = (item) => {
        triggerHaptic('light');
        setEditingItem(item);
        setNewItemName(item.name);

        // Handle color resolution
        const itemColor = item.color || DEFAULT_COLOR;
        const colorObj = typeof itemColor === 'string'
            ? COLOR_PALETTE.find(c => c.id === itemColor) || DEFAULT_COLOR
            : itemColor;

        setSelectedColor(colorObj);
    };

    const cancelEditing = () => {
        triggerHaptic('light');
        setEditingItem(null);
        setNewItemName('');
        setSelectedColor(DEFAULT_COLOR);
    };

    const handleDelete = (id) => {
        triggerHaptic('warning');
        onDeleteItem(id);
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="bg-white w-full sm:rounded-2xl rounded-t-2xl shadow-xl sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">
                        {editingItem ? `Modifica ${title.slice(0, -1)}` : `Gestisci ${title}`}
                    </h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="mb-6 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder={editingItem ? "Modifica nome..." : `Nuova ${title.slice(0, -1)}...`}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                            />
                            <button
                                type="submit"
                                disabled={!newItemName.trim() || isLoading}
                                className={`text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${editingItem ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                title={editingItem ? "Salva Modifiche" : "Aggiungi"}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingItem ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </button>

                            {editingItem && (
                                <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {editingItem ? "Modifica Colore" : "Scegli Colore"}
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_PALETTE.map((color) => (
                                    <button
                                        key={color.id}
                                        type="button"
                                        onClick={() => { triggerHaptic('light'); setSelectedColor(color); }}
                                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${color.bg} ${selectedColor.id === color.id
                                            ? 'border-slate-800 scale-110 shadow-sm'
                                            : 'border-transparent hover:scale-105'
                                            }`}
                                        title={color.name}
                                    >
                                        {selectedColor.id === color.id && (
                                            <Check className={`w-4 h-4 ${color.text}`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {items.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-4">Nessun elemento presente.</p>
                        ) : (
                            items.map((item) => {
                                // Fallback to default color if item has no color property (backward compatibility)
                                const itemColor = item.color || DEFAULT_COLOR;
                                // Handle if item.color is just an ID string (future proofing) or object
                                const colorObj = typeof itemColor === 'string'
                                    ? COLOR_PALETTE.find(c => c.id === itemColor) || DEFAULT_COLOR
                                    : itemColor;

                                const isEditingThis = editingItem && editingItem.id === item.id;

                                return (
                                    <div
                                        key={item.id || item.name}
                                        className={`flex items-center justify-between p-3 rounded-lg group transition-all border ${isEditingThis
                                            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                            : 'bg-white border-slate-100 hover:shadow-sm hover:border-indigo-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full ${colorObj.bg} border ${colorObj.border}`} />
                                            <span className={`font-medium ${isEditingThis ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                {item.name || item}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditing(item)}
                                                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors"
                                                title="Modifica"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id || item)}
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                                title="Elimina"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
