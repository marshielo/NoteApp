'use client';

import type { SaveStatus as SaveStatusType } from '@/hooks/use-auto-save';

interface SaveStatusProps {
  status: SaveStatusType;
}

const statusConfig: Record<SaveStatusType, { label: string; className: string }> = {
  idle: { label: 'Draft', className: 'text-text-muted' },
  saving: { label: 'Menyimpan...', className: 'text-text-muted' },
  saved: { label: 'Tersimpan', className: 'text-success' },
  synced: { label: 'Tersinkron', className: 'text-success' },
  error: { label: 'Gagal menyimpan', className: 'text-error' },
};

export function SaveStatus({ status }: SaveStatusProps) {
  const config = statusConfig[status];

  return (
    <span className={`text-caption flex items-center gap-1.5 transition-colors ${config.className}`}>
      {status === 'saving' && (
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
      )}
      {(status === 'saved' || status === 'synced') && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {config.label}
    </span>
  );
}
