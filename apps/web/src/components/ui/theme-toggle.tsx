'use client';

import { useTheme } from '@/hooks/use-theme';
import type { ThemePreference } from '@/stores/ui-store';

const options: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function ThemeToggle() {
  const { themePreference, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-bg-tertiary p-1" role="radiogroup" aria-label="Theme preference">
      {options.map((opt) => {
        const isActive = themePreference === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-caption transition-all duration-150 ${
              isActive
                ? 'bg-bg-elevated text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <span className="text-sm" aria-hidden="true">
              {opt.icon}
            </span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
