import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Verify admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Parallel queries
    const [
      totalUsersRes,
      proUsersRes,
      recentSignupsRes,
      recentPaymentsRes,
      revenueMtdRes,
    ] = await Promise.all([
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'pro'),
      admin.from('profiles')
        .select('id, email, display_name, role, subscription_status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      admin.from('payment_events')
        .select('id, user_id, provider, event_type, external_id, payload, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      admin.from('subscriptions')
        .select('amount')
        .eq('status', 'active')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]);

    const revenueMtd = (revenueMtdRes.data || []).reduce((sum, s) => sum + (s.amount || 0), 0);

    return NextResponse.json({
      totalUsers: totalUsersRes.count || 0,
      proUsers: proUsersRes.count || 0,
      revenueMtd,
      recentSignups: recentSignupsRes.data || [],
      recentPayments: recentPaymentsRes.data || [],
    });
  } catch (err) {
    console.error('[admin/stats] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
