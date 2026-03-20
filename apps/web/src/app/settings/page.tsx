'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AppShell } from '@/components/layout/app-shell';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useNotesStore } from '@/stores/notes-store';
import { useTagsStore } from '@/stores/tags-store';
import { useAuthStore } from '@/stores/auth-store';
import { db } from '@/lib/db';
import { tiptapToPlainText } from '@/lib/export-utils';
import { showToast } from '@/components/ui/toast';
import { FONT_PRESETS, type FontPresetId, getSavedPreset, savePreset, loadPresetFonts, getPreset } from '@/lib/font-presets';
import { ACCENT_PRESETS, DEFAULT_ACCENT, getSavedAccent, saveAccent, applyAccent, isValidHex } from '@/lib/accent-colors';
import { getStatusLabel, getStatusColor, formatDate } from '@/lib/subscription';

const APP_VERSION = '0.1.0';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-4 lg:p-6"><div className="mx-auto max-w-2xl animate-pulse space-y-6"><div className="h-8 w-40 rounded bg-bg-tertiary" /><div className="h-48 rounded-xl bg-bg-tertiary" /><div className="h-32 rounded-xl bg-bg-tertiary" /></div></div>}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const notes = useNotesStore((s) => s.notes);
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const tags = useTagsStore((s) => s.tags);
  const loadTags = useTagsStore((s) => s.loadTags);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const isPro = user?.isPro ?? false;

  const [deleteDialogStep, setDeleteDialogStep] = useState(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [subExpiresAt, setSubExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
    loadTags();
    // Re-fetch profile from DB to pick up subscription changes (e.g. after payment)
    refreshProfile();
  }, [loadNotes, loadTags, refreshProfile]);

  // Fetch subscription expiry for display
  useEffect(() => {
    if (user && user.subscriptionStatus !== 'none') {
      fetch('/api/subscription')
        .then((r) => r.json())
        .then((data) => setSubExpiresAt(data.subscription?.expires_at || null))
        .catch(() => {});
    }
  }, [user]);

  const activeNotes = notes.filter((n) => !n.isDeleted);
  const notesCount = activeNotes.length;
  const tagsCount = tags.length;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/login');
    } catch {
      showToast({ message: 'Gagal keluar. Coba lagi.' });
      setIsLoggingOut(false);
    }
  };

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
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-xl font-bold text-accent">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      (user.displayName || user.email).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-body-ui font-medium text-text-primary">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-caption text-text-muted">{user.email}</p>
                  </div>
                  {isPro && (
                    <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-accent">
                      PRO
                    </span>
                  )}
                </div>
                <div className="mt-6 border-t border-border pt-4">
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="w-full rounded-lg border border-red-300 py-2.5 text-center text-body-ui font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                  >
                    Keluar
                  </button>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </section>

        {/* ---- Appearance ---- */}
        <section className="mt-8">
          <h2 className="text-body-ui font-semibold text-text-primary">Tampilan</h2>
          <div className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
            <ThemeSelector />
            <div className="mt-6 border-t border-border pt-6">
              <FontPresetSelector isPro={isPro} />
            </div>
            <div className="mt-6 border-t border-border pt-6">
              <AccentColorPicker isPro={isPro} />
            </div>
          </div>
        </section>

        {/* ---- Subscription ---- */}
        <section className="mt-8">
          <h2 className="text-body-ui font-semibold text-text-primary">Langganan</h2>
          <div className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-block rounded-full px-3 py-1 text-label font-semibold ${getStatusColor(user?.subscriptionStatus || 'none')}`}>
                  {getStatusLabel(user?.subscriptionStatus || 'none')}
                </span>
                {isPro && subExpiresAt && (
                  <p className="mt-2 text-caption text-text-muted">
                    {user?.subscriptionStatus === 'canceled' ? 'Akses berakhir' : 'Berlaku hingga'}: {formatDate(subExpiresAt)}
                  </p>
                )}
                {!isPro && (
                  <p className="mt-2 text-caption text-text-muted">
                    Paket gratis dengan 50 catatan dan 10 tag.
                  </p>
                )}
              </div>
            </div>
            {!isPro && (
              <a
                href="/upgrade"
                className="mt-4 block rounded-lg bg-accent py-2.5 text-center text-body-ui font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Upgrade ke Pro
              </a>
            )}
            {isPro && (
              <a
                href="/upgrade"
                className="mt-4 block rounded-lg border border-border py-2.5 text-center text-body-ui font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
              >
                Kelola Langganan
              </a>
            )}
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
                  {isPro ? notesCount : `${notesCount} dari 50`}
                </span>
              </div>
              {!isPro && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${Math.min(100, (notesCount / 50) * 100)}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-caption text-text-secondary">Tag</span>
                <span className="text-caption font-medium text-text-primary">
                  {isPro ? tagsCount : `${tagsCount} dari 10`}
                </span>
              </div>
              {!isPro && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${Math.min(100, (tagsCount / 10) * 100)}%` }}
                  />
                </div>
              )}
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

      {/* Logout confirmation */}
      <ConfirmDialog
        open={showLogoutDialog}
        title="Keluar dari akun?"
        message="Kamu akan keluar dari akunmu. Catatan lokal tetap tersimpan di perangkat ini."
        confirmLabel={isLoggingOut ? 'Sedang keluar...' : 'Ya, Keluar'}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />

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
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('catatan-theme') || 'system';
    }
    return 'system';
  });

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

