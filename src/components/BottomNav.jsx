import React from 'react';
import { SlidersHorizontal, Search, Heart, User, Plus } from 'lucide-react';
import { triggerHaptic } from '../lib/utils';
import VersionBadge from './VersionBadge';

export default function BottomNav({
    activeTab,
    onTabChange,
    onNewPrompt,
    showFavorites,
    onToggleFavorites,
    isLoggedIn,
    onLogin,
    onLogout
}) {
    const navItems = [
        { id: 'filters', icon: SlidersHorizontal, label: 'Filtri' },
        { id: 'search', icon: Search, label: 'Cerca' },
        { id: 'favorites', icon: Heart, label: 'Salvati', isFavorite: true },
        { id: 'account', icon: User, label: isLoggedIn ? 'Esci' : 'Accedi', isAccount: true },
    ];

    const handleTabClick = (item) => {
        triggerHaptic('light');
        if (item.isFavorite) {
            onToggleFavorites();
        } else if (item.isAccount) {
            isLoggedIn ? onLogout() : onLogin();
        } else {
            onTabChange(item.id);
        }
    };

    return (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            {/* Version strip */}
            <VersionBadge className="py-1 border-b border-slate-100 dark:border-slate-800/60" />

            {/* Nav row */}
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2 pb-safe">
                {navItems.slice(0, 2).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id && !showFavorites;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item)}
                            className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
                                isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'fill-current opacity-20' : ''}`} />
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                    );
                })}

                {/* Central Plus Button */}
                <div className="flex-1 flex justify-center -mt-6">
                    <button
                        onClick={() => {
                            triggerHaptic('medium');
                            onNewPrompt();
                        }}
                        className="w-14 h-14 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-lg shadow-sky-500/40 flex items-center justify-center border-4 border-white dark:border-slate-900 transition-transform active:scale-90"
                    >
                        <Plus className="w-8 h-8" />
                    </button>
                </div>

                {navItems.slice(2).map((item) => {
                    const Icon = item.icon;
                    const isActive = (item.isFavorite && showFavorites) || (item.isAccount && false);
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item)}
                            className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
                                isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : (item.isFavorite && showFavorites ? 'text-rose-500 fill-rose-500' : '')}`} />
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
