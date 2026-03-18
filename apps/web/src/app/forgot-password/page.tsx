'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export default function ForgotPasswordPage() {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
    } catch {
      // Always show success to avoid leaking email existence
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-5xl">📧</div>
          <h1 className="text-heading-2 text-text-primary">Cek email kamu</h1>
          <p className="text-body-ui mt-2 text-text-secondary">
            Jika akun dengan email <strong>{email}</strong> ada, kami akan mengirim link untuk reset password.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-accent px-6 py-2.5 text-body-ui font-medium text-white hover:bg-accent-hover"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-heading-1 text-text-primary">Lupa Password</h1>
          <p className="text-body-ui mt-2 text-text-secondary">
            Masukkan email kamu untuk menerima link reset password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-caption mb-1.5 block font-medium text-text-primary">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 w-full rounded-lg border border-border bg-bg-elevated px-3 text-body-ui text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              placeholder="nama@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-lg bg-accent text-body-ui font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>

        <p className="mt-6 text-center text-caption text-text-secondary">
          <Link href="/login" className="text-accent hover:underline">
            Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  );
}
