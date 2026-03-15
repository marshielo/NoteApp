'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { NoteListSkeleton } from '@/components/ui/skeleton';
import { useNotesStore } from '@/stores/notes-store';
import { formatRelativeTime, truncate } from '@/lib/utils';

export default function NotesPage() {
  const router = useRouter();
  const notes = useNotesStore((s) => s.notes);
  const isLoading = useNotesStore((s) => s.isLoading);
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const createNote = useNotesStore((s) => s.createNote);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleNewNote = async () => {
    try {
      const noteId = await createNote();
      router.push(`/editor/${noteId}`);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const activeNotes = notes.filter((n) => !n.isDeleted && !n.isArchived);

  return (
    <AppShell>
      <div className="p-4 lg:p-6">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-heading-2 text-text-primary">Semua Catatan</h1>
            <p className="text-caption mt-1 text-text-muted">
              {activeNotes.length} catatan
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <NoteListSkeleton count={6} />
        ) : activeNotes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 text-6xl">📝</div>
            <h2 className="text-heading-3 text-text-primary">
              Belum ada catatan
            </h2>
            <p className="text-body-ui mt-2 text-text-secondary">
              Mulai menulis catatan pertamamu
            </p>
            <button
              onClick={handleNewNote}
              className="mt-6 rounded-lg bg-accent px-6 py-2.5 text-body-ui font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Buat Catatan Baru
            </button>
          </div>
        ) : (
          /* Notes grid */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeNotes.map((note) => (
              <Link
                key={note.id}
                href={`/editor/${note.id}`}
                className="group rounded-lg border border-border bg-bg-elevated p-4 shadow-sm transition-all hover:border-border-secondary hover:shadow-md"
              >
                <h3 className="text-body-ui font-semibold text-text-primary group-hover:text-accent">
                  {note.title || 'Untitled'}
                </h3>
                {note.contentText && (
                  <p className="text-caption mt-2 text-text-tertiary line-clamp-2">
                    {truncate(note.contentText, 120)}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-caption text-text-muted">
                    {formatRelativeTime(note.lastEditedAt)}
                  </span>
                  <span className="text-text-muted">·</span>
                  <span className="text-caption text-text-muted">
                    {note.wordCount} kata
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
