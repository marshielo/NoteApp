'use client';

import { use } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { EditorLayout } from '@/components/layout/editor-layout';
import { EditorSkeleton } from '@/components/ui/skeleton';

interface EditorPageProps {
  params: Promise<{ noteId: string }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const { noteId } = use(params);

  return (
    <AppShell showSidebar={false} showBackButton>
      <EditorLayout
        saveStatus={<span>Saved</span>}
        wordCount={<span>0 kata · 0 min</span>}
      >
        {/* Tiptap editor — built in MAR-7 */}
        <EditorSkeleton />
        <p className="mt-4 text-center text-caption text-text-muted">
          Editor for note {noteId} — built in MAR-7
        </p>
      </EditorLayout>
    </AppShell>
  );
}
