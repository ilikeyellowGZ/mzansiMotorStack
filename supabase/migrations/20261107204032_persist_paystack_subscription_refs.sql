alter table public.billing_checkout_sessions
  add column provider_customer_reference text,
  add column provider_subscription_reference text,
  add column setup_subscription_references jsonb not null default '{}'::jsonb;

create unique index billing_checkout_sessions_paystack_subscription_idx
  on public.billing_checkout_sessions (provider_subscription_reference)
  where provider_subscription_reference is not null;
