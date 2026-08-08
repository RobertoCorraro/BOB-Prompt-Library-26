---
name: vercel-pocketbase-app
description: >-
  Avvia, collega e collauda web app con frontend React/Vite su Vercel e backend
  PocketBase in Docker dietro Traefik su VPS. Usa questa skill ogni volta che si
  parla di creare una nuova app o un nuovo progetto di questo tipo, di collegare
  un frontend a PocketBase, di pubblicare o ripubblicare su Vercel, di un'app che
  "non si connette al database" o "non è aggiornata dopo il deploy", di configurare
  Traefik o un sottodominio per PocketBase, di impostare o correggere collection,
  campi relation e regole di accesso, oppure di testare login, registrazione,
  recupero password e operazioni CRUD. Attivala anche quando la richiesta è
  implicita — "facciamo un'altra app come quella dei prompt", "perché non vedo i
  dati", "il salvataggio dà errore 400", "va bene da desktop ma non da telefono" —
  e anche se Vercel o PocketBase non vengono nominati esplicitamente.
---

# App React/Vite su Vercel con PocketBase su VPS

Questa architettura è stata messa a punto sul campo. Gran parte del tempo di
sviluppo se ne va in una manciata di trappole che danno **sintomi fuorvianti**:
un errore che sembra di rete è quasi sempre un campo mancante nello schema, e un
frontend che "non si connette" di solito è solo un bundle vecchio. Le pagine di
riferimento raccolgono quei casi con sintomo, causa e rimedio: consultale appena
qualcosa non torna, invece di partire a tentativi.

## Come è fatta

```
Browser ──► Vercel (React/Vite, build statica)
              │  chiamate dirette, cross-origin
              ▼
        pb.dominio.it ──► Traefik (TLS) ──► container PocketBase :8090
```

Vercel serve **solo file statici**: non conosce gli utenti né il database, e non
può inviare email. Tutto ciò che riguarda dati, autenticazione e posta vive in
PocketBase. Tenere a mente questa divisione evita di cercare i problemi dalla
parte sbagliata.

## Le due regole che spiegano metà dei problemi

**1. Le variabili `VITE_*` sono compile-time.** Finiscono dentro il bundle al
momento della build, non vengono lette a runtime. Cambiare l'URL del backend sul
server non ha alcun effetto finché non si ricostruisce e ripubblica. Quando l'app
sembra parlare con l'indirizzo sbagliato, la prima cosa da fare è guardare cosa
c'è davvero nel bundle pubblicato:

```bash
curl -s https://app.vercel.app/ | grep -o '/assets/index-[^"]*\.js'
curl -s https://app.vercel.app/assets/index-XXXX.js | grep -o 'https://[a-z0-9.-]*'
```

**2. Le regole di accesso di PocketBase filtrano, non bloccano.** Una richiesta
senza autenticazione su una collection con `listRule` che richiede il login non
riceve `403`: riceve `200` con una lista **vuota**. Per questo una "modalità
ospite" mostra un'app deserta invece di un errore, e per questo un elenco vuoto
non significa che i dati siano andati persi.

## Passi per una nuova app

Il dettaglio operativo — compose Traefik, impostazioni Vercel, DNS, e i messaggi
pronti per chi amministra la VPS — sta in `references/setup.md`. In sintesi:

1. Scaffolding Vite + React, `.env` con `VITE_POCKETBASE_URL`.
2. Container PocketBase con le label Traefik giuste: **niente `ports:`**, stessa
   rete Docker di Traefik, stesso `certresolver`, e soprattutto un `Host()` con il
   dominio vero — un segnaposto lasciato lì non corrisponde a nulla e produce un
   404 che sembra un guasto del server.
3. Superuser, collection e regole (vedi `references/pocketbase.md`).
4. Progetto Vercel collegato al repo GitHub, variabili d'ambiente impostate lì.
5. Collaudo con gli script qui sotto **prima** di dire che è pronto.

## Collaudo

Non dichiarare funzionante ciò che non hai visto rispondere. Due script fanno il
lavoro noioso; entrambi ripuliscono ciò che creano, quindi si possono lanciare
anche su un'istanza con dati veri.

**Backend — raggiungibilità, CRUD, login, regole, CORS:**

```bash
scripts/pb_smoke_test.sh https://pb.dominio.it admin@dominio.it 'password' \
  [collection] [https://app.vercel.app]
```

Copre in un colpo solo: health e TLS, login superuser, audit dello schema alla
ricerca delle trappole note, ciclo create/read/update/delete, registrazione e
login di un utente normale, cosa vede un anonimo, stato dell'SMTP e preflight
CORS dall'origine del frontend.

**Frontend — errori, backend nel bundle, contrasti, layout mobile:**

```bash
node scripts/browser_check.mjs https://app.vercel.app [--mobile] \
  [--login email:password] [--shot ./out]
```

Serve `playwright-core` (`npm i playwright-core`) e un Chromium: se la variabile
`PLAYWRIGHT_CHROMIUM` non è impostata usa il percorso preinstallato negli ambienti
Claude. Lo script segnala i contrasti sotto WCAG AA calcolandoli sul DOM
renderizzato — gestisce gradienti e colori `oklch`, che è il formato usato da
Tailwind v4 e che un audit ingenuo non vede — e individua i pannelli più alti
dello schermo privi di area scorrevole, cioè i modali in cui da telefono il
pulsante di conferma resta irraggiungibile.

Per il dettaglio delle verifiche manuali e delle prove da fare a mano quando
serve capire *perché* qualcosa fallisce, vedi `references/testing.md`.

## Dove guardare quando qualcosa non va

Prima di ipotizzare, isola **quale strato** risponde. Il messaggio d'errore lo
dice già:

| Cosa vedi | Chi sta rispondendo | Dove intervenire |
|---|---|---|
| `404 page not found` in testo semplice | Traefik: nessuna rotta per quell'host | regola `Host()` nel compose |
| `{"...":"File not found","status":404}` sulla root | PocketBase: raggiunto e sano | niente, è normale |
| `{"message":"Something went wrong..."}` su `?sort=-created` | PocketBase | manca il campo autodate `created` |
| lista `200` ma vuota da un client anonimo | PocketBase | comportamento normale delle list rule |
| errore CORS in console | PocketBase | `settings.meta` / reverse proxy |
| l'app chiama un dominio vecchio | Vercel | bundle non ricostruito |

I log si leggono così:

- **Vercel**: pannello del progetto → Deployments → il singolo deploy. Un deploy
  fallito lascia online l'ultima versione buona: il sito "funziona" ma è vecchio.
- **PocketBase**: `docker logs <container> --tail 100`. Se non hai accesso SSH,
  chiedilo a chi amministra la VPS.
- **Browser**: la console mostra i log di inizializzazione del client; il pannello
  Network dice se la chiamata parte, verso quale host e con quale esito.

## Riferimenti

Leggi la pagina pertinente appena tocchi quell'area, non solo quando sei bloccato.

- `references/setup.md` — scaffolding, compose Traefik commentato, Vercel, DNS,
  messaggi pronti per l'amministratore della VPS.
- `references/pocketbase.md` — schema, campi relation, regole di accesso, SMTP:
  le trappole con sintomo → causa → rimedio, e gli snippet client corretti.
- `references/testing.md` — procedure di collaudo manuali, comandi curl commentati,
  come guidare un browser reale anche in sandbox senza rete diretta.
- `references/frontend.md` — accorgimenti dell'interfaccia che si pagano cari se
  scoperti tardi: date, modali accessibili, viste mobile, accessibilità.
