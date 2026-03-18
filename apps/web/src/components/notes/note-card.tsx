'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type NoteRecord } from '@/lib/db';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { useNotesStore } from '@/stores/notes-store';
import { type ViewMode } from '@/stores/ui-store';
import { ContextMenu, type ContextMenuItem } from './context-menu';

interface NoteCardProps {
  note: NoteRecord;
  viewMode: ViewMode;
  filter?: 'active' | 'archived' | 'trash';
  daysLeft?: number;
  onPermanentDelete?: (id: string) => void;
}

// SVG icons as small components
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 1L5 3L3 5L3 6.5H6.25L5.5 13H6.5L7.25 6.5H11V5L9 3V1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PinOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2V4L4 6V7.5H7.25L6.5 14H7.5L8.25 7.5H12V6L10 4V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 14L14 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const ArchiveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="12" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M3 6.5V12.5C3 13.0523 3.44772 13.5 4 13.5H12C12.5523 13.5 13 13.0523 13 12.5V6.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M6.5 9.5H9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const DuplicateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M11 3H3.5C2.94772 3 2.5 3.44772 2.5 4V11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5H13M6 4.5V3.5C6 2.94772 6.44772 2.5 7 2.5H9C9.55228 2.5 10 2.94772 10 3.5V4.5M4.5 4.5L5 13C5 13.5523 5.44772 14 6 14H10C10.5523 14 11 13.5523 11 13L11.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const RestoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8C3 5.23858 5.23858 3 8 3C10.7614 3 13 5.23858 13 8C13 10.7614 10.7614 13 8 13C6.34315 13 4.88048 12.1571 4 10.874" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M3 4V8H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function NoteCard({ note, viewMode, filter = 'active', daysLeft, onPermanentDelete }: NoteCardProps) {
  const router = useRouter();
  const togglePin = useNotesStore((s) => s.togglePin);
  const archiveNote = useNotesStore((s) => s.archiveNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const duplicateNote = useNotesStore((s) => s.duplicateNote);
  const restoreNote = useNotesStore((s) => s.restoreNote);
  const permanentDelete = useNotesStore((s) => s.permanentDelete);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const getMenuItems = (): ContextMenuItem[] => {
    if (filter === 'trash') {
      return [
        { label: 'Pulihkan', icon: <RestoreIcon />, onClick: () => restoreNote(note.id) },
        {
          label: 'Hapus permanen',
          icon: <TrashIcon />,
          onClick: () => onPermanentDelete ? onPermanentDelete(note.id) : permanentDelete(note.id),
          variant: 'danger',
          separator: true,
        },
      ];
    }

    if (filter === 'archived') {
      return [
        { label: 'Pulihkan', icon: <RestoreIcon />, onClick: () => restoreNote(note.id) },
        {
          label: 'Hapus',
          icon: <TrashIcon />,
          onClick: () => deleteNote(note.id),
          variant: 'danger',
          separator: true,
        },
      ];
    }

    return [
      {
        label: note.isPinned ? 'Lepas pin' : 'Sematkan',
        icon: note.isPinned ? <PinOffIcon /> : <PinIcon />,
        onClick: () => togglePin(note.id),
      },
      {
        label: 'Duplikat',
        icon: <DuplicateIcon />,
        onClick: async () => {
          const newId = await duplicateNote(note.id);
          router.push(`/editor/${newId}`);
        },
      },
      {
        label: 'Arsipkan',
        icon: <ArchiveIcon />,
        onClick: () => archiveNote(note.id),
        separator: true,
      },
      {
        label: 'Hapus',
        icon: <TrashIcon />,
        onClick: () => deleteNote(note.id),
        variant: 'danger',
      },
    ];
  };

  if (viewMode === 'list') {
    return (
      <>
        <div onContextMenu={handleContextMenu}>
          <Link
            href={filter === 'trash' ? '#' : `/editor/${note.id}`}
            className="group flex items-center gap-4 rounded-lg border border-border bg-bg-elevated px-4 py-3 transition-all hover:border-border-secondary hover:shadow-sm"
          >
            {note.isPinned && filter === 'active' && (
              <span className="shrink-0 text-accent">
                <PinIcon />
              </span>
            )}
            <h3 className="min-w-0 flex-1 truncate text-body-ui font-medium text-text-primary group-hover:text-accent">
              {note.title || 'Untitled'}
            </h3>
            {note.contentText && (
              <p className="hidden min-w-0 max-w-[300px] truncate text-caption text-text-tertiary md:block">
                {truncate(note.contentText, 80)}
              </p>
            )}
            {filter === 'trash' && daysLeft !== undefined ? (
              <span className="shrink-0 text-caption text-red-500">
                {daysLeft === 0 ? 'Hari ini' : `${daysLeft} hari lagi`}
              </span>
            ) : (
              <span className="shrink-0 text-caption text-text-muted">
                {formatRelativeTime(note.lastEditedAt)}
              </span>
            )}
          </Link>
        </div>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={getMenuItems()}
            onClose={() => setContextMenu(null)}
          />
        )}
      </>
    );
  }

  // Card view
  return (
    <>
      <div onContextMenu={handleContextMenu}>
        <Link
          href={filter === 'trash' ? '#' : `/editor/${note.id}`}
          className="group flex h-full flex-col rounded-lg border border-border bg-bg-elevated p-4 shadow-sm transition-all hover:border-border-secondary hover:shadow-md"
        >
          {/* Pin indicator */}
          {note.isPinned && filter === 'active' && (
            <div className="mb-2 flex items-center gap-1 text-accent">
              <PinIcon />
              <span className="text-label">DISEMATKAN</span>
            </div>
          )}

          <h3 className="text-body-ui font-semibold text-text-primary group-hover:text-accent">
            {note.title || 'Untitled'}
          </h3>

          {note.contentText && (
            <p className="mt-2 flex-1 text-caption text-text-tertiary line-clamp-3">
              {truncate(note.contentText, 150)}
            </p>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {note.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent-tertiary/15 px-2 py-0.5 text-[11px] font-medium text-accent-tertiary"
                >
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-[11px] text-text-muted">+{note.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <span className="text-caption text-text-muted">
              {formatRelativeTime(note.lastEditedAt)}
            </span>
            {filter === 'trash' && daysLeft !== undefined ? (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-caption text-red-500">
                  {daysLeft === 0 ? 'Akan dihapus hari ini' : `Dihapus dalam ${daysLeft} hari`}
                </span>
              </>
            ) : (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-caption text-text-muted">{note.wordCount} kata</span>
              </>
            )}
          </div>
        </Link>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
