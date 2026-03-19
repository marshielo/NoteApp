'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { db, type NoteRecord } from '@/lib/db';
import { useAuthStore } from '@/stores/auth-store';
import { queueSync, schedulCloudSync } from '@/lib/sync';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'synced' | 'error';

interface UseAutoSaveOptions {
  noteId: string;
  debounceMs?: number;
}

/**
 * Auto-save hook for persisting note content to IndexedDB.
 *
 * - 1500ms debounce after last keystroke
 * - beforeunload handler to prevent data loss
 * - visibilitychange handler to flush on tab switch
 * - Manual save via forceSave()
 */
export function useAutoSave({ noteId, debounceMs = 1500 }: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const pendingDataRef = useRef<Partial<NoteRecord> | null>(null);
  const noteIdRef = useRef(noteId);

  // Keep noteIdRef in sync with the prop
  useEffect(() => {
    noteIdRef.current = noteId;
  }, [noteId]);

  const saveToIndexedDB = useCallback(
    async (data: Partial<NoteRecord>) => {
      setSaveStatus('saving');
      try {
        const now = new Date().toISOString();
        const existing = await db.notes.get(noteIdRef.current);
        await db.notes.update(noteIdRef.current, {
          ...data,
          lastEditedAt: now,
          updatedAt: now,
          localVersion: (existing?.localVersion ?? 0) + 1,
        });
        setSaveStatus('saved');
        pendingDataRef.current = null;

        // Queue cloud sync for authenticated users
        const auth = useAuthStore.getState();
        if (auth.isAuthenticated && auth.user) {
          queueSync(noteIdRef.current, 'update');
          schedulCloudSync(auth.user.id);
        }

        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
        }, 2000);
      } catch {
        setSaveStatus('error');
      }
    },
    []
  );

  const scheduleSave = useCallback(
    (data: Partial<NoteRecord>) => {
      pendingDataRef.current = data;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        saveToIndexedDB(data);
      }, debounceMs);
    },
    [saveToIndexedDB, debounceMs]
  );

  const forceSave = useCallback(
    async (data?: Partial<NoteRecord>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const dataToSave = data || pendingDataRef.current;
      if (dataToSave) {
        await saveToIndexedDB(dataToSave);
      }
    },
    [saveToIndexedDB]
  );

  // beforeunload — warn user if unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (pendingDataRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // visibilitychange — flush pending save when tab loses focus
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden' && pendingDataRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        saveToIndexedDB(pendingDataRef.current);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [saveToIndexedDB]);

  // Keyboard shortcut: Cmd/Ctrl + S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        forceSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [forceSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { saveStatus, scheduleSave, forceSave };
}
