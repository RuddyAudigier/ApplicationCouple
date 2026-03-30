import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabaseConfigError = supabaseConfigured
  ? ''
  : 'Supabase n’est pas configuré. Vérifie VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (Vercel → Settings → Environment Variables), puis redeploy.'

export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null
