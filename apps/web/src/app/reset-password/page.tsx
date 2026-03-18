'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function ResetPasswordPage() {
  const router = useRouter();
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      router.push('/login');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-heading-1 text-text-primary">Reset Password</h1>
          <p className="text-body-ui mt-2 text-text-secondary">
            Masukkan password baru kamu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-caption mb-1.5 block font-medium text-text-primary">
              Password baru
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="h-10 w-full rounded-lg border border-border bg-bg-elevated px-3 text-body-ui text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              placeholder="Min. 8 karakter"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-caption mb-1.5 block font-medium text-text-primary">
              Konfirmasi password baru
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-10 w-full rounded-lg border border-border bg-bg-elevated px-3 text-body-ui text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              placeholder="Ulangi password"
            />
          </div>

          {error && <p className="text-caption text-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-lg bg-accent text-body-ui font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}
