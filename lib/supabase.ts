import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface Acceso {
  id: number
  ip: string
  fecha: string
}

export interface Cargo {
  id: number
  nombre: string
  salario: number
}

export interface Festivo {
  id: number
  fecha: string
  nombre: string
  tipo: 'FIJO' | 'MOVIL'
} 