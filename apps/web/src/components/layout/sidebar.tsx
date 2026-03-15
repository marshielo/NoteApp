'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTagsStore } from '@/stores/tags-store';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  {
    href: '/notes',
    filter: null,
    label: 'Semua Catatan',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/notes?filter=archived',
    filter: 'archived',
    label: 'Arsip',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 7V14C3 14.5523 3.44772 15 4 15H14C14.5523 15 15 14.5523 15 14V7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/notes?filter=trash',
    filter: 'trash',
    label: 'Sampah',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 5H15M6 5V4C6 3.44772 6.44772 3 7 3H11C11.5523 3 12 3.44772 12 4V5M5 5L5.5 14C5.5 14.5523 5.94772 15 6.5 15H11.5C12.0523 15 12.5 14.5523 12.5 14L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter');
  const currentTag = searchParams.get('tag');

  const tags = useTagsStore((s) => s.tags);
  const loadTags = useTagsStore((s) => s.loadTags);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-bg-secondary transition-transform duration-250 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="mb-2">
            <span className="text-label px-3 text-text-muted">Catatan</span>
          </div>
          {navItems.map((item) => {
            const isActive =
              pathname === '/notes' && currentFilter === item.filter && !currentTag;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-body-ui transition-colors ${
                  isActive
                    ? 'bg-bg-tertiary text-text-primary font-medium'
                    : 'text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Tags section */}
          <div className="mt-6 mb-2">
            <span className="text-label px-3 text-text-muted">Tag</span>
          </div>
          {tags.length === 0 ? (
            <div className="px-3 py-2">
              <p className="text-caption italic text-text-muted">Belum ada tag</p>
            </div>
          ) : (
            tags.map((tag) => {
              const isActive = currentTag === tag.name;
              return (
                <Link
                  key={tag.id}
                  href={`/notes?tag=${encodeURIComponent(tag.name)}`}
                  onClick={onClose}
                  className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-body-ui transition-colors ${
                    isActive
                      ? 'bg-bg-tertiary text-text-primary font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 truncate">{tag.name}</span>
                  {tag.notesCount > 0 && (
                    <span className="text-caption text-text-muted">{tag.notesCount}</span>
                  )}
                </Link>
              );
            })
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-3">
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
