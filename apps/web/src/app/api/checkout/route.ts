import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInvoice } from '@/lib/xendit';
import { generateExternalId, calculateTrialExpiry, PLANS, TRIAL_DURATION_DAYS, type SubscriptionPlan } from '@/lib/subscription';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, action } = body as { plan?: SubscriptionPlan; action?: 'trial' };

    // Handle trial activation
    if (action === 'trial') {
      return handleTrialActivation(user.id, user.email!);
    }

    // Handle payment checkout
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    const externalId = generateExternalId(user.id, plan);
    const origin = request.headers.get('origin') || '';

    const invoice = await createInvoice({
      externalId,
      amount: planConfig.price,
      description: `Catatan ${planConfig.name}`,
      payerEmail: user.email!,
      successRedirectUrl: `${origin}/upgrade?status=success`,
      failureRedirectUrl: `${origin}/upgrade?status=failed`,
      metadata: {
        user_id: user.id,
        plan,
      },
    });

    return NextResponse.json({
      invoiceUrl: invoice.invoice_url,
      invoiceId: invoice.id,
      externalId: invoice.external_id,
    });
  } catch (err) {
    console.error('[checkout] Error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

async function handleTrialActivation(userId: string, email: string) {
  const admin = createAdminClient();

  // Check if user already had a trial
  const { data: profile } = await admin
    .from('profiles')
    .select('trial_started_at, subscription_status')
    .eq('id', userId)
    .single();

  if (profile?.trial_started_at) {
    return NextResponse.json(
      { error: 'Trial sudah pernah digunakan' },
      { status: 400 }
    );
  }

  if (profile?.subscription_status === 'active') {
    return NextResponse.json(
      { error: 'Kamu sudah berlangganan Pro' },
      { status: 400 }
    );
  }

  const now = new Date();
  const trialEnds = calculateTrialExpiry(now);

  // Update profile with trial
  await admin
    .from('profiles')
    .update({
      role: 'pro',
      subscription_status: 'trial',
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnds.toISOString(),
    })
    .eq('id', userId);

  // Create subscription record
  await admin.from('subscriptions').insert({
    user_id: userId,
    plan: 'monthly',
    status: 'trial',
    amount: 0,
    payment_provider: 'trial',
    started_at: now.toISOString(),
    expires_at: trialEnds.toISOString(),
  });

  return NextResponse.json({
    success: true,
    trialEndsAt: trialEnds.toISOString(),
    message: `Trial Pro aktif selama ${TRIAL_DURATION_DAYS} hari`,
  });
}
