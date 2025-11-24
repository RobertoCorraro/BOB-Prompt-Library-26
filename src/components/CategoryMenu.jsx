import React from 'react';
import { clsx } from 'clsx';

export default function CategoryMenu({ categories, activeCategory, onSelectCategory }) {
    return (
        <div className="sticky top-16 z-40 bg-slate-50 border-b border-slate-200 py-3">
            <div className="max-w-4xl mx-auto px-4 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 min-w-max">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => onSelectCategory(cat)}
                            className={clsx(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                                activeCategory === cat
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105"
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
