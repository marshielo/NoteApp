/**
 * Cloud Sync — two-way sync between IndexedDB and Supabase for Pro users.
 *
 * Local-first: all writes go to IndexedDB first, then sync to Supabase.
 * Conflict resolution: last-write-wins using local_version.
 */

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { db, type NoteRecord } from '@/lib/db';
import { useSyncStore } from '@/stores/sync-store';
import type { RealtimeChannel } from '@supabase/supabase-js';

/* ---- Types ---- */

interface CloudNote {
  id: string;
  user_id: string;
  title: string;
  content: Record<string, unknown>;
  content_text: string;
  word_count: number;
  reading_time_minutes: number;
  is_pinned: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  last_edited_at: string;
  last_synced_at: string | null;
  local_version: number;
  created_at: string;
  updated_at: string;
}

/* ---- Mappers ---- */

function cloudToLocal(cloud: CloudNote): NoteRecord {
  return {
    id: cloud.id,
    userId: cloud.user_id,
    title: cloud.title,
    content: cloud.content,
    contentText: cloud.content_text,
    wordCount: cloud.word_count,
    readingTimeMinutes: cloud.reading_time_minutes,
    isPinned: cloud.is_pinned,
    isArchived: cloud.is_archived,
    isDeleted: cloud.is_deleted,
    deletedAt: cloud.deleted_at,
    lastEditedAt: cloud.last_edited_at,
    lastSyncedAt: cloud.last_synced_at,
    localVersion: cloud.local_version,
    createdAt: cloud.created_at,
    updatedAt: cloud.updated_at,
    tags: [],
  };
}

function localToCloud(local: NoteRecord, userId: string): Omit<CloudNote, 'created_at'> {
  return {
    id: local.id,
    user_id: userId,
    title: local.title,
    content: local.content,
    content_text: local.contentText,
    word_count: local.wordCount,
    reading_time_minutes: local.readingTimeMinutes,
    is_pinned: local.isPinned,
    is_archived: local.isArchived,
    is_deleted: local.isDeleted,
    deleted_at: local.deletedAt,
    last_edited_at: local.lastEditedAt,
    last_synced_at: new Date().toISOString(),
    local_version: local.localVersion,
    updated_at: new Date().toISOString(),
  };
}

/* ---- Sync Engine ---- */

let realtimeChannel: RealtimeChannel | null = null;
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Initial sync — merge local IndexedDB with cloud Supabase data.
 * Called once on app load for authenticated Pro users.
 */
export async function initialSync(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const store = useSyncStore.getState();
  store.setStatus('syncing');

  try {
    const supabase = createClient();

    // 1. Fetch all cloud notes for this user
    const { data: cloudNotes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    // 2. Get all local notes
    const localNotes = await db.notes.toArray();

    // 3. Create maps for efficient lookup
    const cloudMap = new Map<string, CloudNote>();
    (cloudNotes || []).forEach((n) => cloudMap.set(n.id, n as CloudNote));

    const localMap = new Map<string, NoteRecord>();
    localNotes.forEach((n) => localMap.set(n.id, n));

    // 4. Merge — cloud notes not in local → add to local
    for (const [id, cloud] of cloudMap) {
      const local = localMap.get(id);
      if (!local) {
        // Cloud-only: add to local
        await db.notes.put(cloudToLocal(cloud));
      } else if (cloud.local_version > local.localVersion) {
        // Cloud is newer: update local
        await db.notes.put(cloudToLocal(cloud));
      } else if (local.localVersion > cloud.local_version) {
        // Local is newer: push to cloud
        await pushNoteToCloud(local, userId);
      }
      // Same version: skip
    }

    // 5. Local notes not in cloud → push to cloud
    for (const [id, local] of localMap) {
      if (!cloudMap.has(id)) {
        await pushNoteToCloud(local, userId);
      }
    }

    // 6. Process sync queue (pending changes from offline)
    await processSyncQueue(userId);

    const now = new Date().toISOString();
    store.setStatus('synced');
    store.setLastSyncedAt(now);
    store.setPendingChanges(0);
  } catch (err) {
    console.error('Initial sync failed:', err);
    store.setStatus('error');
    store.setError((err as Error).message);
  }
}

/**
 * Push a single note to Supabase (upsert).
 */
async function pushNoteToCloud(note: NoteRecord, userId: string): Promise<void> {
  const supabase = createClient();
  const cloudData = localToCloud(note, userId);

  const { error } = await supabase
    .from('notes')
    .upsert(cloudData, { onConflict: 'id' });

  if (error) throw error;

  // Update local sync timestamp
  const now = new Date().toISOString();
  await db.notes.update(note.id, { lastSyncedAt: now });
}

/**
 * Queue a note change for cloud sync.
 * Called after every local save for Pro users.
 */
export function queueSync(noteId: string, action: 'create' | 'update' | 'delete') {
  db.syncQueue.add({
    noteId,
    action,
    createdAt: new Date().toISOString(),
  });

  const store = useSyncStore.getState();
  store.setPendingChanges(store.pendingChanges + 1);
}

/**
 * Debounced sync — call after local save. Waits 3000ms then syncs.
 */
export function schedulCloudSync(userId: string) {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    processSyncQueue(userId);
  }, 3000);
}

