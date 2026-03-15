import { create } from 'zustand';
import { db, type NoteRecord } from '@/lib/db';
import { generateId } from '@/lib/utils';

const FREE_NOTES_LIMIT = 50;

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
      const notes = await db.notes
        .where('isDeleted')
        .equals(0)
        .reverse()
        .sortBy('lastEditedAt');
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
      notes: state.notes.filter((n) => n.id !== id),
    }));
  },

  setActiveNoteId: (id) => set({ activeNoteId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
