'use client';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
export default function Header() {
  const { user, role } = useAuth();
  return (
    <header className="hdr">
      <Link href="/" className="logo">🛍️ Shopora</Link>
      <nav>
        {user && <Link href="/orders" className="pill">My orders</Link>}
        {(role === 'staff' || role === 'admin') && <Link href="/admin" className="pill">Dashboard</Link>}
        {user ? <><span className="muted hide">{user.email}</span><button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sign out</button></>
              : <Link href="/login" className="btn">Sign in</Link>}
      </nav>
    </header>
  );
}
