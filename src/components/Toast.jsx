import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function Toast({ message, isVisible, onClose }) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg shadow-slate-900/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
