import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ searchQuery, onSearchChange }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Cerca prompt per titolo o contenuto..."
        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          title="Cancella ricerca"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
