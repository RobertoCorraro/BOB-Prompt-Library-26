# 📚 BOB Prompt Library

<div align="center">

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/RobertoCorraro/BOB-Prompt-Library-26/deploy.yml?branch=main&style=for-the-badge&logo=github&label=Deployment)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

**Il tuo centro di comando per l'ingegneria dei prompt. Organizza, testa e sincronizza i tuoi prompt AI in un'unica interfaccia premium.**

[Esplora le Caratteristiche](#-caratteristiche) • [Inizia Ora](#-installazione-rapida) • [Guida Tecnica](./GUIDA_TECNICA.md) • [Sicurezza](#-security-audit)

</div>

---

## 🎯 Panoramica Professionale

**BOB Prompt Library** non è solo un raccoglitore, ma uno strumento di produttività avanzato per professionisti AI. Offre una sincronizzazione cloud nativa, un sistema di gestione variabili intelligente e un'interfaccia mobile-first progettata per chi lavora in mobilità.

### 💎 Caratteristiche Principali

- **🏛️ Architettura Robusta**: Basata su **React 19** e **Vite** per prestazioni fulminee.
- **☁️ Cloud Sync Nativo**: Integrazione profonda con **Supabase** (PostgreSQL) per disponibilità immediata tra dispositivi.
- **🧩 Variabili Dinamiche**: Rilevamento automatico di placeholder (es. `{{testo}}`) con interfaccia di compilazione rapida.
- **🏷️ Organizzazione Totale**: Tagging granulare, categorie dinamiche e tipologie codificate a colori.
- **🌙 Esperienza Premium**: Supporto Dark Mode intelligente, micro-animazioni e feedback aptico per mobile.

---

## 🛡️ Security Audit

La sicurezza è una nostra priorità. Ecco lo stato attuale della protezione dei dati:

- **Row Level Security (RLS)**: Il database Supabase è protetto da policy RLS. 
  > [!NOTE]
  > Le policy attuali sono in modalità "Demo". Per l'uso in produzione, consulta le istruzioni di hardening in [schema.sql](./schema.sql).
- **Session Protection**: L'autenticazione è gestita localmente per velocità, con credenziali configurabili in `src/auth.config.js`.
- **Environment Safety**: Le chiavi segrete del database non sono mai esposte nel codice sorgente pubblico, ma gestite tramite *GitHub Secrets*.

---

## 🚀 Installazione Rapida

Assicurati di avere **Node.js >= 18** installato.

```bash
# Sviluppo Locale
git clone https://github.com/RobertoCorraro/BOB-Prompt-Library-26.git
cd BOB-Prompt-Library-26
npm install
npm run dev
```

### Accesso Rapido (Demo)
*   **Username**: `admin`
*   **Password**: `changeme123`
*(Puoi modificare queste chiavi in `src/auth.config.js`)*

---

## 🏗️ Deployment Automatizzato

Abbiamo già configurato per te una pipeline di **CI/CD** con GitHub Actions:

1.  **Imposta i Secrets**: Vai in GitHub *Settings -> Secrets* e aggiungi `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2.  **Sorgente Pages**: In *Settings -> Pages*, imposta la sorgente su **GitHub Actions**.
3.  **Deploy**: Basta un `git push` sul branch `main` e la tua app sarà online in meno di 2 minuti.

---

## 📂 Struttura del Progetto

```bash
src/
├── components/   # UI Modulare (React)
├── lib/          # Connessione Supabase & Utility
├── auth.config.js # Configurazione Sicurezza
└── App.jsx       # Logica centrale e Routing
```

---

## 🤝 Supporto & Documentazione

Per approfondimenti tecnici sul funzionamento di Vite, Supabase e GitHub Actions, consulta la nostra **[Guida Tecnica](./GUIDA_TECNICA.md)**.

---

<div align="center">

**Built for the future of AI engineering.**
Creato con ❤️ per una gestione intelligente della conoscenza AI.

[⬆ Torna all'inizio](#-bob-prompt-library)

</div>