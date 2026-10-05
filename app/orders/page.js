'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/useAuth';
export default function Orders() {
  const { user, loading } = useAuth(); const [orders, setOrders] = useState(null);
  useEffect(() => { if (user) supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setOrders(data || [])); }, [user]);
  if (loading) return <p className="center muted pad">Loading…</p>;
  if (!user) return <p className="center muted pad"><Link href="/login">Sign in</Link> to see your orders.</p>;
  return (<div className="dash"><h1>My orders</h1>
    {orders && !orders.length && <p className="muted">No orders yet. <Link href="/">Start shopping</Link></p>}
    {orders?.map((o) => <section className="panel" key={o.id}>
      <div className="row"><b>{new Date(o.created_at).toLocaleString()}</b><span className={'badge ' + o.status}>{o.status}</span></div>
      {o.items.map((it, k) => <div className="line" key={k}><Link href={'/product/' + it.id}>{it.name}</Link><span>{it.qty} × ${Number(it.price).toFixed(2)}</span></div>)}
      <div className="row tot"><span className="muted">{o.payment_method === 'cash' ? 'Cash' : 'Online'} · <span className={'badge ' + o.payment_status}>{o.payment_status}</span></span><b>${Number(o.total).toFixed(2)}</b></div>
    </section>)}
  </div>);
}
