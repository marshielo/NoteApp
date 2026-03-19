'use client';

import { getEnvLabel, getEnvColor } from '@/lib/env';

/**
 * Shows a small DEV / STAGING badge in the bottom-left corner.
 * Hidden in production.
 */
export function EnvBadge() {
  const label = getEnvLabel();
  if (!label) return null;

  const color = getEnvColor();

  return (
    <div
      className="fixed bottom-3 left-3 z-[9999] rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider text-white shadow-lg select-none pointer-events-none"
      style={{ backgroundColor: color }}
    >
      {label}
    </div>
  );
}
