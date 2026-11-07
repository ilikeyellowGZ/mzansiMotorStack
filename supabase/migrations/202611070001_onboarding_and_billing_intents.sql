create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  marketing_opt_in boolean not null default false,
  terms_version text,
  terms_accepted_at timestamptz,
  privacy_version text,
  privacy_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  created_by_user_id uuid not null references auth.users(id),
  phone text not null check (length(trim(phone)) between 7 and 30),
  city text not null check (length(trim(city)) between 2 and 100),
  province text not null check (length(trim(province)) between 2 and 80),
  address text,
  role text not null check (role in ('Owner', 'Manager', 'Other')),
  staff_size text not null check (staff_size in ('Just me', '2–5', '6–10', 'More than 10')),
  stock_band text not null check (stock_band in ('1–10', '11–30', '31–60', 'More than 60')),
  help_areas text[] not null default '{}',
  website_status text not null default 'not_now' check (website_status in ('happy', 'needs_improvement', 'want_one', 'not_now')),
  website_url text,
  website_review_requested boolean not null default false,
  social_platforms text[] not null default '{}',
  social_profiles jsonb not null default '{}'::jsonb,
  social_help text check (social_help is null or social_help in ('self', 'profile_setup', 'ongoing', 'discuss')),
  onboarding_status text not null default 'awaiting_payment_setup' check (onboarding_status in ('awaiting_payment_setup', 'active', 'quote_requested', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not ('None yet' = any(social_platforms)) or cardinality(social_platforms) = 1),
  check (website_url is null or website_url ~* '^https?://[^/]+\.[^/]+')
);

create index organizations_creator_idx on public.organizations(created_by_user_id, created_at desc);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'staff')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_memberships_user_idx on public.organization_memberships(user_id, status, organization_id);

create table public.dealership_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  city text not null,
  province text not null,
  address text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);
create unique index dealership_one_default_location_idx on public.dealership_locations(organization_id) where is_default;

create table public.onboarding_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_step smallint not null default 2 check (current_step between 2 and 7),
  answers jsonb not null default '{}'::jsonb check (not (answers ? 'password')),
  submitted_request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  onboarding_user_id uuid not null unique references auth.users(id),
  organization_id uuid not null unique references public.organizations(id),
  submitted_by_user_id uuid not null references auth.users(id),
  plan_code text not null check (plan_code in ('essentials', 'growth', 'managed')),
  billing_interval text not null check (billing_interval in ('monthly', 'annual')),
  setup_method text not null check (setup_method in ('self_service', 'online', 'in_person')),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  subscription_amount_minor integer not null check (subscription_amount_minor > 0),
  annual_total_minor integer not null check (annual_total_minor > 0),
  annual_saving_minor integer not null check (annual_saving_minor >= 0),
  setup_fee_minor integer not null check (setup_fee_minor >= 0),
  setup_installments smallint not null check (setup_installments in (1, 3)),
  setup_schedule_minor integer[] not null,
  due_today_minor integer not null check (due_today_minor >= 0),
  tax_status text not null default 'configuration_required' check (tax_status in ('inclusive', 'exclusive', 'configuration_required')),
  payment_status text not null default 'not_configured' check (payment_status in ('not_configured', 'pending', 'paid', 'failed', 'cancelled')),
  status text not null default 'awaiting_billing_configuration' check (status in ('awaiting_billing_configuration', 'quote_requested', 'pending_payment', 'active', 'cancelled')),
  service_scope_snapshot jsonb not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (cardinality(setup_schedule_minor) = setup_installments)
);
alter table public.onboarding_drafts
  add constraint onboarding_draft_submitted_request_fk
  foreign key (submitted_request_id) references public.onboarding_requests(id) on delete set null;
create index onboarding_requests_org_idx on public.onboarding_requests(organization_id, submitted_at desc);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_onboarding_request_id uuid not null references public.onboarding_requests(id) on delete cascade,
  service_code text not null check (service_code in ('website_review', 'website_build', 'social_profile_setup', 'managed_social')),
  status text not null default 'awaiting_activation' check (status in ('awaiting_activation', 'awaiting_quote', 'in_progress', 'customer_approval', 'completed', 'cancelled')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_onboarding_request_id, service_code)
);
create index service_requests_org_idx on public.service_requests(organization_id, status, created_at desc);

create table public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_onboarding_request_id uuid not null unique references public.onboarding_requests(id) on delete cascade,
  preferred_date date not null,
  preferred_time time not null,
  time_zone text not null default 'Africa/Johannesburg' check (time_zone = 'Africa/Johannesburg'),
  meeting_format text not null check (meeting_format in ('online', 'in_person')),
  contact_name text not null,
  contact_phone text not null,
  address text,
  notes text,
  travel_quote_status text not null default 'not_applicable' check (travel_quote_status in ('not_applicable', 'pending', 'quoted', 'accepted')),
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'reschedule_requested', 'cancelled')),
  created_at timestamptz not null default now(),
  check (meeting_format <> 'in_person' or nullif(trim(address), '') is not null)
);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('manager', 'staff')),
  token_hash bytea not null unique,
  invited_by_user_id uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null,
  accepted_by_user_id uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);
