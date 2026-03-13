import { create } from 'zustand';
import type { TagRecord } from '@/lib/db';

interface TagsState {
  tags: TagRecord[];
  isLoading: boolean;
  error: string | null;

  // Actions — fully implemented in Sprint 2 (MAR-13)
  setTags: (tags: TagRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTagsStore = create<TagsState>()((set) => ({
  tags: [],
  isLoading: true,
  error: null,

  setTags: (tags) => set({ tags }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
