import { useState, useCallback, useRef, useMemo } from 'react';
import type { NoteRecord } from '@/lib/db';

interface SearchResult {
  note: NoteRecord;
  matchField: 'title' | 'content' | 'tag';
  snippet: string;
}

export function useSearch(notes: NoteRecord[]) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim().toLowerCase());
    }, 300);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const results: SearchResult[] = useMemo(() => {
    if (!debouncedQuery) return [];

    const matches: SearchResult[] = [];
    const q = debouncedQuery;

    for (const note of notes) {
      if (note.isDeleted) continue;

      // Title match
      if (note.title?.toLowerCase().includes(q)) {
        matches.push({
          note,
          matchField: 'title',
          snippet: getSnippet(note.contentText || '', q),
        });
        continue;
      }

      // Content match
      if (note.contentText?.toLowerCase().includes(q)) {
        matches.push({
          note,
          matchField: 'content',
          snippet: getSnippet(note.contentText, q),
        });
        continue;
      }

      // Tag match
      if (note.tags?.some((t) => t.toLowerCase().includes(q))) {
        matches.push({
          note,
          matchField: 'tag',
          snippet: note.contentText ? getSnippet(note.contentText, q) : '',
        });
      }
    }

    return matches;
  }, [notes, debouncedQuery]);

  return {
    query,
    debouncedQuery,
    results,
    isSearching: !!debouncedQuery,
    handleQueryChange,
    clearSearch,
  };
}

function getSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query);
  if (idx === -1) return text.slice(0, 120);

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 80);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

export function highlightMatch(text: string, query: string): React.ReactNode[] {
  if (!query || !text) return [text];

  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  let lastIndex = 0;

  let idx = lower.indexOf(qLower, lastIndex);
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(text.slice(idx, idx + query.length));
    lastIndex = idx + query.length;
    idx = lower.indexOf(qLower, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
