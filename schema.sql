-- Run this in Supabase > SQL Editor
create table profiles(id uuid primary key references auth.users on delete cascade, email text, role text not null default 'buyer' check (role in ('buyer','staff','admin')));
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,email) values(new.id,new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
create function is_staff() returns boolean language sql security definer set search_path=public as $$
select exists(select 1 from profiles where id=auth.uid() and role in ('staff','admin')) $$;

create table products(id uuid primary key default gen_random_uuid(), name text not null, description text, price numeric(10,2) not null, category text, image_url text, stock int default 0, created_at timestamptz default now());
create table orders(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users not null, items jsonb not null, total numeric(10,2) not null, status text default 'pending', created_at timestamptz default now());

alter table profiles enable row level security; alter table products enable row level security; alter table orders enable row level security;
create policy "own profile" on profiles for select using (id=auth.uid());
create policy "read products" on products for select using (true);
create policy "staff write products" on products for all using (is_staff()) with check (is_staff());
create policy "buyer insert order" on orders for insert with check (user_id=auth.uid());
create policy "read own or staff orders" on orders for select using (user_id=auth.uid() or is_staff());
create policy "staff update orders" on orders for update using (is_staff());

insert into storage.buckets(id,name,public) values('products','products',true);
create policy "public read images" on storage.objects for select using (bucket_id='products');
create policy "staff upload images" on storage.objects for insert with check (bucket_id='products' and is_staff());
create policy "staff delete images" on storage.objects for delete using (bucket_id='products' and is_staff());

-- AFTER you sign up on the site with your email, make yourself admin:
-- update profiles set role='admin' where email='YOUR@EMAIL.COM';
