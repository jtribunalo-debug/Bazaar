'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
export default function Login() {
  const router = useRouter(); const [mode, setMode] = useState('in'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [msg, setMsg] = useState('');
  async function submit() {
    setMsg('');
    const { data, error } = mode === 'in' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);
    if (mode === 'up' && !data.session) return setMsg('Check your email to confirm your account, then sign in.');
    router.push('/');
  }
  return (<div className="authwrap"><div className="authbox">
    <h2>{mode === 'in' ? 'Welcome back' : 'Create your account'}</h2>
    <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input placeholder="Password (min 6 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
    {msg && <p className="err">{msg}</p>}
    <button className="btn full" onClick={submit}>{mode === 'in' ? 'Sign in' : 'Sign up'}</button>
    <p className="muted center">{mode === 'in' ? 'New here?' : 'Have an account?'} <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'in' ? 'up' : 'in'); }}>{mode === 'in' ? 'Create account' : 'Sign in'}</a></p>
    <p className="muted center sm">Staff accounts are created by the store admin.</p>
  </div></div>);
}
