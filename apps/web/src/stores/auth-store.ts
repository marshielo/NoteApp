import { create } from 'zustand';

export type UserRole = 'free' | 'pro' | 'super_admin';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLocalMode: boolean;
  isLoading: boolean;

  // Actions — fully implemented in Sprint 3 (MAR-17)
  setUser: (user: User | null) => void;
  setLocalMode: (local: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLocalMode: true, // Default: local-only mode until auth is implemented
  isLoading: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
      isLocalMode: user === null,
    }),
  setLocalMode: (local) => set({ isLocalMode: local }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
