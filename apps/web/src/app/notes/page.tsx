'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { NoteListSkeleton } from '@/components/ui/skeleton';
import { NoteCard } from '@/components/notes/note-card';
import { NotesToolbar } from '@/components/notes/notes-toolbar';
import { SearchBar } from '@/components/notes/search-bar';
import { SearchResults } from '@/components/notes/search-results';
import { useNotesStore } from '@/stores/notes-store';
import { useUIStore } from '@/stores/ui-store';
import { useSearch } from '@/hooks/use-search';

type Filter = 'active' | 'archived' | 'trash';

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const tagParam = searchParams.get('tag');

  const notes = useNotesStore((s) => s.notes);
  const isLoading = useNotesStore((s) => s.isLoading);
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const createNote = useNotesStore((s) => s.createNote);

  const viewMode = useUIStore((s) => s.viewMode);
  const sortOrder = useUIStore((s) => s.sortOrder);
  const hydrate = useUIStore((s) => s.hydrate);

  const { query, debouncedQuery, results, isSearching, handleQueryChange, clearSearch } =
    useSearch(notes);

  useEffect(() => {
    loadNotes();
    hydrate();
  }, [loadNotes, hydrate]);

  const filter: Filter =
    filterParam === 'archived' ? 'archived' : filterParam === 'trash' ? 'trash' : 'active';

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (filter === 'archived') {
      filtered = notes.filter((n) => n.isArchived && !n.isDeleted);
    } else if (filter === 'trash') {
      filtered = notes.filter((n) => n.isDeleted);
    } else {
      filtered = notes.filter((n) => !n.isDeleted && !n.isArchived);
    }

    // Tag filter
    if (tagParam) {
      filtered = filtered.filter((n) => n.tags?.includes(tagParam));
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'alphabetical':
          return (a.title || '').localeCompare(b.title || '', 'id');
        case 'lastEdited':
        default:
          return new Date(b.lastEditedAt).getTime() - new Date(a.lastEditedAt).getTime();
      }
    });

    // Pinned notes always on top (only in active view)
    if (filter === 'active' && !tagParam) {
      const pinned = sorted.filter((n) => n.isPinned);
      const unpinned = sorted.filter((n) => !n.isPinned);
      return [...pinned, ...unpinned];
    }

    return sorted;
  }, [notes, filter, sortOrder, tagParam]);

  const handleNewNote = async () => {
    try {
      const noteId = await createNote();
      router.push(`/editor/${noteId}`);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const pageTitle = tagParam
    ? `Tag: ${tagParam}`
    : filter === 'archived'
      ? 'Arsip'
      : filter === 'trash'
        ? 'Sampah'
        : 'Semua Catatan';

  const emptyMessage =
    filter === 'archived'
      ? 'Tidak ada catatan yang diarsipkan'
      : filter === 'trash'
        ? 'Sampah kosong'
        : 'Belum ada catatan';

  const emptySubtext =
    filter === 'active' && !tagParam ? 'Mulai menulis catatan pertamamu' : undefined;

  return (
    <AppShell>
      <div className="p-4 lg:p-6">
        {/* Page header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-heading-2 text-text-primary">{pageTitle}</h1>
          {filter === 'active' && !tagParam && (
            <button
              onClick={handleNewNote}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-caption font-medium text-white transition-colors hover:bg-accent-hover sm:hidden"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Baru
            </button>
          )}
        </div>

        {/* Search bar */}
        {filter === 'active' && (
          <SearchBar query={query} onChange={handleQueryChange} onClear={clearSearch} />
        )}

        {/* Search results mode */}
        {isSearching ? (
          <SearchResults results={results} query={debouncedQuery} />
        ) : (
          <>
            {/* Toolbar */}
            <NotesToolbar count={filteredNotes.length} />

            {/* Content */}
            {isLoading ? (
              <NoteListSkeleton count={6} />
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-4 text-6xl">
                  {filter === 'archived' ? '📦' : filter === 'trash' ? '🗑️' : '📝'}
                </div>
                <h2 className="text-heading-3 text-text-primary">{emptyMessage}</h2>
                {emptySubtext && (
                  <p className="text-body-ui mt-2 text-text-secondary">{emptySubtext}</p>
                )}
                {filter === 'active' && !tagParam && (
                  <button
                    onClick={handleNewNote}
                    className="mt-6 rounded-lg bg-accent px-6 py-2.5 text-body-ui font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    Buat Catatan Baru
                  </button>
                )}
              </div>
            ) : (
              <div
                className={
                  viewMode === 'card'
                    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2'
                    : 'flex flex-col gap-2'
                }
              >
                {filteredNotes.map((note) => (
                  <NoteCard key={note.id} note={note} viewMode={viewMode} filter={filter} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
