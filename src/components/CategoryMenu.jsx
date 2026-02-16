import React from 'react';
import { clsx } from 'clsx';
import { DEFAULT_COLOR } from '../lib/constants';

export default function CategoryMenu({ categories, activeCategory, onSelectCategory }) {
    return (
        <div className="sticky top-16 z-40 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 transition-colors duration-200">
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
                                        ? `shadow-md scale-105 border-transparent ${isAll ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : `${colorObj.bg} ${colorObj.text} ring-1 ring-offset-1 ring-slate-300 dark:ring-slate-700`}` // Highlight
                                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400"
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
