'use client';
import { ReactNode, useEffect } from 'react';
import { useSupabaseAuth } from './use-supabase-auth';
import { queryClient } from '@/lib/queryClient';
import { User as SelectUser } from '@shared/schema';

/**
 * This component serves as an adapter between Supabase Auth and our application's auth system.
 * It syncs the Supabase auth state with our React Query cache.
 */
export function SupabaseAuthAdapter({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSupabaseAuth();

  // Sync Supabase user with our app's user data structure
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      // Create a properly formatted user object for our app
      const appUser = {
        id: Number(user.id) || -1, // Use -1 for dev users with non-numeric IDs
        username: user.email || 'user',
        displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        status: user.user_metadata?.status || 'Available',
        profileImage: user.user_metadata?.profileImage || null,
        isOnline: true,
        lastSeen: new Date(),
        password: '', // Never expose password
      } as SelectUser;

      // Set this user in our React Query cache
      queryClient.setQueryData(['/api/user'], appUser);
    } else {
      // Clear user from cache when signed out
      queryClient.setQueryData(['/api/user'], null);
    }
  }, [user, isLoading]);

  return <>{children}</>;
}