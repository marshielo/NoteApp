export interface Note {
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
}

export type NoteCreateInput = Pick<Note, 'title'> & Partial<Note>;

export type NoteSortOrder = 'lastEdited' | 'created' | 'alphabetical';
export type NoteViewMode = 'card' | 'list';
