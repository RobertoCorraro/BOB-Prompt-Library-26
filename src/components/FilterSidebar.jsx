import React, { useEffect, useRef } from 'react';
import { X, Tag, FolderTree, Type, SlidersHorizontal, Heart, RotateCcw, Settings } from 'lucide-react';
import { triggerHaptic } from '../lib/utils';
import { DEFAULT_COLOR } from '../lib/constants';

export default function FilterSidebar({
    isOpen,
    onClose,
    // Taxonomy data
    categories = [],
    activeCategory,
    onSelectCategory,
    types = [],
    activeType,
    onSelectType,
    tags = [],
    selectedTags = [],
    onSelectTags,
    showFavorites,
    onToggleFavorites,
    onResetFilters,
    isLoggedIn,
    onOpenSettings
}) {
    const sidebarRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const toggleTagFilter = (tagName) => {
        triggerHaptic('light');
        if (selectedTags.includes(tagName)) {
            onSelectTags(selectedTags.filter(t => t !== tagName));
        } else {
            onSelectTags([...selectedTags, tagName]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-hidden">
            <div
                ref={sidebarRef}
                className="w-full max-w-[280px] h-full bg-white dark:bg-slate-950 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-left duration-500 ease-out"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 sticky top-0 z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-sky-50 dark:bg-sky-900/30 rounded-xl text-sky-600 dark:text-sky-400 shadow-sm shadow-sky-100 dark:shadow-none">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-1">Filtri</h2>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Ecommerce Style</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            onClose();
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Filters (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-5 space-y-9 no-scrollbar">

                    {/* Section: Favorites Quick Access */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Heart className="w-3.5 h-3.5" />
                                Preferiti
                            </h3>
                        </div>
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                onToggleFavorites();
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all border-2 ${showFavorites
                                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 font-bold'
                                : 'text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Heart className={`w-4 h-4 ${showFavorites ? 'fill-current animate-pulse' : ''}`} />
                                <span className="text-sm">Solo Preferiti</span>
                            </div>
                            {showFavorites && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
                        </button>
                    </div>

                    {/* Section: Categories */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <FolderTree className="w-3.5 h-3.5" />
                            Categorie
                        </h3>
                        <div className="space-y-1.5">
                            {categories.map(cat => {
                                const isSelected = activeCategory === cat.name;
                                const color = cat.color || DEFAULT_COLOR;
                                return (
                                    <button
                                        key={cat.id || cat.name}
                                        onClick={() => {
                                            triggerHaptic('light');
                                            onSelectCategory(cat.name);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${isSelected
                                            ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-900/50'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                            <span>{cat.name}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section: Type Filter */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Type className="w-3.5 h-3.5" />
                            Tipologie
                        </h3>
                        <div className="space-y-1.5">
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    onSelectType('Tutti');
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${activeType === 'Tutti'
                                    ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${activeType === 'Tutti' ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                Tutti i Tipi
                            </button>
                            {types.map(type => {
                                const color = type.color || DEFAULT_COLOR;
                                const isSelected = activeType === type.name;
                                return (
                                    <button
                                        key={type.id || type.name}
                                        onClick={() => {
                                            triggerHaptic('light');
                                            onSelectType(type.name);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${isSelected
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold border border-slate-200 dark:border-slate-700'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full border ${color.bg} ${color.border}`} />
                                        {type.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section: Tag Filter */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5" />
                            Tag
                        </h3>
                        {tags.length === 0 ? (
                            <p className="px-2 text-sm text-slate-400 italic">Nessun tag disponibile.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2 px-1">
                                {tags.map(tag => {
                                    const isSelected = selectedTags.includes(tag.name);
                                    return (
                                        <button
                                            key={tag.id || tag.name}
                                            onClick={() => toggleTagFilter(tag.name)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border-2 ${isSelected
                                                ? 'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-200 dark:shadow-none scale-105'
                                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700'
                                                }`}
                                        >
                                            {tag.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - Reset Actions */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 mt-auto sticky bottom-0">
                    <button
                        onClick={() => {
                            triggerHaptic('warning');
                            onResetFilters();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-95 group mb-4"
                    >
                        <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
                        Resetta Tutti i Filtri
                    </button>

                    {isLoggedIn && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => onOpenSettings('categories')}
                                className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                title="Gestisci Tassonomie"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Mode</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
