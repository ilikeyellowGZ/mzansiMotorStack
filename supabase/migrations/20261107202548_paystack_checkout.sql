create table public.paystack_plan_catalog (
  id uuid primary key default gen_random_uuid(),
  amount_minor integer not null check (amount_minor > 0),
  billing_interval text not null check (billing_interval in ('monthly', 'annually')),
  invoice_limit integer not null default 0 check (invoice_limit >= 0),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  provider_plan_code text not null unique,
  created_at timestamptz not null default now(),
  unique (amount_minor, billing_interval, currency, invoice_limit)
);

create table public.billing_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  onboarding_request_id uuid not null references public.onboarding_requests(id) on delete cascade,
  provider text not null default 'paystack' check (provider = 'paystack'),
  provider_reference text not null unique,
  provider_transaction_id bigint,
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  amount_minor integer not null check (amount_minor > 0),
  checkout_url text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed', 'abandoned')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index billing_checkout_sessions_one_pending_idx
  on public.billing_checkout_sessions (onboarding_request_id) where status in ('pending', 'processing');
create index billing_checkout_sessions_org_idx
  on public.billing_checkout_sessions (organization_id, created_at desc);

alter table public.paystack_plan_catalog enable row level security;
alter table public.billing_checkout_sessions enable row level security;
revoke all on public.paystack_plan_catalog from public, anon, authenticated;
revoke all on public.billing_checkout_sessions from public, anon, authenticated;
grant all on public.paystack_plan_catalog to service_role;
grant all on public.billing_checkout_sessions to service_role;
alter table public.billing_charges add column provider_subscription_reference text;
create index billing_charges_paystack_subscription_idx
  on public.billing_charges (provider_subscription_reference) where provider_subscription_reference is not null;

