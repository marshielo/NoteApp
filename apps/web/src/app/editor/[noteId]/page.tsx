'use client';

import { use, useState, useCallback, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { EditorLayout } from '@/components/layout/editor-layout';
import { CatatanEditor } from '@/components/editor/catatan-editor';
import { WordCount } from '@/components/editor/word-count';
import { SaveStatus } from '@/components/editor/save-status';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useNotesStore } from '@/stores/notes-store';
import { db } from '@/lib/db';
import {
  extractTextFromTiptapJSON,
  calculateWordCount,
  calculateReadingTime,
} from '@/lib/content-utils';

interface EditorPageProps {
  params: Promise<{ noteId: string }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const { noteId } = use(params);
  const [wordCount, setWordCount] = useState(0);
  const [initialContent, setInitialContent] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const updateNote = useNotesStore((s) => s.updateNote);

  const { saveStatus, scheduleSave, forceSave } = useAutoSave({
    noteId,
    debounceMs: 1500,
  });

  // Load note from IndexedDB on mount
  useEffect(() => {
    async function loadNote() {
      try {
        const note = await db.notes.get(noteId);
        if (note) {
          setInitialContent(note.content);
          setWordCount(note.wordCount);
        } else {
          // Note doesn't exist yet — create it
          const createNote = useNotesStore.getState().createNote;
          // If noteId is "new", create a new note; otherwise load might fail
          setInitialContent(null);
        }
      } catch (err) {
        console.error('Failed to load note:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNote();
  }, [noteId]);

  const handleUpdate = useCallback(
    (data: {
      json: Record<string, unknown>;
      text: string;
      wordCount: number;
      title: string;
    }) => {
      setWordCount(data.wordCount);

      const contentText = extractTextFromTiptapJSON(data.json);
      const wc = calculateWordCount(contentText);
      const readingTime = calculateReadingTime(wc);

      // Update Zustand store (in-memory)
      updateNote(noteId, {
        title: data.title,
        content: data.json,
        contentText,
        wordCount: wc,
        readingTimeMinutes: readingTime,
      });

      // Schedule IndexedDB save with debounce
      scheduleSave({
        title: data.title,
        content: data.json,
        contentText,
        wordCount: wc,
        readingTimeMinutes: readingTime,
      });
    },
    [noteId, updateNote, scheduleSave]
  );

  // Force save on unmount
  useEffect(() => {
    return () => {
      forceSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <AppShell showSidebar={false} showBackButton>
        <EditorLayout
          saveStatus={<SaveStatus status="idle" />}
          wordCount={<WordCount wordCount={0} />}
        >
          <div className="animate-pulse">
            <div className="mb-6 h-10 w-2/3 rounded bg-bg-tertiary" />
            <div className="mb-4 h-4 w-full rounded bg-bg-tertiary" />
            <div className="mb-4 h-4 w-5/6 rounded bg-bg-tertiary" />
          </div>
        </EditorLayout>
      </AppShell>
    );
  }

  return (
    <AppShell showSidebar={false} showBackButton>
      <EditorLayout
        saveStatus={<SaveStatus status={saveStatus} />}
        wordCount={<WordCount wordCount={wordCount} />}
      >
        <CatatanEditor
          content={initialContent ?? undefined}
          onUpdate={handleUpdate}
        />
      </EditorLayout>
    </AppShell>
  );
}
