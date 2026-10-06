import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

const toRow = (o, emails) => ({
  id: o.id,
  date: new Date(o.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
  source: o.source === 'in_store' ? 'In-store' : 'Website',
  customer: o.customer_name || emails[o.user_id] || 'Guest',
  items: (o.items || []).map((i) => `${i.qty}x ${i.name}`).join(', '),
  total: Number(o.total), method: o.payment_method, payment: o.payment_status, status: o.status,
});

async function push(rows) {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!url) throw new Error('GOOGLE_SHEET_WEBHOOK_URL is not set in Vercel');
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ secret: process.env.GOOGLE_SHEET_SECRET, rows }), redirect: 'follow' });
  const t = await r.text(); let j;
  try { j = JSON.parse(t); } catch { throw new Error('Sheet script did not return JSON. Check the Apps Script deployment is set to "Anyone".'); }
  if (!j.ok) throw new Error(j.error || 'Sheet error');
}

export async function POST(req) {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  try {
    let orders; const hook = req.headers.get('x-webhook-secret');
    if (hook) { // real-time: called by a Supabase Database Webhook
      if (!process.env.SHEETS_WEBHOOK_SECRET || hook !== process.env.SHEETS_WEBHOOK_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const body = await req.json(); if (!body.record) return NextResponse.json({ ok: true, skipped: true });
      orders = [body.record];
    } else { // push button: staff/admin only
      const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
      const { data: { user } } = await db.auth.getUser(token);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { data: p } = await db.from('profiles').select('role').eq('id', user.id).single();
      if (!['staff', 'admin'].includes(p?.role)) return NextResponse.json({ error: 'Staff only' }, { status: 403 });
      orders = (await db.from('orders').select('*').order('created_at', { ascending: true }).limit(5000)).data || [];
    }
    const ids = [...new Set(orders.map((o) => o.user_id).filter(Boolean))]; const emails = {};
    if (ids.length) (await db.from('profiles').select('id,email').in('id', ids)).data?.forEach((x) => (emails[x.id] = x.email));
    if (orders.length) await push(orders.map((o) => toRow(o, emails)));
    return NextResponse.json({ ok: true, count: orders.length });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
