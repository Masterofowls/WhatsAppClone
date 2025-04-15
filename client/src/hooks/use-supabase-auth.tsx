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
          // First try to auto-confirm the user on the server
          const confirmRes = await fetch('/api/dev/confirm-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          
          if (confirmRes.ok) {
            console.log('User auto-confirmed successfully');
          } else {
            console.warn('Could not auto-confirm user:', await confirmRes.text());
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
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
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
      variant: 'default',
    });
  };

  const updateProfile = async (data: Record<string, any>) => {
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