/**
 * Process all pending items in the sync queue.
 */
async function processSyncQueue(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const store = useSyncStore.getState();
  const queue = await db.syncQueue.toArray();

  if (queue.length === 0) return;

  store.setStatus('syncing');

  const supabase = createClient();

  for (const item of queue) {
    try {
      if (item.action === 'delete') {
        // For deleted notes, we push the is_deleted flag
        const note = await db.notes.get(item.noteId);
        if (note) {
          await pushNoteToCloud(note, userId);
        }
      } else {
        const note = await db.notes.get(item.noteId);
        if (note) {
          await pushNoteToCloud(note, userId);
        }
      }

      // Remove from queue on success
      if (item.id) await db.syncQueue.delete(item.id);
    } catch (err) {
      console.error(`Sync failed for note ${item.noteId}:`, err);
      // Leave in queue for retry
    }
  }

  // Check remaining
  const remaining = await db.syncQueue.count();
  store.setPendingChanges(remaining);

  if (remaining === 0) {
    store.setStatus('synced');
    store.setLastSyncedAt(new Date().toISOString());
  } else {
    store.setStatus('error');
    store.setError(`${remaining} changes failed to sync`);
  }
}

/**
 * Subscribe to Supabase Realtime for live updates from other devices.
 */
export function subscribeToRealtime(userId: string) {
  if (!isSupabaseConfigured()) return;
  if (realtimeChannel) return; // Already subscribed

  const supabase = createClient();

  realtimeChannel = supabase
    .channel('notes-sync')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        const { eventType } = payload;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const cloud = payload.new as CloudNote;
          const local = await db.notes.get(cloud.id);

          // Only update local if cloud is newer
          if (!local || cloud.local_version >= local.localVersion) {
            await db.notes.put(cloudToLocal(cloud));
          }
        }

        if (eventType === 'DELETE') {
          const old = payload.old as { id: string };
          if (old?.id) {
            await db.notes.delete(old.id);
          }
        }
      }
    )
    .subscribe();
}

/**
 * Unsubscribe from Realtime channel.
 */
export function unsubscribeFromRealtime() {
  if (realtimeChannel) {
    const supabase = createClient();
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

/**
 * Handle online/offline transitions.
 * When coming back online, process the sync queue.
 */
export function setupOnlineListener(userId: string) {
  const handler = () => {
    if (navigator.onLine) {
      const store = useSyncStore.getState();
      if (store.pendingChanges > 0) {
        processSyncQueue(userId);
      }
    } else {
      useSyncStore.getState().setStatus('offline');
    }
  };

  window.addEventListener('online', handler);
  window.addEventListener('offline', () => {
    useSyncStore.getState().setStatus('offline');
  });

  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}
