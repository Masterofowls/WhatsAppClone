import { createSupabaseAdmin } from '@shared/supabase';

// Admin function to confirm user email without verification
export async function adminConfirmUser(userId: string) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    
    // Update auth.users directly to set email_confirmed_at
    const { data, error } = await supabaseAdmin
      .from('auth.users')
      .update({ email_confirmed_at: new Date().toISOString() })
      .eq('id', userId);
      
    if (error) {
      console.error('Error confirming user:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Exception confirming user:', error);
    return { success: false, error };
  }
}

// Admin function to fetch user by email
export async function getUserByEmail(email: string) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    
    const { data, error } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, email_confirmed_at')
      .eq('email', email)
      .single();
      
    if (error) {
      console.error('Error getting user by email:', error);
      return { success: false, error };
    }
    
    return { success: true, user: data };
  } catch (error) {
    console.error('Exception getting user by email:', error);
    return { success: false, error };
  }
}