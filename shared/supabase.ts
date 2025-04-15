import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// For server-side admin operations
export const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};