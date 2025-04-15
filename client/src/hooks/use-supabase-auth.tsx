'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Session, User, AuthError } from '@supabase/supabase-js';

interface SupabaseAuthContextType {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string, userData?: Record<string, any>) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  updateProfile: (data: Record<string, any>) => Promise<{ error: AuthError | null }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    async function getInitialSession() {
      setIsLoading(true);
      
      // Get session data
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching initial session:', error);
        toast({
          title: 'Authentication Error',
          description: error.message,
          variant: 'destructive',
        });
      }
      
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setIsLoading(false);
    }

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event);
      setSession(newSession);
      setUser(newSession?.user || null);
      
      if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries();
      } else if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, queryClient]);

  const signUp = async (email: string, password: string, userData?: Record<string, any>) => {
    // In development mode, we'll create a simulated signup process that doesn't rely on email confirmation
    if (import.meta.env.DEV) {
      try {
        console.log('[DEV MODE] Using simulated sign up for:', email);
        
        // Simulate a successful registration
        // Then go directly to our special dev signin that bypasses confirmation
        setUser({
          id: 'dev-user-id',
          email: email,
          user_metadata: { 
            ...userData,
            name: userData?.name || email.split('@')[0] 
          },
          created_at: new Date().toISOString(),
          app_metadata: {},
          aud: 'authenticated',
          confirmed_at: new Date().toISOString()
        } as any);
        
        toast({
          title: 'Development sign up',
          description: 'Account created and signed in (DEV MODE)',
          variant: 'default',
        });
        
        return { error: null };
      } catch (devError) {
        console.error('[DEV MODE] Simulated signup failed, falling back to normal flow', devError);
      }
    }
    
    // Normal Supabase flow
    const { error, data } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: userData,
        emailRedirectTo: window.location.origin,
      }
    });
    
    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // In development, we'll auto-confirm and auto-login users
      if (import.meta.env.DEV) {
        try {
          // Wait a bit to allow Supabase to create the user
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Use our simulated confirmation endpoint
          const confirmRes = await fetch('/api/dev/confirm-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          
          if (confirmRes.ok) {
            const data = await confirmRes.json();
            console.log('User auto-confirm response:', data);
          } else {
            const errorText = await confirmRes.text();
            console.warn('Could not auto-confirm user:', errorText);
          }
        } catch (confirmError) {
          console.error('Error auto-confirming user:', confirmError);
        }
        
        // Then try to sign in
        await signIn(email, password);
        toast({
          title: 'Sign up and sign in successful',
          description: 'Your account was created and you are now signed in.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Sign up successful',
          description: 'Please check your email to confirm your account.',
          variant: 'default',
        });
      }
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // First try normal sign in
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    // If sign in fails with email_not_confirmed and we're in development mode,
    // we'll try a special development-only bypass
    if (error && error.message === 'Email not confirmed' && import.meta.env.DEV) {
      try {
        console.log('Attempting dev mode auth bypass for:', email);
        
        // Try manual confirmation first
        const confirmRes = await fetch('/api/dev/confirm-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (confirmRes.ok) {
          console.log('Dev auth: User confirmed successfully');
          
          // Try signing in again
          const retryResult = await supabase.auth.signInWithPassword({ email, password });
          
          if (!retryResult.error) {
            toast({
              title: 'Dev sign in successful',
              description: 'Signed in after auto-confirmation',
              variant: 'default',
            });
            return { error: null };
          }
          
          // If still fails, we'll simulate a successful auth
          if (retryResult.error) {
            console.log('Dev auth: Still cannot sign in after confirmation, using simulation');
            
            // Try to load saved profile data from localStorage
            let savedProfile = {};
            try {
              const savedData = localStorage.getItem('dev_user_profile');
              if (savedData) {
                savedProfile = JSON.parse(savedData);
              }
            } catch (e) {
              console.error('Failed to load profile from localStorage:', e);
            }
            
            // Simulate session in development mode only
            setUser({
              id: 'dev-user-id',
              email: email,
              user_metadata: { 
                name: savedProfile?.name || email.split('@')[0],
                status: savedProfile?.status || 'Available',
                profileImage: savedProfile?.profileImage || null,
                ...savedProfile
              },
              created_at: new Date().toISOString(),
              app_metadata: {},
              aud: 'authenticated',
              confirmed_at: new Date().toISOString()
            } as any);
            
            toast({
              title: 'Development sign in',
              description: 'Signed in with simulated auth (DEV MODE)',
              variant: 'default',
            });
            
            return { error: null };
          }
        }
      } catch (bypassError) {
        console.error('Dev auth bypass error:', bypassError);
      }
    }
    
    // Standard error handling
    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sign in successful',
        description: 'Welcome back!',
        variant: 'default',
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    
    // Clear our simulated user if we're using development mode
    setUser(null);
    setSession(null);
    
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
      variant: 'default',
    });
  };

  const updateProfile = async (data: Record<string, any>) => {
    // If we're using a simulated dev user, just update local state
    if (user && (user.id === 'dev-user-id' || import.meta.env.DEV)) {
      // Apply updates to simulated user
      setUser(prevUser => {
        if (!prevUser) return null;
        
        // Create a deep copy to ensure we don't directly modify state
        const updatedUser = { 
          ...prevUser,
          user_metadata: {
            ...prevUser.user_metadata,
            ...data
          }
        };
        
        // For the display name update
        if (data.name) {
          updatedUser.user_metadata.name = data.name;
        }
        
        // For status updates
        if (data.status) {
          updatedUser.user_metadata.status = data.status;
        }
        
        // For profile image updates
        if (data.profileImage) {
          updatedUser.user_metadata.profileImage = data.profileImage;
        }
        
        // Sync to localStorage for persistence in dev mode
        if (import.meta.env.DEV) {
          try {
            localStorage.setItem('dev_user_profile', JSON.stringify(updatedUser.user_metadata));
          } catch (e) {
            console.error('Failed to save profile to localStorage:', e);
          }
        }
        
        return updatedUser as any;
      });
      
      // Wait a moment to ensure state has updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Invalidate any related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated in development mode.',
        variant: 'default',
      });
      
      return { error: null };
    }
    
    // Normal flow for real users
    const { error } = await supabase.auth.updateUser({
      data
    });

    if (error) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Invalidate any related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'default',
      });
    }

    return { error };
  };

  const value = {
    session,
    user,
    signUp,
    signIn,
    signOut,
    isLoading,
    updateProfile,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}