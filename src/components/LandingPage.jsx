import React from 'react';
import {
    BookOpen, Braces, History, Search, Star, Download, Tags, Smartphone,
    Copy, ArrowRight, Play, Check, Sparkles, LogIn,
} from 'lucide-react';

/* eslint-disable-next-line no-undef */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.2.2';

export const DEMO_CREDENTIALS = { email: 'demo@frasi.info', password: 'demoBPL2026' };

const FEATURES = [
    {
        icon: Tags,
        title: 'Libreria organizzata',
        text: 'Categorie, tipi e tag colorati per ritrovare il prompt giusto in un attimo, anche quando la libreria cresce.',
        accent: 'from-violet-600 to-purple-600',
    },
    {
        icon: Braces,
        title: 'Variabili dinamiche',
        text: 'Scrivi {{cliente}} o {{tono}} nel prompt: al momento dell\'uso compili i campi in un form e copi il testo già pronto.',
        accent: 'from-fuchsia-600 to-purple-600',
    },
    {
        icon: History,
        title: 'Storico revisioni',
        text: 'Ogni versione salvata resta consultabile. Se una modifica non convince, ripristini quella precedente con un click.',
        accent: 'from-amber-500 to-orange-600',
    },
    {
        icon: Search,
        title: 'Ricerca e filtri',
        text: 'Cerca nel titolo e nel contenuto, poi affina per categoria, tipo o tag multipli. Nessun prompt si perde più.',
        accent: 'from-emerald-500 to-green-600',
    },
    {
        icon: Star,
        title: 'Preferiti',
        text: 'Marca i prompt che usi ogni giorno e tienili sempre in cima, separati dal resto dell\'archivio.',
        accent: 'from-yellow-500 to-amber-600',
    },
    {
        icon: Download,
        title: 'Esporta in JSON',
        text: 'I tuoi prompt restano tuoi: esporti l\'intera libreria (o solo i risultati filtrati) in un file JSON quando vuoi.',
        accent: 'from-rose-500 to-pink-600',
    },
];

const STEPS = [
    { n: '01', title: 'Salva il prompt', text: 'Incollalo, dagli un titolo e assegna categoria, tipo e tag. Bastano pochi secondi.' },
    { n: '02', title: 'Rendilo riutilizzabile', text: 'Sostituisci le parti che cambiano con variabili {{così}}, e il prompt diventa un template.' },
    { n: '03', title: 'Usalo ovunque', text: 'Compili le variabili, copi il risultato e lo incolli nel tuo modello AI preferito.' },
];

