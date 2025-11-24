import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Tag } from 'lucide-react';

export default function PromptCard({ prompt, onCopy }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt.content);
        onCopy(prompt.title);
    };

    return (
        <div
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
        >
            {/* Card Body - Click to Copy */}
            <div
                onClick={handleCopy}
                className="p-5 cursor-pointer relative active:bg-slate-50 transition-colors"
            >
                <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                        {prompt.title}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0 ml-2">
                        {prompt.category}
                    </span>
                </div>

                <div className="relative">
                    <p className={`text-slate-600 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                        {prompt.content}
                    </p>
                    {!isExpanded && (
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/0 to-transparent pointer-events-none" />
                    )}
                </div>

                <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 font-medium">
                    <Tag className="w-3 h-3" />
                    <span>{prompt.type}</span>
                </div>

                {/* Copy Overlay Hint */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-full shadow-sm border border-slate-100">
                    <Copy className="w-4 h-4 text-indigo-500" />
                </div>
            </div>

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
