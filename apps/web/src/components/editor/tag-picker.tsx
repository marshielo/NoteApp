'use client';

import { useState, useEffect, useRef } from 'react';
import { useTagsStore } from '@/stores/tags-store';

interface TagPickerProps {
  noteId: string;
  noteTags: string[];
  onClose: () => void;
  onTagsChange: (tags: string[]) => void;
}

export function TagPicker({ noteId, noteTags, onClose, onTagsChange }: TagPickerProps) {
  const tags = useTagsStore((s) => s.tags);
  const loadTags = useTagsStore((s) => s.loadTags);
  const createTag = useTagsStore((s) => s.createTag);
  const addTagToNote = useTagsStore((s) => s.addTagToNote);
  const removeTagFromNote = useTagsStore((s) => s.removeTagFromNote);

  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handleToggleTag = async (tagId: string, tagName: string) => {
    setError(null);
    if (noteTags.includes(tagName)) {
      await removeTagFromNote(tagId, noteId);
      onTagsChange(noteTags.filter((t) => t !== tagName));
    } else {
      await addTagToNote(tagId, noteId);
      onTagsChange([...noteTags, tagName]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setError(null);
    try {
      const tag = await createTag(newTagName);
      await addTagToNote(tag.id, noteId);
      onTagsChange([...noteTags, tag.name]);
      setNewTagName('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div
      ref={ref}
      className="w-64 rounded-lg border border-border bg-bg-elevated shadow-lg"
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-caption font-medium text-text-primary">Tag</p>
      </div>

      {/* Tag list */}
      <div className="max-h-48 overflow-y-auto p-2">
        {tags.length === 0 ? (
          <p className="px-2 py-3 text-center text-caption text-text-muted">
            Belum ada tag. Buat tag pertamamu di bawah.
          </p>
        ) : (
          tags.map((tag) => {
            const isAssigned = noteTags.includes(tag.name);
            return (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag.id, tag.name)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-bg-tertiary"
              >
                <div
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                  style={{
                    borderColor: tag.color,
                    backgroundColor: isAssigned ? tag.color : 'transparent',
                  }}
                >
                  {isAssigned && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span
                  className="text-caption"
                  style={{ color: tag.color }}
                >
                  {tag.name}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Create new tag */}
      <div className="border-t border-border p-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateTag();
          }}
          className="flex gap-1.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={newTagName}
            onChange={(e) => {
              setNewTagName(e.target.value);
              setError(null);
            }}
            placeholder="Tag baru..."
            maxLength={30}
            className="min-w-0 flex-1 rounded-md border border-border bg-bg-primary px-2 py-1.5 text-caption text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newTagName.trim()}
            className="rounded-md bg-accent px-2.5 py-1.5 text-caption font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            +
          </button>
        </form>
        {error && (
          <p className="mt-1.5 text-[11px] text-error">{error}</p>
        )}
      </div>
    </div>
  );
}
