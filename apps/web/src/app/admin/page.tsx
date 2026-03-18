'use client';

import { useEffect, useState } from 'react';
import { formatIDR } from '@/lib/subscription';

interface Stats {
  totalUsers: number;
  proUsers: number;
  revenueMtd: number;
  recentSignups: Array<{
    id: string;
    email: string;
    display_name: string | null;
    role: string;
    subscription_status: string;
    created_at: string;
  }>;
  recentPayments: Array<{
    id: string;
    user_id: string;
    provider: string;
    event_type: string;
    external_id: string | null;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading-2 text-text-primary">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-bg-tertiary" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-bg-tertiary" />
          <div className="h-64 animate-pulse rounded-xl bg-bg-tertiary" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-text-muted">Gagal memuat data.</p>;
  }

  const cards = [
    { label: 'Total Pengguna', value: stats.totalUsers.toLocaleString('id-ID'), color: 'text-blue-600' },
    { label: 'Pengguna Pro', value: stats.proUsers.toLocaleString('id-ID'), color: 'text-green-600' },
    { label: 'Konversi Pro', value: stats.totalUsers > 0 ? `${Math.round((stats.proUsers / stats.totalUsers) * 100)}%` : '0%', color: 'text-purple-600' },
    { label: 'Revenue (MTD)', value: formatIDR(stats.revenueMtd), color: 'text-accent' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-heading-2 text-text-primary">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-bg-elevated p-5">
            <p className="text-caption text-text-muted">{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Signups */}
        <div className="rounded-xl border border-border bg-bg-elevated">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-body-ui font-semibold text-text-primary">Pendaftaran Terbaru</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-2.5 text-left text-[11px] font-medium uppercase text-text-muted">User</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-medium uppercase text-text-muted">Role</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-medium uppercase text-text-muted">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSignups.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <p className="text-caption font-medium text-text-primary">{u.display_name || '—'}</p>
                      <p className="text-[11px] text-text-muted">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        u.role === 'pro' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        'bg-bg-tertiary text-text-secondary'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-text-muted">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
                {stats.recentSignups.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-caption text-text-muted">Belum ada pengguna</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="rounded-xl border border-border bg-bg-elevated">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-body-ui font-semibold text-text-primary">Pembayaran Terbaru</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-2.5 text-left text-[11px] font-medium uppercase text-text-muted">Event</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-medium uppercase text-text-muted">Provider</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-medium uppercase text-text-muted">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        p.event_type.includes('success') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {p.event_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-caption text-text-secondary">{p.provider}</td>
                    <td className="px-5 py-3 text-[11px] text-text-muted">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {stats.recentPayments.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-caption text-text-muted">Belum ada pembayaran</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
