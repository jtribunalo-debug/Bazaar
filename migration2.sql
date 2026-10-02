-- Run in Supabase > SQL Editor (after schema.sql)
alter table products add column if not exists images text[] default '{}';
alter table orders alter column user_id drop not null;
alter table orders add column if not exists payment_method text not null default 'cash' check (payment_method in ('online','cash'));
alter table orders add column if not exists payment_status text not null default 'unpaid' check (payment_status in ('paid','unpaid'));
alter table orders add column if not exists source text not null default 'website' check (source in ('website','in_store'));
alter table orders add column if not exists customer_name text;

create table if not exists reviews(id uuid primary key default gen_random_uuid(), product_id uuid references products on delete cascade not null, user_id uuid references auth.users not null, author text, rating int not null check (rating between 1 and 5), comment text, created_at timestamptz default now(), unique(product_id,user_id));
alter table reviews enable row level security;
create policy "read reviews" on reviews for select using (true);
create policy "add own review" on reviews for insert with check (user_id=auth.uid());
create policy "delete own or staff review" on reviews for delete using (user_id=auth.uid() or is_staff());

create policy "staff read profiles" on profiles for select using (is_staff());
drop policy if exists "buyer insert order" on orders; -- orders now go through place_order() so stock & prices are enforced

create or replace function place_order(p_items jsonb, p_method text default 'cash', p_status text default 'unpaid', p_source text default 'website', p_customer text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare it jsonb; prod products%rowtype; tot numeric:=0; lines jsonb:='[]'::jsonb; oid uuid; q int; uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  if p_method not in ('online','cash') then raise exception 'Invalid payment method'; end if;
  if not is_staff() then p_source:='website'; p_status:='unpaid'; end if;
  if p_source='in_store' then uid:=null; end if;
  for it in select value from jsonb_array_elements(p_items) loop
    q:=(it->>'qty')::int;
    select * into prod from products where id=(it->>'id')::uuid for update;
    if not found or q<1 or prod.stock<q then raise exception 'Not enough stock for %', coalesce(prod.name,'an item'); end if;
    update products set stock=stock-q where id=prod.id;
    tot:=tot+prod.price*q;
    lines:=lines||jsonb_build_array(jsonb_build_object('id',prod.id,'name',prod.name,'price',prod.price,'qty',q));
  end loop;
  insert into orders(user_id,items,total,payment_method,payment_status,source,customer_name)
  values(uid,lines,tot,p_method,p_status,p_source,p_customer) returning id into oid;
  return oid;
end $$;
