-- Clerk is the identity provider. Internal UUIDs remain the stable user key
-- referenced by existing dealership records.
do $$
begin
  if exists (select 1 from auth.users limit 1) then
    raise exception 'Clerk cutover stopped: auth.users is not empty. Prepare and approve a verified account-activation mapping before applying this migration.';
  end if;
end $$;

alter table public.profiles
  alter column id set default gen_random_uuid(),
  add column clerk_user_id text,
  add column email text,
  add column email_verified_at timestamptz;
create unique index profiles_clerk_user_id_uidx
  on public.profiles(clerk_user_id) where clerk_user_id is not null;

-- Repoint auth.users foreign keys to the internal profile key. This retains
-- every current UUID and the existing data relationships during cutover.
do $$
declare
  fk record;
  column_name text;
  delete_rule text;
begin
  for fk in
    select c.oid, c.conname, c.conrelid, c.conkey, c.confdeltype,
           c.conrelid::regclass as relation_name
    from pg_constraint c
    where c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass
  loop
    select a.attname into column_name
    from unnest(fk.conkey) with ordinality as key(attnum, ord)
    join pg_attribute a on a.attrelid = fk.conrelid and a.attnum = key.attnum
    where key.ord = 1;
    delete_rule := case fk.confdeltype
      when 'c' then ' cascade'
      when 'n' then ' set null'
      when 'd' then ' set default'
      when 'r' then ' restrict'
      else ''
    end;
    execute format('alter table %s drop constraint %I', fk.relation_name, fk.conname);
    if fk.conrelid = 'public.profiles'::regclass then
      continue;
    end if;
    execute format('alter table %s add constraint %I foreign key (%I) references public.profiles(id)%s',
      fk.relation_name, left(fk.conname || '_clerk_profile_fk', 63), column_name, delete_rule);
  end loop;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.clerk_user_id = (select auth.jwt() ->> 'sub')
  limit 1;
$$;
revoke all on function private.current_profile_id() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_profile_id() to authenticated;

create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select private.current_profile_id())
      and m.status = 'active'
  );
$$;
create or replace function public.is_organization_manager(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select private.current_profile_id())
      and m.status = 'active'
      and m.role in ('owner', 'manager')
  );
$$;
create or replace function public.is_organization_owner(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select private.current_profile_id())
      and m.status = 'active'
      and m.role = 'owner'
  );
$$;
create or replace function public.is_organization_salesperson(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select private.current_profile_id())
      and m.status = 'active'
      and m.role = 'salesperson'
  );
$$;
revoke all on function public.is_organization_member(uuid) from public, anon;
revoke all on function public.is_organization_manager(uuid) from public, anon;
revoke all on function public.is_organization_owner(uuid) from public, anon;
revoke all on function public.is_organization_salesperson(uuid) from public, anon;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_manager(uuid) to authenticated;
grant execute on function public.is_organization_owner(uuid) to authenticated;
grant execute on function public.is_organization_salesperson(uuid) to authenticated;

drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated
  using (id = (select private.current_profile_id()));
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = (select private.current_profile_id()))
  with check (id = (select private.current_profile_id()));
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, marketing_opt_in) on public.profiles to authenticated;

alter table public.organization_memberships drop constraint if exists organization_memberships_role_check;
update public.organization_memberships set role = 'salesperson' where role = 'staff';
alter table public.organization_memberships add constraint organization_memberships_role_check
  check (role in ('owner', 'manager', 'salesperson'));

alter table public.organization_invitations
  alter column email type text using lower(trim(email)),
  alter column email set not null;
alter table public.organization_invitations drop constraint if exists organization_invitations_role_check;
update public.organization_invitations set role = 'salesperson' where role = 'staff';
alter table public.organization_invitations add constraint organization_invitations_role_check
  check (role in ('manager', 'salesperson'));
alter table public.organization_invitations add column if not exists revoked_at timestamptz;
alter table public.organization_invitations drop constraint if exists organization_invitations_organization_id_email_key;
create unique index if not exists organization_invitations_pending_email_uidx
  on public.organization_invitations (organization_id, lower(email)) where status = 'pending';