create or replace function public.claim_paystack_checkout(p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_checkout public.billing_checkout_sessions%rowtype;
begin
  select * into v_checkout from public.billing_checkout_sessions
  where provider_reference = p_reference for update;
  if not found then raise exception 'Checkout reference not found'; end if;
  if v_checkout.status = 'paid' then return jsonb_build_object('status', 'paid'); end if;
  if v_checkout.status = 'processing' then return jsonb_build_object('status', 'processing'); end if;
  if v_checkout.status <> 'pending' then raise exception 'Checkout is not payable'; end if;
  update public.billing_checkout_sessions set status = 'processing', updated_at = now() where id = v_checkout.id;
  return jsonb_build_object('status', 'claimed');
end;
$$;
revoke all on function public.claim_paystack_checkout(text) from public, anon, authenticated;
grant execute on function public.claim_paystack_checkout(text) to service_role;

create or replace function public.release_paystack_checkout(p_reference text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.billing_checkout_sessions set status = 'pending', updated_at = now()
  where provider_reference = p_reference and status = 'processing';
$$;
revoke all on function public.release_paystack_checkout(text) from public, anon, authenticated;
grant execute on function public.release_paystack_checkout(text) to service_role;

create or replace function public.finalize_paystack_checkout(
  p_reference text,
  p_transaction_id bigint,
  p_customer_code text,
  p_subscription_code text,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_checkout public.billing_checkout_sessions%rowtype;
  v_request public.onboarding_requests%rowtype;
  v_subscription_id uuid;
  v_i integer;
begin
  select * into v_checkout
  from public.billing_checkout_sessions
  where provider_reference = p_reference
  for update;
  if not found then raise exception 'Checkout reference not found'; end if;
  if v_checkout.status = 'paid' then
    return jsonb_build_object('status', 'paid', 'onboarding_request_id', v_checkout.onboarding_request_id);
  end if;
  if v_checkout.status not in ('pending', 'processing') then raise exception 'Checkout is not payable'; end if;

  select * into v_request
  from public.onboarding_requests
  where id = v_checkout.onboarding_request_id
    and organization_id = v_checkout.organization_id
  for update;
  if not found then raise exception 'Onboarding request not found'; end if;

  insert into public.organization_subscriptions (
    organization_id, source_onboarding_request_id, provider,
    provider_customer_reference, provider_subscription_reference,
    plan_code, billing_interval, status, currency, amount_minor,
    tax_treatment, current_period_start, current_period_end,
    activated_at, entitlement_verified_at
  ) values (
    v_request.organization_id, v_request.id, 'paystack',
    p_customer_code, p_subscription_code,
    v_request.plan_code, v_request.billing_interval, 'active', v_request.currency,
    v_request.subscription_amount_minor, v_request.tax_status,
    p_period_start, p_period_end, now(), now()
  ) on conflict (source_onboarding_request_id) do update set
    provider = 'paystack',
    provider_customer_reference = excluded.provider_customer_reference,
    provider_subscription_reference = excluded.provider_subscription_reference,
    status = 'active',
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    activated_at = coalesce(public.organization_subscriptions.activated_at, now()),
    entitlement_verified_at = now(),
    updated_at = now()
  returning id into v_subscription_id;

  insert into public.billing_charges (
    organization_id, subscription_id, onboarding_request_id, charge_type,
    status, currency, amount_minor, provider, idempotency_key, paid_at
  ) values (
    v_request.organization_id, v_subscription_id, v_request.id, 'subscription',
    'paid', v_request.currency, v_request.subscription_amount_minor, 'paystack',
    v_request.id::text || ':subscription:initial', now()
  ) on conflict (organization_id, idempotency_key) do update set status = 'paid', paid_at = coalesce(public.billing_charges.paid_at, now()), updated_at = now();

  if v_request.setup_fee_minor > 0 then
    insert into public.billing_charges (
      organization_id, subscription_id, onboarding_request_id, charge_type,
      status, currency, amount_minor, provider, idempotency_key,
      installment_number, due_at, paid_at
    ) values (
      v_request.organization_id, v_subscription_id, v_request.id,
      case when v_request.setup_installments = 1 then 'setup' else 'setup_installment' end,
      'paid', v_request.currency, v_request.setup_schedule_minor[1], 'paystack',
      v_request.id::text || ':setup:1', 1, now(), now()
    ) on conflict (organization_id, idempotency_key) do update set status = 'paid', paid_at = coalesce(public.billing_charges.paid_at, now()), updated_at = now();

    if v_request.setup_installments > 1 then
      for v_i in 2..v_request.setup_installments loop
        insert into public.billing_charges (
          organization_id, subscription_id, onboarding_request_id, charge_type,
          status, currency, amount_minor, provider, idempotency_key,
          installment_number, due_at
        ) values (
          v_request.organization_id, v_subscription_id, v_request.id, 'setup_installment',
          'pending', v_request.currency, v_request.setup_schedule_minor[v_i], 'paystack',
          v_request.id::text || ':setup:' || v_i::text, v_i,
          p_period_start + make_interval(months => v_i - 1)
        ) on conflict (organization_id, idempotency_key) do nothing;
      end loop;
    end if;
  end if;

  update public.billing_checkout_sessions
  set status = 'paid', provider_transaction_id = p_transaction_id, paid_at = now(), updated_at = now()
  where id = v_checkout.id;
  update public.onboarding_requests
  set payment_status = 'paid', status = 'active'
  where id = v_request.id;
  update public.organizations set onboarding_status = 'active'
  where id = v_request.organization_id;
  update public.service_requests
  set status = case when status = 'awaiting_activation' then 'awaiting_quote' else status end
  where source_onboarding_request_id = v_request.id;
  insert into public.audit_events (organization_id, actor_user_id, event_type, record_type, record_id, details)
  values (v_request.organization_id, v_request.onboarding_user_id, 'billing.payment_verified',
    'onboarding_request', v_request.id::text,
    jsonb_build_object('provider', 'paystack', 'reference', p_reference, 'transaction_id', p_transaction_id));

  return jsonb_build_object('status', 'paid', 'onboarding_request_id', v_request.id);
end;
$$;
revoke all on function public.finalize_paystack_checkout(text, bigint, text, text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.finalize_paystack_checkout(text, bigint, text, text, timestamptz, timestamptz) to service_role;
