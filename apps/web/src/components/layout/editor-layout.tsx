'use client';

import type { ReactNode } from 'react';

interface EditorLayoutProps {
  children: ReactNode;
  saveStatus?: ReactNode;
  wordCount?: ReactNode;
  moreMenu?: ReactNode;
}

/**
 * Editor page layout with minimal top bar.
 * Content area is centered at 680px max-width (like Medium).
 */
export function EditorLayout({
  children,
  saveStatus,
  wordCount,
  moreMenu,
}: EditorLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">
      {/* Editor top bar — inside the main content area */}
      <div className="sticky top-14 z-10 flex h-10 items-center justify-between border-b border-border/50 bg-bg-primary/80 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-caption text-text-muted">
          {saveStatus}
        </div>
        <div className="flex items-center gap-3">
          {wordCount && (
            <span className="text-caption text-text-muted">{wordCount}</span>
          )}
          {moreMenu}
        </div>
      </div>

      {/* Editor content area */}
      <div className="flex-1">
        <div className="mx-auto max-w-[680px] px-5 py-8 lg:px-0">
          {children}
        </div>
      </div>
    </div>
  );
}
