import React from 'react';
import { Sparkles, BookOpen, Tag, Star, Download, Eye } from 'lucide-react';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.2.0';

const features = [
  { icon: BookOpen, label: 'Organizza i tuoi prompt' },
  { icon: Tag,      label: 'Categorie & tag custom' },
  { icon: Star,     label: 'Preferiti rapidi' },
  { icon: Download, label: 'Esporta in JSON' },
];

export default function WelcomeScreen({ onRegister, onLogin, onGuest }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">

      {/* Sfondo decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">

        {/* Logo + nome */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-sky-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-sky-900/50">
            <span className="text-white font-black text-4xl leading-none">B</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Bob Prompt Manager</h1>
            <p className="text-sky-400 text-sm font-semibold mt-1 tracking-wide">Il tuo centro di comando per l'AI</p>
            <span className="text-slate-600 text-[10px] font-mono">v{APP_VERSION}</span>
          </div>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5">
              <Icon className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-slate-300 text-xs font-medium leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA principali */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onRegister}
            className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-sky-900/40 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Crea account
          </button>

          <button
            onClick={onLogin}
            className="w-full bg-slate-700/80 hover:bg-slate-700 active:bg-slate-600 text-white font-semibold py-4 rounded-2xl text-base border border-slate-600/50 transition-all duration-150 active:scale-[0.98]"
          >
            Accedi
          </button>
        </div>

        {/* Link ospite */}
        <button
          onClick={onGuest}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          <Eye className="w-4 h-4" />
          Continua come ospite (sola lettura)
        </button>

      </div>
    </div>
  );
}
