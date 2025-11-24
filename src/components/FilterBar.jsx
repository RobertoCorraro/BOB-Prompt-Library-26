import React from 'react';
import { Filter } from 'lucide-react';

export default function FilterBar({ types, activeType, onSelectType }) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 text-slate-400 text-sm font-medium shrink-0">
                <Filter className="w-4 h-4" />
                <span>Filtra:</span>
            </div>
            {types.map((type) => (
                <button
                    key={type}
                    onClick={() => onSelectType(type)}
                    className={`text-xs px-3 py-1.5 rounded-md border transition-colors shrink-0 ${activeType === type
                            ? 'bg-violet-100 border-violet-200 text-violet-700 font-medium'
                            : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                >
                    {type}
                </button>
            ))}
        </div>
    );
}
