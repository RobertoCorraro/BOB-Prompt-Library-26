# 🚀 Developer & Vibe Coding Guidelines

Questo file contiene le linee guida fondamentali per lo sviluppo di **BOB Prompt Library**. Ogni modifica deve rispettare questi principi per evitare errori comuni e mantenere un'esperienza utente premium.

## 🛠 Best Practices di Sviluppo

### 1. Robustezza e Resilienza
- **Sempre prevedere un fallback**: Se un servizio esterno (come Supabase) fallisce o non è configurato, l'app deve caricare i dati locali (`MOCK_DATA`) senza bloccarsi.
- **Gestione Errori**: Ogni operazione asincrona (`fetch`, `auth`) deve avere un blocco `.catch()` o `try-catch` con notifiche utente chiare (Toast).
- **Stato di Caricamento**: Non lasciare mai l'utente nel vuoto. Gestire accuratamente lo stato `loading`.

### 2. Architettura e Pulizia
- **Modularità**: Mantieni i componenti piccoli e focalizzati. Se un file supera le 400 righe, valuta di estrarre dei sotto-componenti.
- **Configurazione Centralizzata**: Costanti, colori e impostazioni di autenticazione devono stare nei rispettivi file in `src/lib/` o `src/config/`.
- **Nomenclatura**: Usa nomi descrittivi in inglese (o italiano coerente con il resto del progetto).

### 3. Deploy e Ambiente
- **Vite Base Path**: Ricordati sempre che l'app è ospitata su `/BOB-Prompt-Library-26/`. Ogni link o configurazione di routing deve tenerne conto.
- **Environment Variables**: Non inserire mai chiavi segrete direttamente nel codice. Usa `import.meta.env`.

## ✨ Vibe Coding & Estetica (Premium UI)

### 1. Micro-Interazioni
- **Feedback Aptico**: Usa `triggerHaptic` per azioni importanti (copia, salvataggio, errori).
- **Transizioni**: Le transizioni tra temi (Dark/Light) e l'apertura delle modali devono essere fluide.
- **Animazioni**: Usa classi `animate-in`, `fade-in`, `slide-in` per rendere l'interfaccia "viva".

### 2. Design System
- **Coerenza**: Usa i colori definiti in `COLOR_PALETTE`. Non inventare colori ad-hoc.
- **Dark Mode**: Ogni nuova feature deve essere testata sia in modalità chiara che scura.
- **Spaziature**: Mantieni una gerarchia visiva chiara con un uso generoso del padding e del whitespace.

### 3. "The Wow Factor"
- **Dettagli**: Usa gradienti raffinati, ombre morbide (`shadow-xl`) e sfondi `backdrop-blur`.
- **Iconografia**: Usa `lucide-react` con pesi e dimensioni coerenti.

## 📝 Regola d'Oro per l'IA (Antigravity)
> **Analizza prima di agire.** Prima di ogni modifica, leggi i file di configurazione (`vite.config.js`, `supabase.js`, `auth.config.js`) per assicurarti di non rompere le fondamenta del progetto.
