# Log di progettazione — problemi reali e come sono stati risolti

Fonte di verità per gli incidenti/bug reali incontrati costruendo questa app. Obiettivo: non rispiegare da zero un sintomo "già visto" (qui o su un'altra app con lo stesso stack) e non ripetere lo stesso errore. Ordine cronologico. Per la guida riusabile (non legata alla storia di *questa* app) vedi la skill `.claude/skills/bob-webapp-stack/`.

---

## 1. Traefik serviva un 404 e sembrava "PocketBase giù"

**Sintomo**: il frontend non si connetteva a PocketBase; le richieste all'URL configurato tornavano 404.
**Causa reale**: la regola `Host()` del router Traefik conteneva ancora il placeholder letterale `<DOMINIO_POCKETBASE>`, mai sostituito con il dominio vero — Traefik non aveva nessuna route valida per quell'host e rispondeva con il proprio 404 generico (`"404 page not found"`, senza header `Server`, diverso dal 404 JSON che restituisce PocketBase stesso per un path non trovato).
**Fix**: dominio reale (`pb.frasi.info`) impostato sulla regola `Host()` lato VPS.
**Segnale utile per il futuro**: un 404 "vuoto"/senza corpo JSON quando ti aspetti PocketBase è quasi sempre un problema di routing Traefik, non del servizio PocketBase stesso.

## 2. `npm ci` falliva in CI con `EUSAGE`

**Causa**: `package-lock.json` era ancora quello dell'era Supabase, disallineato dal `package.json` PocketBase-era (dipendenze cambiate).
**Fix**: `rm package-lock.json && npm install --package-lock-only`, poi commit del lockfile rigenerato.

## 3. Salvataggio prompt falliva con `validation_missing_rel_records`

**Causa**: categoria/tipo/tag in PocketBase sono campi `relation` (richiedono l'id del record collegato). Il codice, ereditato dall'epoca Supabase, inviava il **nome** come stringa.
**Fix**: introdotto un confine esplicito in `App.jsx` — in lettura, `expand` sulla relation + `normalizeRecord()` per esporre alla UI il nome leggibile; in scrittura, `idFor(nome, lista)` per risolvere il nome nell'id prima di inviarlo a PocketBase. Pattern completo (riusabile) in `.claude/skills/bob-webapp-stack/references/crud-ui.md`.

## 4. I tag oltre il primo sparivano silenziosamente

**Sintomo**: creati 3 tag su un prompt demo, ne persisteva solo 1 dopo il salvataggio — nessun errore.
**Causa**: il campo relation `tags` aveva `maxSelect: 0`. In PocketBase questo **non** significa "illimitato": significa selezione singola. Il campo si comportava quindi come un relation a singolo valore, scartando silenziosamente tutto tranne l'ultimo tag.
**Fix**: `maxSelect` impostato esplicitamente a un valore >1 (es. 20) su `prompts.tags` e `prompt_revisions.tags` via API admin di PocketBase; dati demo già corrotti ripristinati a mano. `pb_schema.py` (nella skill) ora imposta sempre `maxSelect` esplicito e non lo lascia mai a `0` per una relation "multiple".

## 5. Date mostrate come "Invalid Date" (solo su Safari/iOS)

**Causa**: PocketBase formatta `created`/`updated` con uno **spazio** al posto della `T` ISO (`2026-08-01 14:53:28.228Z`). Il costruttore `Date()` di Chrome/Node è permissivo e lo accetta; quello di Safari/WebKit no. Bug quindi invisibile durante lo sviluppo (Chrome) e visibile solo agli utenti iOS/Safari.
**Causa aggiuntiva trovata nello stesso giro**: alcuni punti del codice usavano ancora nomi di campo dell'epoca Supabase (`created_at`, `updated_at`, `rev.versionDate`) che su PocketBase non esistono — `undefined` passato a `Date()`.
**Fix**: helper `parseDate`/`formatDate` in `src/lib/utils.js` (sostituisce lo spazio con `T` prima di costruire il `Date`), usati ovunque al posto di `new Date(...)` diretto; nomi di campo corretti a `created`/`updated`.

## 6. "Modalità ospite" mostrava sempre zero prompt

**Causa**: le API rule List/View di PocketBase, quando non soddisfatte, **filtrano** i risultati invece di restituire 401/403 — un utente anonimo riceve `200 OK` con `items: []`. La modalità ospite dell'app (pensata per Supabase, dove una RLS chiusa dà errore esplicito) interpretava quindi "nessun dato" come "nessun prompt esistente", non come "accesso negato".
**Fix**: rimossa del tutto la modalità ospite, per scelta esplicita dell'utente (libreria di team autenticata, non lettura pubblica). Da tenere a mente per qualunque nuova feature "pubblica": una lista vuota da PocketBase non prova che i dati non esistano.

## 7. 6 modali su 7 senza semantica di accessibilità

**Sintomo**: nessun `role="dialog"`, `aria-modal`, gestione focus o `Escape` su quasi tutti i popup dell'app; `PromptViewModal` non si chiudeva nemmeno cliccando fuori (handler assente).
**Decisione**: invece di cambiare framework CSS (opzione valutata e scartata: il problema era nello strato di interazione/JS, non nello styling, quindi un framework diverso non l'avrebbe risolto), costruita una primitiva condivisa `src/components/Modal.jsx` (focus trap, `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape, scroll lock/restore, focus restore, overlay-click-to-close via `mousedown`) e migrati tutti i dialoghi a usarla.
**Scoperta collaterale**: `VariableModal.jsx` era **codice morto** — importato in `App.jsx` ma mai renderizzato (il modale di compilazione reale era scritto inline altrove). Scoperto perché lo script di audit accessibilità non trovava mai `role="dialog"` per quel componente. File eliminato.

## 8. Vista a lista illeggibile su mobile

**Misura reale**: 5 pulsanti azione occupavano 241px di 358px di larghezza riga (67%), lasciando 83px per il titolo — troncato a circa 9 caratteri.
**Fix**: su mobile mostrato solo il pulsante "Copia" (`w-14`), gli altri 4 nascosti (`hidden sm:flex`); titolo passato a `line-clamp-2` invece di singola riga troncata. Verificato con automazione browser: titolo passato da 83px a 243px di spazio disponibile, non più troncato.

## 9. Modale di compilazione variabili inutilizzabile su mobile

**Misura reale**: pannello alto 1028px contro un viewport di 844px, **zero** aree scrollabili — il pulsante di conferma "Copia & Chiudi" era fuori schermo e irraggiungibile.
**Fix**: layout a 3 bande (header/footer fissi, corpo `flex-1 overflow-y-auto overscroll-contain`), altezza massima in `dvh` (non `vh`, per gestire correttamente le barre mobile che appaiono/scompaiono).
**Bug indipendente trovato nello stesso lavoro**: i campi variabile erano input **non controllati** (nessun `value`) — il testo digitato spariva visivamente al re-render pur arrivando correttamente all'anteprima e alla copia finale. Fix: `value={compileModal.inputs[v] ?? ''}`.

## 10. Bug nello script di smoke test stesso (non nell'app)

Durante la scrittura di `pb_smoke_test.sh` (nella skill), due bug hanno prodotto falsi positivi:
- un heredoc `<<'PY'` consumava lo stdin prima che ci arrivasse il JSON pipato (`echo "$COLLS" | python3 - <<'PY'`) → traceback silenzioso, sezione di audit schema che non stampava nulla di utile. Fix: passare il JSON come `sys.argv[1]` invece che da stdin.
- lo script usava `UID`, variabile **readonly** di bash, per salvare l'id dell'utente di test → l'assegnazione falliva silenziosamente, la DELETE di pulizia finale colpiva una variabile vuota e **non cancellava nulla**. Scoperto solo controllando a mano la collection `users` su `pb.frasi.info` e trovando un utente `zz-smoke-*@example.com` residuo. Fix: variabile rinominata `TESTUID`, aggiunto controllo esplicito dello status HTTP della DELETE con warning se fallisce.

---

## Cosa NON è (ancora) un problema documentato qui

Se in una nuova sessione trovi un sintomo non elencato sopra, aggiungilo qui dopo averlo risolto — non lasciarlo solo nella cronologia della chat.
