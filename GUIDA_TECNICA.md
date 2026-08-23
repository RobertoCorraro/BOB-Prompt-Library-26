# 🚀 BOB Prompt Library: Guida Tecnica

> **Nota:** questo file era originariamente scritto per la prima versione dell'app (Supabase + GitHub Pages). Quello stack è stato **completamente sostituito** da PocketBase + Vercel; il testo sotto descrive lo stack attuale. Per il dettaglio di *perché* è cambiato, vedi `log-progettazione/PROBLEMI-STORICI.md`.

Questa guida spiega come funziona l'app oggi. Per i dettagli operativi (VPS, Traefik, credenziali, modello di accesso) la fonte di verità resta **`CLAUDE.md`** — qui trovi solo la spiegazione "semplice" dei pezzi e di come si incastrano.

---

## 🏗️ 1. L'Ecosistema Tecnologico: Chi fa cosa?

| Strumento | Ruolo | Spiegazione semplice |
| :--- | :--- | :--- |
| **Node.js / Vite** | L'Architetto | Impacchetta il codice React in file che ogni browser può leggere. |
| **React** | Il Telaio | Libreria per costruire l'interfaccia (bottoni, menu, card). |
| **Tailwind CSS v4** | Lo Stile | Utility CSS; la palette del progetto è violetto/viola (non più blu). |
| **Git / GitHub** | Macchina del tempo + magazzino | Storico delle modifiche e hosting del codice. |
| **Vercel** | Il Postino | Ogni `git push` su `main` triggera build (`npm run build`) e pubblicazione automatica, senza server da gestire lato nostro. |
| **PocketBase** | Il Cervello (dati) | Database + autenticazione, in un container Docker su una VPS, dietro **Traefik** (reverse proxy che gestisce dominio e HTTPS). |

Supabase e GitHub Pages **non sono più in uso**: erano lo stack della primissima versione, sostituiti perché PocketBase dava controllo self-hosted completo e Vercel eliminava la necessità di gestire secret SSH/registry per il deploy (dopo un tentativo intermedio, abbandonato, di build Docker + push su GHCR).

---

## 🔗 2. Il Flusso di Lavoro (Workflow)

1. **Sviluppo locale**: modifichi il codice, verifichi con `npm run dev` su `localhost:5173`, puntato a `pb.frasi.info` (o a un'istanza PocketBase locale, cambiando `VITE_POCKETBASE_URL` nel `.env`).
2. **Commit + push** su `main`.
3. **Vercel** rileva il push, esegue `npm run build` e pubblica la nuova versione in circa un minuto — nessun robot GitHub Actions coinvolto.
4. **Runtime**: il browser dell'utente parla direttamente con `pb.frasi.info` (CORS aperto), non passa da Vercel per i dati.

> Le variabili `VITE_*` sono compilate **dentro** il bundle JS al momento del build: cambiarle nella dashboard Vercel non serve a nulla finché non si rifà un deploy.

---

## 🛠️ 3. Se vuoi creare la tua prossima app con lo stesso setup

Il tutorial passo-passo (scaffold Vite, Traefik/docker-compose per PocketBase, collegamento a Vercel, script di test CRUD/login/accessibilità/mobile) **non è duplicato qui**: vive nella skill Claude **`.claude/skills/bob-webapp-stack/`**, pensata apposta per essere riusata su altri progetti. Se stai leggendo questo file con un agente AI, chiedigli di caricare quella skill; se lo stai leggendo tu, parti da `.claude/skills/bob-webapp-stack/SKILL.md` e segui i riferimenti (`references/setup.md`, `references/dati.md`, `references/crud-ui.md`, `references/testing.md`, `references/frontend.md`).

Per la lista di problemi reali già affrontati durante la costruzione di *questa* app (utile per non ripeterli su un progetto nuovo), vedi `log-progettazione/PROBLEMI-STORICI.md`.

---

## 💡 Manutenzione quotidiana

1. Lavora in locale con `npm run dev`.
2. Commit + push su `main` → Vercel pubblica da solo.
3. **Dati**: si gestiscono dalla Admin UI di PocketBase (`https://pb.frasi.info/_/`), non da un dashboard Supabase.
4. **Log**: se qualcosa non va lato frontend, apri la Console del browser (F12). Se il problema è sui dati, controlla prima le API Rules della collection in PocketBase (i sintomi di regole troppo strette sono spesso liste vuote, non errori — vedi `references/pocketbase.md` nella skill).
