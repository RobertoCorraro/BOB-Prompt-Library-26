# 🚀 Developer & Vibe Coding Guidelines

Linee guida per lo sviluppo di **BOB Prompt Library** (React/Vite + PocketBase + Vercel). Prima di ogni modifica, leggi anche `CLAUDE.md` (infrastruttura, modello di accesso) e, se stai toccando lo schema dati o l'integrazione PocketBase, `.claude/skills/bob-webapp-stack/references/pocketbase.md` (gotcha reali già incontrati: relation per id non per nome, `maxSelect`, formato data, regole che filtrano invece di bloccare).

## 🛠 Best Practices di Sviluppo

### 1. Robustezza e Resilienza
- **Nessun fallback a dati finti**: se `VITE_POCKETBASE_URL` non è configurata o PocketBase non risponde, l'app deve mostrare uno stato di errore esplicito (schermata di blocco o toast con il dettaglio tecnico reale — status HTTP, campo PocketBase coinvolto), mai inventare/mostrare dati mock.
- **Gestione Errori**: ogni operazione asincrona (`fetch`, `auth`) deve avere un `try/catch` con notifica utente chiara (Toast) che riporti il messaggio tecnico, non un generico "qualcosa è andato storto".
- **Stato di Caricamento**: gestire sempre lo stato `loading` esplicitamente nel flusso `appState`.

### 2. Architettura e Pulizia
- **Modularità**: componenti piccoli e focalizzati; oltre le ~400 righe valuta di estrarre sotto-componenti.
- **Dialoghi**: usa sempre `src/components/Modal.jsx` come base per un nuovo popup/dialogo — porta già focus trap, `role="dialog"`, Escape, scroll lock e overlay-click-to-close. Non reinventare questa logica per-componente.
- **Confini relation↔UI**: la UI lavora con nomi (categoria/tipo/tag come stringhe leggibili), PocketBase lavora con id (campi `relation`). La conversione va fatta solo ai bordi (lettura: `expand` + normalizzazione; scrittura: `idFor()`), mai propagando id "grezzi" nei componenti di presentazione. Pattern completo in `references/crud-ui.md` della skill.
- **Configurazione Centralizzata**: costanti e colori in `src/lib/constants.js` e `src/lib/utils.js`.
- **Nomenclatura**: nomi descrittivi, coerenti con il resto del progetto (italiano per UI-facing, inglese per identificatori tecnici).

### 3. Deploy e Ambiente
- **Vercel, non GitHub Pages**: nessun `base` path da gestire in `vite.config.js`, il progetto è servito dalla root del dominio Vercel.
- **Environment Variables**: mai chiavi hardcoded nel codice; usa `import.meta.env`. Ricorda che le `VITE_*` sono compilate nel bundle al build — un cambio env su Vercel richiede un nuovo deploy per avere effetto.

## ✨ Vibe Coding & Estetica (Premium UI)

### 1. Micro-Interazioni
- **Feedback Aptico**: usa `triggerHaptic` per azioni importanti (copia, salvataggio, errori).
- **Transizioni**: fluide tra temi (Dark/Light) e in apertura/chiusura modali.
- **Animazioni**: classi `animate-in`, `fade-in`, `slide-in` per un'interfaccia "viva".

### 2. Design System
- **Palette**: violetto/viola (`violet-*`, `fuchsia-*`) come colore primario del brand — **non blu**, incluse le sfumature che "leggono" come blu (es. indigo, teal chiaro sono stati sostituiti in passato perché percepiti come blu). Verifica sempre il contrasto (WCAG AA) quando introduci un nuovo colore su testo, specialmente in dark mode.
- **Mobile-first davvero**: ogni nuova vista/lista/modale va provata su viewport mobile reale prima di considerarla finita — non solo ridimensionando la finestra desktop. In passato la vista a lista e il modale di compilazione variabili sono stati "usabili su desktop" ma rotti su mobile (titoli troncati a poche lettere, pulsante di conferma fuori schermo senza scroll).
- **Dark Mode**: ogni nuova feature va testata in entrambe le modalità.

### 3. "The Wow Factor"
- **Dettagli**: gradienti raffinati, ombre morbide (`shadow-xl`), `backdrop-blur` dove ha senso.
- **Iconografia**: `lucide-react`, pesi e dimensioni coerenti.

## 📝 Regola d'oro per l'IA

**Analizza prima di agire.** Prima di ogni modifica, leggi `CLAUDE.md`, `src/lib/pocketbase.js` e — se la modifica tocca schema/regole PocketBase o il deploy — la skill `bob-webapp-stack`. Non assumere che una collection o una regola API si comporti come ti aspetti: verificala (una regola List/View troppo stretta restituisce una lista vuota con HTTP 200, non un errore visibile).
