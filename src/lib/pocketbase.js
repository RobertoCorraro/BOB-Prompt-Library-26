import PocketBase from 'pocketbase'

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL

export const isPocketBaseConfigured = Boolean(pocketbaseUrl)

if (!isPocketBaseConfigured) {
  console.warn('PocketBase environment variable is missing. App will run in local/mock mode.')
}

// AsyncAuthStore persiste il token in localStorage automaticamente
export const pb = new PocketBase(pocketbaseUrl || 'http://localhost:8090')

// Abilita la persistenza automatica della sessione nel localStorage
pb.authStore.onChange(() => {
  localStorage.setItem('bob_pb_auth', JSON.stringify({
    token: pb.authStore.token,
    model: pb.authStore.model,
  }))
})

// Ripristina la sessione al caricamento
try {
  const saved = localStorage.getItem('bob_pb_auth')
  if (saved) {
    const { token, model } = JSON.parse(saved)
    pb.authStore.save(token, model)
  }
} catch {
  localStorage.removeItem('bob_pb_auth')
}

// Helper: normalize tags from PocketBase (stored as JSON string) to JS array
export const normalizeTags = (tags) => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    try { return JSON.parse(tags) } catch { return [] }
  }
  return []
}

// Helper: serialize tags from JS array to JSON string for PocketBase storage
export const serializeTags = (tags) => {
  if (!tags) return '[]'
  if (typeof tags === 'string') return tags
  return JSON.stringify(tags)
}
