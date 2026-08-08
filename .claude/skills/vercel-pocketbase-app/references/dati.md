# Schema riproducibile e backup

Lo schema e i dati di PocketBase vivono in un volume Docker sulla VPS. Se quella
macchina si perde — o se qualcuno cancella il progetto sbagliato — non esiste altra
copia, a meno di averla fatta. Le due cose in questa pagina costano pochi minuti e
sono l'unica assicurazione contro la ricostruzione a mano.

## Creare lo schema da una specifica

`scripts/pb_schema.py apply` crea collection, campi e regole da un file JSON
leggibile, occupandosi dei dettagli che è facile sbagliare a mano: aggiunge sempre
i campi autodate, imposta `maxSelect` corretto sulle relazioni multiple e ordina le
creazioni in modo che le collection referenziate esistano già.

```bash
python3 scripts/pb_schema.py apply schema.spec.json \
  --url https://pb.dominio.it --email admin@dominio.it --password '...'
```

```json
{
  "collections": [
    {"name": "categorie", "rules": "auth", "fields": [
      {"name": "nome", "type": "text", "required": true},
      {"name": "colore", "type": "json"}
    ]},
    {"name": "articoli", "rules": "owner", "fields": [
      {"name": "titolo", "type": "text", "required": true},
      {"name": "corpo", "type": "editor"},
      {"name": "pubblicato", "type": "bool"},
      {"name": "categoria", "type": "relation", "collection": "categorie"},
      {"name": "tag", "type": "relation", "collection": "tag", "multiple": true},
      {"name": "owner", "type": "relation", "collection": "users"},
      {"name": "copertina", "type": "file"}
    ]}
  ]
}
```

Tipi accettati: `text`, `editor`, `bool`, `number`, `json`, `date`, `select`,
`file`, `relation`. Le relation vogliono `collection` (nome, non id) e
`multiple: true` se ne ammettono più di una.

Scorciatoie per `rules`:

| valore | significato |
|---|---|
| `"auth"` | tutto richiede un utente autenticato — libreria condivisa di squadra |
| `"owner"` | tutti gli autenticati leggono, solo il proprietario modifica ed elimina (serve un campo `owner` verso `users`) |
| `"public"` | lettura libera anche senza login, scrittura ai soli autenticati |

Puoi anche passare un oggetto con le cinque regole scritte per esteso.

Il comando è **idempotente**: rilanciato aggiunge solo ciò che manca, quindi si può
tenere la specifica nel repo ed evolverla insieme al codice.

## Versionare lo schema

```bash
python3 scripts/pb_schema.py dump schema.json --url ... --email ... --password ...
git add schema.json && git commit -m "chore: snapshot dello schema PocketBase"
```

Fallo **dopo ogni modifica allo schema**, anche quelle fatte a mano dal pannello:
altrimenti la copia versionata diverge da ciò che gira davvero e diventa
inaffidabile proprio quando serve.

Per ricreare tutto su un'altra istanza (ambiente di prova, migrazione di server):

```bash
python3 scripts/pb_schema.py restore schema.json --url https://pb-prova.dominio.it ...
```

L'import non elimina le collection assenti dal file: aggiunge e aggiorna soltanto,
quindi è sicuro da lanciare su un'istanza che contiene già qualcosa.

## Backup dei dati

Lo schema è metà del problema: senza i record non serve a niente.

**Modo consigliato — l'API di PocketBase**, che produce un archivio coerente
(mette in pausa le scritture durante lo snapshot):

```bash
TOKEN=$(curl -s -X POST https://pb.dominio.it/api/collections/_superusers/auth-with-password \
  -H 'Content-Type: application/json' -d '{"identity":"admin@dominio.it","password":"..."}' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')

# crea uno snapshot lato server
curl -s -X POST https://pb.dominio.it/api/backups -H "Authorization: $TOKEN"

# elenca e scarica
curl -s https://pb.dominio.it/api/backups -H "Authorization: $TOKEN"
curl -s -o backup.zip "https://pb.dominio.it/api/backups/<nome-file>" -H "Authorization: $TOKEN"
```

Il pannello `/_/` ha la stessa funzione sotto **Settings → Backups**, dove si può
anche programmare un backup automatico e configurare un bucket S3 esterno. Un
backup che resta sulla stessa macchina protegge da un errore umano, non dalla
perdita del server: se ti interessa il secondo caso, l'S3 esterno o un download
periodico sono l'unica risposta.

**Alternativa dal server**, se hai accesso alla shell della VPS:

```bash
docker run --rm -v <nome_volume_pb_data>:/data -v "$PWD":/backup alpine \
  tar czf /backup/pb-$(date +%F).tgz -C /data .
```

Da preferire solo a container fermo: a caldo puoi cogliere il database SQLite a
metà scrittura.

## Prima di toccare uno schema in produzione

1. `pb_schema.py dump` — hai una via di ritorno
2. backup dei dati con l'API
3. applica la modifica
4. `pb_smoke_test.sh` — verifica che le query dell'app reggano ancora
5. nuovo `dump` e commit

Le modifiche ai campi via `PATCH` sono **sostitutive**: chi manda solo il campo
nuovo cancella tutti gli altri. `pb_schema.py` rilegge sempre lo schema esistente e
accoda, ma se intervieni a mano tienilo bene a mente.
