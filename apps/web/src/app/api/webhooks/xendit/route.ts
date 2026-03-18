import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature } from '@/lib/xendit';
import { calculateExpiryDate, type SubscriptionPlan } from '@/lib/subscription';
import type { XenditWebhookPayload } from '@/lib/xendit';

export async function POST(request: Request) {
  try {
    const callbackToken = request.headers.get('x-callback-token') || '';

    // Verify webhook authenticity
    if (!verifyWebhookSignature(callbackToken)) {
      console.error('[webhook/xendit] Invalid callback token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const payload: XenditWebhookPayload = await request.json();
    const admin = createAdminClient();

    // Extract user_id from external_id: catatan_{plan}_{userId8}_{timestamp}
    const parts = payload.external_id.split('_');
    if (parts.length < 4 || parts[0] !== 'catatan') {
      console.error('[webhook/xendit] Invalid external_id:', payload.external_id);
      return NextResponse.json({ error: 'Invalid external_id' }, { status: 400 });
    }

    const plan = parts[1] as SubscriptionPlan;
    const userIdPrefix = parts[2];

    // Find user by ID prefix
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email, subscription_status')
      .like('id', `${userIdPrefix}%`)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      console.error('[webhook/xendit] User not found for prefix:', userIdPrefix);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = profiles[0].id;

    // Log payment event (idempotency check)
    const { data: existing } = await admin
      .from('payment_events')
      .select('id')
      .eq('external_id', payload.id)
      .eq('processed', true)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ status: 'already_processed' });
    }

    if (payload.status === 'PAID') {
      await handlePaymentSuccess(admin, userId, plan, payload);
    } else if (payload.status === 'EXPIRED') {
      await handlePaymentExpired(admin, userId, payload);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[webhook/xendit] Error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  plan: SubscriptionPlan,
  payload: XenditWebhookPayload
) {
  const now = new Date();
  const expiresAt = calculateExpiryDate(plan, now);

  // Create subscription record
  const { data: subscription } = await admin
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan,
      status: 'active',
      amount: payload.amount,
      payment_provider: 'xendit',
      payment_external_id: payload.external_id,
      payment_method: payload.payment_method || payload.payment_channel || null,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  // Update profile to Pro
  await admin
    .from('profiles')
    .update({
      role: 'pro',
      subscription_status: 'active',
      subscription_plan: plan,
      payment_provider: 'xendit',
      payment_customer_id: payload.payer_email || null,
    })
    .eq('id', userId);

  // Log payment event
  await admin.from('payment_events').insert({
    subscription_id: subscription?.id || null,
    user_id: userId,
    provider: 'xendit',
    event_type: 'charge.success',
    external_id: payload.id,
    payload: payload as unknown as Record<string, unknown>,
    processed: true,
  });
}

async function handlePaymentExpired(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  payload: XenditWebhookPayload
) {
  // Log the failed/expired payment event
  await admin.from('payment_events').insert({
    user_id: userId,
    provider: 'xendit',
    event_type: 'charge.expired',
    external_id: payload.id,
    payload: payload as unknown as Record<string, unknown>,
    processed: true,
  });
}
