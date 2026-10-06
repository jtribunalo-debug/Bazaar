'use client';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { roleLabel, isStaffRole } from '../lib/roles';
export default function Header() {
  const { user, role } = useAuth();
  return (
    <header className="hdr">
      <Link href="/" className="logo">🛍️ BUYpartite</Link>
      <nav>
        {user && <Link href="/orders" className="pill">My orders</Link>}
        {isStaffRole(role) && <Link href="/admin" className="pill">Dashboard</Link>}
        {user ? <>
          <span className="who hide">{user.email}</span>
          {role && <span className={'role ' + role}>{roleLabel(role)}</span>}
          <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sign out</button></>
              : <Link href="/login" className="btn">Sign in</Link>}
      </nav>
    </header>
  );
}
