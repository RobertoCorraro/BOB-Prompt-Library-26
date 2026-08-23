# 📚 BOB Prompt Library

<div align="center">

![Version](https://img.shields.io/badge/version-1.2.2-22c55e?style=for-the-badge&logo=github)
![PocketBase](https://img.shields.io/badge/PocketBase-Backend-B8DBE4?style=for-the-badge&logo=pocketbase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Libreria condivisa di prompt AI per il team: organizza, testa e compila i tuoi prompt in un'unica interfaccia mobile-first.**

[Caratteristiche](#-caratteristiche) • [Sviluppo locale](#-sviluppo-locale) • [Backend PocketBase](#-backend-pocketbase) • [Deploy](#-deploy) • [Troubleshooting](#-troubleshooting)

</div>

---

## 🎯 Panoramica

**BOB Prompt Library** è uno strumento di produttività per prompt engineering, pensato come **libreria condivisa di team** (non librerie private per utente): chiunque abbia un account autenticato vede e può modificare i prompt di tutti. Frontend React/Vite su **Vercel**, dati su **PocketBase** self-hosted.

> Per l'architettura completa (VPS, Traefik, modello di accesso, credenziali demo) vedi **[`CLAUDE.md`](./CLAUDE.md)** — è la fonte di verità operativa, non duplicata qui.

### 📎 Funzionalità

| Categoria | Feature | Dettagli |
|---|---|---|
| ☁️ **Sincronizzazione** | **Cloud Native** | Backend PocketBase, un solo store condiviso da tutto il team. |
| 🧩 **Ingegneria Prompt** | **Variabili Dinamiche** | Rilevamento `{{variabile}}` con compilatore interattivo (bottom-sheet su mobile). |
| 🏷️ **Tassonomia** | **Gestione Custom** | Categorie, Tipi e Tag dinamici con colori personalizzati, gestibili da UI. |
| 📋 **Gestione** | **Operazioni CRUD** | Creazione, modifica, eliminazione e duplicazione rapida. |
| 🕐 **Versioning** | **Storico Revisioni** | Ogni modifica può essere archiviata come versione storica. |
| 🔀 **Discovery** | **Filtri & Search** | Ricerca full-text e filtri incrociati per categoria, tipo e tag. |
| ⭐ **Organizzazione** | **Preferiti** | Sistema di stelle per accesso rapido ai prompt più usati. |
| 👤 **Attribuzione** | **Creatore visibile** | Ogni card mostra chi ha creato il prompt (solo attribuzione, non un permesso). |
| 📊 **Visualizzazione** | **Dual View** | Switch dinamico tra modalità Grid e List, entrambe ottimizzate per mobile. |
| 📱 **UX Premium** | **Mobile-First** | Feedback aptico, dialoghi accessibili (focus trap, Escape, `role="dialog"`), dark mode. |
| 📤 **Portabilità** | **Export JSON** | Esportazione prompt filtrati in JSON per backup o migrazione. |
| 🖥️ **Landing page** | **Onboarding** | Pagina pubblica con presentazione delle funzionalità e account demo. |

---

## 🚀 Sviluppo locale

Richiede **Node.js >= 18**.

```bash
git clone https://github.com/RobertoCorraro/BOB-Prompt-Library-26.git
cd BOB-Prompt-Library-26
npm install
npm run dev
```

Senza `VITE_POCKETBASE_URL` valorizzata, l'app mostra una schermata di blocco "non configurato" invece di avviarsi — non esiste una modalità offline/mock.

> ⚠️ `VITE_*` sono variabili **compile-time**: Vite le inietta nel bundle in fase di `build`. Cambiarle su Vercel (dashboard) non ha effetto finché non si rifà un deploy.

## 🗄️ Backend PocketBase

- URL attuale: `https://pb.frasi.info` (vedi `.env`).
- Collections principali: `prompts`, `prompt_categ`, `prompt_types`, `prompt_tags`, `prompt_revisions`, oltre a `users` (built-in). `prompts` e `prompt_revisions` referenziano categoria/tipo/tag come campi **relation** (per id, non per nome — vedi gotcha in `.claude/skills/bob-webapp-stack/references/pocketbase.md`).
- Modello di accesso, regole API e credenziali demo: documentati in `CLAUDE.md`, non ripetuti qui per evitare che le due fonti si disallineino.
- Per ricreare lo schema da zero su un'altra istanza, versionarlo o fare backup: `.claude/skills/bob-webapp-stack/scripts/pb_schema.py` (`dump` / `apply` / `restore`) e `references/dati.md` nella stessa skill.

## 🚢 Deploy

Deploy automatico su **Vercel** a ogni push su `main` (nessuna GitHub Action, nessun secret SSH/registry da gestire). Storico dei tentativi precedenti (rsync su VPS, poi build Docker + GHCR) e perché sono stati abbandonati: `log-progettazione/PROBLEMI-STORICI.md`.

## 🔐 Sicurezza

- Nessuna credenziale hardcoded nel codice: solo `VITE_POCKETBASE_URL` (compile-time) e — per l'account demo mostrato in landing — credenziali di sola dimostrazione documentate in chiaro in `CLAUDE.md` (sono già nel bundle pubblico, non sono un segreto).
- Sessione persistita dal client PocketBase (localStorage) con refresh automatico al bootstrap.
- **Nessun isolamento dati per utente**: è una scelta di prodotto (libreria di team), non un bug — vedi `CLAUDE.md` § Modello di accesso.

## 📂 Struttura del progetto

```bash
src/
├── components/       # Modal.jsx è la primitiva di dialogo condivisa (focus trap, a11y);
│                      # tutti gli altri *Modal.jsx/FilterSidebar la usano
├── lib/
│   ├── pocketbase.js  # Client PocketBase + flag isPocketBaseConfigured/isSmtpConfigured
│   └── utils.js       # parseDate/formatDate (gestisce il formato data di PocketBase),
│                       # extractVariables, triggerHaptic
└── App.jsx            # Stato centrale, bootstrap, normalizzazione relation↔nome (idFor/normalizeRecord)
```

## 🔧 Troubleshooting

### Schermata di blocco "PocketBase non configurato"

`VITE_POCKETBASE_URL` non è definita nel bundle in uso. In locale: controlla `.env`. Su Vercel: controlla la env var del progetto **e** rifai il deploy (è compile-time, vedi sopra).

### Errore di validazione al salvataggio (`validation_missing_rel_records` o simile)

Categoria/tipo/tag sono campi PocketBase `relation`: vanno scritti come id, non come nome. Se stai estendendo l'app, passa sempre dal pattern `idFor()`/`expand()` già in `App.jsx` — dettagli in `.claude/skills/bob-webapp-stack/references/crud-ui.md`.

### Un tag "sparisce" dopo il salvataggio

Controlla `maxSelect` sul campo relation `tags` in PocketBase: `0` significa singolo valore, non "illimitato" — va impostato esplicitamente (es. `20`). Successo reale già capitato una volta, log completo in `log-progettazione/PROBLEMI-STORICI.md`.

### Date che appaiono come "Invalid Date" (soprattutto Safari/iOS)

PocketBase restituisce `created`/`updated` con uno spazio invece di `T` — usa sempre `parseDate`/`formatDate` da `src/lib/utils.js`, mai `new Date(record.created)` diretto.

### Altri problemi noti e già risolti in passato

Prima di investigare da zero un sintomo che sembra "già visto", controlla `log-progettazione/PROBLEMI-STORICI.md`.

---

<div align="center">

**BOB Prompt Library** — libreria di prompt condivisa per il team.

[⬆ Torna all'inizio](#-bob-prompt-library)

</div>