create index organization_invitations_expiry_idx on public.organization_invitations(status, expires_at);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  record_type text not null,
  record_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_org_created_idx on public.audit_events(organization_id, created_at desc);

create table public.pricing_configuration (
  singleton boolean primary key default true check (singleton),
  tax_treatment text not null default 'configuration_required' check (tax_treatment in ('inclusive', 'exclusive', 'configuration_required')),
  tax_rate_basis_points integer check (tax_rate_basis_points is null or tax_rate_basis_points between 0 and 10000),
  ai_allowances jsonb,
  messaging_allowances jsonb,
  service_terms_version text,
  privacy_notice_version text,
  payment_provider text not null default 'unconfigured',
  effective_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.pricing_configuration(singleton) values (true) on conflict (singleton) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id, full_name, marketing_opt_in, terms_version, terms_accepted_at,
    privacy_version, privacy_acknowledged_at
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false),
    null, null, null, null
  ) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.is_organization_manager(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role in ('owner', 'manager')
  );
$$;
revoke all on function public.is_organization_member(uuid) from public, anon;
revoke all on function public.is_organization_manager(uuid) from public, anon;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_manager(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.dealership_locations enable row level security;
alter table public.onboarding_drafts enable row level security;
alter table public.onboarding_requests enable row level security;
alter table public.service_requests enable row level security;
alter table public.appointment_requests enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.audit_events enable row level security;
alter table public.pricing_configuration enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy organizations_member_select on public.organizations for select to authenticated using (public.is_organization_member(id));
create policy memberships_member_select on public.organization_memberships for select to authenticated using (public.is_organization_member(organization_id));
create policy locations_member_select on public.dealership_locations for select to authenticated using (public.is_organization_member(organization_id));
create policy drafts_owner_select on public.onboarding_drafts for select to authenticated using (user_id = (select auth.uid()));
create policy drafts_owner_insert on public.onboarding_drafts for insert to authenticated with check (user_id = (select auth.uid()));
create policy drafts_owner_update on public.onboarding_drafts for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy requests_member_select on public.onboarding_requests for select to authenticated using (public.is_organization_member(organization_id));
create policy services_member_select on public.service_requests for select to authenticated using (public.is_organization_member(organization_id));
create policy appointments_member_select on public.appointment_requests for select to authenticated using (public.is_organization_member(organization_id));
create policy invitations_manager_select on public.organization_invitations for select to authenticated using (public.is_organization_manager(organization_id));
create policy audit_manager_select on public.audit_events for select to authenticated using (organization_id is not null and public.is_organization_manager(organization_id));

revoke all on public.profiles, public.organizations, public.organization_memberships,
  public.dealership_locations, public.onboarding_drafts, public.onboarding_requests,
  public.service_requests, public.appointment_requests, public.organization_invitations,
  public.audit_events, public.pricing_configuration from anon, authenticated;
grant select, update on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name, marketing_opt_in) on public.profiles to authenticated;
grant select on public.organizations, public.organization_memberships, public.dealership_locations,
  public.onboarding_requests, public.service_requests, public.appointment_requests,
  public.organization_invitations, public.audit_events to authenticated;
grant select on public.onboarding_drafts to authenticated;
grant insert (user_id, current_step, answers), update (current_step, answers, updated_at)
  on public.onboarding_drafts to authenticated;

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
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
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
  where id = (select auth.uid());
  if not found then raise exception 'Profile is not ready'; end if;
end;
$$;
revoke all on function public.save_onboarding_terms(text, text) from public, anon;
grant execute on function public.save_onboarding_terms(text, text) to authenticated;

create or replace function public.submit_onboarding_request(p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
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
  select u.email, u.email_confirmed_at into v_user_email, v_email_confirmed_at
  from auth.users u where u.id = v_user_id;
  if v_email_confirmed_at is null then raise exception 'Verify your email before completing onboarding'; end if;
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
revoke all on function public.submit_onboarding_request(jsonb) from public, anon;
grant execute on function public.submit_onboarding_request(jsonb) to authenticated;

create or replace function public.accept_organization_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_confirmed_at timestamptz;
  v_invitation public.organization_invitations%rowtype;
begin
  if v_user_id is null then raise exception 'Sign in with the invited email address'; end if;
  select lower(u.email), u.email_confirmed_at into v_email, v_confirmed_at from auth.users u where u.id = v_user_id;
  if v_confirmed_at is null then raise exception 'Verify your email before accepting this invitation'; end if;
  select * into v_invitation from public.organization_invitations i
    where i.token_hash = extensions.digest(p_token, 'sha256') and i.status = 'pending' and i.expires_at > now()
    for update;
  if not found then raise exception 'Invitation is invalid, expired or already used'; end if;
  if lower(v_invitation.email) <> v_email then raise exception 'Sign in with the email address that received this invitation'; end if;
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
revoke all on function public.accept_organization_invitation(text) from public, anon;
grant execute on function public.accept_organization_invitation(text) to authenticated;

comment on table public.pricing_configuration is 'Privileged pricing configuration. No browser role has table access.';
comment on table public.onboarding_requests is 'Accepted price/scope snapshots and non-payment onboarding requests. No payment is processed here.';
comment on table public.audit_events is 'Append-only application audit records; writes are reserved for trusted database functions and server operations.';
