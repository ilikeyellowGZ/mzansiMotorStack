create table public.assistant_conversations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  thread_id uuid not null,
  messages jsonb not null default '[]'::jsonb,
  draft text not null default '',
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  primary key (user_id, thread_id),
  constraint assistant_messages_bounded check (jsonb_typeof(messages) = 'array' and jsonb_array_length(messages) <= 40 and length(messages::text) <= 40000),
  constraint assistant_draft_bounded check (length(draft) <= 800)
);
create index assistant_conversations_expiry_idx on public.assistant_conversations(expires_at);
create or replace function public.set_assistant_conversation_expiry()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.expires_at := now() + interval '30 days';
  return new;
end $$;
create trigger assistant_conversation_expiry before insert or update on public.assistant_conversations
  for each row execute function public.set_assistant_conversation_expiry();
alter table public.assistant_conversations enable row level security;
create policy assistant_own_read on public.assistant_conversations for select to authenticated
  using (user_id = (select private.current_profile_id()) and expires_at > now());
create policy assistant_own_insert on public.assistant_conversations for insert to authenticated
  with check (user_id = (select private.current_profile_id()));
create policy assistant_own_update on public.assistant_conversations for update to authenticated
  using (user_id = (select private.current_profile_id()))
  with check (user_id = (select private.current_profile_id()));
create policy assistant_own_delete on public.assistant_conversations for delete to authenticated
  using (user_id = (select private.current_profile_id()));
revoke all on public.assistant_conversations from anon, authenticated;
grant select, insert, update (messages, draft, updated_at, expires_at), delete
  on public.assistant_conversations to authenticated;
grant select, insert, update, delete on public.assistant_conversations to service_role;

-- Contact requests are write-only through the Edge Function. No browser role can
-- browse other visitors' names, emails, or conversation summaries.
create table public.assistant_enquiries (
  request_id uuid primary key,
  kind text not null check (kind in ('demo', 'person', 'assisted_setup', 'other')),
  name text not null check (length(trim(name)) between 2 and 120),
  email text not null check (length(trim(email)) between 3 and 254),
  dealership text not null check (length(trim(dealership)) between 2 and 120),
  summary text not null check (length(trim(summary)) between 5 and 2000),
  status text not null default 'received' check (status in ('received', 'in_progress', 'closed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);
create index assistant_enquiries_expiry_idx on public.assistant_enquiries(expires_at);
alter table public.assistant_enquiries enable row level security;
revoke all on public.assistant_enquiries from anon, authenticated;
grant select, insert, update, delete on public.assistant_enquiries to service_role;

create table public.assistant_rate_limits (
  key_hash text primary key,
  window_start timestamptz not null default now(),
  request_count integer not null default 1
);
create index assistant_rate_limits_window_idx on public.assistant_rate_limits(window_start);
alter table public.assistant_rate_limits enable row level security;
revoke all on public.assistant_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.assistant_rate_limits to service_role;

create or replace function public.reserve_assistant_rate_limit(p_key_hash text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_count integer;
begin
  if length(p_key_hash) <> 64 or p_limit not between 1 and 60 or p_window_seconds not between 60 and 86400 then
    raise exception 'Invalid rate limit parameters';
  end if;
  insert into public.assistant_rate_limits(key_hash, window_start, request_count)
  values (p_key_hash, now(), 1)
  on conflict (key_hash) do update set
    window_start = case when public.assistant_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
      then now() else public.assistant_rate_limits.window_start end,
    request_count = case when public.assistant_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
      then 1 else public.assistant_rate_limits.request_count + 1 end
  returning request_count into v_count;
  return v_count <= p_limit;
end $$;
revoke all on function public.reserve_assistant_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.reserve_assistant_rate_limit(text, integer, integer) to service_role;

create or replace function public.purge_assistant_expired()
returns void language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.assistant_conversations where expires_at <= now();
  delete from public.assistant_enquiries where expires_at <= now();
  delete from public.assistant_rate_limits where window_start < now() - interval '2 days';
end $$;
revoke all on function public.purge_assistant_expired() from public, anon, authenticated;
grant execute on function public.purge_assistant_expired() to service_role;
