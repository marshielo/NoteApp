import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const sortBy = searchParams.get('sort') || 'created_at';
    const perPage = 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const admin = createAdminClient();

    let query = admin
      .from('profiles')
      .select('id, email, display_name, avatar_url, role, subscription_status, subscription_plan, notes_count, tags_count, created_at, last_active_at', { count: 'exact' });

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role && ['free', 'pro', 'admin'].includes(role)) {
      query = query.eq('role', role);
    }

    const validSorts = ['created_at', 'last_active_at', 'notes_count'];
    const sortField = validSorts.includes(sortBy) ? sortBy : 'created_at';

    query = query.order(sortField, { ascending: false }).range(from, to);

    const { data: users, count } = await query;

    return NextResponse.json({
      users: users || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / perPage),
    });
  } catch (err) {
    console.error('[admin/users] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
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

    const body = await request.json();
    const { targetUserId, action, value } = body as {
      targetUserId: string;
      action: 'change_role';
      value: string;
    };

    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const admin = createAdminClient();

    if (action === 'change_role') {
      if (!['free', 'pro', 'admin'].includes(value)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      // Get current role for audit
      const { data: target } = await admin
        .from('profiles')
        .select('role')
        .eq('id', targetUserId)
        .single();

      await admin
        .from('profiles')
        .update({ role: value })
        .eq('id', targetUserId);

      // Audit log
      await admin.from('admin_audit_log').insert({
        admin_id: user.id,
        action: 'change_role',
        target_user_id: targetUserId,
        details: { from: target?.role, to: value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/users] PATCH Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
