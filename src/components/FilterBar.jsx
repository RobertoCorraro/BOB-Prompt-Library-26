import React from 'react';
import { Filter } from 'lucide-react';
import { DEFAULT_COLOR } from '../lib/constants';

export default function FilterBar({ types, activeType, onSelectType }) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 text-slate-400 text-sm font-medium shrink-0">
                <Filter className="w-4 h-4" />
                <span>Filtra:</span>
            </div>
            {types.map((type) => {
                const isSelected = activeType === type.name;
                const color = type.color || DEFAULT_COLOR;
                const isAll = type.name === 'Tutti';

                return (
                    <button
                        key={type.name}
                        onClick={() => onSelectType(type.name)}
                        className={`text-xs px-3 py-1.5 rounded-md border transition-all duration-200 shrink-0 ${isSelected
                            ? isAll
                                ? 'bg-slate-800 text-white border-transparent'
                                : `${color.bg} ${color.text} ${color.border} font-bold shadow-sm`
                            : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                    >
                        {type.name}
                    </button>
                );
            })}
        </div>
    );
}
