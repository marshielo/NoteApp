'use client';

import { use, useState, useCallback, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { EditorLayout } from '@/components/layout/editor-layout';
import { CatatanEditor } from '@/components/editor/catatan-editor';
import { WordCount } from '@/components/editor/word-count';
import { SaveStatus } from '@/components/editor/save-status';
import { MoreMenu } from '@/components/editor/more-menu';
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
  const [currentContent, setCurrentContent] = useState<Record<string, unknown>>({});
  const [noteTitle, setNoteTitle] = useState('Untitled');
  const [isLoading, setIsLoading] = useState(true);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const updateNote = useNotesStore((s) => s.updateNote);

  const { saveStatus, scheduleSave, forceSave } = useAutoSave({
    noteId,
    debounceMs: 1500,
  });

  useEffect(() => {
    async function loadNote() {
      try {
        const note = await db.notes.get(noteId);
        if (note) {
          setInitialContent(note.content);
          setCurrentContent(note.content);
          setNoteTitle(note.title || 'Untitled');
          setWordCount(note.wordCount);
          setNoteTags(note.tags || []);
          setIsPinned(note.isPinned);
        } else {
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
      setCurrentContent(data.json);
      setNoteTitle(data.title);

      const contentText = extractTextFromTiptapJSON(data.json);
      const wc = calculateWordCount(contentText);
      const readingTime = calculateReadingTime(wc);

      updateNote(noteId, {
        title: data.title,
        content: data.json,
        contentText,
        wordCount: wc,
        readingTimeMinutes: readingTime,
      });

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

  const handleTagsChange = useCallback((tags: string[]) => {
    setNoteTags(tags);
    updateNote(noteId, { tags });
  }, [noteId, updateNote]);

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
        moreMenu={
          <MoreMenu
            noteId={noteId}
            noteTitle={noteTitle}
            noteContent={currentContent}
            noteTags={noteTags}
            isPinned={isPinned}
            onTagsChange={handleTagsChange}
          />
        }
      >
        {noteTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {noteTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent-tertiary/15 px-2.5 py-0.5 text-caption text-accent-tertiary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <CatatanEditor
          content={initialContent ?? undefined}
          onUpdate={handleUpdate}
        />
      </EditorLayout>
    </AppShell>
  );
}
