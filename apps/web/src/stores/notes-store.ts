import { create } from 'zustand';
import { db, type NoteRecord } from '@/lib/db';
import { generateId } from '@/lib/utils';

const FREE_NOTES_LIMIT = 50;
const TRASH_PURGE_DAYS = 30;

const DEFAULT_CONTENT = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [] },
    { type: 'paragraph', content: [] },
  ],
};

interface NotesState {
  notes: NoteRecord[];
  activeNoteId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadNotes: () => Promise<void>;
  createNote: () => Promise<string>;
  updateNote: (id: string, data: Partial<NoteRecord>) => void;
  deleteNote: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<string>;
  togglePin: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  autoPurgeTrash: () => Promise<void>;
  undoDelete: (id: string) => Promise<void>;
  setActiveNoteId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNotesStore = create<NotesState>()((set, get) => ({
  notes: [],
  activeNoteId: null,
  isLoading: true,
  error: null,

  loadNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const notes = await db.notes.reverse().sortBy('lastEditedAt');
      set({ notes, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createNote: async () => {
    const state = get();
    const activeNotes = state.notes.filter((n) => !n.isDeleted);

    if (activeNotes.length >= FREE_NOTES_LIMIT) {
      throw new Error(
        `Kamu sudah mencapai batas ${FREE_NOTES_LIMIT} catatan. Upgrade ke Pro untuk catatan tak terbatas.`
      );
    }

    const id = generateId();
    const now = new Date().toISOString();

    const newNote: NoteRecord = {
      id,
      userId: null,
      title: 'Untitled',
      content: DEFAULT_CONTENT,
      contentText: '',
      wordCount: 0,
      readingTimeMinutes: 0,
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      deletedAt: null,
      lastEditedAt: now,
      lastSyncedAt: null,
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      tags: [],
    };

    await db.notes.add(newNote);
    set({ notes: [newNote, ...state.notes] });
    return id;
  },

  updateNote: (id, data) => {
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));
  },

  deleteNote: async (id) => {
    const now = new Date().toISOString();
    await db.notes.update(id, {
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
    });
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, isDeleted: true, deletedAt: now, updatedAt: now } : n
      ),
    }));
  },

  duplicateNote: async (id) => {
    const state = get();
    const source = state.notes.find((n) => n.id === id);
    if (!source) throw new Error('Note not found');

    const activeNotes = state.notes.filter((n) => !n.isDeleted);
    if (activeNotes.length >= FREE_NOTES_LIMIT) {
      throw new Error(
        `Kamu sudah mencapai batas ${FREE_NOTES_LIMIT} catatan. Upgrade ke Pro untuk catatan tak terbatas.`
      );
    }

    const newId = generateId();
    const now = new Date().toISOString();
    const duplicate: NoteRecord = {
      ...source,
      id: newId,
      title: source.title ? `${source.title} (copy)` : 'Untitled (copy)',
      isPinned: false,
      lastEditedAt: now,
      lastSyncedAt: null,
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    await db.notes.add(duplicate);
    set({ notes: [duplicate, ...state.notes] });
    return newId;
  },

  togglePin: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const now = new Date().toISOString();
    const isPinned = !note.isPinned;
    await db.notes.update(id, { isPinned, updatedAt: now });
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, isPinned, updatedAt: now } : n
      ),
    }));
  },

  archiveNote: async (id) => {
    const now = new Date().toISOString();
    await db.notes.update(id, { isArchived: true, isPinned: false, updatedAt: now });
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, isArchived: true, isPinned: false, updatedAt: now } : n
      ),
    }));
  },

  restoreNote: async (id) => {
    const now = new Date().toISOString();
    await db.notes.update(id, {
      isArchived: false,
      isDeleted: false,
      deletedAt: null,
      updatedAt: now,
    });
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id
          ? { ...n, isArchived: false, isDeleted: false, deletedAt: null, updatedAt: now }
          : n
      ),
    }));
  },

  permanentDelete: async (id) => {
    await db.notes.delete(id);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }));
  },

  emptyTrash: async () => {
    const trashed = get().notes.filter((n) => n.isDeleted);
    const ids = trashed.map((n) => n.id);
    await db.notes.bulkDelete(ids);
    set((state) => ({
      notes: state.notes.filter((n) => !n.isDeleted),
    }));
  },

  autoPurgeTrash: async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - TRASH_PURGE_DAYS);
    const cutoffISO = cutoff.toISOString();

    const toPurge = get().notes.filter(
      (n) => n.isDeleted && n.deletedAt && n.deletedAt < cutoffISO
    );
    if (toPurge.length === 0) return;

    const ids = toPurge.map((n) => n.id);
    await db.notes.bulkDelete(ids);
    set((state) => ({
      notes: state.notes.filter((n) => !ids.includes(n.id)),
    }));
  },

  undoDelete: async (id) => {
    const now = new Date().toISOString();
    await db.notes.update(id, {
      isDeleted: false,
      deletedAt: null,
      updatedAt: now,
    });
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, isDeleted: false, deletedAt: null, updatedAt: now } : n
      ),
    }));
  },

  setActiveNoteId: (id) => set({ activeNoteId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
