# Frontend: accorgimenti che si pagano cari se scoperti tardi

Raccolta di problemi che non si vedono sviluppando su desktop e che emergono in
mano agli utenti — quasi sempre su telefono.

## Modali: una primitiva condivisa, non markup ripetuto

Ogni finestra di dialogo scritta a mano tende a dimenticare le stesse cose:
chiusura con Esc, semantica per gli screen reader, e soprattutto il **focus trap**
(premendo Tab si finisce a navigare la pagina dietro l'overlay, senza capire dove
sia finito il cursore).

Conviene scrivere una volta sola un componente `Modal` che si occupa di:

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` sul titolo
- chiusura con `Escape`
- focus iniziale dentro al pannello e **ritorno** all'elemento che l'ha aperto
- blocco e ripristino dello scorrimento di fondo
- chiusura su clic dell'overlay basata su **`mousedown` sul solo overlay**: con un
  `onClick` generico, selezionare del testo dentro al pannello e rilasciare il
  mouse fuori chiude la finestra sotto le dita

Overlay e pannello restano stilizzati da chi lo usa, così l'aspetto dei singoli
modali non cambia e la migrazione è a costo quasi zero.

## Modali su mobile: servono tre fasce

Il difetto più grave e più facile da non vedere: un pannello **senza altezza
massima e senza area scorrevole**. Con pochi campi sta nello schermo, con qualcuno
in più sfora — e siccome il modale blocca anche lo scroll della pagina, **il
pulsante di conferma diventa irraggiungibile**. L'utente non può completare
l'operazione e non capisce perché.

Struttura corretta:

```jsx
panelClassName="flex flex-col max-h-[92dvh] overflow-hidden
                rounded-t-3xl sm:rounded-2xl"     // pannello a comparsa su mobile
```
```jsx
<div className="shrink-0">…intestazione…</div>
<div className="flex-1 overflow-y-auto overscroll-contain">…contenuto…</div>
<div className="shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">…azione…</div>
```

Dettagli che contano:

- **`dvh` invece di `vh`**: `vh` non tiene conto delle barre del browser mobile, e
  il footer finisce sotto la barra degli indirizzi.
- **`overscroll-contain`**: impedisce che, arrivati a fine scroll, il movimento
  prosegua sulla pagina sottostante.
- **`env(safe-area-inset-bottom)`**: lascia spazio alla home bar di iOS.
- Su mobile conviene ancorare il pannello in basso (`items-end sm:items-center`)
  con una maniglia in cima: è la convenzione che gli utenti riconoscono.

## Densità dei comandi nelle liste

Su schermi stretti i pulsanti azione mangiano lo spazio del contenuto. In un caso
reale, su 390px di larghezza cinque pulsanti occupavano **241px su 358**, lasciando
83px al titolo: gli elementi erano indistinguibili l'uno dall'altro.

Criterio: su mobile tieni **solo l'azione principale**, quella per cui si apre
l'app di corsa. Il resto resta raggiungibile aprendo il dettaglio, che di solito
contiene già tutti i comandi. Un chevron segnala che la riga è toccabile.

```jsx
<button className="w-14 sm:w-16 …">…azione principale…</button>
<button className="hidden sm:flex w-16 …">…le altre, solo da tablet in su…</button>
```

Il titolo, con lo spazio recuperato, può andare a capo (`line-clamp-2 sm:truncate`)
invece di essere troncato dopo tre lettere.

## Date

PocketBase usa `created` / `updated`, non `created_at` / `updated_at`, e li
restituisce con uno **spazio** al posto della `T`. Su Safari e iOS ciò produce
`Invalid Date` mentre su desktop funziona tutto. Vedi `pocketbase.md`, punto 8:
serve normalizzare il formato e non mostrare mai la stringa grezza.

## Contrasti e accessibilità

Verificali **calcolandoli sul DOM renderizzato**, non a occhio: `browser_check.mjs`
lo fa e considera gradienti e colori `oklch`.

Due errori ricorrenti trovati su un progetto reale:

- **tonalità invertite tra i temi**: `text-slate-400 dark:text-slate-500` dà al
  tema chiaro il grigio più chiaro e a quello scuro il più scuro — il peggiore in
  entrambi i casi. Va invertito: `text-slate-500 dark:text-slate-400`.
- **gradienti dei pulsanti troppo chiari**: un gradiente che parte da una tinta
  a 500 con testo bianco può stare sotto 3:1. Per il testo normale serve 4.5:1;
  conviene partire da una tonalità 600.

Un colore che *sembra* a posto può non esserlo: prima di sostituire una palette,
misura anche quella vecchia — capita di scoprire che il problema c'era già.

## Variabili d'ambiente e versione

`import.meta.env.VITE_*` viene risolta **in fase di build**. Un fallback tipo
`import.meta.env.VITE_APP_VERSION || '1.1.0'` su Vercel — dove quella variabile non
è impostata — mostra per sempre `1.1.0`, contraddicendo la versione vera letta da
`package.json` altrove. Prendi il numero da un'unica fonte e mostralo in un unico
punto.

## Codice morto

Componenti importati ma mai renderizzati sopravvivono a lungo e confondono: capita
di correggere un file che non è quello effettivamente in uso, perché lo stesso
modale esiste sia come componente sia scritto inline nella pagina. Prima di
mettere mano a un componente, verifica che sia davvero montato:

```bash
grep -rn "NomeComponente" src/ | grep -v "src/components/NomeComponente"
```
