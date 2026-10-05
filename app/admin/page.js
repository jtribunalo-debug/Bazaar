'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/useAuth';
import { roleLabel } from '../../lib/roles';
import { peso } from '../../lib/money';
const blank = { name: '', description: '', price: '', category: '', stock: 10 };
const blankSale = { lines: [], customer: '', method: 'cash', status: 'paid' };
export default function Admin() {
  const { user, role, token, loading } = useAuth();
  const [f, setF] = useState(blank); const [editing, setEditing] = useState(null); const [imgs, setImgs] = useState([]); const [files, setFiles] = useState([]); const [fk, setFk] = useState(0);
  const [products, setProducts] = useState([]); const [orders, setOrders] = useState([]); const [emails, setEmails] = useState({});
  const [staff, setStaff] = useState({ email: '', password: '' }); const [msg, setMsg] = useState('');
  const [sale, setSale] = useState(blankSale); const [sp, setSp] = useState(''); const [sq, setSq] = useState(1);
  const isStaff = role === 'staff' || role === 'admin';
  const load = async () => {
    setProducts((await supabase.from('products').select('*').order('created_at', { ascending: false })).data || []);
    setOrders((await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200)).data || []);
    const pr = (await supabase.from('profiles').select('id,email')).data || []; setEmails(Object.fromEntries(pr.map((x) => [x.id, x.email])));
  };
  useEffect(() => { if (isStaff) load(); }, [isStaff]);
  if (loading) return <p className="center muted pad">Loading…</p>;
  if (!isStaff) return <p className="center muted pad">Staff access only. {!user && <a href="/login">Sign in</a>}</p>;
  const reset = () => { setF(blank); setEditing(null); setImgs([]); setFiles([]); setFk(fk + 1); };
  async function saveProduct() {
    setMsg(''); const urls = [...imgs];
    for (const file of files) {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${file.name.replace(/[^\w.-]/g, '_')}`;
      const up = await supabase.storage.from('products').upload(path, file); if (up.error) return setMsg(up.error.message);
      urls.push(supabase.storage.from('products').getPublicUrl(path).data.publicUrl);
    }
    const row = { name: f.name, description: f.description, category: f.category, price: Number(f.price), stock: Number(f.stock), images: urls, image_url: urls[0] || null };
    const { error } = editing ? await supabase.from('products').update(row).eq('id', editing) : await supabase.from('products').insert(row);
    if (error) return setMsg(error.message);
    reset(); setMsg(editing ? '✅ Product updated' : '✅ Product added'); load();
  }
  function edit(p) { setEditing(p.id); setF({ name: p.name, description: p.description || '', price: p.price, category: p.category || '', stock: p.stock }); setImgs(p.images?.length ? p.images : p.image_url ? [p.image_url] : []); setFiles([]); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function del(id) { if (confirm('Delete this product?')) { await supabase.from('products').delete().eq('id', id); load(); } }
  async function patchOrder(o, patch) {
    if (patch.status === 'cancelled' && o.status !== 'cancelled')
      for (const it of o.items) { const p = products.find((x) => x.id === it.id); if (p) await supabase.from('products').update({ stock: p.stock + it.qty }).eq('id', p.id); }
    await supabase.from('orders').update(patch).eq('id', o.id); load();
  }
  async function createStaff() {
    const r = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(staff) });
    const j = await r.json(); setMsg(r.ok ? '✅ Staff account created' : j.error); if (r.ok) setStaff({ email: '', password: '' });
  }
  const addLine = () => { if (!sp) return; setSale({ ...sale, lines: [...sale.lines.filter((l) => l.id !== sp), { id: sp, qty: Number(sq) }] }); setSp(''); setSq(1); };
  async function recordSale() {
    const { error } = await supabase.rpc('place_order', { p_items: sale.lines, p_method: sale.method, p_status: sale.status, p_source: 'in_store', p_customer: sale.customer || null });
    if (error) return setMsg('⚠️ ' + error.message);
    setSale(blankSale); setMsg('✅ Sale recorded'); load();
  }
  const live = orders.filter((o) => o.status !== 'cancelled'); const sum = (fn) => live.filter(fn).reduce((s, o) => s + Number(o.total), 0);
  const stats = [['Paid', sum((o) => o.payment_status === 'paid')], ['Unpaid', sum((o) => o.payment_status === 'unpaid')], ['Cash collected', sum((o) => o.payment_status === 'paid' && o.payment_method === 'cash')], ['Online collected', sum((o) => o.payment_status === 'paid' && o.payment_method === 'online')]];
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (<div className="dash">
    <h1>Dashboard <span className={'role ' + role}>{roleLabel(role)}</span></h1>{msg && <div className="toast" onClick={() => setMsg('')}>{msg}</div>}
    <div className="stats">{stats.map(([k, v]) => <div className="stat" key={k}><span className="muted sm">{k}</span><b>{peso(v)}</b></div>)}</div>
    <section className="panel"><h2>{editing ? 'Edit product' : 'Add product'}</h2>
      <div className="form">
        <input placeholder="Name" value={f.name} onChange={set('name')} /><input placeholder="Category" value={f.category} onChange={set('category')} />
        <input placeholder="Price" type="number" value={f.price} onChange={set('price')} /><input placeholder="Stock" type="number" value={f.stock} onChange={set('stock')} />
        <textarea placeholder="Description" value={f.description} onChange={set('description')} />
        {imgs.length > 0 && <div className="thumbs">{imgs.map((u) => <span key={u} className="rm"><img src={u} alt="" /><button onClick={() => setImgs(imgs.filter((x) => x !== u))}>×</button></span>)}</div>}
        <label className="muted sm">Photos (select several; first one is the cover)</label>
        <input key={fk} type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
        <div className="row2"><button className="btn" onClick={saveProduct} disabled={!f.name || f.price === ''}>{editing ? 'Update product' : 'Save product'}</button>{editing && <button className="btn ghost" onClick={reset}>Cancel</button>}</div>
      </div></section>
    <section className="panel"><h2>Record a sale (in-store)</h2>
      <div className="form">
        <div className="row2"><select value={sp} onChange={(e) => setSp(e.target.value)}><option value="">Choose product…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} (₱{p.price}, stock {p.stock})</option>)}</select>
          <input type="number" min="1" value={sq} onChange={(e) => setSq(e.target.value)} style={{ width: 90 }} /><button className="btn ghost" onClick={addLine}>Add</button></div>
        {sale.lines.map((l) => <div className="line" key={l.id}><span>{products.find((p) => p.id === l.id)?.name}</span><span>× {l.qty}</span><button className="btn ghost sm" onClick={() => setSale({ ...sale, lines: sale.lines.filter((x) => x.id !== l.id) })}>Remove</button></div>)}
        <input placeholder="Customer name (optional)" value={sale.customer} onChange={(e) => setSale({ ...sale, customer: e.target.value })} />
        <div className="row2"><select value={sale.method} onChange={(e) => setSale({ ...sale, method: e.target.value })}><option value="cash">Cash</option><option value="online">Online</option></select>
          <select value={sale.status} onChange={(e) => setSale({ ...sale, status: e.target.value })}><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></div>
        <button className="btn" disabled={!sale.lines.length} onClick={recordSale}>Record sale</button>
      </div></section>
    {role === 'admin' && <section className="panel"><h2>Create staff login</h2>
      <div className="form"><input placeholder="Staff email" value={staff.email} onChange={(e) => setStaff({ ...staff, email: e.target.value })} />
        <input placeholder="Temporary password" value={staff.password} onChange={(e) => setStaff({ ...staff, password: e.target.value })} />
        <button className="btn" onClick={createStaff}>Create staff</button></div></section>}
    <section className="panel"><h2>Products ({products.length})</h2>
      {products.map((p) => <div className="line" key={p.id}><span>{(p.images?.[0] || p.image_url) && <img className="th" src={p.images?.[0] || p.image_url} alt="" />} {p.name}</span><span>₱{p.price} · stock {p.stock}</span>
        <span className="row2"><button className="btn ghost sm" onClick={() => edit(p)}>Edit</button><button className="btn ghost sm" onClick={() => del(p.id)}>Delete</button></span></div>)}</section>
    <section className="panel"><h2>Sales &amp; orders</h2>
      {orders.map((o) => <div className="order" key={o.id}>
        <div className="row"><span><b>{new Date(o.created_at).toLocaleString()}</b> · <span className="badge">{o.source === 'in_store' ? 'In-store' : 'Website'}</span> · {o.customer_name || emails[o.user_id] || 'Guest'}</span><b>{peso(o.total)}</b></div>
        <div className="muted sm">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</div>
        <div className="row2">
          <select value={o.status} onChange={(e) => patchOrder(o, { status: e.target.value })}>{['pending', 'packed', 'shipped', 'delivered', 'cancelled'].map((s) => <option key={s}>{s}</option>)}</select>
          <select value={o.payment_method} onChange={(e) => patchOrder(o, { payment_method: e.target.value })}><option value="cash">Cash</option><option value="online">Online</option></select>
          <select value={o.payment_status} onChange={(e) => patchOrder(o, { payment_status: e.target.value })}><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select>
        </div></div>)}</section>
  </div>);
}
