import { create } from 'zustand';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { initialSync, subscribeToRealtime, unsubscribeFromRealtime, setupOnlineListener } from '@/lib/sync';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { hasProAccess, type SubscriptionStatus } from '@/lib/subscription';

export type UserRole = 'free' | 'pro' | 'admin';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  isPro: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLocalMode: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setLocalMode: (local: boolean) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

function mapUser(user: SupabaseUser, role: UserRole = 'free', subscriptionStatus: SubscriptionStatus = 'none'): User {
  return {
    id: user.id,
    email: user.email || '',
    displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || '',
    avatarUrl: user.user_metadata?.avatar_url || null,
    role,
    subscriptionStatus,
    isPro: hasProAccess(subscriptionStatus),
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLocalMode: true,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
      isLocalMode: user === null,
    }),
  setLocalMode: (local) => set({ isLocalMode: local }),
  setLoading: (loading) => set({ isLoading: loading }),

  initialize: async () => {
    set({ isLoading: true });

    if (!isSupabaseConfigured()) {
      set({ user: null, isAuthenticated: false, isLocalMode: true, isLoading: false });
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch profile for role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, subscription_status')
          .eq('id', user.id)
          .single();

        const role = (profile?.role as UserRole) || 'free';
        const subStatus = (profile?.subscription_status as SubscriptionStatus) || 'none';
        const mapped = mapUser(user, role, subStatus);

        set({ user: mapped, isAuthenticated: true, isLocalMode: false, isLoading: false });

        // Start cloud sync for authenticated users
        initialSync(user.id);
        subscribeToRealtime(user.id);
        setupOnlineListener(user.id);
      } else {
        set({ user: null, isAuthenticated: false, isLocalMode: true, isLoading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          // Fetch profile for role & subscription status
          const { data: prof } = await supabase
            .from('profiles')
            .select('role, subscription_status')
            .eq('id', session.user.id)
            .single();

          const r = (prof?.role as UserRole) || 'free';
          const s = (prof?.subscription_status as SubscriptionStatus) || 'none';

          set({
            user: mapUser(session.user, r, s),
            isAuthenticated: true,
            isLocalMode: false,
            isLoading: false,
          });

          // Start cloud sync for authenticated users
          initialSync(session.user.id);
          subscribeToRealtime(session.user.id);
          setupOnlineListener(session.user.id);
        } else {
          set({ user: null, isAuthenticated: false, isLocalMode: true, isLoading: false });
        }
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLocalMode: true, isLoading: false });
    }
  },

  refreshProfile: async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, subscription_status')
        .eq('id', user.id)
        .single();

      const role = (profile?.role as UserRole) || 'free';
      const subStatus = (profile?.subscription_status as SubscriptionStatus) || 'none';
      const mapped = mapUser(user, role, subStatus);

      set({ user: mapped, isAuthenticated: true, isLocalMode: false });
    } catch {
      // Silently fail — keep existing state
    }
  },

  signInWithEmail: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },

  signUpWithEmail: async (email, password, displayName) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw new Error(error.message);
  },

  signInWithGoogle: async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw new Error(error.message);
  },

  signOut: async () => {
    unsubscribeFromRealtime();
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isLocalMode: true });
  },

  resetPassword: async (email) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  },

  updatePassword: async (newPassword) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },
}));
