import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client using the service role key.
 * Only for server-side use (API routes, webhooks).
 * Bypasses RLS policies.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}
