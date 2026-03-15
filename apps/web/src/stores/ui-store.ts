import { create } from 'zustand';
import { db } from '@/lib/db';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type ViewMode = 'card' | 'list';
export type SortOrder = 'lastEdited' | 'created' | 'alphabetical';

interface UIState {
  themePreference: ThemePreference;
  sidebarOpen: boolean;
  viewMode: ViewMode;
  sortOrder: SortOrder;
  isMobileMenuOpen: boolean;
  isHydrated: boolean;

  setThemePreference: (pref: ThemePreference) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSortOrder: (order: SortOrder) => void;
  setMobileMenuOpen: (open: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useUIStore = create<UIState>()((set) => ({
  themePreference: 'system',
  sidebarOpen: true,
  viewMode: 'card',
  sortOrder: 'lastEdited',
  isMobileMenuOpen: false,
  isHydrated: false,

  setThemePreference: (pref) => set({ themePreference: pref }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setViewMode: (mode) => {
    set({ viewMode: mode });
    db.settings.put({ key: 'viewMode', value: mode }).catch(() => {});
  },

  setSortOrder: (order) => {
    set({ sortOrder: order });
    db.settings.put({ key: 'sortOrder', value: order }).catch(() => {});
  },

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  hydrate: async () => {
    try {
      const [viewModeSetting, sortOrderSetting] = await Promise.all([
        db.settings.get('viewMode'),
        db.settings.get('sortOrder'),
      ]);
      set({
        viewMode: (viewModeSetting?.value as ViewMode) || 'card',
        sortOrder: (sortOrderSetting?.value as SortOrder) || 'lastEdited',
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
