'use client';

import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position to keep menu on screen
  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 100,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="min-w-[180px] rounded-lg border border-border bg-bg-elevated py-1 shadow-lg"
      role="menu"
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.separator && <div className="my-1 border-t border-border" />}
          <button
            role="menuitem"
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-caption transition-colors hover:bg-bg-tertiary ${
              item.variant === 'danger'
                ? 'text-error hover:text-error'
                : 'text-text-secondary'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