drop policy if exists drafts_owner_select on public.onboarding_drafts;
drop policy if exists drafts_owner_insert on public.onboarding_drafts;
drop policy if exists drafts_owner_update on public.onboarding_drafts;
create policy drafts_owner_select on public.onboarding_drafts for select to authenticated
  using (user_id = (select private.current_profile_id()));
create policy drafts_owner_insert on public.onboarding_drafts for insert to authenticated
  with check (user_id = (select private.current_profile_id()));
create policy drafts_owner_update on public.onboarding_drafts for update to authenticated
  using (user_id = (select private.current_profile_id()))
  with check (user_id = (select private.current_profile_id()));

drop policy if exists notification_preferences_self_select on public.user_notification_preferences;
drop policy if exists notification_preferences_self_insert on public.user_notification_preferences;
drop policy if exists notification_preferences_self_update on public.user_notification_preferences;
create policy notification_preferences_self_select on public.user_notification_preferences
  for select to authenticated using (user_id = (select private.current_profile_id()) and public.is_organization_member(organization_id));
create policy notification_preferences_self_insert on public.user_notification_preferences
  for insert to authenticated with check (user_id = (select private.current_profile_id()) and public.is_organization_member(organization_id));
create policy notification_preferences_self_update on public.user_notification_preferences
  for update to authenticated using (user_id = (select private.current_profile_id()) and public.is_organization_member(organization_id))
  with check (user_id = (select private.current_profile_id()) and public.is_organization_member(organization_id));

-- Owner membership creation is serialized and idempotent. The caller ID comes
-- only from the verified Clerk JWT subject mapped in private.current_profile_id.
comment on column public.profiles.clerk_user_id is 'Unique Clerk subject. Only trusted server-side provisioning may set this mapping.';

create or replace function private.has_assigned_lead(p_organization_id uuid, p_lead_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.leads l
    join public.organization_memberships m on m.organization_id = l.organization_id
    where l.id = p_lead_id and l.organization_id = p_organization_id
      and l.assigned_to_user_id = (select private.current_profile_id())
      and m.user_id = (select private.current_profile_id())
      and m.organization_id = p_organization_id and m.status = 'active'
  );
$$;
revoke all on function private.has_assigned_lead(uuid, uuid) from public, anon;
grant execute on function private.has_assigned_lead(uuid, uuid) to authenticated;

-- Keep dealership membership as the sole source of tenant and role authority.
drop policy if exists organizations_manager_update on public.organizations;
create policy organizations_owner_update on public.organizations for update to authenticated
  using (public.is_organization_owner(id)) with check (public.is_organization_owner(id));

drop policy if exists invitations_manager_select on public.organization_invitations;
create policy invitations_owner_select on public.organization_invitations for select to authenticated
  using (public.is_organization_owner(organization_id));

drop policy if exists requests_member_select on public.onboarding_requests;
create policy requests_owner_select on public.onboarding_requests for select to authenticated
  using (public.is_organization_owner(organization_id));
drop policy if exists services_member_select on public.service_requests;
create policy services_manager_select on public.service_requests for select to authenticated
  using (public.is_organization_manager(organization_id));
drop policy if exists appointments_member_select on public.appointment_requests;
create policy appointments_manager_select on public.appointment_requests for select to authenticated
  using (public.is_organization_manager(organization_id));

