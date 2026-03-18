/**
 * Subscription lifecycle helpers.
 * Manages state transitions: free → trial → active → past_due → canceled → expired.
 */

export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
export type SubscriptionPlan = 'monthly' | 'yearly';

export const PLANS = {
  monthly: {
    name: 'Pro Bulanan',
    price: 39_000,
    interval: 'bulan' as const,
    durationDays: 30,
  },
  yearly: {
    name: 'Pro Tahunan',
    price: 349_000,
    interval: 'tahun' as const,
    durationDays: 365,
    badge: 'Paling Hemat',
    savings: '25%',
  },
} as const;

export const TRIAL_DURATION_DAYS = 7;

export const PRO_STATUSES: SubscriptionStatus[] = ['trial', 'active', 'canceled'];

/**
 * Whether a subscription status grants Pro access.
 * - trial: yes (within trial period)
 * - active: yes
 * - canceled: yes (until period ends)
 * - past_due: yes (7-day grace)
 * - expired/none: no
 */
export function hasProAccess(status: SubscriptionStatus): boolean {
  return ['trial', 'active', 'canceled', 'past_due'].includes(status);
}

/**
 * Generate a unique external ID for Xendit invoice.
 */
export function generateExternalId(userId: string, plan: SubscriptionPlan): string {
  const ts = Date.now();
  return `catatan_${plan}_${userId.slice(0, 8)}_${ts}`;
}

/**
 * Calculate subscription expiry date from start.
 */
export function calculateExpiryDate(plan: SubscriptionPlan, startDate?: Date): Date {
  const start = startDate || new Date();
  const days = PLANS[plan].durationDays;
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Calculate trial expiry date.
 */
export function calculateTrialExpiry(startDate?: Date): Date {
  const start = startDate || new Date();
  return new Date(start.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Format price in IDR.
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date to Indonesian locale string.
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Check if a subscription/trial has expired.
 */
export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Get human-readable status label.
 */
export function getStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    none: 'Free',
    trial: 'Trial',
    active: 'Pro Aktif',
    past_due: 'Pembayaran Tertunda',
    canceled: 'Dibatalkan',
    expired: 'Kadaluarsa',
  };
  return labels[status];
}

/**
 * Get status badge color class.
 */
export function getStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    none: 'bg-bg-tertiary text-text-secondary',
    trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    past_due: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    canceled: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status];
}
