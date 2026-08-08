# Collaudo: prove, log, comandi

Il principio è uno solo: **non dichiarare funzionante ciò che non hai visto
rispondere**. Gli script in `scripts/` coprono il percorso standard; qui c'è cosa
fare quando serve capire *perché* qualcosa non va, e come guidare un browser vero.

## Ordine di verifica

Procedi dal basso verso l'alto: ogni strato dipende dal precedente, e partire
dall'interfaccia porta a inseguire sintomi invece di cause.

1. **DNS e TLS** — il dominio risolve? Il certificato è valido?
2. **PocketBase risponde?** — `/api/health`
3. **Lo schema regge le query dell'app?** — sort, filtri, expand
4. **Le regole permettono ciò che serve?** — con e senza token
5. **CORS dall'origine reale del frontend**
6. **Il bundle pubblicato punta al backend giusto?**
7. **L'interfaccia si comporta bene** — desktop e mobile

## Comandi di diagnosi

```bash
# 1-2. raggiungibilità
getent hosts pb.dominio.it
curl -sv https://pb.dominio.it/api/health 2>&1 | grep -E 'subject|issuer|SSL certificate|HTTP/'

# 3. schema, letto come superuser
TOKEN=$(curl -s -X POST https://pb.dominio.it/api/collections/_superusers/auth-with-password \
  -H 'Content-Type: application/json' \
  -d '{"identity":"admin@dominio.it","password":"..."}' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')

curl -s https://pb.dominio.it/api/collections -H "Authorization: $TOKEN" | python3 -c '
import json,sys
for c in json.load(sys.stdin)["items"]:
    if c["name"].startswith("_"): continue
    print(c["name"], "|", [f["name"] for f in c["fields"]])
    print("   list:", repr(c["listRule"]), " create:", repr(c["createRule"]))'

# 4. la stessa query con e senza token: il confronto rivela le regole
curl -s "https://pb.dominio.it/api/collections/COLL/records" | head -c 200          # anonimo
curl -s "https://pb.dominio.it/api/collections/COLL/records" -H "Authorization: $TOKEN" | head -c 200

# 5. preflight CORS dall'origine vera del frontend
curl -s -i -X OPTIONS https://pb.dominio.it/api/collections/users/auth-with-password \
  -H 'Origin: https://app.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' | grep -i 'access-control'
```

### Trappola di `curl -D -` dietro un proxy

Quando la connessione passa da un proxy HTTP, `-D -` include **anche** la risposta
`HTTP/1.1 200 Connection Established` del tunnel CONNECT. Chi separa header e corpo
cercando la prima riga vuota ottiene un corpo che comincia con gli header veri: il
JSON non si lascia interpretare e sembra che il server risponda male.

Rimedio: scrivere corpo e header su file separati.

```bash
curl -s -o corpo.json -D header.txt -w '%{http_code}' "$URL"
```

## Prova del ciclo CRUD a mano

Utile per isolare quale operazione fallisce quando l'interfaccia dà solo "errore".

```bash
C=https://pb.dominio.it/api/collections/COLL/records

ID=$(curl -s -X POST "$C" -H "Authorization: $TOKEN" -H 'Content-Type: application/json' \
     -d '{"name":"ZZ-test"}' | python3 -c 'import json,sys;print(json.load(sys.stdin).get("id",""))')
echo "creato: $ID"

curl -s "$C/$ID?expand=category,type,tags" -H "Authorization: $TOKEN" | python3 -m json.tool
curl -s -o /dev/null -w 'sort: %{http_code}\n' "$C?sort=-created" -H "Authorization: $TOKEN"
curl -s -X PATCH "$C/$ID" -H "Authorization: $TOKEN" -H 'Content-Type: application/json' -d '{"name":"ZZ-mod"}' -o /dev/null -w 'update: %{http_code}\n'
curl -s -X DELETE "$C/$ID" -H "Authorization: $TOKEN" -o /dev/null -w 'delete: %{http_code}\n'
```

**Ripulisci sempre.** Su un'istanza condivisa i record di prova restano visibili a
tutti. Verifica l'esito della DELETE invece di darlo per scontato: se torna `404`
il record è ancora lì.

## Autenticazione

