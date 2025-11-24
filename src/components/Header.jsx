import React, { useState } from 'react';
import { BookOpen, Menu, Settings, LogOut } from 'lucide-react';

export default function Header({ onOpenSettings, onLogout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        BOB Prompt Library
                    </h1>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {isMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => {
                                        onOpenSettings('categories');
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Gestisci Categorie
                                </button>
                                <button
                                    onClick={() => {
                                        onOpenSettings('types');
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Gestisci Tipologie
                                </button>
                                <button
                                    onClick={() => {
                                        onOpenSettings('promptTags');
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Gestisci Prompt Tags
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                    onClick={() => {
                                        onLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
