'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { NoteListSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UpgradeNudge } from '@/components/ui/upgrade-nudge';
import { NoteCard } from '@/components/notes/note-card';
import { NotesToolbar } from '@/components/notes/notes-toolbar';
import { SearchBar } from '@/components/notes/search-bar';
import { SearchResults } from '@/components/notes/search-results';
import { useNotesStore } from '@/stores/notes-store';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useSearch } from '@/hooks/use-search';

type Filter = 'active' | 'archived' | 'trash';

function daysUntilPurge(deletedAt: string | null): number {
  if (!deletedAt) return 30;
  const deleted = new Date(deletedAt);
  const purgeDate = new Date(deleted);
  purgeDate.setDate(purgeDate.getDate() + 30);
  const now = new Date();
  return Math.max(0, Math.ceil((purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="p-4 lg:p-6">
        <NoteListSkeleton count={6} />
      </div>
    }>
      <NotesPageContent />
    </Suspense>
  );
}

function NotesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const tagParam = searchParams.get('tag');

  const notes = useNotesStore((s) => s.notes);
  const isLoading = useNotesStore((s) => s.isLoading);
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const createNote = useNotesStore((s) => s.createNote);
  const emptyTrash = useNotesStore((s) => s.emptyTrash);
  const autoPurgeTrash = useNotesStore((s) => s.autoPurgeTrash);

  const viewMode = useUIStore((s) => s.viewMode);
  const sortOrder = useUIStore((s) => s.sortOrder);
  const hydrate = useUIStore((s) => s.hydrate);
  const isPro = useAuthStore((s) => s.user?.isPro ?? false);

  const { query, debouncedQuery, results, isSearching, handleQueryChange, clearSearch } =
    useSearch(notes);

  const [emptyTrashDialog, setEmptyTrashDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);

  useEffect(() => {
    loadNotes().then(() => {
      autoPurgeTrash();
    });
    hydrate();
  }, [loadNotes, hydrate, autoPurgeTrash]);

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
      if (filter === 'trash') {
        return new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime();
      }
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
    } catch {
      setShowUpgradeNudge(true);
    }
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
    setEmptyTrashDialog(false);
  };

  const handlePermanentDelete = async () => {
    if (deleteConfirm) {
      await useNotesStore.getState().permanentDelete(deleteConfirm);
      setDeleteConfirm(null);
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

  const trashedCount = filteredNotes.length;

  return (
    <AppShell>
      <div className="p-4 lg:p-6">
        {/* Page header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-heading-2 text-text-primary">{pageTitle}</h1>
          <div className="flex items-center gap-2">
            {filter === 'trash' && trashedCount > 0 && (
              <button
                onClick={() => setEmptyTrashDialog(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-red-300 px-4 text-caption font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                Kosongkan Trash
              </button>
            )}
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
        </div>

        {/* Trash info banner */}
        {filter === 'trash' && trashedCount > 0 && (
          <div className="mb-4 rounded-lg border border-border bg-bg-tertiary px-4 py-3">
            <p className="text-caption text-text-secondary">
              Catatan di trash akan dihapus otomatis setelah 30 hari.
            </p>
          </div>
        )}

        {/* Sync promotion banner (free users only) */}
        {!isPro && filter === 'active' && !tagParam && filteredNotes.length > 0 && (
          <div className="mb-4">
            <UpgradeNudge
              trigger="sync"
              variant="banner"
              title="Sinkronkan catatanmu"
              description="Upgrade ke Pro untuk menyinkronkan catatan ke cloud dan mengakses dari perangkat lain."
            />
          </div>
        )}

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
            {filter !== 'trash' && <NotesToolbar count={filteredNotes.length} />}

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
                  <NoteCard
                    key={note.id}
                    note={note}
                    viewMode={viewMode}
                    filter={filter}
                    daysLeft={filter === 'trash' ? daysUntilPurge(note.deletedAt) : undefined}
                    onPermanentDelete={filter === 'trash' ? (id) => setDeleteConfirm(id) : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Empty Trash confirmation dialog */}
      <ConfirmDialog
        open={emptyTrashDialog}
        title="Kosongkan Trash?"
        message={`${trashedCount} catatan akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Kosongkan"
        onConfirm={handleEmptyTrash}
        onCancel={() => setEmptyTrashDialog(false)}
      />

      {/* Single permanent delete confirmation */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Hapus permanen?"
        message="Catatan ini akan dihapus secara permanen dan tidak bisa dikembalikan."
        confirmLabel="Hapus Permanen"
        onConfirm={handlePermanentDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Upgrade nudge when note limit reached */}
      {showUpgradeNudge && (
        <UpgradeNudge
          trigger="note_limit"
          variant="modal"
          title="Batas catatan tercapai"
          description="Kamu sudah mencapai batas 50 catatan di paket gratis. Upgrade ke Pro untuk catatan tak terbatas."
          onDismiss={() => setShowUpgradeNudge(false)}
        />
      )}
    </AppShell>
  );
}
