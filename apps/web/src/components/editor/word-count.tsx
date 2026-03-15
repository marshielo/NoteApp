'use client';

interface WordCountProps {
  wordCount: number;
}

export function WordCount({ wordCount }: WordCountProps) {
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <span className="text-caption text-text-muted">
      {wordCount} kata · {readingTime} min
    </span>
  );
}