-- Operational tables are manager-managed. Salespeople see assigned work and
-- permitted inventory details; every write validates the same tenant and role.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'customers', 'vehicles', 'vehicle_media', 'vehicle_service_records', 'leads', 'lead_activities',
    'dealership_tasks', 'dealership_appointments', 'sales_deals', 'trade_in_vehicles',
    'sales_invoices', 'sales_invoice_lines', 'deal_payments', 'sales_documents',
    'import_jobs', 'import_job_rows', 'organization_social_profiles'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_member_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_member_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_member_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_member_delete', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'customers', 'vehicles', 'vehicle_media', 'vehicle_service_records', 'leads', 'lead_activities',
    'dealership_tasks', 'dealership_appointments', 'sales_deals', 'trade_in_vehicles',
    'sales_invoices', 'sales_invoice_lines', 'deal_payments', 'sales_documents',
    'import_jobs', 'import_job_rows', 'organization_social_profiles'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_organization_manager(organization_id))', table_name || '_manager_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_organization_manager(organization_id))', table_name || '_manager_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_organization_manager(organization_id)) with check (public.is_organization_manager(organization_id))', table_name || '_manager_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_organization_manager(organization_id))', table_name || '_manager_delete', table_name);
  end loop;
end $$;

create policy vehicles_salesperson_select on public.vehicles for select to authenticated
  using (public.is_organization_salesperson(organization_id));
grant select on public.vehicles to authenticated;
create policy vehicle_media_salesperson_select on public.vehicle_media for select to authenticated
  using (public.is_organization_salesperson(organization_id));
grant select on public.vehicle_media to authenticated;

create policy leads_salesperson_select on public.leads for select to authenticated
  using (public.is_organization_salesperson(organization_id)
    and assigned_to_user_id = (select private.current_profile_id()));
grant select on public.leads to authenticated;
create policy lead_activities_salesperson_select on public.lead_activities for select to authenticated
  using (public.is_organization_salesperson(organization_id)
    and private.has_assigned_lead(organization_id, lead_id));
create policy lead_activities_salesperson_insert on public.lead_activities for insert to authenticated
  with check (public.is_organization_salesperson(organization_id)
    and actor_user_id = (select private.current_profile_id())
    and private.has_assigned_lead(organization_id, lead_id));
grant select, insert on public.lead_activities to authenticated;

create policy tasks_salesperson_select on public.dealership_tasks for select to authenticated
  using (public.is_organization_salesperson(organization_id)
    and assigned_to_user_id = (select private.current_profile_id()));
grant select on public.dealership_tasks to authenticated;
create policy appointments_salesperson_select on public.dealership_appointments for select to authenticated
  using (public.is_organization_salesperson(organization_id)
    and assigned_to_user_id = (select private.current_profile_id()));
grant select on public.dealership_appointments to authenticated;

-- Billing belongs to owners; operational managers cannot change billing or
-- staff authority. Removing a member takes effect on their next database call.
do $$
declare table_name text;
begin
  foreach table_name in array array['organization_subscriptions', 'billing_charges'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_member_select', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_organization_owner(organization_id))', table_name || '_owner_select', table_name);
  end loop;
end $$;

drop policy if exists service_quotes_member_select on public.service_quotes;
drop policy if exists service_quote_lines_member_select on public.service_quote_lines;
drop policy if exists service_delivery_tasks_member_select on public.service_delivery_tasks;
drop policy if exists service_deliverables_member_select on public.service_deliverables;
create policy service_quotes_manager_select on public.service_quotes for select to authenticated using (public.is_organization_manager(organization_id));
create policy service_quote_lines_manager_select on public.service_quote_lines for select to authenticated using (public.is_organization_manager(organization_id));
create policy service_delivery_tasks_manager_select on public.service_delivery_tasks for select to authenticated using (public.is_organization_manager(organization_id));
create policy service_deliverables_manager_select on public.service_deliverables for select to authenticated using (public.is_organization_manager(organization_id));

drop policy if exists dealership_storage_select on storage.objects;
drop policy if exists dealership_storage_insert on storage.objects;
drop policy if exists dealership_storage_update on storage.objects;
drop policy if exists dealership_storage_delete on storage.objects;
create policy dealership_storage_select on storage.objects for select to authenticated
  using (
    bucket_id in ('vehicle-media', 'sales-documents', 'customer-imports', 'service-deliverables')
    and case when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (public.is_organization_manager(split_part(name, '/', 1)::uuid)
        or (bucket_id = 'vehicle-media' and public.is_organization_salesperson(split_part(name, '/', 1)::uuid)))
      else false end
  );
