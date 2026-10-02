'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/useAuth';
import { getCart, saveCart } from '../../../lib/cart';
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
export default function Product() {
  const { id } = useParams(); const { user } = useAuth();
  const [p, setP] = useState(null); const [reviews, setReviews] = useState([]); const [i, setI] = useState(0); const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState(''); const [rating, setRating] = useState(5); const [comment, setComment] = useState('');
  const loadReviews = async () => setReviews((await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false })).data || []);
  useEffect(() => { supabase.from('products').select('*').eq('id', id).single().then(({ data }) => setP(data)); loadReviews(); }, [id]);
  if (!p) return <p className="center muted pad">Loading…</p>;
  const imgs = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  function addToCart() { const c = getCart(); c[p.id] = Math.min((c[p.id] || 0) + qty, p.stock); saveCart(c); setMsg('✅ Added to cart — open it from the store page.'); }
  async function submitReview() {
    const { error } = await supabase.from('reviews').insert({ product_id: id, user_id: user.id, author: user.email.split('@')[0], rating, comment });
    if (error) return setMsg(error.code === '23505' ? 'You already reviewed this product.' : error.message);
    setComment(''); loadReviews();
  }
  async function delReview(rid) { await supabase.from('reviews').delete().eq('id', rid); loadReviews(); }
  return (<div className="pdp">
    <Link href="/" className="muted">← Back to store</Link>
    <div className="pdpgrid">
      <div><div className="bigimg">{imgs[i] ? <img src={imgs[i]} alt={p.name} /> : <span>📦</span>}</div>
        <div className="thumbs">{imgs.map((u, k) => <img key={u} src={u} alt="" className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}</div></div>
      <div className="info">
        <span className="pill">{p.category || 'General'}</span><h1>{p.name}</h1>
        <div className="stars">{stars(Math.round(avg))} <span className="muted sm">{reviews.length ? `${avg.toFixed(1)} (${reviews.length})` : 'No reviews yet'}</span></div>
        <div className="price big">${Number(p.price).toFixed(2)}</div>
        <p>{p.description}</p>
        <p className={p.stock > 0 ? 'ok' : 'err'}>{p.stock > 0 ? `${p.stock} in stock` : 'Sold out'}</p>
        {p.stock > 0 && <div className="row2"><input type="number" min="1" max={p.stock} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} style={{ width: 90 }} />
          <button className="btn" onClick={addToCart}>Add to cart</button></div>}
        {msg && <p className="muted">{msg}</p>}
      </div>
    </div>
    <section className="panel"><h2>Customer reviews</h2>
      {user ? <div className="form"><select value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{stars(n)}</option>)}</select>
        <textarea placeholder="Share your thoughts…" value={comment} onChange={(e) => setComment(e.target.value)} /><button className="btn" onClick={submitReview}>Post review</button></div>
        : <p className="muted"><Link href="/login">Sign in</Link> to write a review.</p>}
      {reviews.map((r) => <div key={r.id} className="line"><span><b>{r.author}</b> <span className="stars">{stars(r.rating)}</span><br /><span className="muted">{r.comment}</span></span>
        {(user?.id === r.user_id) && <button className="btn ghost sm" onClick={() => delReview(r.id)}>Delete</button>}</div>)}
    </section>
  </div>);
}
