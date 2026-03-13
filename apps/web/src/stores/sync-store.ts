import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  pendingChanges: number;
  lastSyncedAt: string | null;
  error: string | null;

  // Actions — fully implemented in Sprint 3 (MAR-18)
  setStatus: (status: SyncStatus) => void;
  setPendingChanges: (count: number) => void;
  setLastSyncedAt: (date: string | null) => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>()((set) => ({
  status: 'idle',
  pendingChanges: 0,
  lastSyncedAt: null,
  error: null,

  setStatus: (status) => set({ status }),
  setPendingChanges: (count) => set({ pendingChanges: count }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
  setError: (error) => set({ error }),
}));
