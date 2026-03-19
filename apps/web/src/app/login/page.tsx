'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push('/notes');
    } catch {
      setError('Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-heading-1 text-text-primary">Masuk</h1>
          <p className="text-body-ui mt-2 text-text-secondary">
            Masuk ke akun Catatan kamu
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

          <div>
            <label htmlFor="password" className="text-caption mb-1.5 block font-medium text-text-primary">
              Password
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

          {error && (
            <p className="text-caption text-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-lg bg-accent text-body-ui font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-caption text-text-muted">atau</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={handleGoogle}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-bg-elevated text-body-ui text-text-primary transition-colors hover:bg-bg-tertiary"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Masuk dengan Google
        </button>

        <div className="mt-6 space-y-2 text-center text-caption text-text-secondary">
          <p>
            <Link href="/forgot-password" className="text-accent hover:underline">
              Lupa password?
            </Link>
          </p>
          <p>
            Belum punya akun?{' '}
            <Link href="/register" className="text-accent hover:underline">
              Daftar
            </Link>
          </p>
          <p>
            <Link href="/notes" className="text-text-muted hover:text-text-secondary">
              Lanjut tanpa akun
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