create policy dealership_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('vehicle-media', 'sales-documents', 'customer-imports', 'service-deliverables')
    and case when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_manager(split_part(name, '/', 1)::uuid) else false end);
create policy dealership_storage_update on storage.objects for update to authenticated
  using (bucket_id in ('vehicle-media', 'sales-documents', 'customer-imports', 'service-deliverables')
    and case when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_manager(split_part(name, '/', 1)::uuid) else false end)
  with check (bucket_id in ('vehicle-media', 'sales-documents', 'customer-imports', 'service-deliverables')
    and case when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_manager(split_part(name, '/', 1)::uuid) else false end);
create policy dealership_storage_delete on storage.objects for delete to authenticated
  using (bucket_id in ('vehicle-media', 'sales-documents', 'customer-imports', 'service-deliverables')
    and case when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_manager(split_part(name, '/', 1)::uuid) else false end);

create table public.platform_administrators (
  profile_id uuid primary key references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.platform_administrators enable row level security;
revoke all on public.platform_administrators from public, anon, authenticated;

create or replace function public.suspend_dealership_member(p_organization_id uuid, p_member_profile_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_organization_owner(p_organization_id) then raise exception 'Only an owner can suspend a dealership member'; end if;
  update public.organization_memberships set status = 'suspended'
  where organization_id = p_organization_id and user_id = p_member_profile_id and role <> 'owner';
  if not found then raise exception 'Active non-owner membership was not found'; end if;
end $$;
revoke all on function public.suspend_dealership_member(uuid, uuid) from public, anon;
grant execute on function public.suspend_dealership_member(uuid, uuid) to authenticated;


create or replace function public.save_onboarding_terms(p_terms_version text, p_privacy_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_terms_version text;
  v_privacy_version text;
begin
  if (select private.current_profile_id()) is null then raise exception 'Authentication required'; end if;
  select service_terms_version, privacy_notice_version
    into v_terms_version, v_privacy_version from public.pricing_configuration where singleton;
  if v_terms_version is null or v_privacy_version is null then
    raise exception 'Approved service terms and privacy notice versions are not configured';
  end if;
  if p_terms_version <> v_terms_version or p_privacy_version <> v_privacy_version then
    raise exception 'The service terms or privacy notice version is no longer current';
  end if;
  update public.profiles
  set terms_version = p_terms_version, terms_accepted_at = now(),
      privacy_version = p_privacy_version, privacy_acknowledged_at = now(), updated_at = now()
  where id = (select private.current_profile_id());
  if not found then raise exception 'Profile is not ready'; end if;
end;
$$;

create or replace function public.submit_onboarding_request(p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select private.current_profile_id());
  v_user_email text;
  v_email_confirmed_at timestamptz;
  v_terms_at timestamptz;
  v_profile_terms_version text;
  v_profile_privacy_version text;
  v_plan text := p_answers ->> 'plan';
  v_billing text := p_answers ->> 'billingInterval';
  v_method text := p_answers ->> 'setupMethod';
  v_setup_payment text := p_answers ->> 'setupPayment';
  v_monthly integer;
  v_annual integer;
  v_saving integer;
  v_subscription integer;
  v_setup_fee integer;
  v_parts smallint;
  v_schedule integer[];
  v_due_today integer;
  v_tax_status text;
  v_organization_id uuid;
  v_location_id uuid;
  v_request_id uuid;
  v_existing public.onboarding_requests%rowtype;
  v_source_count integer;
  v_status text := 'awaiting_billing_configuration';
  v_i integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select u.email, u.email_verified_at into v_user_email, v_email_confirmed_at
  from public.profiles u where u.id = v_user_id;
  if v_email_confirmed_at is null then raise exception 'Verify your email before completing onboarding'; end if;
  if exists (select 1 from public.organization_invitations i where lower(trim(i.email)) = lower(trim(v_user_email)) and i.status = 'pending' and i.expires_at > now()) then
    raise exception 'Accept your outstanding dealership invitation before creating a dealership';
  end if;
  select p.terms_accepted_at, p.terms_version, p.privacy_version
    into v_terms_at, v_profile_terms_version, v_profile_privacy_version
    from public.profiles p where p.id = v_user_id;
  if v_terms_at is null then raise exception 'Accept the current service terms before completing onboarding'; end if;
  if not exists (
    select 1 from public.pricing_configuration pc where pc.singleton
      and pc.service_terms_version = v_profile_terms_version
      and pc.privacy_notice_version = v_profile_privacy_version
  ) then raise exception 'Accept the current service terms and privacy notice before completing onboarding'; end if;
  if p_answers ? 'password' then raise exception 'Passwords cannot be saved in onboarding data'; end if;

  select * into v_existing from public.onboarding_requests r where r.onboarding_user_id = v_user_id;
  if found then
    return jsonb_build_object(
      'id', v_existing.id, 'status', v_existing.status, 'currency', v_existing.currency,
      'due_today_minor', v_existing.due_today_minor, 'setup_fee_minor', v_existing.setup_fee_minor,
      'installments', v_existing.setup_installments, 'setup_schedule_minor', to_jsonb(v_existing.setup_schedule_minor)
    );
  end if;

  if exists (select 1 from public.organization_memberships m where m.user_id = v_user_id and m.status = 'active') then
    raise exception 'This account already belongs to a dealership';
  end if;

  if v_plan not in ('essentials', 'growth', 'managed') then raise exception 'Select a valid subscription plan'; end if;
  if v_billing not in ('monthly', 'annual') then raise exception 'Select a valid billing interval'; end if;
  if v_method not in ('self_service', 'online', 'in_person') then raise exception 'Select a setup method'; end if;
  if v_setup_payment not in ('upfront', 'three_monthly') then raise exception 'Select a setup payment option'; end if;
  if nullif(trim(p_answers ->> 'dealershipName'), '') is null
      or nullif(trim(p_answers ->> 'phone'), '') is null
      or nullif(trim(p_answers ->> 'city'), '') is null
      or nullif(trim(p_answers ->> 'province'), '') is null then
    raise exception 'Complete the dealership name, phone, city and province';
  end if;

  if v_plan = 'essentials' then v_monthly := 84900; v_annual := 916920; v_saving := 101880;
  elsif v_plan = 'growth' then v_monthly := 150000; v_annual := 1620000; v_saving := 180000;
  else v_monthly := 350000; v_annual := 3780000; v_saving := 420000; end if;
  v_subscription := case when v_billing = 'annual' then v_annual else v_monthly end;

  if v_method = 'self_service' then
    v_setup_fee := case when v_plan = 'managed' then 450000 else 0 end;
  else
    v_setup_fee := case when v_plan = 'essentials' then 149900 when v_plan = 'growth' then 299900 else 599900 end;
  end if;
  v_parts := case when v_setup_fee > 0 and v_setup_payment = 'three_monthly' then 3 else 1 end;
  v_schedule := array[]::integer[];
  if v_parts = 1 then v_schedule := array[v_setup_fee];
  else
    for v_i in 1..v_parts loop
      v_schedule := array_append(v_schedule, (v_setup_fee / v_parts) + case when v_i <= (v_setup_fee % v_parts) then 1 else 0 end);
    end loop;
  end if;
  v_due_today := v_subscription + coalesce(v_schedule[1], 0);
  select pc.tax_treatment into v_tax_status from public.pricing_configuration pc where pc.singleton;

  insert into public.organizations (
    name, created_by_user_id, phone, city, province, address, role, staff_size, stock_band, help_areas,
    website_status, website_url, website_review_requested, social_platforms, social_profiles, social_help
  ) values (
    trim(p_answers ->> 'dealershipName'), v_user_id, trim(p_answers ->> 'phone'), trim(p_answers ->> 'city'),
    trim(p_answers ->> 'province'), nullif(trim(p_answers ->> 'address'), ''), coalesce(p_answers ->> 'role', 'Owner'),
    coalesce(p_answers ->> 'staffSize', 'Just me'), coalesce(p_answers ->> 'stockBand', '1–10'),
    array(select jsonb_array_elements_text(coalesce(p_answers -> 'helpAreas', '[]'::jsonb))),
    coalesce(nullif(p_answers ->> 'websiteStatus', ''), 'not_now'), nullif(p_answers ->> 'websiteUrl', ''),
    coalesce((p_answers ->> 'websiteReview')::boolean, false),
    array(select jsonb_array_elements_text(coalesce(p_answers -> 'socialPlatforms', '[]'::jsonb))),
    coalesce(p_answers -> 'socialProfiles', '{}'::jsonb), nullif(p_answers ->> 'socialHelp', '')
  ) returning id into v_organization_id;

  insert into public.dealership_locations (organization_id, name, city, province, address, is_default)
  values (v_organization_id, trim(p_answers ->> 'dealershipName'), trim(p_answers ->> 'city'),
    trim(p_answers ->> 'province'), nullif(trim(p_answers ->> 'address'), ''), true)
  returning id into v_location_id;
  insert into public.organization_memberships (organization_id, user_id, role, status)
  values (v_organization_id, v_user_id, 'owner', 'active');

  insert into public.onboarding_requests (
    onboarding_user_id, organization_id, submitted_by_user_id, plan_code, billing_interval, setup_method,
    subscription_amount_minor, annual_total_minor, annual_saving_minor, setup_fee_minor, setup_installments,
    setup_schedule_minor, due_today_minor, tax_status, service_scope_snapshot
  ) values (
    v_user_id, v_organization_id, v_user_id, v_plan, v_billing, v_method, v_subscription, v_annual, v_saving,
    v_setup_fee, v_parts, v_schedule, v_due_today, coalesce(v_tax_status, 'configuration_required'),
    jsonb_build_object(
      'answers', p_answers - 'password', 'email', v_user_email, 'currency', 'ZAR',
      'amount_due_today_before_tax_configuration', v_due_today, 'setup_schedule_minor', to_jsonb(v_schedule),
      'tax_treatment', coalesce(v_tax_status, 'configuration_required'),
      'ai_allowances', 'configuration_required', 'messaging_allowances', 'configuration_required',
      'payment_provider', 'unconfigured', 'service_terms_version', v_profile_terms_version,
      'privacy_notice_version', v_profile_privacy_version
    )
  ) returning id into v_request_id;

  update public.onboarding_drafts
    set submitted_request_id = v_request_id, current_step = 7, updated_at = now()
    where user_id = v_user_id;

  if v_method <> 'self_service' then
    if nullif(trim(p_answers ->> 'preferredDate'), '') is null or nullif(trim(p_answers ->> 'preferredTime'), '') is null then
      raise exception 'Provide a preferred date and time for your assistance request';
    end if;
    if (p_answers ->> 'preferredDate')::date <= (now() at time zone 'Africa/Johannesburg')::date then
      raise exception 'Choose a future date for your assistance request';
    end if;
    if nullif(trim(p_answers ->> 'contactPerson'), '') is null or nullif(trim(p_answers ->> 'contactPhone'), '') is null then
      raise exception 'Provide the assistance contact name and phone number';
    end if;
    if v_method = 'in_person' and nullif(trim(p_answers ->> 'appointmentAddress'), '') is null then
      raise exception 'Provide the dealership address for an in-person visit request';
    end if;
    insert into public.appointment_requests (
      organization_id, source_onboarding_request_id, preferred_date, preferred_time, meeting_format,
      contact_name, contact_phone, address, notes, travel_quote_status, status
    ) values (
      v_organization_id, v_request_id, (p_answers ->> 'preferredDate')::date,
      (p_answers ->> 'preferredTime')::time, case when v_method = 'in_person' then 'in_person' else 'online' end,
      trim(p_answers ->> 'contactPerson'), trim(p_answers ->> 'contactPhone'),
      nullif(trim(p_answers ->> 'appointmentAddress'), ''), nullif(trim(p_answers ->> 'appointmentNotes'), ''),
      case when v_method = 'in_person' then 'pending' else 'not_applicable' end, 'requested'
    );
  end if;

  if coalesce((p_answers ->> 'websiteReview')::boolean, false) then
    insert into public.service_requests (organization_id, source_onboarding_request_id, service_code, status, details)
      values (v_organization_id, v_request_id, 'website_review', 'awaiting_activation', jsonb_build_object('website_url', p_answers ->> 'websiteUrl'));
  end if;
  if v_plan = 'managed' or coalesce((p_answers ->> 'websiteOptions')::boolean, false) then
    insert into public.service_requests (organization_id, source_onboarding_request_id, service_code, status, details)
      values (v_organization_id, v_request_id, 'website_build', 'awaiting_activation', jsonb_build_object('scope', 'up_to_five_standard_pages_and_vehicle_templates'));
  end if;
  if v_plan = 'managed' then
    insert into public.service_requests (organization_id, source_onboarding_request_id, service_code, status, details)
      values (v_organization_id, v_request_id, 'managed_social', 'awaiting_activation', jsonb_build_object('scope', 'eight_original_posts_adapted_for_facebook_and_instagram'));
  elsif (p_answers ->> 'socialHelp') in ('profile_setup', 'ongoing', 'discuss') then
    insert into public.service_requests (organization_id, source_onboarding_request_id, service_code, status, details)
      values (v_organization_id, v_request_id,
        case when p_answers ->> 'socialHelp' = 'profile_setup' then 'social_profile_setup' else 'managed_social' end,
        'awaiting_activation', jsonb_build_object('requested_help', p_answers ->> 'socialHelp'));
  end if;

  insert into public.audit_events (organization_id, actor_user_id, event_type, record_type, record_id, details)
  values (v_organization_id, v_user_id, 'onboarding.requested', 'onboarding_request', v_request_id::text,
    jsonb_build_object('plan_code', v_plan, 'billing_interval', v_billing, 'payment_status', 'not_configured'));

  return jsonb_build_object(
    'id', v_request_id, 'status', v_status, 'currency', 'ZAR', 'due_today_minor', v_due_today,
    'setup_fee_minor', v_setup_fee, 'installments', v_parts, 'setup_schedule_minor', to_jsonb(v_schedule)
  );
end;
$$;

create or replace function public.accept_organization_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select private.current_profile_id());
  v_email text;
  v_confirmed_at timestamptz;
  v_invitation public.organization_invitations%rowtype;
begin
  if v_user_id is null then raise exception 'Sign in with the invited email address'; end if;
  select lower(u.email), u.email_verified_at into v_email, v_confirmed_at from public.profiles u where u.id = v_user_id;
  if v_confirmed_at is null then raise exception 'Verify your email before accepting this invitation'; end if;
  select * into v_invitation from public.organization_invitations i
    where i.token_hash = extensions.digest(p_token, 'sha256')
    for update;
  if not found then raise exception 'Invitation link is invalid'; end if;
  if v_invitation.status = 'revoked' then raise exception 'This invitation was revoked'; end if;
  if v_invitation.status = 'accepted' then raise exception 'This invitation was already accepted'; end if;
  if v_invitation.expires_at <= now() or v_invitation.status = 'expired' then raise exception 'This invitation has expired'; end if;
  if v_invitation.status <> 'pending' then raise exception 'This invitation is no longer available'; end if;
  if lower(trim(v_invitation.email)) <> v_email then raise exception 'Sign in with the email address that received this invitation'; end if;
  insert into public.organization_memberships (organization_id, user_id, role, status)
    values (v_invitation.organization_id, v_user_id, v_invitation.role, 'active')
    on conflict (organization_id, user_id) do update set status = 'active';
  update public.organization_invitations set status = 'accepted', accepted_by_user_id = v_user_id, accepted_at = now()
    where id = v_invitation.id;
  insert into public.audit_events (organization_id, actor_user_id, event_type, record_type, record_id)
    values (v_invitation.organization_id, v_user_id, 'membership.invitation_accepted', 'invitation', v_invitation.id::text);
  return v_invitation.organization_id;
end;
$$;
