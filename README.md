# Shopora — deploy guide
1. supabase.com → New project. Open SQL Editor, paste & run `supabase/schema.sql`.
2. Supabase > Authentication > Providers > Email: turn OFF "Confirm email" for easy testing (optional).
3. Copy URL, anon key and service_role key (Settings > API) into Vercel env vars (see `.env.example`).
4. Push this folder to GitHub → Import into Vercel → Deploy.
5. Visit /login, sign up with YOUR email, then run in SQL Editor:
   `update profiles set role='admin' where email='YOUR@EMAIL.COM';`
6. Refresh → "Dashboard" appears. Add products, and create staff logins there.

7. Run `supabase/migration2.sql` in the SQL Editor (adds reviews, multi-image, payments, stock-safe checkout).
