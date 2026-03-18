import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
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

    const admin = createAdminClient();
    const { data: configs } = await admin
      .from('platform_config')
      .select('*')
      .order('key');

    return NextResponse.json({ configs: configs || [] });
  } catch (err) {
    console.error('[admin/config] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
    const { key, value } = body as { key: string; value: unknown };

    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get old value for audit
    const { data: oldConfig } = await admin
      .from('platform_config')
      .select('value')
      .eq('key', key)
      .single();

    await admin
      .from('platform_config')
      .update({
        value: value as never,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key);

    // Audit log
    await admin.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'update_config',
      details: { key, old_value: oldConfig?.value, new_value: value },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/config] PUT Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
