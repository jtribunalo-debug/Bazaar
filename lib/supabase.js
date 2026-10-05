import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvfahuhlceehwgoemarl.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_cAte9btEKYF8H-padPzdLA_yFnYcC8a'
);
