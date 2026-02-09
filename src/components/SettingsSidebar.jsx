import React, { useEffect, useRef } from 'react';
import { X, Tag, FolderTree, Type, LogOut, Sliders, Settings } from 'lucide-react';
import { triggerHaptic } from '../lib/utils';
import { DEFAULT_COLOR } from '../lib/constants';

export default function SettingsSidebar({
    isOpen,
    onClose,
    onOpenSettings,
    onLogout,
    userEmail,
    // Filters
    types = [],
    activeType,
    onSelectType,
    tags = [],
    selectedTags,
    onSelectTags
}) {
    const sidebarRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
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
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={sidebarRef}
                className="w-full max-w-xs h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300"
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Filtri & Opzioni</h2>
                    </div>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            onClose();
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Filters (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-8">

                    {/* Section: Type Filter */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                            <Type className="w-3 h-3" />
                            Filtra per Tipologia
                        </h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    onSelectType('Tutti');
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${activeType === 'Tutti'
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${activeType === 'Tutti' ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                Tutti
                            </button>
                            {types.map(type => {
                                const color = type.color || DEFAULT_COLOR;
                                return (
                                    <button
                                        key={type.id || type.name}
                                        onClick={() => {
                                            triggerHaptic('light');
                                            onSelectType(type.name);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${activeType === type.name
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <div className={`w-3 h-3 rounded-full border ${color.bg} ${color.border}`} />
                                        {type.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section: Tag Filter */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                            <Tag className="w-3 h-3" />
                            Filtra per Tag
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
                                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                }`}
                                        >
                                            {isSelected && <span className="mr-1">✓</span>}
                                            {tag.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {selectedTags.length > 0 && (
                            <button
                                onClick={() => onSelectTags([])}
                                className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 px-2 font-medium"
                            >
                                Resetta filtri tag
                            </button>
                        )}
                    </div>

                </div>

                {/* Footer / Management (Pinned to bottom) */}
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">

                    {/* Management Links */}
                    <div className="p-2 grid grid-cols-3 gap-1 border-b border-slate-100 dark:border-slate-800/50">
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                onOpenSettings('categories');
                            }}
                            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors group"
                            title="Gestisci Categorie"
                        >
                            <FolderTree className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 mb-1" />
                            <span className="text-[10px] text-slate-500 font-medium">Categorie</span>
                        </button>
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                onOpenSettings('types');
                            }}
                            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors group"
                            title="Gestisci Tipologie"
                        >
                            <Type className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 mb-1" />
                            <span className="text-[10px] text-slate-500 font-medium">Tipi</span>
                        </button>
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                onOpenSettings('tags');
                            }}
                            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors group"
                            title="Gestisci Tag"
                        >
                            <Tag className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 mb-1" />
                            <span className="text-[10px] text-slate-500 font-medium">Tag</span>
                        </button>
                    </div>

                    {/* Account & Logout */}
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 text-xs">
                                {userEmail ? userEmail[0].toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {userEmail || 'Utente'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    triggerHaptic('warning');
                                    onLogout();
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Esci"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
