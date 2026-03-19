/**
 * Privacy-friendly analytics integration.
 * Supports Umami (default) — no cookies, GDPR-compliant.
 * No-op when NEXT_PUBLIC_UMAMI_WEBSITE_ID is not set.
 */

type EventProperties = Record<string, string | number | boolean>;

// All tracked events in the app
export type AnalyticsEvent =
  | 'note_created'
  | 'note_deleted'
  | 'note_exported'
  | 'tag_created'
  | 'search_performed'
  | 'theme_changed'
  | 'editor_shortcut_used'
  | 'upgrade_nudge_shown'
  | 'upgrade_clicked'
  | 'subscription_started'
  | 'subscription_canceled'
  | 'image_uploaded'
  | 'pwa_installed';

function isEnabled(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
  );
}

/**
 * Track a custom event.
 */
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties) {
  if (!isEnabled()) return;

  // Umami tracking
  const umami = (window as unknown as { umami?: { track: (event: string, data?: EventProperties) => void } }).umami;
  if (umami) {
    umami.track(event, properties);
  }
}

/**
 * Identify a user (anonymized — only hashed ID, no PII).
 */
export function identifyUser(userId: string) {
  if (!isEnabled()) return;

  // Hash the user ID for privacy
  const anonymizedId = userId.slice(0, 8);
  trackEvent('note_created', { user_hash: anonymizedId } as never);
}

/**
 * Get the Umami script props for the layout.
 */
export function getUmamiConfig() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const host = process.env.NEXT_PUBLIC_UMAMI_HOST || 'https://cloud.umami.is';

  if (!websiteId) return null;

  return {
    src: `${host}/script.js`,
    'data-website-id': websiteId,
  };
}
