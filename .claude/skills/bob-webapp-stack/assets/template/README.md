# Template UI — drop-in, non un framework

Non è un framework CSS (niente Bootstrap/Bulma/Material): sono i file **generici, già puliti da logica specifica** che danno all'app BOB Prompt Library la sua estetica ("premium", accessibile, mobile-first). Copiali dentro un nuovo progetto Vite invece di riscriverli da zero — sono già stati provati e corretti su un'app reale (vedi `../../log-progettazione/PROBLEMI-STORICI.md` del progetto sorgente per i bug già risolti in queste stesse righe).

## Cosa c'è

```
src/
├── components/
│   ├── Modal.jsx    # primitiva di dialogo: focus trap, role="dialog", Escape,
│   │                  scroll lock, focus restore. Overlay/pannello restano
│   │                  senza stile: passa overlayClassName/panelClassName tu.
│   └── Toast.jsx     # notifica bottom-center auto-dismiss (3s)
├── lib/
│   └── utils.js      # triggerHaptic + parseDate/formatDate
tailwind.config.js     # darkMode: 'selector' (necessario per il dark mode a toggle,
                         non solo prefers-color-scheme)
src/index.css          # base layer: font-size 16px su input/textarea/select per
                         evitare lo zoom automatico iOS quando si tocca un campo
```

## Come usarlo (dopo lo scaffold Vite — vedi `references/setup.md` per i comandi)

1. `npm install lucide-react clsx` (Modal non ne ha bisogno, Toast usa `lucide-react`).
2. Copia questa cartella `src/` dentro il nuovo progetto (merge, non sovrascrivere un `index.css` già personalizzato).
3. Usa `Modal` come base per **ogni** dialogo/popup nuovo — non scrivere di nuovo focus trap o gestione Escape a mano:
   ```jsx
   <Modal isOpen={open} onClose={close} labelledBy="my-title"
     overlayClassName="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
     panelClassName="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
     <h2 id="my-title">Titolo</h2>
     ...
   </Modal>
   ```
   Per una variante "bottom sheet" mobile, vedi lo snippet in `../../references/frontend.md`.

## Convenzione colore (non è un file di config, è una scelta da rispettare)

Nessun override di tema serve: la palette "Tailwind default" basta. La convenzione è **quali** scale usare, non *come* configurarle:
- **Primario/CTA piene**: `violet-600` → `purple-600` (gradiente) o `violet-600` solido — non `violet-500` o più chiaro, fallisce il contrasto AA su testo bianco.
- **Accenti secondari**: `fuchsia-600`, `green-600` (non `emerald-500`/`teal-500` chiari, letti come "blu-ish" o troppo poco contrastati).
- **Mai `blue-*`/`sky-*`/`indigo-*` chiari come colore di brand** — è l'errore fatto e poi corretto nel progetto sorgente (vedi `PROBLEMI-STORICI.md`).
- Verifica sempre il contrasto AA (4.5:1 su testo normale) quando introduci un nuovo abbinamento colore/sfondo, anche in dark mode.

## Cosa NON è incluso qui (di proposito)

Componenti legati al dominio dell'app sorgente (card dei prompt, filtri per categoria/tag, landing page) non sono qui: sono specifici di *quel* prodotto. Questo template contiene solo la parte riusabile — dialoghi accessibili, feedback aptico, gestione date PocketBase, convenzione colore.
