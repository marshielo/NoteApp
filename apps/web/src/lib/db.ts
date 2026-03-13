import Dexie, { type Table } from 'dexie';

/* -------------------------------------------------------------------------- */
/*  Record types — stored in IndexedDB                                        */
/* -------------------------------------------------------------------------- */

export interface NoteRecord {
  id: string;
  userId: string | null;
  title: string;
  content: Record<string, unknown>;
  contentText: string;
  wordCount: number;
  readingTimeMinutes: number;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  lastEditedAt: string;
  lastSyncedAt: string | null;
  localVersion: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface TagRecord {
  id: string;
  userId: string | null;
  name: string;
  color: string;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueueRecord {
  id?: number;
  noteId: string;
  action: 'create' | 'update' | 'delete';
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

/* -------------------------------------------------------------------------- */
/*  Database class                                                            */
/* -------------------------------------------------------------------------- */

export class CatatanDB extends Dexie {
  notes!: Table<NoteRecord, string>;
  tags!: Table<TagRecord, string>;
  syncQueue!: Table<SyncQueueRecord, number>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super('CatatanDB');

    this.version(1).stores({
      notes: 'id, userId, lastEditedAt, isPinned, isArchived, isDeleted, *tags',
      tags: 'id, userId, name',
      syncQueue: '++id, noteId, action, createdAt',
      settings: 'key',
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Singleton instance                                                        */
/* -------------------------------------------------------------------------- */

export const db = new CatatanDB();
