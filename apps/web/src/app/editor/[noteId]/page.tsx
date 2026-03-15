'use client';

import { use, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { EditorLayout } from '@/components/layout/editor-layout';
import { CatatanEditor } from '@/components/editor/catatan-editor';
import { WordCount } from '@/components/editor/word-count';

interface EditorPageProps {
  params: Promise<{ noteId: string }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const { noteId: _noteId } = use(params);
  const [wordCount, setWordCount] = useState(0);

  const handleUpdate = useCallback(
    (data: { json: Record<string, unknown>; text: string; wordCount: number; title: string }) => {
      setWordCount(data.wordCount);
      // Auto-save integration added in MAR-8
    },
    []
  );

  return (
    <AppShell showSidebar={false} showBackButton>
      <EditorLayout
        saveStatus={<span>Draft</span>}
        wordCount={<WordCount wordCount={wordCount} />}
      >
        <CatatanEditor onUpdate={handleUpdate} />
      </EditorLayout>
    </AppShell>
  );
}
