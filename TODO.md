# 🚀 Backlog & Sviluppi Futuri

Elenco di funzionalità e correzioni da implementare in un secondo momento. Aggiornato per lo stack attuale (PocketBase + Vercel) — la versione precedente di questo file conteneva voci Supabase-specifiche già superate o già risolte, rimosse da qui.

---

## 📊 Esportazione & Dati
- [ ] **Esportazione CSV**: implementare la conversione dei prompt in formato CSV (attualmente solo JSON).
- [ ] **Importazione**: permettere di caricare prompt da file JSON/CSV esterni.

## 🔐 Sicurezza & Account
- [ ] **Isolamento dati per utente** (opzionale): oggi è una libreria condivisa di team per scelta esplicita — nessun utente ha una libreria privata (vedi `CLAUDE.md` § Modello di accesso). Se in futuro serve, richiede di cambiare le API rule di `prompts`/`prompt_revisions` da "chiunque autenticato" a `@request.auth.id = owner` su update/delete, e valutare cosa succede alle taxonomy condivise (categorie/tipi/tag restano di team o diventano per-utente?).
- [x] ~~Recupero Password~~: implementato (`Login.jsx`, flusso PocketBase); mostra un avviso invece del falso "controlla la tua email" finché `VITE_SMTP_CONFIGURED` resta `false` (nessun provider SMTP reale attivo su `pb.frasi.info`).

## 🎨 UI/UX Avanzata
- [ ] **Modalità Desktop split-view**: lista a sinistra, contenuto a destra su schermi grandi.
- [ ] **Drag & Drop**: riordinare prompt o categorie tramite trascinamento.
- [ ] **Rich Text Editor**: supporto Markdown per il contenuto dei prompt.

## 🧹 Manutenzione
- [ ] **Dominio `lista.frasi.info`**: valutare switch DNS (CNAME) verso Vercel al posto del vecchio container Docker sulla VPS, che oggi resta acceso solo come fallback non aggiornato (vedi `CLAUDE.md`).
