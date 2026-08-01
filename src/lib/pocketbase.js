import PocketBase from 'pocketbase'

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL

export const isPocketBaseConfigured = Boolean(pocketbaseUrl)

// Nessuna API pubblica di PocketBase espone lo stato SMTP: questo flag va
// impostato a mano (VITE_SMTP_CONFIGURED=true) quando viene attivato un
// provider email reale sull'istanza PocketBase.
export const isSmtpConfigured = import.meta.env.VITE_SMTP_CONFIGURED === 'true'

// ─ Diagnostic log ───────────────────────────────────────────────
console.group('🔧 PocketBase Init')
console.log('VITE_POCKETBASE_URL:', pocketbaseUrl || '❌ NON DEFINITA')
console.log('isPocketBaseConfigured:', isPocketBaseConfigured)
console.groupEnd()

if (!isPocketBaseConfigured) {
  console.warn('⚠️ PocketBase URL mancante → modalità mock attiva')
}

export const pb = new PocketBase(pocketbaseUrl || 'http://localhost:8090')

// ─ Auth store diagnostics ────────────────────────────────────────
pb.authStore.onChange((token, model) => {
  console.group('🔐 AuthStore changed')
  console.log('Token presente:', Boolean(token))
  console.log('Model:', model ? `${model.email} (id: ${model.id})` : 'null')
  console.log('isValid:', pb.authStore.isValid)
  console.groupEnd()
  // Token mantenuto in memoria dal SDK durante la sessione corrente
})

// ─ Fetch wrapper con log ─────────────────────────────────────────
export const fetchCollection = async (collectionName, options = {}) => {
  console.group(`📦 Fetch: ${collectionName}`)
  console.log('Options:', options)
  console.log('Auth valida:', pb.authStore.isValid)
  console.log('Token:', pb.authStore.token ? pb.authStore.token.substring(0, 20) + '...' : 'nessuno')
  try {
    const result = await pb.collection(collectionName).getFullList(options)
    console.log(`✅ ${collectionName}: ${result.length} record ricevuti`)
    if (result.length > 0) {
      console.log('Esempio primo record:', result[0])
      console.log('Chiavi disponibili:', Object.keys(result[0]))
      if (result[0].category !== undefined) {
        console.log('category tipo:', typeof result[0].category, '→ valore:', result[0].category)
      }
      if (result[0].type !== undefined) {
        console.log('type tipo:', typeof result[0].type, '→ valore:', result[0].type)
      }
      if (result[0].tags !== undefined) {
        console.log('tags tipo:', typeof result[0].tags, Array.isArray(result[0].tags) ? '(array)' : '', '→ valore:', result[0].tags)
      }
    }
    console.groupEnd()
    return result
  } catch (err) {
    console.error(`❌ Errore fetch ${collectionName}:`)
    console.error('  Status HTTP:', err.status)
    console.error('  Messaggio:', err.message)
    console.error('  URL:', err.url)
    console.error('  Dettaglio risposta:', err.data)
    console.error('  Auth valida al momento errore:', pb.authStore.isValid)
    console.groupEnd()
    throw err
  }
}

// ─ Tag helpers ───────────────────────────────────────────────────
// Con campi relation, tags è già un array di ID — normalizeTags gestisce entrambi i casi
export const normalizeTags = (tags) => {
  console.debug('normalizeTags input:', tags, '| tipo:', typeof tags, Array.isArray(tags) ? '(array)' : '')
  if (!tags) return []
  // Se relation → array di ID stringhe o oggetti espansi
  if (Array.isArray(tags)) {
    return tags.map(t => (typeof t === 'object' && t !== null ? t.name ?? t.id : t))
  }
  // Legacy: stringa JSON (vecchio schema)
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      console.debug('normalizeTags: parsed da stringa JSON:', parsed)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      console.warn('normalizeTags: impossibile fare JSON.parse su:', tags)
      return []
    }
  }
  return []
}

export const serializeTags = (tags) => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags // Per relation, invia array di ID
  if (typeof tags === 'string') {
    try { return JSON.parse(tags) } catch { return [] }
  }
  return []
}

// ─ Normalize relation field ──────────────────────────────────────
// Restituisce il nome leggibile da un campo relation (espanso o solo ID)
export const normalizeRelationField = (field, expandKey, expandedData) => {
  if (!field) return null
  if (expandedData && expandedData[expandKey]) {
    return expandedData[expandKey].name ?? field
  }
  console.debug(`normalizeRelationField: campo "${expandKey}" non espanso, valore grezzo:`, field)
  return field
}
