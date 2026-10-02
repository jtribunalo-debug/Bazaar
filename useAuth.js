'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
export function useAuth() {
  const [s, setS] = useState({ user: null, role: null, token: null, loading: true });
  useEffect(() => {
    const load = async (session) => {
      const user = session?.user ?? null;
      let role = null;
      if (user) { const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single(); role = data?.role ?? 'buyer'; }
      setS({ user, role, token: session?.access_token ?? null, loading: false });
    };
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { setTimeout(() => load(session), 0); });
    return () => sub.subscription.unsubscribe();
  }, []);
  return s;
}
