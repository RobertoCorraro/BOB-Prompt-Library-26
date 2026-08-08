# Schermate CRUD e autenticazione

Impalcatura minima ma completa per un'app di questo tipo. L'idea portante è tenere
la conversione fra il modo di ragionare di PocketBase (id, `expand`) e quello
dell'interfaccia (nomi leggibili) **ai confini**: due funzioni sole, in un punto
solo, così il resto dei componenti non deve saperne niente.

## Il confine fra dati e interfaccia

```js
// lettura: da record PocketBase a oggetto comodo per la UI
const normalizza = (r) => ({
  ...r,
  categoria: r.expand?.categoria?.nome ?? r.categoria,
  tag: (r.expand?.tag ?? []).map(t => t.nome),
  autore: r.expand?.owner?.name || r.expand?.owner?.email?.split('@')[0] || '',
});

// scrittura: da nomi scelti nella UI agli id attesi dal backend
const idDi = (nome, lista) => lista.find(x => x.nome === nome)?.id ?? nome;
```

Senza questo, o l'interfaccia mostra stringhe come `0mm9u7zbb4yj3eu`, o il
salvataggio fallisce con `validation_missing_rel_records`.

## Caricamento

```js
const carica = async () => {
  setCaricamento(true);
  try {
    const [articoli, categorie, tag] = await Promise.all([
      pb.collection('articoli').getFullList({ sort: '-created', expand: 'categoria,tag,owner' }),
      pb.collection('categorie').getFullList({ sort: '+nome' }),
      pb.collection('tag').getFullList({ sort: '+nome' }),
    ]);
    setArticoli(articoli.map(normalizza));
    setCategorie(categorie); setTag(tag);
    setErrore(null);
  } catch (e) {
    // Mostra sempre il dettaglio: "errore di caricamento" da solo non permette
    // di distinguere un campo mancante nello schema da un problema di permessi.
    setErrore(descriviErrore(e));
  } finally { setCaricamento(false); }
};

const descriviErrore = (e) => {
  const stato = e?.status ? `[HTTP ${e.status}] ` : '';
  const campi = e?.data && typeof e.data === 'object'
    ? Object.entries(e.data).map(([k, v]) => `${k}: ${v?.message ?? JSON.stringify(v)}`).join(' | ')
    : '';
  return stato + (campi || e?.message || String(e));
};
```

`getFullList` pagina da solo. Chiedi `expand` **sempre** per i campi relation che
l'interfaccia deve mostrare: senza, ricevi gli id e basta.

## Creazione e modifica

```js
const salva = async (form) => {
  // Payload esplicito: un record letto porta con sé expand, created, collectionId
  // e i campi che hai aggiunto tu per comodità — roba che non appartiene allo schema.
  const dati = {
    titolo: form.titolo,
    corpo: form.corpo,
    categoria: idDi(form.categoria, categorie),
    tag: (form.tag ?? []).map(n => idDi(n, tag)),
  };

  if (inModifica) {
    // owner non si tocca: chi corregge un contenuto altrui non ne diventa l'autore
    await pb.collection('articoli').update(inModifica.id, dati);
  } else {
    await pb.collection('articoli').create({ ...dati, owner: pb.authStore.model?.id });
  }
  await carica();               // ricarica: più semplice e sempre coerente
};
```

Per la duplicazione vale il contrario: la copia appartiene a chi la crea, quindi
`owner` va impostato all'utente corrente.

## Eliminazione

Chiedi conferma e ricarica. Se l'utente può eliminare solo i propri record
(`deleteRule: @request.auth.id = owner`), un tentativo su un record altrui torna
`404`, non `403`: PocketBase non rivela l'esistenza di ciò che non puoi toccare.
Nell'interfaccia conviene nascondere il pulsante quando `record.owner !== utente.id`,
così l'errore non si presenta proprio.

## Autenticazione

Una sola schermata con tre stati (`login`, `registrazione`, `recupero`) è più
semplice da mantenere di tre componenti separati, e permette di passare da uno
all'altro senza perdere l'email già digitata.

```js
// accesso
await pb.collection('users').authWithPassword(email, password);

// registrazione (poi accesso automatico)
await pb.collection('users').create({ email, password, passwordConfirm: password, name });
await pb.collection('users').authWithPassword(email, password);

// email già registrata: PocketBase lo dice così
const d = err?.response?.data ?? err?.data;
if (d?.email?.code === 'validation_not_unique') { /* proponi di accedere */ }

// ripristino della sessione all'avvio
if (pb.authStore.isValid) {
  try { await pb.collection('users').authRefresh(); }
  catch { pb.authStore.clear(); }   // token scaduto o utente eliminato
}

// uscita
pb.authStore.clear();
```

**Recupero password.** `requestPasswordReset()` non fallisce mai, nemmeno con
l'SMTP spento: risponde correttamente e non invia niente. Finché non c'è un
provider email configurato, dillo esplicitamente invece di scrivere "controlla la
tua email" — un flag di build come `VITE_SMTP_CONFIGURED` basta a cambiare
messaggio senza toccare il codice.

**Modalità ospite.** Se le regole richiedono l'autenticazione in lettura, un
visitatore non autenticato riceve liste vuote, non un errore: vedrebbe un'app
deserta. O apri `listRule`/`viewRule`, o non offrire quella modalità.

## Struttura delle schermate

```
App
├── Landing / accesso        quando non autenticato
├── Header                   ricerca, tema, uscita
├── Filtri                   categorie, tipi, tag; con i pulsanti per gestirli
├── Elenco                   griglia o lista (vedi frontend.md per il mobile)
├── Dettaglio                sola lettura + tutte le azioni
├── Form                     creazione e modifica
└── Conferme                 eliminazione, avvisi
```

Tutte le finestre passano dalla stessa primitiva `Modal` descritta in
`frontend.md`: chiusura con Esc, focus trattenuto, corpo scorrevole. Riscriverle
una per una significa dimenticare ogni volta qualcosa di diverso.

## Gestione delle tassonomie

Categorie, tipi e tag vanno creati e modificati dall'app, non dal pannello di
PocketBase: sono contenuti, non configurazione. Un modale unico parametrico sulla
collection evita di scriverne tre uguali — ma passagli **etichette esplicite** in
italiano invece di derivarle dal nome tecnico: ricavare il singolare togliendo
l'ultima lettera del plurale funziona in inglese e produce "Ta" da "Tag".

## Errori all'utente

Mostra sempre il dettaglio tecnico accanto al messaggio comprensibile. Nel debug di
questa architettura la differenza fra `HTTP 400 validation_missing_rel_records` e
`HTTP 400 Something went wrong` indica due cause completamente diverse — la prima
è un id sbagliato, la seconda quasi sempre un campo mancante nello schema — e un
generico "si è verificato un errore" le nasconde entrambe.
