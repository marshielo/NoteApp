'use client';

import { Suspense, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useNotesStore } from '@/stores/notes-store';
import { useTagsStore } from '@/stores/tags-store';
import { useUIStore } from '@/stores/ui-store';
import { db } from '@/lib/db';
import { tiptapToMarkdown, tiptapToPlainText, sanitizeFilename } from '@/lib/export-utils';
import { showToast } from '@/components/ui/toast';

const APP_VERSION = '0.1.0';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-4 lg:p-6"><div className="mx-auto max-w-2xl animate-pulse space-y-6"><div className="h-8 w-40 rounded bg-bg-tertiary" /><div className="h-48 rounded-xl bg-bg-tertiary" /><div className="h-32 rounded-xl bg-bg-tertiary" /></div></div>}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const notes = useNotesStore((s) => s.notes);
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const tags = useTagsStore((s) => s.tags);
  const loadTags = useTagsStore((s) => s.loadTags);

  const [deleteDialogStep, setDeleteDialogStep] = useState(0);

  useEffect(() => {
    loadNotes();
    loadTags();
  }, [loadNotes, loadTags]);

  const activeNotes = notes.filter((n) => !n.isDeleted);
  const notesCount = activeNotes.length;
  const tagsCount = tags.length;

  const handleDeleteAllData = async () => {
    await db.notes.clear();
    await db.tags.clear();
    await db.settings.clear();
    window.location.href = '/';
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-4 lg:p-6">
        <h1 className="text-heading-2 text-text-primary">Pengaturan</h1>

        {/* ---- Profile ---- */}
        <section className="mt-8">
          <h2 className="text-body-ui font-semibold text-text-primary">Profil</h2>
          <div className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-xl font-bold text-accent">
                ?
              </div>
              <div className="flex-1">
                <p className="text-body-ui font-medium text-text-primary">Pengguna Lokal</p>
                <p className="text-caption text-text-muted">
                  Mode lokal — data tersimpan di perangkat ini
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-bg-tertiary px-4 py-3">
              <p className="text-caption text-text-secondary">
                <a href="/login" className="font-medium text-accent hover:text-accent-hover">
                  Masuk
                </a>{' '}
                atau{' '}
                <a href="/register" className="font-medium text-accent hover:text-accent-hover">
                  daftar
                </a>{' '}
                untuk menyinkronkan catatan ke cloud dan mengakses dari perangkat lain.
              </p>
            </div>
          </div>
        </section>

        {/* ---- Appearance ---- */}
        <section className="mt-8">
          <h2 className="text-body-ui font-semibold text-text-primary">Tampilan</h2>
          <div className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
            <ThemeSelector />
          </div>
        </section>

        {/* ---- Subscription ---- */}
        <section className="mt-8">
          <h2 className="text-body-ui font-semibold text-text-primary">Langganan</h2>
          <div className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full bg-bg-tertiary px-3 py-1 text-label font-semibold text-text-secondary">
                  FREE
                </span>
                <p className="mt-2 text-caption text-text-muted">
                  Paket gratis dengan 50 catatan dan 10 tag.
                </p>
              </div>
            </div>
            <a
              href="/#pricing"
              className="mt-4 block rounded-lg bg-accent py-2.5 text-center text-body-ui font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Upgrade ke Pro
            </a>
          </div>
        </section>

        {/* ---- Data & Storage ---- */}
        <section className="mt-8">
          <h2 className="text-body-ui font-semibold text-text-primary">Data & Penyimpanan</h2>
          <div className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-secondary">Catatan</span>
                <span className="text-caption font-medium text-text-primary">
                  {notesCount} dari 50
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min(100, (notesCount / 50) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-caption text-text-secondary">Tag</span>
                <span className="text-caption font-medium text-text-primary">
                  {tagsCount} dari 10
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min(100, (tagsCount / 10) * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium text-text-secondary">Ekspor semua catatan</p>
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    Unduh semua catatan sebagai file teks (.txt)
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const allNotes = await db.notes.toArray();
                    const activeNotes = allNotes.filter((n) => !n.isDeleted);
                    if (activeNotes.length === 0) {
                      showToast({ message: 'Tidak ada catatan untuk diekspor' });
                      return;
                    }
                    const combined = activeNotes
                      .map((n) => {
                        const text = tiptapToPlainText(n.content);
                        return `=== ${n.title || 'Untitled'} ===\n\n${text}`;
                      })
                      .join('\n\n' + '='.repeat(40) + '\n\n');
                    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `catatan-export-${new Date().toISOString().slice(0, 10)}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast({ message: `${activeNotes.length} catatan diekspor` });
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-caption font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
                >
                  Ekspor
                </button>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <button
                onClick={() => setDeleteDialogStep(1)}
                className="text-caption font-medium text-red-500 transition-colors hover:text-red-600"
              >
                Hapus semua data
              </button>
              <p className="mt-1 text-[11px] text-text-muted">
                Menghapus semua catatan, tag, dan pengaturan dari perangkat ini. Tidak bisa dibatalkan.
              </p>
            </div>
          </div>
        </section>

        {/* ---- About ---- */}
        <section className="mt-8 mb-12">
          <h2 className="text-body-ui font-semibold text-text-primary">Tentang</h2>
          <div className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-secondary">Versi</span>
                <span className="text-caption text-text-muted">v{APP_VERSION}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-secondary">Changelog</span>
                <a href="#" className="text-caption text-accent hover:text-accent-hover">
                  Lihat perubahan
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-secondary">Kebijakan Privasi</span>
                <a href="#" className="text-caption text-accent hover:text-accent-hover">
                  Baca
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-secondary">Syarat Layanan</span>
                <a href="#" className="text-caption text-accent hover:text-accent-hover">
                  Baca
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-secondary">Kontak</span>
                <a href="#" className="text-caption text-accent hover:text-accent-hover">
                  Hubungi kami
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Delete data — step 1 */}
      <ConfirmDialog
        open={deleteDialogStep === 1}
        title="Hapus semua data?"
        message="Semua catatan, tag, dan pengaturan akan dihapus dari perangkat ini. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Lanjutkan"
        onConfirm={() => setDeleteDialogStep(2)}
        onCancel={() => setDeleteDialogStep(0)}
      />

      {/* Delete data — step 2 (double confirmation) */}
      <ConfirmDialog
        open={deleteDialogStep === 2}
        title="Kamu yakin?"
        message="Ini adalah konfirmasi terakhir. Semua data akan hilang secara permanen."
        confirmLabel="Ya, Hapus Semua"
        onConfirm={handleDeleteAllData}
        onCancel={() => setDeleteDialogStep(0)}
      />
    </AppShell>
  );
}

/* ---- Theme Selector sub-component ---- */

function ThemeSelector() {
  const [theme, setTheme] = useState<string>('system');

  useEffect(() => {
    const stored = localStorage.getItem('catatan-theme') || 'system';
    setTheme(stored);
  }, []);

  const handleTheme = (value: string) => {
    setTheme(value);
    localStorage.setItem('catatan-theme', value);

    let resolved = value;
    if (value === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  };

  const options = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  return (
    <div>
      <p className="text-caption font-medium text-text-secondary">Tema</p>
      <div className="mt-3 flex gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleTheme(opt.value)}
            className={`flex-1 rounded-lg border px-4 py-3 text-center text-caption font-medium transition-all ${
              theme === opt.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-secondary hover:border-border-secondary'
            }`}
          >
            <span className="mr-1">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
