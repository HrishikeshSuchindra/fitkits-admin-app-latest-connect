import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserRole = 'admin' | 'venue_owner' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has admin role
  const checkRole = async (userId: string, role: 'admin' | 'venue_owner'): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: role
      });
      if (error) {
        console.error(`[Auth] Error checking ${role} role:`, error);
        return false;
      }
      return data === true;
    } catch (err) {
      console.error(`[Auth] Exception checking ${role} role:`, err);
      return false;
    }
  };

  // Check user's role (admin or venue_owner)
  const checkUserRole = async (userId: string): Promise<UserRole> => {
    try {
      console.log('[Auth] Checking user role for:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<UserRole>((_, reject) => {
        setTimeout(() => reject(new Error('Role check timeout')), 5000);
      });
      
      const checkPromise = (async () => {
        // Check admin first
        const isAdmin = await checkRole(userId, 'admin');
        if (isAdmin) {
          console.log('[Auth] User has admin role');
          return 'admin' as UserRole;
        }
        
        // Check venue_owner
        const isVenueOwner = await checkRole(userId, 'venue_owner');
        if (isVenueOwner) {
          console.log('[Auth] User has venue_owner role');
          return 'venue_owner' as UserRole;
        }
        
        console.log('[Auth] User has no valid role');
        return null;
      })();
      
      return await Promise.race([checkPromise, timeoutPromise]);
    } catch (err) {
      console.error('[Auth] Error checking user role:', err);
      return null;
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
          const role = await checkUserRole(initialSession.user.id);
          if (mounted) {
            setUserRole(role);
            console.log('[Auth] User role set:', role);
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
        
        // Defer role check to avoid deadlock
        if (newSession?.user) {
          setTimeout(() => {
            if (!mounted) return;
            checkUserRole(newSession.user.id).then(role => {
              if (mounted) setUserRole(role);
            });
          }, 0);
        } else {
          setUserRole(null);
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
        const role = await checkUserRole(data.user.id);
        
        if (!role) {
          console.log('[Auth] User has no valid role, signing out');
          await supabase.auth.signOut();
          return { error: new Error('Access denied. You must be an admin or venue owner to access this app.') };
        }
        
        setUserRole(role);
        console.log('[Auth] Sign in successful, user role:', role);
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
    setUserRole(null);
  };

  // isAdmin is true if userRole is 'admin'
  const isAdmin = userRole === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, userRole, isAdmin, isLoading, signIn, signOut }}>
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
