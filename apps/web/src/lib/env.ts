/**
 * Centralized environment configuration.
 * Single source of truth for all env-dependent behavior.
 */

export type AppEnv = 'development' | 'staging' | 'production';

/** Current environment — defaults to 'development' if not set. */
export const APP_ENV: AppEnv =
  (process.env.NEXT_PUBLIC_APP_ENV as AppEnv) || 'development';

/** Base URL of the app. */
export const APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/** True when running in production. */
export const IS_PROD = APP_ENV === 'production';

/** True when running in staging. */
export const IS_STAGING = APP_ENV === 'staging';

/** True when running in development (local). */
export const IS_DEV = APP_ENV === 'development';

/** Debug mode — extra logging, dev tools. */
export const IS_DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

/* -------------------------------------------------------------------------- */
/*  Feature Flags                                                             */
/* -------------------------------------------------------------------------- */

export const features = {
  /** Cloud sync via Supabase. */
  cloudSync: process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC !== 'false',

  /** Xendit payment / subscription. */
  payments: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS !== 'false',

  /** Umami analytics. */
  analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
} as const;

/* -------------------------------------------------------------------------- */
/*  Environment Label (for UI badges)                                         */
/* -------------------------------------------------------------------------- */

export function getEnvLabel(): string | null {
  if (IS_PROD) return null; // No badge in production
  if (IS_STAGING) return 'STAGING';
  return 'DEV';
}

export function getEnvColor(): string {
  if (IS_STAGING) return '#f59e0b'; // amber
  return '#22c55e'; // green for dev
}
