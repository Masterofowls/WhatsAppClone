import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables (configured in Replit)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side admin operations
export const createSupabaseAdmin = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
};