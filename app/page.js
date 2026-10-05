'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { getCart, saveCart } from '../lib/cart';
import { roleLabel, isStaffRole } from '../lib/roles';
const money = (n) => '$' + Number(n).toFixed(2);
export default function Store() {
  const router = useRouter(); const { user, role } = useAuth();
  const [products, setProducts] = useState([]); const [q, setQ] = useState(''); const [cat, setCat] = useState('All');
  const [cart, setCart] = useState({}); const [open, setOpen] = useState(false); const [msg, setMsg] = useState(''); const [pay, setPay] = useState('cash');
  const loadProducts = () => supabase.from('products').select('*').order('created_at', { ascending: false }).then(({ data }) => setProducts(data || []));
  useEffect(() => { loadProducts(); setCart(getCart()); }, []);
  const update = (fn) => setCart((c) => { const n = fn(c); saveCart(n); return n; });
  const cats = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];
  const shown = useMemo(() => products.filter((p) => (cat === 'All' || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase())), [products, q, cat]);
  const lines = products.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id] }));
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0); const count = lines.reduce((s, l) => s + l.qty, 0);
  const add = (p, d = 1) => update((c) => { const n = { ...c, [p.id]: Math.min((c[p.id] || 0) + d, p.stock) }; if (n[p.id] <= 0) delete n[p.id]; return n; });
  async function checkout() {
    if (!user) return router.push('/login');
    const { error } = await supabase.rpc('place_order', { p_items: lines.map((l) => ({ id: l.id, qty: l.qty })), p_method: pay });
    if (error) return setMsg('⚠️ ' + error.message);
    update(() => ({})); setOpen(false); setMsg('🎉 Order placed! Track it under "My orders".'); loadProducts();
  }
  return (<>
    <section className="hero"><h1>Discover amazing deals</h1><p>Millions of reasons to smile — shop trending products today.</p>
      <input className="search" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} /></section>
    <div className="cats">{cats.map((c) => <button key={c} className={'chip' + (c === cat ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}</div>
    {isStaffRole(role) && <div className="staffbar"><span>You're signed in as <b>{roleLabel(role)}</b> — you can manage the shop.</span><Link href="/admin" className="btn sm">+ Add product</Link></div>}
    {role === 'buyer' && <div className="staffbar cust"><span>You're signed in as a <b>Customer</b> — browse, buy and track your orders.</span><Link href="/orders" className="btn sm ghost">My orders</Link></div>}
    {msg && <div className="toast" onClick={() => setMsg('')}>{msg}</div>}
    <main className="grid">
      {shown.map((p) => { const cover = p.images?.[0] || p.image_url; return (<article key={p.id} className="card">
        <Link href={'/product/' + p.id} className="img">{cover ? <img src={cover} alt={p.name} /> : <span>📦</span>}</Link>
        <div className="body"><Link href={'/product/' + p.id}><h3>{p.name}</h3></Link><p className="muted">{p.description}</p>
          <div className="row"><b className="price">{money(p.price)}</b>
            <button className="btn sm" disabled={p.stock <= 0} onClick={() => add(p)}>{p.stock > 0 ? 'Add to cart' : 'Sold out'}</button></div></div>
      </article>); })}
      {!shown.length && <p className="muted center">No products yet.</p>}
    </main>
    <button className="fab" onClick={() => setOpen(true)}>🛒 {count}</button>
    {open && <div className="overlay" onClick={() => setOpen(false)}><aside className="drawer" onClick={(e) => e.stopPropagation()}>
      <h2>Your cart</h2>
      {lines.map((l) => <div key={l.id} className="line"><span>{l.name}</span>
        <span><button className="q" onClick={() => add(l, -1)}>−</button> {l.qty} <button className="q" onClick={() => add(l)}>+</button></span><b>{money(l.qty * l.price)}</b></div>)}
      {!lines.length && <p className="muted">Your cart is empty.</p>}
      <div className="row tot"><b>Total</b><b>{money(total)}</b></div>
      <label className="muted sm">Payment method</label>
      <select value={pay} onChange={(e) => setPay(e.target.value)}><option value="cash">Cash (on delivery / pickup)</option><option value="online">Online payment</option></select>
      <br /><br /><button className="btn full" disabled={!lines.length} onClick={checkout}>{user ? 'Place order' : 'Sign in to checkout'}</button>
    </aside></div>}
  </>);
}