/* ---- Font Preset Selector sub-component ---- */

function FontPresetSelector({ isPro }: { isPro: boolean }) {
  const [activePreset, setActivePreset] = useState<FontPresetId>(() => getSavedPreset());

  const handleSelect = (id: FontPresetId) => {
    const preset = getPreset(id);

    // Free users can only use Classic
    if (!preset.isFree && !isPro) {
      showToast({
        message: 'Fitur Pro — upgrade untuk font preset lainnya',
        action: { label: 'Upgrade', onClick: () => { window.location.href = '/upgrade'; } },
      });
      return;
    }

    setActivePreset(id);
    savePreset(id);
    loadPresetFonts(preset);

    // Apply to editor CSS variables
    document.documentElement.style.setProperty('--editor-heading-font', preset.headingFont);
    document.documentElement.style.setProperty('--editor-body-font', preset.bodyFont);
  };

  return (
    <div>
      <p className="text-caption font-medium text-text-secondary">Font Preset</p>
      <div className="mt-3 space-y-2">
        {FONT_PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelect(preset.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                isActive
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-border-secondary'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-caption font-medium text-text-primary">{preset.name}</span>
                  {!preset.isFree && (
                    <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                      PRO
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-text-muted">{preset.vibe}</span>
              </div>
              <div className="mt-2">
                <p
                  className="text-[15px] font-semibold text-text-primary"
                  style={{ fontFamily: preset.headingFont }}
                >
                  {preset.previewHeading}
                </p>
                <p
                  className="mt-0.5 text-[13px] text-text-secondary"
                  style={{ fontFamily: preset.bodyFont }}
                >
                  {preset.previewBody}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Accent Color Picker sub-component ---- */

function AccentColorPicker({ isPro }: { isPro: boolean }) {
  const [activeColor, setActiveColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = getSavedAccent();
      applyAccent(saved);
      return saved;
    }
    return DEFAULT_ACCENT;
  });
  const [customHex, setCustomHex] = useState('');

  const handleSelect = (hex: string) => {
    if (!isPro && hex !== DEFAULT_ACCENT) {
      showToast({
        message: 'Fitur Pro — upgrade untuk warna aksen kustom',
        action: { label: 'Upgrade', onClick: () => { window.location.href = '/upgrade'; } },
      });
      return;
    }
    setActiveColor(hex);
    saveAccent(hex);
    applyAccent(hex);
  };

  const handleCustomSubmit = () => {
    if (!isValidHex(customHex)) {
      showToast({ message: 'Masukkan kode hex yang valid (contoh: #2D7CC4)' });
      return;
    }
    handleSelect(customHex);
  };

  const handleReset = () => {
    setActiveColor(DEFAULT_ACCENT);
    setCustomHex('');
    saveAccent(DEFAULT_ACCENT);
    applyAccent(DEFAULT_ACCENT);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-caption font-medium text-text-secondary">Warna Aksen</p>
        {activeColor !== DEFAULT_ACCENT && (
          <button
            onClick={handleReset}
            className="text-[11px] text-text-muted transition-colors hover:text-text-secondary"
          >
            Reset ke default
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ACCENT_PRESETS.map((color) => {
          const isActive = activeColor.toLowerCase() === color.hex.toLowerCase();
          const isLocked = !isPro && color.hex !== DEFAULT_ACCENT;
          return (
            <button
              key={color.hex}
              onClick={() => handleSelect(color.hex)}
              title={color.name}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                isActive ? 'border-text-primary scale-110' : 'border-transparent hover:scale-105'
              }`}
            >
              <span
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: color.hex }}
              />
              {isLocked && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bg-elevated text-[8px]">
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>
      {isPro && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#hex"
            maxLength={7}
            className="w-24 rounded-md border border-border bg-bg-primary px-2 py-1.5 text-caption text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customHex}
            className="rounded-md bg-accent px-3 py-1.5 text-caption font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            Terapkan
          </button>
        </div>
      )}
    </div>
  );
}
