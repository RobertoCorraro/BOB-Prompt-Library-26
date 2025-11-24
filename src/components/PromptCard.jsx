import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Tag, Calendar, RefreshCw, Edit2, Star } from 'lucide-react';

export default function PromptCard({ prompt, onCopy, onEdit, onToggleFavorite }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt.content);
        onCopy(prompt.title);

        // Trigger copy animation
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    };

    return (
        <div
            className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group ${isCopied ? 'border-green-500 shadow-green-200' : 'border-slate-200'
                }`}
        >
            {/* Card Body - Click to Copy */}
            <div
                onClick={handleCopy}
                className="p-5 cursor-pointer relative active:bg-slate-50 transition-colors"
            >
                <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors flex-1 pr-2">
                        {prompt.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(prompt.id, prompt.is_favorite);
                            }}
                            className="text-slate-300 hover:text-yellow-500 transition-colors"
                            title={prompt.is_favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                        >
                            <Star
                                className={`w-5 h-5 ${prompt.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`}
                            />
                        </button>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                            {prompt.category}
                        </span>
                    </div>
                </div>

                <div className="relative">
                    <p className={`text-slate-600 leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}>
                        {prompt.content}
                    </p>
                    {!isExpanded && (
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/0 to-transparent pointer-events-none" />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>{prompt.type}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <div className="flex items-center gap-1" title="Data creazione">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                    </div>
                    {prompt.updated_at && (
                        <>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-1" title="Ultima modifica">
                                <RefreshCw className="w-3 h-3" />
                                <span>{new Date(prompt.updated_at).toLocaleDateString()}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Copy Overlay Hint */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-full shadow-sm border border-slate-100">
                    <Copy className="w-4 h-4 text-indigo-500" />
                </div>
            </div>

            {/* Expanded Content Section */}
            {isExpanded && (
                <div className="px-5 pb-4 border-t border-slate-100 pt-4 bg-slate-50/50">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(prompt);
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        <Edit2 className="w-5 h-5" />
                        <span>Modifica Prompt</span>
                    </button>
                </div>
            )}

            {/* Footer - Expand Action */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
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
