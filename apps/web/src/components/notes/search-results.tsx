'use client';

import Link from 'next/link';
import type { NoteRecord } from '@/lib/db';
import { formatRelativeTime } from '@/lib/utils';

interface SearchResult {
  note: NoteRecord;
  matchField: 'title' | 'content' | 'tag';
  snippet: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-3 text-5xl">🔍</div>
        <h3 className="text-heading-3 text-text-primary">Tidak ditemukan</h3>
        <p className="text-body-ui mt-1 text-text-secondary">
          Tidak ada catatan untuk &ldquo;{query}&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption text-text-muted">
        {results.length} hasil untuk &ldquo;{query}&rdquo;
      </p>
      {results.map(({ note, snippet, matchField }) => (
        <Link
          key={note.id}
          href={`/editor/${note.id}`}
          className="group rounded-lg border border-border bg-bg-elevated p-4 transition-all hover:border-border-secondary hover:shadow-sm"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-body-ui font-semibold text-text-primary group-hover:text-accent">
              <HighlightText text={note.title || 'Untitled'} query={query} />
            </h3>
            {matchField === 'tag' && (
              <span className="rounded-full bg-accent-tertiary/15 px-2 py-0.5 text-[11px] text-accent-tertiary">
                tag match
              </span>
            )}
          </div>
          {snippet && (
            <p className="mt-1.5 text-caption text-text-tertiary line-clamp-2">
              <HighlightText text={snippet} query={query} />
            </p>
          )}
          <span className="mt-2 block text-caption text-text-muted">
            {formatRelativeTime(note.lastEditedAt)}
          </span>
        </Link>
      ))}
    </div>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  let lastIndex = 0;
  let key = 0;

  let idx = lower.indexOf(qLower, lastIndex);
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, idx)}</span>);
    }
    parts.push(
      <mark key={key++} className="rounded bg-accent/20 px-0.5 text-accent">
        {text.slice(idx, idx + query.length)}
      </mark>
    );
    lastIndex = idx + query.length;
    idx = lower.indexOf(qLower, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}
