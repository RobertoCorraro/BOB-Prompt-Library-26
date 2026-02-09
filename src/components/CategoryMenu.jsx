import React from 'react';
import { clsx } from 'clsx';
import { DEFAULT_COLOR } from '../lib/constants';

export default function CategoryMenu({ categories, activeCategory, onSelectCategory }) {
    return (
        <div className="sticky top-16 z-40 bg-slate-50 border-b border-slate-200 py-3">
            <div className="max-w-4xl mx-auto px-4 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 min-w-max">
                    {categories.map((cat) => {
                        const isSelected = activeCategory === cat.name;
                        // Handle 'Tutti' or string-only categories (fallback)
                        const color = cat.color || DEFAULT_COLOR;
                        const colorObj = typeof color === 'string'
                            ? { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' } // Fallback for strings lookup if needed, or just default
                            : color;

                        // For "Tutti", we might want a specific neutral style or just use the default Slate
                        const isAll = cat.name === 'Tutti';

                        return (
                            <button
                                key={cat.name}
                                onClick={() => onSelectCategory(cat.name)}
                                className={clsx(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                                    isSelected
                                        ? `shadow-md scale-105 border-transparent ${isAll ? 'bg-slate-800 text-white' : `${colorObj.bg} ${colorObj.text} ring-1 ring-offset-1 ring-slate-300`}` // Highlight
                                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                )}
                                style={isSelected && !isAll ? { backgroundColor: 'var(--tw-bg-opacity)' } : {}} // Tailwind handling is tricky with dynamic classes, relying on the class injection above
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
