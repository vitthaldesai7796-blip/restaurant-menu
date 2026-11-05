import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)
export const IMAGE_BUCKET = 'menu-images'

// Only the public "anon" key is ever used in the browser. Security is enforced by RLS policies.
export const supabase = createClient(url || 'http://localhost', key || 'missing-key')
