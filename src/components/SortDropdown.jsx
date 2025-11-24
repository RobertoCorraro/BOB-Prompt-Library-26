import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export default function SortDropdown({ sortBy, onSortChange }) {
    const sortOptions = [
        { value: 'newest', label: 'Più recenti' },
        { value: 'oldest', label: 'Più vecchi' },
        { value: 'a-z', label: 'A-Z' },
        { value: 'z-a', label: 'Z-A' }
    ];

    return (
        <div className="relative inline-block">
            <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="pl-2 pr-8 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white cursor-pointer"
                >
                    {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
