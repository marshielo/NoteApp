'use client';

import { useEffect, useState } from 'react';
import { showToast } from '@/components/ui/toast';

interface ConfigRow {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const res = await fetch('/api/admin/config');
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch {
      showToast({ message: 'Gagal memuat konfigurasi' });
    } finally {
      setLoading(false);
    }
  }

  function startEdit(config: ConfigRow) {
    setEditingKey(config.key);
    setEditValue(typeof config.value === 'string' ? config.value : JSON.stringify(config.value, null, 2));
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue('');
  }

  async function saveConfig(key: string) {
    setSaving(true);
    try {
      // Try to parse as JSON, fall back to string
      let parsedValue: unknown;
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        parsedValue = editValue;
      }

      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: parsedValue }),
      });

      if (!res.ok) throw new Error('Failed');

      showToast({ message: `${key} berhasil diperbarui` });
      setEditingKey(null);
      fetchConfigs();
    } catch {
      showToast({ message: 'Gagal menyimpan konfigurasi' });
    } finally {
      setSaving(false);
    }
  }

  function getValueType(value: unknown): string {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    return 'json';
  }

  function formatValue(value: unknown): string {
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toLocaleString('id-ID');
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading-2 text-text-primary">Platform Config</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-bg-tertiary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-2 text-text-primary">Platform Config</h1>
        <p className="text-caption text-text-muted">
          Kelola konfigurasi platform. Perubahan berlaku langsung.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-bg-elevated">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">Key</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">Value</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">Type</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">Description</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase text-text-muted">Updated</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase text-text-muted">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((config) => (
              <tr key={config.key} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <code className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[11px] text-text-primary">
                    {config.key}
                  </code>
                </td>
                <td className="px-4 py-3">
                  {editingKey === config.key ? (
                    <div className="flex gap-2">
                      {getValueType(config.value) === 'boolean' ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="rounded border border-accent bg-bg-primary px-2 py-1 text-caption text-text-primary focus:outline-none"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          type={getValueType(config.value) === 'number' ? 'number' : 'text'}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-40 rounded border border-accent bg-bg-primary px-2 py-1 text-caption text-text-primary focus:outline-none"
                          autoFocus
                        />
                      )}
                      <button
                        onClick={() => saveConfig(config.key)}
                        disabled={saving}
                        className="rounded bg-accent px-2 py-1 text-[11px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                      >
                        {saving ? '...' : 'Simpan'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded border border-border px-2 py-1 text-[11px] text-text-muted hover:bg-bg-tertiary"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <span className="text-caption font-medium text-text-primary">
                      {formatValue(config.value)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-muted">
                    {getValueType(config.value)}
                  </span>
                </td>
                <td className="max-w-[200px] px-4 py-3 text-[11px] text-text-muted">
                  {config.description || '—'}
                </td>
                <td className="px-4 py-3 text-[11px] text-text-muted">
                  {new Date(config.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingKey !== config.key && (
                    <button
                      onClick={() => startEdit(config)}
                      className="rounded border border-border px-2 py-1 text-[11px] text-text-secondary transition-colors hover:bg-bg-tertiary"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {configs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-caption text-text-muted">
                  Belum ada konfigurasi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
