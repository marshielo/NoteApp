'use client';

import { useCallback, useEffect } from 'react';
import { useUIStore, type ThemePreference, type ResolvedTheme } from '@/stores/ui-store';
import { db } from '@/lib/db';

const STORAGE_KEY = 'catatan-theme';

/**
 * Resolve a theme preference to an actual theme.
 * "system" is resolved based on the OS `prefers-color-scheme` media query.
 */
function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}

/**
 * Apply a theme preference to the DOM and persist to localStorage.
 */
function applyTheme(pref: ThemePreference): void {
  const resolved = resolveTheme(pref);
  document.documentElement.setAttribute('data-theme', resolved);
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // localStorage might be unavailable in some contexts
  }
}

/**
 * Hook providing theme state and controls.
 *
 * - `theme`: the resolved theme ('light' | 'dark')
 * - `themePreference`: the raw preference ('light' | 'dark' | 'system')
 * - `setTheme`: update the preference (persists to localStorage + IndexedDB)
 */
export function useTheme() {
  const themePreference = useUIStore((s) => s.themePreference);
  const setThemePreference = useUIStore((s) => s.setThemePreference);

  const setTheme = useCallback(
    async (pref: ThemePreference) => {
      setThemePreference(pref);
      applyTheme(pref);

      // Persist to IndexedDB (async, canonical storage)
      try {
        await db.settings.put({ key: 'theme_preference', value: pref });
      } catch {
        // IndexedDB might not be available (SSR)
      }
    },
    [setThemePreference]
  );

  // Listen for system preference changes when set to "system"
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (useUIStore.getState().themePreference === 'system') {
        applyTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Load saved preference from IndexedDB on mount and apply it
  useEffect(() => {
    async function loadTheme() {
      try {
        const record = await db.settings.get('theme_preference');
        if (record?.value) {
          const pref = record.value as ThemePreference;
          setThemePreference(pref);
          applyTheme(pref);
        }
      } catch {
        // IndexedDB unavailable — fall back to localStorage value (already applied by blocking script)
      }
    }
    loadTheme();
  }, [setThemePreference]);

  return {
    theme: resolveTheme(themePreference),
    themePreference,
    setTheme,
  };
}
