'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TagPicker } from './tag-picker';
import { useNotesStore } from '@/stores/notes-store';
import { showToast } from '@/components/ui/toast';

interface MoreMenuProps {
  noteId: string;
  noteTags: string[];
  isPinned: boolean;
  onTagsChange: (tags: string[]) => void;
}

export function MoreMenu({ noteId, noteTags, isPinned, onTagsChange }: MoreMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const togglePin = useNotesStore((s) => s.togglePin);
  const archiveNote = useNotesStore((s) => s.archiveNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const duplicateNote = useNotesStore((s) => s.duplicateNote);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (showTagPicker) {
    return (
      <div className="relative">
        <div className="absolute top-8 right-0 z-50">
          <TagPicker
            noteId={noteId}
            noteTags={noteTags}
            onClose={() => setShowTagPicker(false)}
            onTagsChange={onTagsChange}
          />
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      label: 'Kelola tag',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 7.5V2C1 1.44772 1.44772 1 2 1H7.5L13 6.5L7.5 13L1 7.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <circle cx="4.5" cy="4.5" r="1" fill="currentColor"/>
        </svg>
      ),
      onClick: () => {
        setOpen(false);
        setShowTagPicker(true);
      },
    },
    {
      label: isPinned ? 'Lepas pin' : 'Sematkan',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 1L5 3L3 5L3 6.5H6.25L5.5 13H6.5L7.25 6.5H11V5L9 3V1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onClick: async () => {
        await togglePin(noteId);
        setOpen(false);
      },
    },
    {
      label: 'Duplikat',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M9.5 2.5H2.5C1.94772 2.5 1.5 2.94772 1.5 3.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
      onClick: async () => {
        setOpen(false);
        try {
          const newId = await duplicateNote(noteId);
          router.push(`/editor/${newId}`);
        } catch (err) {
          alert((err as Error).message);
        }
      },
    },
    'separator' as const,
    {
      label: 'Arsipkan',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1.5" y="2.5" width="11" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M2.5 5.5V11C2.5 11.5523 2.94772 12 3.5 12H10.5C11.0523 12 11.5 11.5523 11.5 11V5.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M5.5 8.5H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
      onClick: async () => {
        await archiveNote(noteId);
        router.push('/notes');
      },
    },
    {
      label: 'Hapus',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.5 4H11.5M5 4V3C5 2.44772 5.44772 2 6 2H8C8.55228 2 9 2.44772 9 3V4M4 4L4.5 11.5C4.5 12.0523 4.94772 12.5 5.5 12.5H8.5C9.05228 12.5 9.5 12.0523 9.5 11.5L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
      onClick: async () => {
        await deleteNote(noteId);
        router.push('/notes');
        showToast({
          message: 'Catatan dihapus',
          duration: 5000,
          action: {
            label: 'Urungkan',
            onClick: async () => {
              await useNotesStore.getState().undoDelete(noteId);
              router.push(`/editor/${noteId}`);
            },
          },
        });
      },
      variant: 'danger' as const,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        aria-label="More options"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="3" r="1.2" fill="currentColor"/>
          <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
          <circle cx="8" cy="13" r="1.2" fill="currentColor"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-8 right-0 z-50 min-w-[170px] rounded-lg border border-border bg-bg-elevated py-1 shadow-lg">
          {menuItems.map((item, i) => {
            if (item === 'separator') {
              return <div key={i} className="my-1 border-t border-border" />;
            }
            return (
              <button
                key={i}
                onClick={item.onClick}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-caption transition-colors hover:bg-bg-tertiary ${
                  item.variant === 'danger'
                    ? 'text-error hover:text-error'
                    : 'text-text-secondary'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
