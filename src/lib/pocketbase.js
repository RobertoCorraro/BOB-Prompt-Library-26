import PocketBase from 'pocketbase'

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL

export const isPocketBaseConfigured = Boolean(pocketbaseUrl)

if (!isPocketBaseConfigured) {
  console.warn('PocketBase environment variable is missing. App will run in local/mock mode.')
}

export const pb = new PocketBase(pocketbaseUrl || 'http://localhost:8090')

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
