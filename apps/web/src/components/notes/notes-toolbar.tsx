'use client';

import { useRef, useState, useEffect } from 'react';
import { useUIStore, type SortOrder } from '@/stores/ui-store';

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: 'lastEdited', label: 'Terakhir diedit' },
  { value: 'created', label: 'Tanggal dibuat' },
  { value: 'alphabetical', label: 'A-Z' },
];

export function NotesToolbar({ count }: { count: number }) {
  const viewMode = useUIStore((s) => s.viewMode);
  const sortOrder = useUIStore((s) => s.sortOrder);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const setSortOrder = useUIStore((s) => s.setSortOrder);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="mb-4 flex items-center justify-between">
      <p className="text-caption text-text-muted">{count} catatan</p>

      <div className="flex items-center gap-2">
        {/* Sort dropdown */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-caption text-text-secondary transition-colors hover:bg-bg-tertiary"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4H12M4 7H10M6 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="hidden sm:inline">
              {sortOptions.find((o) => o.value === sortOrder)?.label}
            </span>
          </button>

          {sortOpen && (
            <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-border bg-bg-elevated py-1 shadow-md">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortOrder(opt.value);
                    setSortOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-caption transition-colors hover:bg-bg-tertiary ${
                    sortOrder === opt.value ? 'text-accent font-medium' : 'text-text-secondary'
                  }`}
                >
                  {sortOrder === opt.value && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <span className={sortOrder === opt.value ? '' : 'ml-5'}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-border">
          <ViewToggleButton
            active={viewMode === 'card'}
            onClick={() => setViewMode('card')}
            label="Card view"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
          </ViewToggleButton>
          <ViewToggleButton
            active={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            label="List view"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 3H13M1 7H13M1 11H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </ViewToggleButton>
        </div>
      </div>
    </div>
  );
}

function ViewToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center transition-colors ${
        active
          ? 'bg-bg-tertiary text-text-primary'
          : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {children}
    </button>
  );
}
