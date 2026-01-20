import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    try {
      console.log('[Auth] Checking admin role for user:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Admin check timeout')), 5000);
      });
      
      const checkPromise = supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      }).then(({ data, error }) => {
        if (error) {
          console.error('[Auth] Error checking admin role:', error);
          return false;
        }
        console.log('[Auth] Admin role check result:', data);
        return data === true;
      });
      
      return await Promise.race([checkPromise, timeoutPromise]);
    } catch (err) {
      console.error('[Auth] Error checking admin role:', err);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Initializing auth...');

    const initializeAuth = async () => {
      try {
        // Get initial session first
        console.log('[Auth] Getting initial session...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('[Auth] Initial session:', initialSession ? 'exists' : 'none');
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          const adminStatus = await checkAdminRole(initialSession.user.id);
          if (mounted) {
            setIsAdmin(adminStatus);
            console.log('[Auth] Admin status set:', adminStatus);
          }
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          console.log('[Auth] Loading complete');
        }
      }
    };

    initializeAuth();

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        
        console.log('[Auth] Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Defer admin check to avoid deadlock
        if (newSession?.user) {
          setTimeout(() => {
            if (!mounted) return;
            checkAdminRole(newSession.user.id).then(adminStatus => {
              if (mounted) setIsAdmin(adminStatus);
            });
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        return { error };
      }

      if (data.user) {
        const adminStatus = await checkAdminRole(data.user.id);
        
        if (!adminStatus) {
          console.log('[Auth] User is not admin, signing out');
          await supabase.auth.signOut();
          return { error: new Error('Admin access required. Please contact your administrator.') };
        }
        
        setIsAdmin(true);
        console.log('[Auth] Sign in successful, user is admin');
      }

      return { error: null };
    } catch (err) {
      console.error('[Auth] Sign in exception:', err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    console.log('[Auth] Signing out...');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
