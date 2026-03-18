import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/subscription — fetch current user's subscription info.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get profile with subscription info
    const { data: profile } = await admin
      .from('profiles')
      .select('role, subscription_status, subscription_plan, trial_started_at, trial_ends_at')
      .eq('id', user.id)
      .single();

    // Get active subscription
    const { data: subscription } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trial', 'canceled', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      profile: profile || { role: 'free', subscription_status: 'none' },
      subscription: subscription || null,
    });
  } catch (err) {
    console.error('[subscription] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

/**
 * DELETE /api/subscription — cancel active subscription.
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = (body as { reason?: string }).reason || 'User requested cancellation';

    const admin = createAdminClient();

    // Find active subscription
    const { data: subscription } = await admin
      .from('subscriptions')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Update subscription to canceled (access until expires_at)
    await admin
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: now,
        cancel_reason: reason,
      })
      .eq('id', subscription.id);

    // Update profile status to canceled
    await admin
      .from('profiles')
      .update({
        subscription_status: 'canceled',
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Langganan dibatalkan. Akses Pro tetap aktif hingga periode berakhir.',
      expiresAt: subscription.expires_at,
    });
  } catch (err) {
    console.error('[subscription/cancel] Error:', err);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
