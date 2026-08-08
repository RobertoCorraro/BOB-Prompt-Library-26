# PocketBase: schema, relazioni, regole

Le trappole di questa sezione hanno tutte la stessa caratteristica: **il sintomo
non somiglia alla causa**. Sono ordinate per quanto tempo fanno perdere.

## 1. Campi `created` / `updated` mancanti

**Sintomo.** Qualunque query ordinata per data risponde:

```
HTTP 400 {"data":{},"message":"Something went wrong while processing your request."}
```

Il messaggio non nomina il campo, quindi sembra un guasto del server. Con
`?sort=-id` invece funziona tutto: è quello il segnale che il problema è il campo,
non la connessione.

**Causa.** In PocketBase i campi `created` e `updated` **non esistono in
automatico**: sono campi di tipo `autodate` che vanno aggiunti allo schema. Le
collection create via API o migration se ne dimenticano facilmente.

**Rimedio.** Aggiungerli a ogni collection applicativa:

```python
campo_created = {"name":"created","type":"autodate","onCreate":True, "onUpdate":False,
                 "id":"autodate1","hidden":False,"presentable":False,"system":False}
campo_updated = {"name":"updated","type":"autodate","onCreate":True, "onUpdate":True,
                 "id":"autodate2","hidden":False,"presentable":False,"system":False}
# poi PATCH /api/collections/<nome> con {"fields":[...campi esistenti..., campo_created, campo_updated]}
```

Il PATCH dei campi è **sostitutivo**: rileggi lo schema, aggiungi in coda alla
lista esistente e rimanda tutto, altrimenti cancelli i campi che non hai incluso.

## 2. Campi relation: id in scrittura, `expand` in lettura

**Sintomo.** Al salvataggio:

```
HTTP 400 {"category":{"code":"validation_missing_rel_records",
          "message":"Failed to find all relation records with the provided ids."}}
```

**Causa.** Un campo `relation` accetta **id di record**, non nomi. Capita spesso
in app migrate da un database dove categoria e tipo erano semplici colonne di
testo: l'interfaccia continua a ragionare per nomi e manda `"Marketing"` dove
serve `"0mm9u7zbb4yj3eu"`.

**Rimedio.** Convertire nei due sensi ai confini dell'applicazione, lasciando che
il resto del codice continui a ragionare per nomi:

```js
// scrittura: nome -> id
const idFor = (nome, lista) => lista.find(x => x.name === nome)?.id ?? nome;

await pb.collection('prompts').create({
  title,
  category: idFor(form.category, categorie),
  tags: form.tags.map(n => idFor(n, tuttiITag)),   // le relation multiple vogliono un array
});

// lettura: chiedi expand e rileggi i nomi da lì
const record = await pb.collection('prompts').getFullList({ expand: 'category,type,tags' });
const nome = r.expand?.category?.name ?? r.category;
const tags = (r.expand?.tags ?? []).map(t => t.name);
```

Senza `expand` ricevi solo gli id e l'interfaccia mostra stringhe incomprensibili.

## 3. `maxSelect: 0` = selezione singola (e perdita silenziosa)

**Sintomo.** Salvi tre tag, ne resta **uno solo**, l'ultimo. Nessun errore.

**Causa.** Su un campo `relation`, `maxSelect: 0` non significa "illimitati": viene
trattato come selezione singola, e il valore memorizzato è una stringa invece di un
array.

**Rimedio.** Impostare un massimo esplicito maggiore di 1 (es. `20`) sul campo, e
ricontrollare i record già salvati: quelli scritti prima hanno perso i valori in
eccesso e vanno riassegnati.

Lo script `pb_smoke_test.sh` segnala da solo questa configurazione.

## 4. Le regole di accesso filtrano, non bloccano

Una `listRule` come `@request.auth.id != ''` applicata a una richiesta anonima
**non produce 403**: produce `200` con `items: []`. Conseguenze pratiche:

- una "modalità ospite" che si limita a non autenticarsi mostra un'app vuota, non
  un messaggio di errore: o si aprono le regole in lettura, o la si toglie;
- un elenco vuoto in fase di debug non vuol dire che i dati siano spariti — prima
  di allarmarsi, rifare la stessa query con il token di un superuser.

## 5. `expand` verso `users` richiede una view rule permissiva

**Sintomo.** Il campo `owner` contiene un id corretto, ma `expand.owner` è assente
per i record altrui — quindi l'interfaccia non riesce a mostrare "creato da".

**Causa.** L'espansione rispetta le regole della collection collegata. Con la
`viewRule` predefinita `id = @request.auth.id` ciascuno può vedere **solo il
proprio** record utente.

**Rimedio.** Aprire lettura e lista di `users` agli autenticati, lasciando
invariata la `updateRule` così nessuno può modificare l'account altrui:

```
listRule:   @request.auth.id != ''
viewRule:   @request.auth.id != ''
updateRule: id = @request.auth.id     ← non toccare
```

Va detto a chi usa l'app: da quel momento nome ed email sono visibili agli altri
utenti autenticati. Se basta il nome, disattivare `emailVisibility`.

## 6. Attribuzione non è autorizzazione

Un campo `owner` valorizzato alla creazione mostra chi ha creato cosa, ma **non
impedisce** agli altri di modificare o eliminare: quello dipende solo dalle regole.
Per renderlo un vincolo vero servono `updateRule` e `deleteRule` tipo
`@request.auth.id = owner`. Da decidere consapevolmente: libreria condivisa di
squadra oppure archivi separati per utente.

Alla modifica, **non** riscrivere `owner`: chi corregge un contenuto altrui non
deve diventarne l'autore. Alla duplicazione invece sì, la copia è di chi la fa.

## 7. SMTP spento: il recupero password finge di funzionare

Con `smtp.enabled: false`, `requestPasswordReset()` **non fallisce**: risponde
correttamente e non invia nulla. Un'interfaccia che dice "controlla la tua email"
sta mentendo.

Finché l'SMTP non è configurato, mostrare un avviso esplicito. Un semplice flag di
build (`VITE_SMTP_CONFIGURED`) permette di cambiare messaggio senza toccare il
codice. Stessa logica per `authRule`: se richiede `verified = true` e l'SMTP è
spento, **nessuno riesce più ad accedere**.

## 8. Formato date

PocketBase restituisce `2026-08-01 14:53:28.228Z` — con **spazio** al posto della
`T`. Node e Chrome lo accettano, **Safari e iOS no**: producono `Invalid Date`. Chi
sviluppa su desktop non se ne accorge.

```js
export const parseDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};
```

Attenzione anche ai **nomi**: i campi sono `created` e `updated`. Codice ereditato
da altri backend cerca spesso `created_at` / `updated_at`, ottiene `undefined` e
mostra "Invalid Date" ovunque.

## Payload di scrittura: manda solo ciò che è nello schema

Un record letto contiene anche `expand`, `collectionId`, `created`, e gli eventuali
campi calcolati aggiunti dall'app. Rimandarlo così com'è in fase di update è
fragile. Meglio costruire un oggetto esplicito con i soli campi previsti.
