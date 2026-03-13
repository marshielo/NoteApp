'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function NotesPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="text-center">
        <h1 className="text-heading-1 text-text-primary">Catatan</h1>
        <p className="text-body-ui mt-3 text-text-secondary">
          Beautiful note-taking for everyone
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="rounded-xl bg-accent px-4 py-2 text-caption text-white">
            Accent
          </span>
          <span className="rounded-xl bg-accent-secondary px-4 py-2 text-caption text-white">
            Secondary
          </span>
          <span className="rounded-xl bg-accent-tertiary px-4 py-2 text-caption text-white">
            Tertiary
          </span>
        </div>
        <div className="mt-8 flex justify-center">
          <ThemeToggle />
        </div>
        <p className="text-caption mt-6 text-text-muted">
          Layout &amp; editor coming in MAR-10 &amp; MAR-7
        </p>
      </div>
    </div>
  );
}
