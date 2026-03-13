'use client';

import { AppShell } from '@/components/layout/app-shell';
import { NoteListSkeleton } from '@/components/ui/skeleton';

export default function NotesPage() {
  return (
    <AppShell>
      <div className="p-4 lg:p-6">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-heading-2 text-text-primary">Semua Catatan</h1>
            <p className="text-caption mt-1 text-text-muted">0 catatan</p>
          </div>
        </div>

        {/* Empty state / skeleton */}
        <NoteListSkeleton count={6} />
      </div>
    </AppShell>
  );
}
