# Avvio di una nuova app

## 1. Frontend

```bash
npm create vite@latest nome-app -- --template react
cd nome-app && npm install pocketbase lucide-react clsx
npm install -D tailwindcss @tailwindcss/postcss autoprefixer
```

`.env` alla radice (va versionato: contiene solo l'URL pubblico del backend, non
segreti):

```bash
VITE_POCKETBASE_URL=https://pb.dominio.it
VITE_SMTP_CONFIGURED=false   # metti true quando PocketBase ha un provider email
```

Client, in `src/lib/pocketbase.js`:

```js
import PocketBase from 'pocketbase';

const url = import.meta.env.VITE_POCKETBASE_URL;
export const isPocketBaseConfigured = Boolean(url);
export const isSmtpConfigured = import.meta.env.VITE_SMTP_CONFIGURED === 'true';
export const pb = new PocketBase(url || 'http://localhost:8090');

// Un log all'avvio con l'URL effettivo fa risparmiare molto tempo: dice subito
// se si sta guardando un bundle vecchio o una variabile non impostata.
console.log('[app] backend:', url || 'NON DEFINITO');
```

Se vuoi mostrare la versione nell'interfaccia, prendila da `package.json` tramite
`vite.config.js` (`define: { __APP_VERSION__: ... }`) e mostrala **in un solo
punto**. Una versione letta da una variabile d'ambiente non impostata su Vercel
resta ferma al valore di fallback e finisce per contraddire l'altra.

## 2. PocketBase dietro Traefik

```yaml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    restart: unless-stopped
    # Niente "ports:": con Traefik il traffico passa dalla rete Docker interna.
    # Esporre la porta significa aggirare TLS e reverse proxy.
    environment:
      - PB_HOST=0.0.0.0
      - PB_PORT=8090
    volumes:
      - pb_data:/pb_data
      - pb_public:/pb_public
      - pb_hooks:/pb_hooks
    labels:
      - traefik.enable=true
      # Il dominio VERO, non un segnaposto: una regola con <PLACEHOLDER> non
      # corrisponde mai e Traefik risponde 404 come se il servizio fosse spento.
      - traefik.http.routers.pb.rule=Host(`pb.dominio.it`)
      - traefik.http.routers.pb.entrypoints=web,websecure
      - traefik.http.routers.pb.tls=true
      - traefik.http.routers.pb.tls.certresolver=mytlschallenge
      - traefik.http.services.pb.loadbalancer.server.port=8090
    networks:
      - proxy          # deve essere la stessa rete del container Traefik

networks:
  proxy:
    external: true

volumes:
  pb_data:
  pb_public:
  pb_hooks:
```

Punti in cui si sbaglia più spesso:

- **rete diversa da quella di Traefik** → il router esiste ma non raggiunge il
  container. Verificabile con `docker network inspect <rete>`: devono comparire
  entrambi.
- **certresolver diverso** da quello configurato in Traefik → il certificato non
  viene emesso.
- **`ports:` lasciato** → il servizio resta accessibile in chiaro sull'IP.

Dopo la modifica basta `docker compose up -d`: Traefik rilegge le label dal
provider Docker, non serve riavviarlo.

### Primo superuser

```bash
docker exec <container> /pocketbase superuser upsert admin@dominio.it 'password-lunga'
```

Il pannello risponde su `https://pb.dominio.it/_/`. La root `/` restituisce un 404
JSON: è normale, PocketBase non serve una home.

## 3. Vercel

Da pannello: **Add New Project** → importa il repository → il preset Vite viene
riconosciuto da solo (build `npm run build`, output `dist`).

In **Settings → Environment Variables** aggiungi `VITE_POCKETBASE_URL`. Attenzione:
le variabili valgono **per la build successiva**. Cambiarle non aggiorna il sito
già pubblicato; serve un nuovo deploy.

Ogni push sul branch principale ripubblica. Se il repository contiene un workflow
GitHub Actions di deploy ereditato da una configurazione precedente, **rimuovilo**:
resterebbe a fallire a ogni push, generando notifiche a vuoto.

### Perché non serve un `package-lock.json` disallineato

`npm ci` — usato da Vercel e da GitHub Actions — fallisce con `EUSAGE` se il lock
non corrisponde a `package.json`, e **blocca ogni deploy**. Capita dopo un cambio
di dipendenze fatto a mano. Si risolve rigenerando il lock e committandolo:

```bash
rm package-lock.json && npm install --package-lock-only && npm ci   # prova che funzioni
```

## 4. DNS

Il sottodominio del backend (`pb.dominio.it`) punta all'IP della VPS con un record
`A`. Il dominio dell'app punta a Vercel con un `CNAME`, secondo le istruzioni del
pannello.

Cambia il DNS **solo dopo** aver verificato che il deploy Vercel funzioni sul suo
indirizzo `*.vercel.app`: così se qualcosa non va il dominio buono resta servito
dalla versione precedente.

## 5. Comunicare con chi amministra la VPS

Se non hai accesso SSH diretto, gli interventi lato server vanno chiesti a chi
gestisce la macchina (di persona o tramite un agente). Alcuni pannelli hanno un
**limite di caratteri per messaggio**: verifica qual è e sta dentro quel limite.

Un messaggio efficace dice **cosa serve e come verificarlo**, non come farlo:

> Serve un sottodominio `pb.dominio.it` per un container PocketBase (immagine
> `ghcr.io/muchobien/pocketbase:latest`, porta interna 8090) dietro il Traefik già
> attivo. Va sulla stessa rete Docker di Traefik, senza `ports:` esposte, con lo
> stesso certresolver degli altri servizi. Verifica che
> `curl https://pb.dominio.it/api/health` risponda `{"code":200}`.

Per una diagnosi, chiedi **output di comandi** invece di conclusioni:

> Puoi mandarmi l'esito di `docker ps | grep pocketbase`,
> `docker inspect <container> --format '{{json .Mounts}}'` e
> `docker logs <container> --tail 50`?
