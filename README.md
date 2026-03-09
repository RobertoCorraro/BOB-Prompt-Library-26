# 📚 BOB Prompt Library

<div align="center">

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/RobertoCorraro/BOB-Prompt-Library-26/deploy.yml?branch=main&style=for-the-badge&logo=github&label=Deployment)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

**Il tuo centro di comando per l'ingegneria dei prompt. Organizza, testa e sincronizza i tuoi prompt AI in un'unica interfaccia premium.**

[Esplora le Caratteristiche](#-caratteristiche) • [Inizia Ora](#-installazione-rapida) • [Sicurezza](#-security-audit) • [Migrazione DB](#-migrazione-database)

</div>

---

## 🎯 Panoramica

**BOB Prompt Library** è uno strumento di produttività per professionisti AI. Offre sincronizzazione cloud nativa, gestione avanzata delle variabili e un'interfaccia mobile-first.

### 💎 Funzionalità Avanzate

| Categoria | Feature | Dettagli |
|---|---|---|
| ☁️ **Sincronizzazione** | **Cloud Native** | Integrazione completa con **Supabase** (PostgreSQL) e fallback mock locale. |
| 🧩 **Ingegneria Prompt** | **Variabili Dinamiche** | Rilevamento `{{variabile}}` con compilatore interattivo e conteggio variabili nelle card. |
| 🏷️ **Tassonomia** | **Gestione Custom** | Categorie, Tipi e Tag dinamici con colori personalizzati e ordinamento alfabetico automatico. |
| 📋 **Gestione** | **Operazioni CRUD** | Creazione, modifica, eliminazione e **duplicazione rapida** dei prompt. |
| 🕐 **Versioning** | **Storico Revisioni** | Ogni modifica può essere archiviata come versione storica consultabile nell'area admin. |
| 🔀 **Discovery** | **Filtri & Search** | Ricerca full-text e filtri incrociati per categoria, tipo e tag multipli. |
| ⭐ **Organizzazione** | **Preferiti** | Sistema di "Stelle" per accesso rapido ai prompt più importanti. |
| 📊 **Visualizzazione** | **Dual View** | Switch dinamico tra modalità **Grid** (schede) e **List** (compatta). |
| 📱 **UX Premium** | **Mobile-First** | Feedback aptico, layout a griglia adattiva, pulsanti extra-large e dark mode nativa. |
| 📤 **Portabilità** | **Export JSON** | Esportazione dei prompt filtrati in formato JSON per backup o migrazione. |

---

## 🛡️ Security Audit

- **Row Level Security (RLS)**: Policy RLS attive su tutte le tabelle.
  > [!NOTE]
  > Le policy attuali sono in modalità "Demo" (aperte). Per la produzione, esegui il blocco `-- SICUREZZA` in `supabase_migration.sql`.
- **Session Protection**: Autenticazione locale configurabile in `src/auth.config.js`.
- **Environment Safety**: Le chiavi Supabase non sono mai nel codice sorgente — gestite via *GitHub Secrets*.

---

## 🚀 Installazione Rapida

Assicurati di avere **Node.js >= 18** installato.

```bash
git clone https://github.com/RobertoCorraro/BOB-Prompt-Library-26.git
cd BOB-Prompt-Library-26
npm install
npm run dev
```

### Accesso Admin (Demo)
*   **Username**: `admin`
*   **Password**: `changeme123`
*(Modifica le credenziali in `src/auth.config.js`)*

---

## 🗄️ Migrazione Database

Al primo avvio con un database Supabase vuoto, esegui nel **SQL Editor** di Supabase:

```sql
-- Esegui il file: supabase_migration.sql
```

Il file `supabase_migration.sql` incluso nel progetto:
- Aggiunge la colonna `color` alle tabelle tassonomia
- Popola le categorie, tipi e tag di default
- Include (commentato) lo script per migrare agli ID numerici sequenziali

---

## 🏗️ Deployment Automatizzato

Pipeline CI/CD preconfigurata con GitHub Actions:

1. **Secrets**: In GitHub *Settings → Secrets*, aggiungi `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2. **Pages**: In *Settings → Pages*, imposta la sorgente su **GitHub Actions**.
3. **Deploy**: Un `git push` su `main` pubblica in meno di 2 minuti.

---

## 📂 Struttura del Progetto

```bash
src/
├── components/     # UI Modulare (React)
├── lib/            # Connessione Supabase & Utility
├── auth.config.js  # Credenziali admin locali
└── App.jsx         # Logica centrale e stato
supabase_migration.sql  # Script migrazione DB
schema.sql              # Schema completo DB
```

---

<div align="center">

**Built for the future of AI engineering.**
Creato con ❤️ per una gestione intelligente della conoscenza AI.

[⬆ Torna all'inizio](#-bob-prompt-library)

</div>