import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Tag, Calendar, RefreshCw, Edit2, Star, Braces, Zap, Type, Trash2, Eye, CopyPlus, User } from 'lucide-react';
import { DEFAULT_COLOR } from '../lib/constants';
import { extractVariables, triggerHaptic, formatDate } from '../lib/utils';

export default function PromptCard({
    prompt,
    onCopy,
    onEdit,
    onDelete,
    onToggleFavorite,
    onCompile,
    onView,
    onDuplicate,
    categories = [],
    types = [],
    viewMode = 'grid'
}) {
    const [isCopied, setIsCopied] = useState(false);

    // Lookup colors
    const categoryObj = categories.find(c => c.name === prompt.category) || { color: DEFAULT_COLOR };
    const typeObj = types.find(t => t.name === prompt.type) || { color: DEFAULT_COLOR };

    const catColor = categoryObj.color || DEFAULT_COLOR;
    const typeColor = typeObj.color || DEFAULT_COLOR;

    const variables = extractVariables(prompt.content);

    const renderContentWithHighlights = (content) => {
        if (!content) return null;
        const parts = content.split(/(\{\{[^{}]+\}\})/g);
        return parts.map((part, i) => {
            if (part.startsWith('{{') && part.endsWith('}}')) {
                return (
                    <strong key={i} className="text-sky-600 dark:text-sky-400 font-bold">
                        {part}
                    </strong>
                );
            }
            return part;
        });
    };

    const handleCopy = (e) => {
        if (e) e.stopPropagation();
        triggerHaptic('success');
        let contentToCopy = prompt.content;

        if (variables.length > 0) {
            const variablesBlock = `#Variabili utili\n${variables.map(v => `- {{${v}}}: _____`).join('\n')}\n\n`;
            contentToCopy = variablesBlock + contentToCopy;
        }

        navigator.clipboard.writeText(contentToCopy);
        onCopy(prompt.title);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        onEdit(prompt);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        triggerHaptic('warning');
        if (window.confirm('Sei sicuro di voler eliminare questo prompt?')) {
            onDelete(prompt.id);
        }
    };

    const handleToggleFavorite = (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        onToggleFavorite(prompt.id, prompt.is_favorite);
    };

    const handleDuplicate = (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        onDuplicate(prompt);
    };

    const handleView = (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        onView(prompt);
    };

    if (viewMode === 'list') {
        return (
            <div className={`flex items-center w-full mb-3 bg-white dark:bg-slate-800 rounded-lg border shadow-sm overflow-hidden transition-all ${isCopied
                ? 'border-green-500 shadow-green-200 dark:border-green-500/50 dark:shadow-green-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600'
                }`}>
                <div onClick={handleView} className="flex-1 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center min-w-0">
                    <div className="flex flex-col gap-1 overflow-hidden">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">{prompt.title}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                            <span className="truncate">{prompt.category}</span>
                            <span>•</span>
                            <span className="truncate">{prompt.type}</span>
                            {prompt.owner_name && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 truncate">
                                        <User className="w-2.5 h-2.5 shrink-0" />
                                        {prompt.owner_name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-stretch border-l border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50">
                    <button onClick={handleView} className="w-12 sm:w-16 flex items-center justify-center text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-all active:scale-95" title="Visualizza"><Eye className="w-5 h-5" /></button>
                    <button onClick={handleCopy} className={`w-12 sm:w-16 flex items-center justify-center transition-all active:scale-95 ${isCopied ? 'text-green-600 dark:text-green-400' : 'text-slate-400 hover:text-sky-600 dark:hover:text-sky-400'}`} title="Copia">
                        {isCopied ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button onClick={handleEdit} className="w-12 sm:w-16 flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95" title="Modifica"><Edit2 className="w-5 h-5" /></button>
                    {onDuplicate && <button onClick={handleDuplicate} className="w-12 sm:w-16 flex items-center justify-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95" title="Duplica"><CopyPlus className="w-5 h-5" /></button>}
                    <button onClick={handleDelete} className="w-12 sm:w-16 flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95" title="Elimina"><Trash2 className="w-5 h-5" /></button>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col ${isCopied ? 'border-green-500 shadow-green-200 dark:border-green-500/50 dark:shadow-green-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
            {/* Top Action Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700/50">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${catColor.bg} ${catColor.text} ${catColor.border} dark:bg-opacity-20`}>
                    {prompt.category}
                </span>
                <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button onClick={handleCopy} className={`p-2.5 transition-colors border-r border-slate-100 dark:border-slate-700 ${isCopied ? 'text-green-600' : 'text-slate-400 hover:text-sky-600'}`} title="Copia">
                        <Copy className="w-4.5 h-4.5" />
                    </button>
                    <button onClick={handleEdit} className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors border-r border-slate-100 dark:border-slate-700" title="Modifica"><Edit2 className="w-4.5 h-4.5" /></button>
                    <button onClick={handleDelete} className="p-2.5 text-slate-400 hover:text-red-600 transition-colors border-r border-slate-100 dark:border-slate-700" title="Elimina"><Trash2 className="w-4.5 h-4.5" /></button>
                    {onDuplicate && <button onClick={handleDuplicate} className="p-2.5 text-slate-400 hover:text-emerald-600 transition-colors border-r border-slate-100 dark:border-slate-700" title="Duplica"><CopyPlus className="w-4.5 h-4.5" /></button>}
                    <button onClick={handleToggleFavorite} className={`p-2.5 transition-colors ${prompt.is_favorite ? 'text-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : 'text-slate-400 hover:text-yellow-500'}`} title="Preferiti">
                        <Star className={`w-4.5 h-4.5 ${prompt.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div onClick={() => onCompile(prompt)} className="p-5 cursor-pointer relative active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors flex-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight mb-3 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors pr-2">{prompt.title}</h3>
                <div className="relative">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-3">{renderContentWithHighlights(prompt.content)}</p>
                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/0 to-transparent dark:from-slate-800/90 dark:via-slate-800/0 pointer-events-none" />
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-medium">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${typeColor.bg} ${typeColor.text} ${typeColor.border} dark:bg-opacity-20 dark:border-opacity-30`}>
                        <Type className="w-3.5 h-3.5" />
                        <span>{prompt.type}</span>
                    </div>

                    {variables.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/50">
                            <Braces className="w-3.5 h-3.5" />
                            <span>{variables.length} {variables.length === 1 ? 'Variabile' : 'Variabili'}</span>
                        </div>
                    )}

                    {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-3 text-slate-400 dark:text-slate-500">
                            <Tag className="w-3 h-3" />
                            <div className="flex flex-wrap gap-1">
                                {prompt.tags.map(tag => <span key={tag} className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">#{tag}</span>)}
                            </div>
                        </div>
                    )}
                    <div className="ml-auto flex items-center gap-2.5 text-slate-400 dark:text-slate-500">
                        {prompt.owner_name && (
                            <span className="flex items-center gap-1" title={`Creato da ${prompt.owner_name}`}>
                                <User className="w-3 h-3" />
                                <span className="max-w-[90px] truncate">{prompt.owner_name}</span>
                            </span>
                        )}
                        {formatDate(prompt.created) && (
                            <span className="flex items-center gap-1" title={formatDate(prompt.created, { timeZone: 'Europe/Rome', dateStyle: 'long', timeStyle: 'short' })}>
                                <Calendar className="w-3 h-3" />
                                {formatDate(prompt.created, {
                                    timeZone: 'Europe/Rome',
                                    day: '2-digit', month: '2-digit', year: 'numeric'
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer View Button */}
            <div onClick={handleView} className="bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 py-3 flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group/view">
                <div className="flex items-center gap-2 text-slate-400 group-hover/view:text-sky-600 transition-colors">
                    <Eye className="w-4.5 h-4.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Visualizza</span>
                </div>
            </div>
        </div>
    );
}
