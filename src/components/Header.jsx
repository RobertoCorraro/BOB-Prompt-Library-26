import React from 'react';
import { BookOpen } from 'lucide-react';

export default function Header() {
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
            </div>
        </header>
    );
}
