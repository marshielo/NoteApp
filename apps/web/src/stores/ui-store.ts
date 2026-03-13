import { create } from 'zustand';

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

  setThemePreference: (pref: ThemePreference) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSortOrder: (order: SortOrder) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  themePreference: 'system',
  sidebarOpen: true,
  viewMode: 'card',
  sortOrder: 'lastEdited',
  isMobileMenuOpen: false,

  setThemePreference: (pref) => set({ themePreference: pref }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
}));
