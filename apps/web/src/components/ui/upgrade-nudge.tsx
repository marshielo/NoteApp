'use client';

import { useState } from 'react';

interface UpgradeNudgeProps {
  /** What triggered this nudge */
  trigger: 'note_limit' | 'tag_limit' | 'export' | 'sync' | 'image' | 'font' | 'accent';
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** Whether to show as a modal overlay or inline banner */
  variant?: 'modal' | 'banner';
  /** Called when dismissed */
  onDismiss?: () => void;
}

export function UpgradeNudge({
  trigger,
  title,
  description,
  variant = 'banner',
  onDismiss,
}: UpgradeNudgeProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (variant === 'modal') {
    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={handleDismiss}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.5 9H22L16 13.5L18 21L12 16.5L6 21L8 13.5L2 9H9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-accent"/>
              </svg>
            </div>
            <h3 className="text-body-ui font-semibold text-text-primary">{title}</h3>
            <p className="mt-2 text-caption text-text-secondary">{description}</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 rounded-lg border border-border py-2.5 text-caption font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
              >
                Nanti
              </button>
              <a
                href="/upgrade"
                className="flex-1 rounded-lg bg-accent py-2.5 text-center text-caption font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Upgrade
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Banner variant
  return (
    <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1L10 6H15L11 9L12.5 14L8 11L3.5 14L5 9L1 6H6L8 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" className="text-accent"/>
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-caption font-medium text-text-primary">{title}</p>
        <p className="text-[11px] text-text-muted">{description}</p>
      </div>
      <a
        href="/upgrade"
        className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Upgrade
      </a>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-text-muted transition-colors hover:text-text-secondary"
        aria-label="Tutup"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

/**
 * Inline "PRO" badge for feature gating.
 */
export function ProBadge() {
  return (
    <span className="inline-flex items-center rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-accent">
      PRO
    </span>
  );
}
