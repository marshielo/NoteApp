import { create } from 'zustand';
import { db, type TagRecord } from '@/lib/db';
import { generateId } from '@/lib/utils';

const FREE_TAGS_LIMIT = 10;

const TAG_COLORS = [
  '#C4785B', // Terracotta
  '#5B8C5A', // Sage
  '#6B7BA8', // Slate blue
  '#B8976B', // Warm gold
  '#8B6B99', // Muted purple
  '#6B9B8A', // Teal
  '#A8785B', // Sienna
  '#7B8C6B', // Olive
  '#9B6B78', // Dusty rose
  '#6B8B8B', // Gray teal
];

function validateTagName(name: string): string {
  const cleaned = name.toLowerCase().trim().slice(0, 30);
  if (!cleaned) throw new Error('Tag name cannot be empty');
  if (!/^[a-z0-9\-_\s]+$/.test(cleaned)) {
    throw new Error('Tag hanya boleh huruf, angka, dash, dan underscore');
  }
  return cleaned;
}

interface TagsState {
  tags: TagRecord[];
  isLoading: boolean;
  error: string | null;

  loadTags: () => Promise<void>;
  createTag: (name: string) => Promise<TagRecord>;
  renameTag: (id: string, newName: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  addTagToNote: (tagId: string, noteId: string) => Promise<void>;
  removeTagFromNote: (tagId: string, noteId: string) => Promise<void>;
  getOrCreateTag: (name: string) => Promise<TagRecord>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTagsStore = create<TagsState>()((set, get) => ({
  tags: [],
  isLoading: true,
  error: null,

  loadTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const tags = await db.tags.toArray();
      set({ tags, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createTag: async (name) => {
    const validName = validateTagName(name);
    const state = get();

    // Check for duplicates
    if (state.tags.some((t) => t.name === validName)) {
      throw new Error(`Tag "${validName}" sudah ada`);
    }

    if (state.tags.length >= FREE_TAGS_LIMIT) {
      throw new Error(
        `Kamu sudah mencapai batas ${FREE_TAGS_LIMIT} tag. Upgrade ke Pro untuk tag tak terbatas.`
      );
    }

    const id = generateId();
    const now = new Date().toISOString();
    const colorIndex = state.tags.length % TAG_COLORS.length;

    const tag: TagRecord = {
      id,
      userId: null,
      name: validName,
      color: TAG_COLORS[colorIndex],
      notesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.tags.add(tag);
    set({ tags: [...state.tags, tag] });
    return tag;
  },

  renameTag: async (id, newName) => {
    const validName = validateTagName(newName);
    const state = get();
    const existing = state.tags.find((t) => t.name === validName && t.id !== id);
    if (existing) throw new Error(`Tag "${validName}" sudah ada`);

    const tag = state.tags.find((t) => t.id === id);
    if (!tag) return;

    const oldName = tag.name;
    const now = new Date().toISOString();
    await db.tags.update(id, { name: validName, updatedAt: now });

    // Update tag name in all notes that use this tag
    const notesWithTag = await db.notes.where('tags').equals(oldName).toArray();
    for (const note of notesWithTag) {
      const updatedTags = (note.tags || []).map((t) => (t === oldName ? validName : t));
      await db.notes.update(note.id, { tags: updatedTags });
    }

    set({
      tags: state.tags.map((t) =>
        t.id === id ? { ...t, name: validName, updatedAt: now } : t
      ),
    });
  },

  deleteTag: async (id) => {
    const state = get();
    const tag = state.tags.find((t) => t.id === id);
    if (!tag) return;

    // Remove tag from all notes
    const notesWithTag = await db.notes.where('tags').equals(tag.name).toArray();
    for (const note of notesWithTag) {
      const updatedTags = (note.tags || []).filter((t) => t !== tag.name);
      await db.notes.update(note.id, { tags: updatedTags });
    }

    await db.tags.delete(id);
    set({ tags: state.tags.filter((t) => t.id !== id) });
  },

  addTagToNote: async (tagId, noteId) => {
    const state = get();
    const tag = state.tags.find((t) => t.id === tagId);
    if (!tag) return;

    const note = await db.notes.get(noteId);
    if (!note) return;

    const currentTags = note.tags || [];
    if (currentTags.includes(tag.name)) return;

    const updatedTags = [...currentTags, tag.name];
    await db.notes.update(noteId, { tags: updatedTags });
    await db.tags.update(tagId, { notesCount: tag.notesCount + 1 });

    set({
      tags: state.tags.map((t) =>
        t.id === tagId ? { ...t, notesCount: t.notesCount + 1 } : t
      ),
    });
  },

  removeTagFromNote: async (tagId, noteId) => {
    const state = get();
    const tag = state.tags.find((t) => t.id === tagId);
    if (!tag) return;

    const note = await db.notes.get(noteId);
    if (!note) return;

    const updatedTags = (note.tags || []).filter((t) => t !== tag.name);
    await db.notes.update(noteId, { tags: updatedTags });
    await db.tags.update(tagId, { notesCount: Math.max(0, tag.notesCount - 1) });

    set({
      tags: state.tags.map((t) =>
        t.id === tagId ? { ...t, notesCount: Math.max(0, t.notesCount - 1) } : t
      ),
    });
  },

  getOrCreateTag: async (name) => {
    const state = get();
    const validName = validateTagName(name);
    const existing = state.tags.find((t) => t.name === validName);
    if (existing) return existing;
    return get().createTag(validName);
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
