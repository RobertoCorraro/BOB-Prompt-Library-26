import React, { useState, useEffect } from 'react';
import { Search, Settings, LogOut, Moon, Sun, Heart, Download } from 'lucide-react';
import { triggerHaptic } from '../lib/utils';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.1.0';

export default function Header({ searchRef, onSearch, onSettings, userEmail, showFavorites, onToggleFavorites, isLoggedIn, onLogin, onLogout, onExport }) {
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
                    <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">B</span>
                    </div>
                    <div className="hidden sm:flex flex-col leading-none">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400">
                            Bob Prompt Manager
                        </h1>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
                            v{APP_VERSION}
                        </span>
                    </div>
                    {/* Versione compatta su mobile, accanto al logo */}
                    <span className="sm:hidden text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        v{APP_VERSION}
                    </span>
                </div>

                <div className="flex-1 max-w-md relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Cerca prompt..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Favorites Toggle */}
                    <button
                        onClick={onToggleFavorites}
                        className={`p-1.5 sm:p-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                            showFavorites
                            ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-sm shadow-rose-100 dark:shadow-none'
                            : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800'
                        }`}
                        title={showFavorites ? "Mostra tutti" : "Mostra solo preferiti"}
                    >
                        <Heart className={`w-5 h-5 ${showFavorites ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-bold hidden xs:block">Preferiti</span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-sky-600 dark:text-slate-500 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex flex-col items-center gap-0.5 transition-all"
                        title={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        <span className="text-[10px] font-bold hidden xs:block">Tema</span>
                    </button>

                    {isLoggedIn && (
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                onExport();
                            }}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex flex-col items-center gap-0.5 transition-all"
                            title="Esporta Prompt"
                        >
                            <Download className="w-5 h-5" />
                            <span className="text-[10px] font-bold hidden xs:block">Esporta</span>
                        </button>
                    )}

                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            onSettings();
                        }}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-sky-600 dark:text-slate-500 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex flex-col items-center gap-0.5 transition-all"
                        title="Impostazioni"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="text-[10px] font-bold hidden xs:block">Filtri</span>
                    </button>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                    {isLoggedIn ? (
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                onLogout();
                            }}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex flex-col items-center gap-0.5 transition-all"
                            title="Esci"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-[10px] font-bold hidden xs:block">Esci</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                onLogin();
                            }}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex flex-col items-center gap-0.5 transition-all"
                            title="Accedi"
                        >
                            <LogOut className="w-5 h-5 rotate-180" />
                            <span className="text-[10px] font-bold hidden xs:block">Accedi</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
