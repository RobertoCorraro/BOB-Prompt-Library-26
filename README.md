# 📚 BOB Prompt Library

<div align="center">

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/RobertoCorraro/BOB-Prompt-Library-26/deploy.yml?branch=main&style=for-the-badge&logo=github&label=Deployment)
![PocketBase](https://img.shields.io/badge/PocketBase-Backend-B8DBE4?style=for-the-badge&logo=pocketbase)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

**Il tuo centro di comando per l’ingegneria dei prompt. Organizza, testa e sincronizza i tuoi prompt AI in un’unica interfaccia premium.**

[Caratteristiche](#-caratteristiche) • [Installazione](#-installazione-rapida) • [Configurazione PocketBase](#-configurazione-pocketbase) • [Sicurezza](#-sicurezza) • [Troubleshooting](#-troubleshooting)

</div>

---

## 🎯 Panoramica

**BOB Prompt Library** è uno strumento di produttività per professionisti AI. Offre sincronizzazione cloud nativa tramite **PocketBase**, gestione avanzata delle variabili e un’interfaccia mobile-first.

### 📎 Funzionalità

| Categoria | Feature | Dettagli |
|---|---|---|
| ☁️ **Sincronizzazione** | **Cloud Native** | Integrazione completa con **PocketBase** e fallback mock locale automatico. |
| 🧩 **Ingegneria Prompt** | **Variabili Dinamiche** | Rilevamento `{{variabile}}` con compilatore interattivo. |
| 🏷️ **Tassonomia** | **Gestione Custom** | Categorie, Tipi e Tag dinamici con colori personalizzati. |
| 📋 **Gestione** | **Operazioni CRUD** | Creazione, modifica, eliminazione e duplicazione rapida. |
| 🕐 **Versioning** | **Storico Revisioni** | Ogni modifica può essere archiviata come versione storica. |
| 🔀 **Discovery** | **Filtri & Search** | Ricerca full-text e filtri incrociati per categoria, tipo e tag. |
| ⭐ **Organizzazione** | **Preferiti** | Sistema di stelle per accesso rapido ai prompt più usati. |
| 📊 **Visualizzazione** | **Dual View** | Switch dinamico tra modalità Grid e List. |
| 📱 **UX Premium** | **Mobile-First** | Feedback aptico, layout adattivo, dark mode nativa. |
| 📤 **Portabilità** | **Export JSON** | Esportazione prompt filtrati in JSON per backup o migrazione. |

---

## 🚀 Installazione Rapida

Assicurati di avere **Node.js >= 18** installato.

```bash
git clone https://github.com/RobertoCorraro/BOB-Prompt-Library-26.git
cd BOB-Prompt-Library-26
npm install
npm run dev
```

Senza configurazione PocketBase l’app funziona in **modalità mock** con dati di esempio.

---

## 🗄️ Configurazione PocketBase

### 1. Variabile d’ambiente

Crea un file `.env` nella root del progetto:

```env
VITE_POCKETBASE_URL=http://localhost:8090
```

Per produzione, imposta l’URL del tuo server PocketBase remoto.

### 2. Primo avvio — Setup Wizard

Al primo accesso con PocketBase configurato, l’app mostra automaticamente il **Setup Wizard** a 3 step:

1. **Benvenuto** — panoramica di cosa accadrà
2. **Crea account** — inserisci email, password e nome (opzionale)
3. **Completato** — login automatico e accesso all’app

Le credenziali vengono salvate direttamente su PocketBase, **nessuna password nel codice sorgente**.

### 3. Regole API PocketBase (`users` collection)

Nella **PocketBase Admin UI** (`/_/` → Collections → users → ⚙️ Edit → API Rules):

| Regola | Valore per il setup | Dopo il setup |
|---|---|---|
| **List** | `@request.auth.id != ""` | invariato |
| **View** | `@request.auth.id != ""` | invariato |
| **Create** | `""` (aperta) | `false` o `@request.auth.id != ""` |
| **Update** | `@request.auth.id = id` | invariato |
| **Delete** | `@request.auth.id = id` | invariato |

> ⚠️ Ricorda di chiudere la regola **Create** dopo aver creato il tuo account admin.

### 4. Collections necessarie

Crea in PocketBase le seguenti collections con i relativi campi:

| Collection | Campi principali |
|---|---|
| `prompts` | `title`, `content`, `category`, `type`, `tags` (JSON), `is_favorite` |
| `categories` | `name`, `color` (JSON) |
| `types` | `name`, `color` (JSON) |
| `prompt_tags` | `name`, `color` (JSON) |
| `prompt_revisions` | `prompt_id`, `title`, `content`, `category`, `type`, `tags` |

---

## 🔐 Sicurezza

- **Nessuna credenziale nel codice** — `auth.config.js` è deprecato e non utilizzato.
- **Sessione persistente** — il token PocketBase è salvato in `localStorage` (`bob_pb_auth`) e ripristinato automaticamente al reload.
- **Token refresh automatico** — al bootstrap l’app tenta `authRefresh()` per rinnovare sessioni valide.
- **Environment Safety** — `VITE_POCKETBASE_URL` gestita via variabile d’ambiente, mai hardcoded.

---

## 🏗️ Deployment Automatizzato

Pipeline CI/CD preconfigurata con **GitHub Actions**:

1. In GitHub *Settings → Secrets*, aggiungi `VITE_POCKETBASE_URL`.
2. In *Settings → Pages*, imposta la sorgente su **GitHub Actions**.
3. Un `git push` su `main` pubblica in meno di 2 minuti.

---

## 📂 Struttura del Progetto

```bash
src/
├── components/
│   ├── Login.jsx          # Modal login con semaforo connessione PocketBase
│   ├── SetupWizard.jsx    # Wizard primo avvio (crea account su PocketBase)
│   ├── AdminModal.jsx
│   └── ...
├── lib/
│   ├── pocketbase.js      # Client PocketBase + persistenza sessione localStorage
│   └── utils.js
├── auth.config.js         # ⚠️ DEPRECATO — può essere eliminato
└── App.jsx                # Logica centrale, bootstrap e gestione appState
```

---

## 🔧 Troubleshooting

### Il Setup Wizard si ripresenta ad ogni reload

Succede quando il flag `bob_setup_done` non è stato scritto nel `localStorage`.
Apri la console del browser e lancia:

```js
localStorage.setItem('bob_setup_done', 'true')
location.reload()
```

### "Email: Value must be unique" durante il setup

La tua email è già registrata su PocketBase (da un’installazione precedente). Il wizard intercetta questo errore e mostra automaticamente un pulsante **Vai al Login**. In alternativa, usa il link *"Ho già un account"* presente nel primo step del wizard.

### Semaforo rosso — PocketBase non raggiungibile

- Verifica che PocketBase sia avviato: `./pocketbase serve`
- Controlla che `VITE_POCKETBASE_URL` nel `.env` punti all’indirizzo corretto
- Se usi Docker, verifica che la porta `8090` sia esposta

### Sessione persa dopo reload

Il token è salvato in `localStorage` con chiave `bob_pb_auth`. Se viene rimosso manualmente o il browser è in modalità privata, dovrai fare login di nuovo.

---

<div align="center">

**Built for the future of AI engineering.**
Creato con ❤️ per una gestione intelligente della conoscenza AI.

[⬆ Torna all’inizio](#-bob-prompt-library)

</div>
