# Appunto — stack UI e modali (perché "viene bene" senza Bootstrap)

Nota rapida su cosa produce l'estetica/UX di questa app, per riuso consapevole su altri progetti.

## Non c'è nessun framework CSS a componenti

**Non usiamo Bootstrap, Bulma, Material Design o simili.** Sono stati valutati esplicitamente (quando è emerso il dubbio sull'accessibilità dei modali) e scartati: il problema che sembravano poter risolvere (modali senza `role="dialog"`, senza focus trap, senza Escape) era nello strato di **interazione/JavaScript**, non nello styling — un framework CSS diverso non l'avrebbe risolto comunque, e avrebbe portato con sé un intero design system generico da poi "smontare" per arrivare alla palette violetto/viola custom.

## Cosa c'è davvero

- **Tailwind CSS v4** (CSS-first config, `@theme` in `src/index.css`) — solo utility class, nessun componente pre-fatto. Tutto l'aspetto (bordi arrotondati, ombre, gradienti, spaziature) è deciso a mano, utility per utility, non ereditato da un tema.
- **Palette custom violetto/viola** (`violet-*`, `fuchsia-*` come colore primario) definita e verificata a mano per contrasto WCAG AA — non è un tema pronto, è stata scelta e testata (anche in dark mode) componente per componente.
- **`lucide-react`** per le icone — libreria di sole icone SVG, non un design system.
- **Un'unica primitiva di dialogo custom**, `src/components/Modal.jsx`, scritta da zero e riusata da *tutti* i popup dell'app (AdminModal, SettingsModal, PromptViewModal, AuthGuardModal, FilterSidebar, modale di compilazione variabili). Gestisce:
  - `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (o `aria-label`)
  - **focus trap** (Tab/Shift+Tab restano dentro il dialogo)
  - focus iniziale posizionato dentro il dialogo, e **ripristinato** sull'elemento che l'aveva aperto alla chiusura
  - chiusura con **Escape**
  - chiusura al click sull'overlay, ma solo su `mousedown` con target esattamente l'overlay (non un generico `onClick`, altrimenti selezionare del testo e trascinare il mouse fuori dal dialogo lo chiuderebbe per errore)
  - **scroll lock** del `body` mentre è aperto, con ripristino alla chiusura
- **Varianti mobile "bottom sheet"** costruite sopra la stessa primitiva: `max-h-[92dvh]` (non `vh`, per gestire le barre del browser mobile che appaiono/scompaiono), `overscroll-contain`, `env(safe-area-inset-bottom)`, layout a 3 bande (header/footer fissi, corpo centrale scrollabile) così un pulsante di conferma non finisce mai fuori schermo irraggiungibile — problema reale già capitato una volta, vedi `PROBLEMI-STORICI.md` punto 9.
- **Feedback aptico** (`triggerHaptic`) su azioni chiave (copia, salvataggio, errori, apertura/chiusura filtri) — dettaglio piccolo ma è una delle cose che fa sembrare l'app "un'app" e non "un sito".

## In una frase

L'effetto "premium" non viene da un framework: viene da **una palette scelta e verificata a mano** + **un solo componente di dialogo accessibile riusato ovunque** + **attenzione reale al mobile** (bottom sheet, densità delle liste, contrasto) invece che da un tema scaricato. È lo stesso approccio documentato per riuso in `.claude/skills/bob-webapp-stack/references/frontend.md`.
