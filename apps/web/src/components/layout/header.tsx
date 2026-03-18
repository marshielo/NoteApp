'use client';

import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
  showBackButton?: boolean;
  rightContent?: React.ReactNode;
}

export function Header({ onMenuClick, showBackButton = false, rightContent }: HeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center border-b border-border bg-bg-elevated/80 px-4 backdrop-blur-md">
      {/* Left section */}
      <div className="flex items-center gap-2">
        {showBackButton ? (
          <Link
            href="/notes"
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Back to notes"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ) : (
          <button
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary lg:hidden"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {!showBackButton && (
          <Link href="/notes" className="text-heading-3 text-text-primary">
            Catatan
          </Link>
        )}
      </div>

      {/* Center — search placeholder (desktop only, functional in Sprint 2) */}
      {!showBackButton && (
        <div className="mx-4 hidden max-w-md flex-1 md:block">
          <div className="flex h-9 items-center rounded-lg bg-bg-tertiary px-3 text-text-muted">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-caption">Cari catatan...</span>
          </div>
        </div>
      )}

      {/* Right section */}
      <div className="ml-auto flex items-center gap-2">
        {rightContent}
        {!showBackButton && (
          <Link
            href="/editor/new"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-caption text-white transition-colors hover:bg-accent-hover"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="hidden sm:inline">Catatan Baru</span>
          </Link>
        )}
      </div>
    </header>
  );
}
