# Note operative — BOB Prompt Library

## Infrastruttura

- **Backend (PocketBase)**: containerizzato con Docker su una VPS Hostinger
  (`srv1079959.hstgr.cloud`), esposto via Traefik su `https://pb.frasi.info`
  (certresolver `mytlschallenge`, rete Docker `n8n_default`). CORS aperto
  (`*`), quindi qualunque frontend può chiamarlo in cross-origin.
- **Frontend (webapp React/Vite)**: deployato su **Vercel**, progetto `bpl`,
  URL `https://bpl-neon.vercel.app`. Variabile d'ambiente Vercel
  `VITE_POCKETBASE_URL=https://pb.frasi.info`.
  - Storico: prima si tentava un deploy via rsync su VPS (`.github/workflows/deploy.yml`)
    poi via build Docker + push su GHCR + SSH — entrambi abbandonati in favore
    di Vercel per semplicità (deploy automatico da GitHub senza gestire
    secret SSH/registry).
  - Il vecchio container Docker `bob-prompt-library-26-app-1` sulla VPS può
    essere ancora attivo come fallback ma non è più la fonte di verità:
    non fare affidamento sul suo contenuto senza verificarlo.
- **Dominio `lista.frasi.info`**: in fase di eventuale switch DNS verso Vercel
  (CNAME), da confermare prima di spegnere il vecchio container.

## Kodee

`Kodee` è l'agente AI che gestisce la VPS Hostinger (Traefik, Docker,
docker-compose, SSH). Per qualunque intervento lato server, preparare un
messaggio conciso (**max 1000 caratteri**) da girare a Kodee invece di
provare ad agire direttamente sulla VPS (nessun accesso SSH diretto in questa
sessione).

## Da verificare / in sospeso

- Comando suggerito da Vercel stesso: `npx plugins add vercel/vercel-plugin`
  per integrare Claude/altri agenti con Vercel. Non ancora verificato/eseguito:
  non risulta nel catalogo plugin Claude né come connector MCP ufficiale al
  momento del controllo. Verificare fonte/documentazione ufficiale Vercel
  prima di eseguirlo.
