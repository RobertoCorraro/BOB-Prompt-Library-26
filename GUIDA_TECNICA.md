# 🚀 BOB Prompt Library: Guida Tecnica e Diario di Bordo

Questa guida spiega come funziona la tua applicazione e riassume tutti i problemi tecnici che abbiamo risolto per portarla online. Pensa a questo documento come alla "scatola nera" del tuo progetto: qui c'è scritto perché le cose funzionano e cosa fare se qualcosa si rompe.

---

## 🏗️ 1. L'Ecosistema Tecnologico: Chi fa cosa?

Per far funzionare la tua app, abbiamo messo insieme diversi "pezzi" che comunicano tra loro. Ecco come interagiscono:

| Strumento | Ruolo | Spiegazione Semplice |
| :--- | :--- | :--- |
| **Node.js** | Il Motore | È l'ambiente che permette ai programmi di sviluppo (come Vite) di girare sul tuo computer. |
| **Vite** | L'Architetto | Prende il codice moderno (React) e lo "impacchetta" in file semplici che ogni browser può leggere. |
| **React** | Il Telaio | La libreria che usiamo per costruire l'interfaccia (bottoni, menu, card). |
| **Git** | La Macchina del Tempo | Salva ogni tua modifica in locale. Se fai un errore, puoi tornare indietro. |
| **GitHub** | Il Magazzino | Ospita il tuo codice online e lo tiene al sicuro. |
| **GitHub Actions** | Il Robot | Un server invisibile che, ogni volta che carichi codice su GitHub, costruisce l'app e la pubblica. |
| **GitHub Pages** | La Vetrina | Il servizio che ospita materialmente il sito finito e lo rende raggiungibile via link. |
| **Supabase** | Il Cervello (Cloud) | Il database dove salviamo i tuoi prompt, così non li perdi mai. |

---

## 🛠️ 2. Diario di Bordo: Errori Riscontrati e Soluzioni

Durante lo sviluppo abbiamo incontrato alcuni ostacoli tipici. Ecco come li abbiamo superati:

### ❌ Errore 1: "Schermo Bianco" dopo il Deploy
*   **Problema**: L'app caricata su GitHub Pages non trovava i suoi file (stile e script). Cercava in `robertocorraro.github.io/` invece che nella cartella corretta del progetto.
*   **Soluzione**: Abbiamo configurato il `base path` nel file `vite.config.js` aggiungendo `/BOB-Prompt-Library-26/`. Questo ha detto all'app: "Guarda dentro questa sottocartella per trovare i tuoi pezzi".

### ❌ Errore 2: L'app mostrava solo il README online
*   **Problema**: GitHub Pages era impostato per mostrare i file della "cartella principale", quindi vedevi solo il codice sorgente e non l'app finita.
*   **Soluzione**: Abbiamo cambiato le impostazioni del repository da *"Deploy from a branch"* a *"GitHub Actions"*. Ora GitHub usa il Robot (Actions) per creare una cartella speciale chiamata `dist` (distribuzione) e pubblica solo quella.

### ❌ Errore 3: Il Login non accettava `admin/changeme123`
*   **Problema**: Il componente di login cercava di autenticarsi solo tramite il sistema "serio" di Supabase (che richiede email e conferme). Ignorava le credenziali semplici che volevi usare.
*   **Soluzione**: Abbiamo modificato `Login.jsx` per creare un "doppio controllo". Prima prova le credenziali locali (quelle in `src/auth.config.js`) e, se corrette, ti fa entrare subito.

### ❌ Errore 4: Salvataggio fallito (Errore 400 - "tags" column missing)
*   **Problema**: Quando l'app provava a salvare un prompt, Supabase rispondeva con un errore perché l'app inviava dei "tag", ma nel database non esisteva ancora una colonna chiamata `tags`.
*   **Soluzione**: Abbiamo eseguito un comando SQL (`ALTER TABLE...`) per aggiungere fisicamente questa colonna al database Supabase, allineandolo alla struttura del codice.

### ❌ Errore 5: L'app mostrava ancora i prompt di esempio (Demo)
*   **Problema**: Anche se connessa al database, l'app vedeva che il database era vuoto o che c'era un errore di caricamento, quindi tornava automaticamente ai dati "finti" (mock) per non apparire vuota.
*   **Soluzione**: Abbiamo affinato la logica in `fetchData` (dentro `App.jsx`). Ora, se sei loggato e Supabase è configurato, l'app svuota i dati demo e mostra solo quelli reali del tuo database.

---

## 🔗 3. Il Flusso di Lavoro (Workflow)

Ecco cosa succede dall'inizio alla fine quando fai una modifica:

1.  **Sviluppo Locale**: Modifichi il codice sul tuo computer. Usi `npm run dev` per vedere le modifiche in tempo reale su `localhost:5173`.
2.  **Git Commit**: Salvi la modifica ("Ho aggiunto il colore rosso").
3.  **Git Push**: Invii la modifica a **GitHub** (il magazzino).
4.  **Innesco (Trigger)**: GitHub vede il push e sveglia il Robot (**GitHub Actions**).
5.  **Build**: Il Robot entra in una stanza virtuale, installa **Node.js**, scarica il tuo codice e chiede a **Vite** di creare la versione definitiva dell'app (`npm run build`). Durante questo processo, il Robot inserisce anche le chiavi segrete (**GitHub Secrets**) per parlare con **Supabase**.
6.  **Deploy**: Il Robot prende il pacchetto finito e lo deposita su **GitHub Pages**.
7.  **Persistenza**: Quando un utente apre il sito e salva un prompt, l'app invia i dati a **Supabase**, che li salva nelle sue tabelle (PostgreSQL).

---

## 💡 Consigli per la Manutenzione

*   **Cambio Password**: Se vuoi cambiare la password di accesso, modificala semplicemente in `src/auth.config.js` e fai un `push`.
*   **Database**: Puoi sempre vedere e modificare i tuoi prompt direttamente dal dashboard di Supabase (Table Editor).
*   **Logs**: Se qualcosa non va, premi **F12** nel browser e guarda la "Console". Se vedi scritte in rosso, lì c'è la risposta al problema.

**BOB Prompt Library** è ora un sistema solido e automatizzato. Buon lavoro! 🚀
