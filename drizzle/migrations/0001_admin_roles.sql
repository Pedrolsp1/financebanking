create type public.app_role as enum ('owner', 'admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role in ('owner','admin')) $$;

create policy own_or_admin_select on public.user_roles for select to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- First account becomes owner
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'owner') then
    insert into public.user_roles(user_id, role) values (new.id, 'owner');
  end if;
  return new;
end $$;

create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.handle_new_user_role();

-- Admin: list users
create or replace function public.admin_list_users()
returns table (id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, role text)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden'; end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at,
      coalesce((select r.role::text from public.user_roles r where r.user_id = u.id
        order by case r.role when 'owner' then 0 when 'admin' then 1 else 2 end limit 1), 'user')
    from auth.users u order by u.created_at;
end $$;

-- Owner only: grant/revoke admin
create or replace function public.owner_set_admin(_target uuid, _make_admin boolean)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'owner') then raise exception 'forbidden'; end if;
  if _target = auth.uid() then raise exception 'cannot change own role'; end if;
  if _make_admin then
    insert into public.user_roles(user_id, role) values (_target, 'admin') on conflict do nothing;
  else
    delete from public.user_roles where user_id = _target and role = 'admin';
  end if;
end $$;

revoke execute on function public.admin_list_users() from anon, public;
revoke execute on function public.owner_set_admin(uuid, boolean) from anon, public;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.owner_set_admin(uuid, boolean) to authenticated;