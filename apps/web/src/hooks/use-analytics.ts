'use client';

import { useCallback } from 'react';
import { trackEvent, type AnalyticsEvent } from '@/lib/analytics';

/**
 * Hook for tracking analytics events in components.
 */
export function useAnalytics() {
  const track = useCallback(
    (event: AnalyticsEvent, properties?: Record<string, string | number | boolean>) => {
      trackEvent(event, properties);
    },
    []
  );

  return { track };
}