export default function LandingPage({ onLogin, onRegister, onDemo }) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
            <style>{`
                @keyframes bplFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes bplFadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .bpl-float { animation: bplFloat 6s ease-in-out infinite; }
                .bpl-fade { animation: bplFadeUp .7s ease-out both; }
                @media (prefers-reduced-motion: reduce) {
                    .bpl-float, .bpl-fade { animation: none; }
                }
            `}</style>

            {/* ── Nav ─────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-white/5">
                <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
                            <span className="font-black text-white text-lg leading-none">B</span>
                        </div>
                        <span className="font-bold tracking-tight text-[15px] sm:text-base">BOB Prompt Library</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onDemo}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors rounded-lg"
                        >
                            <Play className="w-4 h-4" />
                            Demo
                        </button>
                        <button
                            onClick={onLogin}
                            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                            <LogIn className="w-4 h-4" />
                            Accedi
                        </button>
                    </div>
                </nav>
            </header>

            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="relative">
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                    <div className="absolute -top-40 -left-32 w-[28rem] h-[28rem] bg-violet-600/20 rounded-full blur-[100px]" />
                    <div className="absolute top-20 -right-40 w-[32rem] h-[32rem] bg-fuchsia-600/15 rounded-full blur-[110px]" />
                    <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-700/10 rounded-full blur-[90px]" />
                </div>

                <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
                    <div className="grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">

                        <div className="bpl-fade">
                            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-1.5 pr-3.5 py-1.5 mb-7">
                                <span className="bg-gradient-to-r from-violet-600 to-purple-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                    Novità
                                </span>
                                <span className="text-xs text-slate-300">Il tuo archivio di prompt, finalmente in ordine</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.08]">
                                Smetti di cercare<br />
                                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                                    i tuoi prompt migliori
                                </span>
                            </h1>

                            <p className="mt-6 text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
                                BOB è il centro di comando per i prompt che usi con l'AI: li organizzi per
                                categoria e tag, li trasformi in template con variabili, ne tieni lo storico
                                e li ritrovi in un secondo — da desktop e da telefono.
                            </p>

                            <div className="mt-9 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={onDemo}
                                    className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-violet-950/50 transition-all active:scale-[0.98]"
                                >
                                    <Play className="w-5 h-5" />
                                    Prova la demo
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                </button>
                                <button
                                    onClick={onRegister}
                                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold px-6 py-4 rounded-2xl transition-colors active:scale-[0.98]"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Crea il tuo account
                                </button>
                            </div>

                            <p className="mt-5 text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" />Nessuna carta richiesta</span>
                                <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" />Dati esportabili</span>
                                <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" />Funziona da mobile</span>
                            </p>
                        </div>

                        {/* App preview mock */}
                        <div className="bpl-float lg:justify-self-end w-full max-w-md mx-auto lg:mx-0" aria-hidden="true">
                            <div className="rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl shadow-black/60 backdrop-blur overflow-hidden">
                                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-white/[0.03]">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                                    <div className="ml-3 h-5 flex-1 rounded-md bg-white/5 flex items-center px-2">
                                        <Search className="w-3 h-3 text-slate-400" />
                                        <span className="ml-1.5 text-[10px] text-slate-400">Cerca nei prompt…</span>
                                    </div>
                                </div>

                                <div className="p-4 space-y-3">
                                    <div className="flex gap-1.5 flex-wrap">
                                        {['Tutti', 'Copywriting', 'Marketing', 'Sviluppo web'].map((c, i) => (
                                            <span key={c} className={`text-[10px] px-2.5 py-1 rounded-full border ${i === 1
                                                ? 'bg-violet-500/20 border-violet-400/40 text-violet-200'
                                                : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                                {c}
                                            </span>
                                        ))}
                                    </div>

                                    {[
                                        { t: 'Articolo SEO da parola chiave', c: 'Copywriting', tag: ['istruzioni', 'variabili'], fav: true },
                                        { t: 'Assistente sviluppo — code review', c: 'Sviluppo web', tag: ['contesto'], fav: true },
                                        { t: 'Analisi competitor', c: 'Marketing', tag: ['contesto', 'istruzioni'], fav: false },
                                    ].map((p) => (
                                        <div key={p.t} className="rounded-xl bg-white/[0.04] border border-white/10 p-3.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-[13px] font-semibold text-slate-100 leading-snug">{p.t}</p>
                                                <Star className={`w-3.5 h-3.5 shrink-0 ${p.fav ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                                            </div>
                                            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">{p.c}</span>
                                                {p.tag.map((t) => (
                                                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">#{t}</span>
                                                ))}
                                                <Copy className="w-3 h-3 text-slate-400 ml-auto" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── Features ────────────────────────────────────────── */}
            <section className="relative border-t border-white/5 bg-slate-950">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Tutto quello che serve<br />
                            <span className="text-slate-400">per non riscrivere due volte lo stesso prompt</span>
                        </h2>
                    </div>

                    <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {FEATURES.map(({ icon: Icon, title, text, accent }) => (
                            <div
                                key={title}
                                className="group rounded-2xl bg-white/[0.03] border border-white/10 p-6 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200"
                            >
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg mb-4 transition-transform duration-200 group-hover:scale-110`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold text-[15px] mb-2">{title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 grid sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 flex items-start gap-4">
                            <Smartphone className="w-6 h-6 text-violet-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-[15px] mb-1.5">Pensata per il telefono</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Interfaccia responsive e installabile come app: apri, copi, incolli. Anche in fila alle poste.
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 flex items-start gap-4">
                            <Copy className="w-6 h-6 text-violet-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-[15px] mb-1.5">Copia in un tap</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Il prompt finito va negli appunti con un tocco, pronto per ChatGPT, Claude o qualunque altro modello.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Come funziona ───────────────────────────────────── */}
            <section className="relative border-t border-white/5">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12">Come funziona</h2>
                    <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                        {STEPS.map((s) => (
                            <div key={s.n} className="relative">
                                <span className="text-5xl font-black bg-gradient-to-b from-white/20 to-white/5 bg-clip-text text-transparent">
                                    {s.n}
                                </span>
                                <h3 className="mt-2 font-bold text-lg">{s.title}</h3>
                                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4">Esempio di template</p>
                        <pre className="text-[13px] sm:text-sm text-slate-300 font-mono leading-relaxed overflow-x-auto">
{`Scrivi un articolo SEO di `}<span className="text-violet-400 font-semibold">{`{{numero_parole}}`}</span>{` parole
sulla parola chiave "`}<span className="text-violet-400 font-semibold">{`{{parola_chiave}}`}</span>{`".

Tono di voce: `}<span className="text-violet-400 font-semibold">{`{{tono}}`}</span>{`
Pubblico target: `}<span className="text-violet-400 font-semibold">{`{{target}}`}</span>
                        </pre>
                        <p className="mt-5 text-sm text-slate-400 leading-relaxed">
                            BOB riconosce le variabili tra doppie graffe e, quando usi il prompt, ti chiede
                            solo quei valori — il resto del testo resta identico ogni volta.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Demo CTA ────────────────────────────────────────── */}
            <section className="relative border-t border-white/5">
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[24rem] bg-violet-600/15 rounded-full blur-[100px]" />
                </div>

                <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-20 sm:py-24 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-xl shadow-violet-950/50 mb-6">
                        <BookOpen className="w-7 h-7 text-white" />
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        Guardala in azione, subito
                    </h2>
                    <p className="mt-4 text-slate-300 leading-relaxed">
                        Entra con l'account dimostrativo e trovi una libreria già popolata con prompt
                        d'esempio, categorie, tag e template con variabili da provare.
                    </p>

                    <div className="mt-8">
                        <button
                            onClick={onDemo}
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-violet-950/50 transition-all active:scale-[0.98]"
                        >
                            <Play className="w-5 h-5" />
                            Entra nella demo
                        </button>
                    </div>

                    <div className="mt-6 mx-auto w-fit text-left rounded-2xl border border-white/10 bg-slate-900/70 px-6 py-5">
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
                            Credenziali demo
                        </p>
                        <dl className="space-y-1.5 font-mono text-sm">
                            <div className="flex items-center gap-3">
                                <dt className="text-slate-400 w-20">email</dt>
                                <dd className="text-violet-300">{DEMO_CREDENTIALS.email}</dd>
                            </div>
                            <div className="flex items-center gap-3">
                                <dt className="text-slate-400 w-20">password</dt>
                                <dd className="text-violet-300">{DEMO_CREDENTIALS.password}</dd>
                            </div>
                        </dl>
                    </div>

                    <p className="mt-8 text-sm text-slate-400">
                        Vuoi la tua libreria personale?{' '}
                        <button onClick={onRegister} className="text-violet-400 hover:text-violet-300 font-medium underline underline-offset-4 transition-colors">
                            Crea un account gratuito
                        </button>
                    </p>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────── */}
            <footer className="border-t border-white/5">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                            <span className="font-black text-white text-sm leading-none">B</span>
                        </div>
                        <span className="text-sm text-slate-400">BOB Prompt Library · v{APP_VERSION}</span>
                    </div>
                    <div className="flex items-center gap-5 text-sm">
                        <button onClick={onLogin} className="text-slate-400 hover:text-slate-100 transition-colors">Accedi</button>
                        <button onClick={onRegister} className="text-slate-400 hover:text-slate-100 transition-colors">Registrati</button>
                        <button onClick={onDemo} className="text-slate-400 hover:text-slate-100 transition-colors">Demo</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
