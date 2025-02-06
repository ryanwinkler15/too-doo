import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

// Create a single instance of the Supabase client
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>()
  }
  return supabaseClient
}

// Function to check if we have a valid session
export const hasValidSession = async () => {
  const client = getSupabaseClient()
  const { data: { session }, error } = await client.auth.getSession()
  return !!session && !error
} 