import { create } from 'zustand';
import type { NoteRecord } from '@/lib/db';

interface NotesState {
  notes: NoteRecord[];
  activeNoteId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions — fully implemented in MAR-8
  setNotes: (notes: NoteRecord[]) => void;
  setActiveNoteId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNotesStore = create<NotesState>()((set) => ({
  notes: [],
  activeNoteId: null,
  isLoading: true,
  error: null,

  setNotes: (notes) => set({ notes }),
  setActiveNoteId: (id) => set({ activeNoteId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
