import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Tag, Calendar, RefreshCw, Edit2, Star, Braces, Zap } from 'lucide-react';
import { DEFAULT_COLOR } from '../lib/constants';
import { extractVariables, triggerHaptic } from '../lib/utils';

export default function PromptCard({ prompt, onCopy, onEdit, onToggleFavorite, onCompile, categories = [], types = [] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Lookup colors
    const categoryObj = categories.find(c => c.name === prompt.category) || { color: DEFAULT_COLOR };
    const typeObj = types.find(t => t.name === prompt.type) || { color: DEFAULT_COLOR };

    // Safety check if color is stored directly or as an object (handle both defaults)
    const catColor = categoryObj.color || DEFAULT_COLOR;
    const typeColor = typeObj.color || DEFAULT_COLOR;

    // Extract variables
    const variables = extractVariables(prompt.content);

    const handleCopy = () => {
        triggerHaptic('success');
        let contentToCopy = prompt.content;

        // Prepend variables if they exist
        if (variables.length > 0) {
            const variablesBlock = `#Variabili utili\n${variables.map(v => `- {{${v}}}: _____`).join('\n')}\n\n`;
            contentToCopy = variablesBlock + contentToCopy;
        }

        navigator.clipboard.writeText(contentToCopy);
        onCopy(prompt.title);

        // Trigger copy animation
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    };

    return (
        <div
            className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group ${isCopied
                ? 'border-green-500 shadow-green-200 dark:border-green-500/50 dark:shadow-green-900/20'
                : 'border-slate-200 dark:border-slate-700'
                }`}
        >
            {/* Variables Header (if any) */}
            {variables.length > 0 && (
                <div className={`border-b px-5 py-2 flex items-center justify-between text-xs font-mono transition-colors ${variables.length > 0
                    ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                    <div className="flex items-center gap-2">
                        <Braces className="w-3 h-3" />
                        <span>{variables.length} Variabili</span>
                    </div>
                </div>
            )}

            {/* Card Body - Click to Copy */}
            <div
                onClick={handleCopy}
                className="p-5 cursor-pointer relative active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-1 pr-2">
                        {prompt.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('light');
                                onToggleFavorite(prompt.id, prompt.is_favorite);
                            }}
                            className="text-slate-300 dark:text-slate-600 hover:text-yellow-500 dark:hover:text-yellow-500 transition-colors"
                            title={prompt.is_favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                        >
                            <Star
                                className={`w-5 h-5 ${prompt.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`}
                            />
                        </button>
                    </div>
                </div>

                {/* Category Badge - moved below title for better spacing */}
                <div className="mb-3">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border ${catColor.bg} ${catColor.text} ${catColor.border} dark:bg-opacity-20 dark:border-opacity-30`}>
                        {prompt.category}
                    </span>
                </div>

                <div className="relative">
                    {/* Display Variables Block Preview if extracted */}
                    {variables.length > 0 && isExpanded && (
                        <div className="mb-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30 text-xs font-mono text-indigo-800 dark:text-indigo-300">
                            <p className="font-bold text-indigo-400 mb-1">#Variabili utili</p>
                            <ul className="space-y-1">
                                {variables.map(v => (
                                    <li key={v}>- {'{{'}{v}{'}}'}: _____</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <p className={`text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}>
                        {prompt.content}
                    </p>
                    {!isExpanded && (
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/0 to-transparent dark:from-slate-800/90 dark:via-slate-800/0 pointer-events-none" />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {/* Category */}
                    <div className="flex items-center gap-1" title="Categoria">
                        <div className={`w-2 h-2 rounded-full ${catColor.bg}`} />
                        <span>{prompt.category}</span>
                    </div>

                    {/* Type */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${typeColor.bg} ${typeColor.text} ${typeColor.border} dark:bg-opacity-20 dark:border-opacity-30`}>
                        <Type className="w-3 h-3" />
                        <span>{prompt.type}</span>
                    </div>

                    {/* Tags */}
                    {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <div className="flex flex-wrap gap-1">
                                {prompt.tags.map(tagName => (
                                    <span key={tagName} className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                                        #{tagName}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-grow" />

                    <div className="flex items-center gap-1" title="Data creazione">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Copy Overlay Hint */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-700/90 p-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-600">
                    <Copy className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                </div>
            </div>

            {/* Expanded Content Section */}
            {isExpanded && (
                <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700 pt-4 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                    {/* Action Buttons Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Compile Button - Only if variables exist */}
                        {variables.length > 0 ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCompile(prompt);
                                }}
                                className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4 fill-white" />
                                <span>Compila & Usa</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleCopy}
                                className="col-span-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                <span>Copia Testo</span>
                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('light');
                                onEdit(prompt);
                            }}
                            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" />
                            <span>Modifica</span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('light');
                                onToggleFavorite(prompt.id, prompt.is_favorite);
                            }}
                            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Star className={`w-4 h-4 ${prompt.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            <span>{prompt.is_favorite ? 'Preferito' : 'Salva'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Footer - Expand Action */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('light');
                    setIsExpanded(!isExpanded);
                }}
                className="bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-4 py-2 flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
            </div>
        </div>
    );
}
