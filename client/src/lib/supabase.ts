import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables (configured in Replit)
// These correspond to the environment secrets you have available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side admin operations
export const createSupabaseAdmin = () => {
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
};