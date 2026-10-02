import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
export async function POST(req) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data: { user } } = await sb.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (p?.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  const { email, password } = await req.json();
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await sb.from('profiles').update({ role: 'staff' }).eq('id', data.user.id);
  return NextResponse.json({ ok: true });
}
