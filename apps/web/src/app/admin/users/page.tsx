'use client';

import { useEffect, useState, useCallback } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { showToast } from '@/components/ui/toast';

interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  subscription_status: string;
  subscription_plan: string | null;
  notes_count: number;
  tags_count: number;
  created_at: string;
  last_active_at: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [loading, setLoading] = useState(true);

  // Role change dialog
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ id: string; name: string; currentRole: string; newRole: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), sort: sortBy });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      showToast({ message: 'Gagal memuat data pengguna' });
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRoleChange = async () => {
    if (!roleChangeTarget) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: roleChangeTarget.id,
          action: 'change_role',
          value: roleChangeTarget.newRole,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast({ message: `Role diubah ke ${roleChangeTarget.newRole}` });
      fetchUsers();
    } catch {
      showToast({ message: 'Gagal mengubah role' });
    } finally {
      setRoleChangeTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-2 text-text-primary">Pengguna</h1>
          <p className="text-caption text-text-muted">{total} pengguna terdaftar</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cari nama atau email..."
          className="w-64 rounded-lg border border-border bg-bg-primary px-3 py-2 text-caption text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-caption text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">Semua Role</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-caption text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="created_at">Terbaru Bergabung</option>
          <option value="last_active_at">Terakhir Aktif</option>
          <option value="notes_count">Jumlah Catatan</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-bg-elevated">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">User</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">Role</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">Notes</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">Bergabung</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">Terakhir Aktif</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase text-text-muted">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-bg-tertiary" />
                    </td>
                  </tr>
                ))}
              </>
            )}
            {!loading && users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg-tertiary/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent">
                      {(u.display_name || u.email)[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-caption font-medium text-text-primary">{u.display_name || '—'}</p>
                      <p className="text-[11px] text-text-muted">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => setRoleChangeTarget({
                      id: u.id,
                      name: u.display_name || u.email,
                      currentRole: u.role,
                      newRole: e.target.value,
                    })}
                    className="rounded border border-border bg-transparent px-2 py-1 text-[11px] text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    u.subscription_status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    u.subscription_status === 'trial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-bg-tertiary text-text-secondary'
                  }`}>
                    {u.subscription_status || 'none'}
                  </span>
                </td>
                <td className="px-4 py-3 text-caption text-text-secondary">{u.notes_count}</td>
                <td className="px-4 py-3 text-[11px] text-text-muted">
                  {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-[11px] text-text-muted">
                  {u.last_active_at
                    ? new Date(u.last_active_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[11px] text-text-muted">{u.id.slice(0, 8)}</span>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-caption text-text-muted">
                  {search ? 'Tidak ada pengguna ditemukan' : 'Belum ada pengguna'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-border px-3 py-1.5 text-caption text-text-secondary transition-colors hover:bg-bg-tertiary disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span className="text-caption text-text-muted">
            Halaman {page} dari {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-border px-3 py-1.5 text-caption text-text-secondary transition-colors hover:bg-bg-tertiary disabled:opacity-40"
          >
            Selanjutnya
          </button>
        </div>
      )}

      {/* Role Change Confirmation */}
      <ConfirmDialog
        open={!!roleChangeTarget}
        title="Ubah Role?"
        message={roleChangeTarget ? `Ubah role ${roleChangeTarget.name} dari ${roleChangeTarget.currentRole} ke ${roleChangeTarget.newRole}?` : ''}
        confirmLabel="Ubah"
        onConfirm={handleRoleChange}
        onCancel={() => setRoleChangeTarget(null)}
      />
    </div>
  );
}