```bash
# registrazione (funziona solo se users.createRule è permissiva)
curl -s -X POST https://pb.dominio.it/api/collections/users/records \
  -H 'Content-Type: application/json' \
  -d '{"email":"prova@example.com","password":"almeno8car","passwordConfirm":"almeno8car"}'

# login
curl -s -X POST https://pb.dominio.it/api/collections/users/auth-with-password \
  -H 'Content-Type: application/json' \
  -d '{"identity":"prova@example.com","password":"almeno8car"}' | head -c 300
```

Se il login fallisce con credenziali giuste, guarda `authRule`: se richiede
`verified = true` e l'SMTP è spento, nessun account potrà mai accedere.

## Guidare un browser reale

Chromium è preinstallato negli ambienti Claude; basta `playwright-core`. Lo script
`browser_check.mjs` è pronto all'uso, ma se serve un test su misura questi sono i
due accorgimenti che fanno la differenza.

**Il browser della sandbox spesso non esce su Internet.** Le richieste al backend
restano appese senza errore, e sembra un problema dell'app. Si aggirano
intercettando le chiamate e inoltrandole con `curl`, che passa dal proxy:

```js
await page.route('**://pb.dominio.it/**', async (route) => {
  const req = route.request();
  const h = await req.allHeaders();        // allHeaders(), NON headers()
  const args = ['-sk','-X',req.method(),req.url(),'-o',bodyFile,'-D',headFile,'-w','%{http_code}'];
  if (h['authorization']) args.push('-H', `Authorization: ${h['authorization']}`);
  if (h['content-type'])  args.push('-H', `Content-Type: ${h['content-type']}`);
  const pd = req.postData(); if (pd) args.push('--data-binary', pd);
  const st = parseInt(execFileSync('curl', args).toString().trim(), 10);
  await route.fulfill({ status: st, contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' }, body: readFileSync(bodyFile,'utf8') });
});
```

`request.headers()` **non contiene** l'header `Authorization` aggiunto dall'SDK:
usando quello, ogni lista torna vuota e sembra un problema di permessi. Serve
`await request.allHeaders()`.

**I colori di Tailwind v4 sono in `oklch`.** Un audit dei contrasti che cerca solo
`rgb()` non trova nulla sui gradienti e riporta falsi positivi (bianco su bianco).
La conversione oklch → sRGB è già dentro `browser_check.mjs`.

Altri controlli utili da automatizzare:

```js
// il pannello sborda senza modo di scorrere? (pulsante di conferma irraggiungibile)
const r = dialog.getBoundingClientRect();
const scorrevoli = [...dialog.querySelectorAll('*')].filter(x =>
  /auto|scroll/.test(getComputedStyle(x).overflowY) && x.scrollHeight > x.clientHeight + 1);
const bloccato = r.bottom > innerHeight && scorrevoli.length === 0;

// focus trap: 25 Tab non devono mai uscire dal dialogo
for (let i = 0; i < 25; i++) {
  await page.keyboard.press('Tab');
  const dentro = await page.evaluate(() =>
    document.querySelector('[role="dialog"]')?.contains(document.activeElement));
  if (!dentro) throw new Error('il focus è uscito dal dialogo');
}
```

## Log

**Vercel** — pannello del progetto → Deployments. Guarda lo **stato**: un deploy
fallito lascia online la versione precedente, quindi il sito funziona ma non
contiene le modifiche. È la spiegazione più frequente di "ho pushato ma non è
cambiato niente".

**PocketBase** — `docker logs <container> --tail 100`. All'avvio corretto compare
l'ascolto su `0.0.0.0:8090` con API e dashboard disponibili.

**Browser** — la console mostra i log di inizializzazione del client; il pannello
Network dice se la richiesta parte, verso quale host e con quale esito. Una
richiesta che parte ma non torna mai indica rete o proxy, non codice.

## Prima di dire che è pronto

- [ ] `pb_smoke_test.sh` senza fallimenti
- [ ] `browser_check.mjs` sull'URL pubblico, desktop **e** `--mobile`
- [ ] login e registrazione provati davvero, non solo l'endpoint
- [ ] un giro CRUD completo dall'interfaccia, non solo via curl
- [ ] il bundle pubblicato punta al backend giusto
- [ ] nessun record di prova lasciato nel database
