'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { PLANS, formatIDR, hasProAccess, getStatusLabel, formatDate, type SubscriptionPlan, type SubscriptionStatus } from '@/lib/subscription';

function UpgradeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Subscription state from API
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>('none');
  const [subExpiresAt, setSubExpiresAt] = useState<string | null>(null);
  const [hadTrial, setHadTrial] = useState(false);
  const [loadingSub, setLoadingSub] = useState(true);

  // Handle redirect status from payment
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      setSuccessMessage('Pembayaran berhasil! Selamat menikmati Catatan Pro.');
      // Refresh subscription status
      fetchSubscription();
    } else if (status === 'failed') {
      setError('Pembayaran gagal. Silakan coba lagi.');
    }
  }, [searchParams]);

  // Fetch subscription info
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    } else {
      setLoadingSub(false);
    }
  }, [isAuthenticated]);

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data.profile.subscription_status || 'none');
        setSubExpiresAt(data.subscription?.expires_at || null);
        setHadTrial(!!data.profile.trial_started_at);
      }
    } catch {
      // Ignore, show default free state
    } finally {
      setLoadingSub(false);
    }
  }

  async function handleCheckout() {
    if (!isAuthenticated) {
      router.push('/login?next=/upgrade');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memulai pembayaran');
      }

      // Redirect to Xendit payment page
      window.location.href = data.invoiceUrl;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartTrial() {
    if (!isAuthenticated) {
      router.push('/login?next=/upgrade');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trial' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengaktifkan trial');
      }

      setSuccessMessage(data.message);
      setSubStatus('trial');
      setSubExpiresAt(data.trialEndsAt);
      setHadTrial(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Yakin ingin membatalkan langganan? Akses Pro tetap aktif hingga periode berakhir.')) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User canceled from upgrade page' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMessage(data.message);
      setSubStatus('canceled');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  const isPro = hasProAccess(subStatus);

  const features = [
    { name: 'Catatan', free: '50', pro: 'Unlimited' },
    { name: 'Tag', free: '10', pro: 'Unlimited' },
    { name: 'Cloud Sync', free: '—', pro: '✓' },
    { name: 'Ekspor Markdown', free: '—', pro: '✓' },
    { name: 'Ekspor HTML', free: '—', pro: '✓' },
    { name: 'Ekspor PDF', free: '—', pro: '✓' },
    { name: 'Upload Gambar', free: 'Base64 (500KB)', pro: 'Cloud (2MB)' },
    { name: 'Font Preset', free: 'Classic', pro: '5 Preset' },
    { name: 'Warna Aksen', free: 'Default', pro: 'Custom' },
    { name: 'Dukungan Prioritas', free: '—', pro: '✓' },
  ];

  const faqs = [
    {
      q: 'Bagaimana cara membayar?',
      a: 'Kami mendukung pembayaran via GoPay, OVO, DANA, ShopeePay, transfer bank (BCA, BNI, BRI, Mandiri), kartu kredit/debit, dan QRIS.',
    },
    {
      q: 'Apakah ada trial gratis?',
      a: 'Ya! Kamu bisa mencoba Pro gratis selama 7 hari. Tidak perlu kartu kredit.',
    },
    {
      q: 'Apa yang terjadi jika saya downgrade?',
      a: 'Semua catatan dan data kamu tetap aman. Kamu hanya tidak bisa membuat catatan baru jika sudah melebihi batas free (50 catatan, 10 tag).',
    },
    {
      q: 'Bisa batalkan kapan saja?',
      a: 'Tentu! Kamu bisa membatalkan kapan saja. Akses Pro tetap aktif hingga periode berlangganan berakhir.',
    },
    {
      q: 'Apakah pembayaran aman?',
      a: 'Ya, semua pembayaran diproses melalui Xendit, payment gateway terpercaya di Indonesia dengan standar keamanan PCI DSS.',
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-elevated">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <a href="/notes" className="text-body-ui font-semibold text-text-primary">
            ← Kembali
          </a>
          {user && (
            <span className="text-caption text-text-muted">{user.email}</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        {/* Messages */}
        {successMessage && (
          <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-4 text-center text-body-ui text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-body-ui text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Current status banner */}
        {isPro && !loadingSub && (
          <div className="mb-8 rounded-xl border border-accent/20 bg-accent/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-body-ui font-semibold text-text-primary">
                  Status: {getStatusLabel(subStatus)}
                </h3>
                {subExpiresAt && (
                  <p className="mt-1 text-caption text-text-muted">
                    {subStatus === 'canceled' ? 'Akses berakhir' : 'Berlaku hingga'}: {formatDate(subExpiresAt)}
                  </p>
                )}
              </div>
              {(subStatus === 'active' || subStatus === 'trial') && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                  className="rounded-lg border border-border px-4 py-2 text-caption text-text-muted transition-colors hover:bg-bg-tertiary"
                >
                  Batalkan Langganan
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-text-primary md:text-4xl">
            Upgrade ke Catatan Pro
          </h1>
          <p className="mt-3 text-body-ui text-text-secondary">
            Unlock fitur premium untuk pengalaman menulis terbaik.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
              selectedPlan === 'monthly'
                ? 'border-accent bg-accent/5 shadow-md'
                : 'border-border bg-bg-elevated hover:border-accent/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-body-ui font-semibold text-text-primary">Pro Bulanan</h3>
              <div className={`h-5 w-5 rounded-full border-2 ${
                selectedPlan === 'monthly' ? 'border-accent bg-accent' : 'border-text-muted'
              }`}>
                {selectedPlan === 'monthly' && (
                  <svg className="h-full w-full text-white" viewBox="0 0 20 20" fill="none">
                    <path d="M6 10L9 13L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-text-primary">{formatIDR(PLANS.monthly.price)}</span>
              <span className="text-caption text-text-muted"> / bulan</span>
            </div>
          </button>

          {/* Yearly */}
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
              selectedPlan === 'yearly'
                ? 'border-accent bg-accent/5 shadow-md'
                : 'border-border bg-bg-elevated hover:border-accent/40'
            }`}
          >
            <div className="absolute -top-3 right-4">
              <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-white">
                {PLANS.yearly.badge}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-body-ui font-semibold text-text-primary">Pro Tahunan</h3>
              <div className={`h-5 w-5 rounded-full border-2 ${
                selectedPlan === 'yearly' ? 'border-accent bg-accent' : 'border-text-muted'
              }`}>
                {selectedPlan === 'yearly' && (
                  <svg className="h-full w-full text-white" viewBox="0 0 20 20" fill="none">
                    <path d="M6 10L9 13L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-text-primary">{formatIDR(PLANS.yearly.price)}</span>
              <span className="text-caption text-text-muted"> / tahun</span>
            </div>
            <p className="mt-1 text-caption text-accent">Hemat {PLANS.yearly.savings}</p>
          </button>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {!isPro && (
            <>
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full max-w-md rounded-xl bg-accent py-3.5 text-body-ui font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {isLoading ? 'Memproses...' : `Berlangganan ${selectedPlan === 'monthly' ? 'Bulanan' : 'Tahunan'}`}
              </button>
              {!hadTrial && isAuthenticated && (
                <button
                  onClick={handleStartTrial}
                  disabled={isLoading}
                  className="w-full max-w-md rounded-xl border border-accent py-3 text-body-ui font-medium text-accent transition-colors hover:bg-accent/5 disabled:opacity-50"
                >
                  Coba gratis 7 hari
                </button>
              )}
            </>
          )}
          {subStatus === 'canceled' && (
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full max-w-md rounded-xl bg-accent py-3.5 text-body-ui font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {isLoading ? 'Memproses...' : 'Perpanjang Langganan'}
            </button>
          )}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-center font-serif text-2xl font-bold text-text-primary">
            Perbandingan Fitur
          </h2>
          <div className="mt-8 overflow-hidden rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-elevated">
                  <th className="px-4 py-3 text-left text-caption font-semibold text-text-secondary">
                    Fitur
                  </th>
                  <th className="px-4 py-3 text-center text-caption font-semibold text-text-secondary">
                    Free
                  </th>
                  <th className="px-4 py-3 text-center text-caption font-semibold text-accent">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={f.name} className={i % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-elevated/50'}>
                    <td className="px-4 py-3 text-caption text-text-primary">{f.name}</td>
                    <td className="px-4 py-3 text-center text-caption text-text-muted">{f.free}</td>
                    <td className="px-4 py-3 text-center text-caption font-medium text-text-primary">{f.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-16 text-center">
          <h2 className="font-serif text-2xl font-bold text-text-primary">
            Metode Pembayaran
          </h2>
          <p className="mt-3 text-caption text-text-muted">
            Diproses dengan aman oleh Xendit
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {['GoPay', 'OVO', 'DANA', 'ShopeePay', 'BCA', 'BNI', 'BRI', 'Mandiri', 'Visa', 'Mastercard', 'QRIS'].map(
              (method) => (
                <span
                  key={method}
                  className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-[11px] font-medium text-text-secondary"
                >
                  {method}
                </span>
              )
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-center font-serif text-2xl font-bold text-text-primary">
            Pertanyaan Umum
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border bg-bg-elevated"
              >
                <summary className="cursor-pointer px-6 py-4 text-body-ui font-medium text-text-primary">
                  {faq.q}
                </summary>
                <p className="px-6 pb-4 text-caption text-text-secondary">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}
