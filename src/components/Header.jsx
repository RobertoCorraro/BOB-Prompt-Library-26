import React, { useState, useEffect } from 'react';
import { Search, Settings, LogOut, Moon, Sun, Heart } from 'lucide-react';
import { triggerHaptic } from '../lib/utils';

export default function Header({ onSearch, onSettings, userEmail, showFavorites, onToggleFavorites }) {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => {
        triggerHaptic('light');
        setIsDark(!isDark);
    };

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">B</span>
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 hidden sm:block">
                        Bob Prompt Manager
                    </h1>
                </div>

                <div className="flex-1 max-w-md relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Cerca prompt..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Favorites Toggle */}
                    <button
                        onClick={onToggleFavorites}
                        className={`p-2 rounded-full transition-colors ${showFavorites
                                ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'
                                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800'
                            }`}
                        title={showFavorites ? "Mostra tutti" : "Mostra solo preferiti"}
                    >
                        <Heart className={`w-5 h-5 ${showFavorites ? 'fill-current' : ''}`} />
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            onSettings();
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title="Impostazioni"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-medium text-xs">
                            {userEmail ? userEmail[0].toUpperCase() : 'U'}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
