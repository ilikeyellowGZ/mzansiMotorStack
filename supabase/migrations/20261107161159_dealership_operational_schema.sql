-- Dealership operating data. Every business record is scoped to one organization.

alter table public.organizations
  add column legal_name text,
  add column contact_email text,
  add column business_registration_number text,
  add column vat_number text,
  add column vat_registered boolean not null default false,
  add column logo_path text,
  add column currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  add column time_zone text not null default 'Africa/Johannesburg',
  add column business_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(business_hours) = 'object'),
  add column default_lead_assignment_user_id uuid,
  add column default_follow_up_days smallint not null default 1 check (default_follow_up_days between 0 and 90),
  add column updated_at timestamptz not null default now();

alter table public.dealership_locations
  add column contact_phone text,
  add column contact_email text,
  add column postal_code text,
  add column latitude numeric(9,6),
  add column longitude numeric(9,6),
  add column business_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(business_hours) = 'object');

alter table public.onboarding_requests
  add constraint onboarding_requests_org_id_id_unique unique (organization_id, id);
alter table public.service_requests
  add constraint service_requests_org_id_id_unique unique (organization_id, id);

alter table public.organizations
  add constraint organizations_default_assignment_membership_fk
  foreign key (id, default_lead_assignment_user_id)
  references public.organization_memberships (organization_id, user_id)
  on delete set null (default_lead_assignment_user_id);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_user_id uuid not null,
  assigned_to_user_id uuid,
  customer_type text not null default 'individual' check (customer_type in ('individual', 'business')),
  first_name text not null default '',
  last_name text not null default '',
  business_name text,
  email text,
  phone text,
  alternate_phone text,
  preferred_contact_channel text not null default 'phone' check (preferred_contact_channel in ('phone', 'email', 'whatsapp', 'sms', 'no_preference')),
  address_line_1 text,
  address_line_2 text,
  suburb text,
  city text,
  province text,
  postal_code text,
  country_code char(2) not null default 'ZA',
  notes text not null default '',
  tags text[] not null default '{}',
  email_marketing_opt_in boolean not null default false,
  email_marketing_consented_at timestamptz,
  sms_marketing_opt_in boolean not null default false,
  sms_marketing_consented_at timestamptz,
  whatsapp_marketing_opt_in boolean not null default false,
  whatsapp_marketing_consented_at timestamptz,
  consent_source text,
  privacy_notice_version text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, created_by_user_id)
    references public.organization_memberships (organization_id, user_id),
  foreign key (organization_id, assigned_to_user_id)
    references public.organization_memberships (organization_id, user_id),
  check (customer_type <> 'business' or nullif(trim(business_name), '') is not null),
  check (email is not null or phone is not null)
);
create index customers_org_name_idx on public.customers (organization_id, last_name, first_name) where archived_at is null;
create index customers_org_created_idx on public.customers (organization_id, created_at desc);
create index customers_org_email_idx on public.customers (organization_id, lower(email)) where email is not null;
create index customers_org_phone_idx on public.customers (organization_id, phone) where phone is not null;
create index customers_org_creator_idx on public.customers (organization_id, created_by_user_id);
create index customers_org_assignee_idx on public.customers (organization_id, assigned_to_user_id) where assigned_to_user_id is not null;

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null,
  created_by_user_id uuid not null,
  stock_number text not null,
  vin text,
  registration_number text,
  make text not null,
  model text not null,
  variant text,
  model_year smallint not null check (model_year between 1886 and 2100),
  body_type text,
  condition text not null default 'used' check (condition in ('new', 'used', 'demo', 'certified_pre_owned')),
  fuel_type text,
  transmission text,
  drivetrain text,
  exterior_colour text,
  interior_colour text,
  odometer_km integer not null default 0 check (odometer_km >= 0),
  previous_owners smallint check (previous_owners is null or previous_owners >= 0),
  engine_capacity_cc integer check (engine_capacity_cc is null or engine_capacity_cc > 0),
  engine_number text,
  description text not null default '',
  features text[] not null default '{}',
  service_history_available boolean not null default false,
  roadworthy_status text not null default 'unknown' check (roadworthy_status in ('unknown', 'valid', 'expired', 'not_required')),
  roadworthy_expires_on date,
  listing_price_minor integer not null check (listing_price_minor >= 0),
  minimum_sale_price_minor integer check (minimum_sale_price_minor is null or minimum_sale_price_minor >= 0),
  acquisition_price_minor integer check (acquisition_price_minor is null or acquisition_price_minor >= 0),
  reconditioning_cost_minor integer not null default 0 check (reconditioning_cost_minor >= 0),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  acquisition_source text,
  acquired_on date,
  listed_at timestamptz,
  reserved_until timestamptz,
  status text not null default 'draft' check (status in ('draft', 'available', 'reserved', 'sold', 'archived')),
  sold_at timestamptz,
  public_listing boolean not null default false,
  custom_fields jsonb not null default '{}'::jsonb check (jsonb_typeof(custom_fields) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, stock_number),
  foreign key (organization_id, location_id)
    references public.dealership_locations (organization_id, id),
  foreign key (organization_id, created_by_user_id)
    references public.organization_memberships (organization_id, user_id),
  check (minimum_sale_price_minor is null or minimum_sale_price_minor <= listing_price_minor),
  check (status <> 'reserved' or reserved_until is not null)
);
create unique index vehicles_org_vin_uidx on public.vehicles (organization_id, upper(vin)) where vin is not null and trim(vin) <> '';
create unique index vehicles_org_registration_uidx on public.vehicles (organization_id, upper(registration_number)) where registration_number is not null and trim(registration_number) <> '';
create index vehicles_org_status_created_idx on public.vehicles (organization_id, status, created_at desc);
create index vehicles_org_make_model_idx on public.vehicles (organization_id, make, model, model_year desc);
create index vehicles_org_location_status_idx on public.vehicles (organization_id, location_id, status);
create index vehicles_org_creator_idx on public.vehicles (organization_id, created_by_user_id);

create table public.vehicle_media (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid not null,
  uploaded_by_user_id uuid not null,
  bucket_id text not null default 'vehicle-media',
  object_path text not null,
  media_type text not null check (media_type in ('photo', 'document', 'video')),
  title text,
  alt_text text,
  sort_order smallint not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (bucket_id, object_path),
  foreign key (organization_id, vehicle_id) references public.vehicles (organization_id, id) on delete cascade,
  foreign key (organization_id, uploaded_by_user_id) references public.organization_memberships (organization_id, user_id)
);
create index vehicle_media_vehicle_order_idx on public.vehicle_media (organization_id, vehicle_id, sort_order);
create index vehicle_media_org_uploader_idx on public.vehicle_media (organization_id, uploaded_by_user_id);
create unique index vehicle_media_one_primary_idx on public.vehicle_media (organization_id, vehicle_id) where is_primary and media_type = 'photo';

create table public.vehicle_service_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid not null,
  recorded_by_user_id uuid not null,
  service_date date not null,
  odometer_km integer check (odometer_km is null or odometer_km >= 0),
  service_type text not null check (service_type in ('inspection', 'maintenance', 'repair', 'tyres', 'roadworthy', 'other')),
  provider_name text,
  work_order_reference text,
  description text not null,
  cost_minor integer check (cost_minor is null or cost_minor >= 0),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  next_service_due_on date,
  next_service_due_odometer_km integer check (next_service_due_odometer_km is null or next_service_due_odometer_km >= 0),
  created_at timestamptz not null default now(),
  foreign key (organization_id, vehicle_id) references public.vehicles (organization_id, id) on delete cascade,
  foreign key (organization_id, recorded_by_user_id) references public.organization_memberships (organization_id, user_id)
);
create index vehicle_service_records_timeline_idx on public.vehicle_service_records (organization_id, vehicle_id, service_date desc);
create index vehicle_service_records_org_recorder_idx on public.vehicle_service_records (organization_id, recorded_by_user_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid,
  vehicle_id uuid,
  assigned_to_user_id uuid,
  created_by_user_id uuid not null,
  source text not null default 'other' check (source in ('website', 'phone', 'walk_in', 'facebook', 'instagram', 'tiktok', 'marketplace', 'referral', 'whatsapp', 'email', 'other')),
  source_detail text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'test_drive', 'negotiation', 'won', 'lost', 'nurture')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  subject text,
  enquiry_message text not null default '',
  requested_make text,
  requested_model text,
  requested_year_from smallint check (requested_year_from is null or requested_year_from between 1886 and 2100),
  requested_year_to smallint check (requested_year_to is null or requested_year_to between 1886 and 2100),
  budget_min_minor integer check (budget_min_minor is null or budget_min_minor >= 0),
  budget_max_minor integer check (budget_max_minor is null or budget_max_minor >= 0),
  finance_required boolean,
  trade_in_expected boolean not null default false,
  preferred_contact_channel text check (preferred_contact_channel is null or preferred_contact_channel in ('phone', 'email', 'whatsapp', 'sms', 'no_preference')),
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  follow_up_at timestamptz,
  expected_purchase_on date,
  lost_reason text,
  consent_to_contact boolean not null default true,
  consent_captured_at timestamptz,
  custom_fields jsonb not null default '{}'::jsonb check (jsonb_typeof(custom_fields) = 'object'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, customer_id) references public.customers (organization_id, id),
  foreign key (organization_id, vehicle_id) references public.vehicles (organization_id, id),
  foreign key (organization_id, assigned_to_user_id) references public.organization_memberships (organization_id, user_id),
  foreign key (organization_id, created_by_user_id) references public.organization_memberships (organization_id, user_id),
  check (budget_max_minor is null or budget_min_minor is null or budget_max_minor >= budget_min_minor),
  check (requested_year_to is null or requested_year_from is null or requested_year_to >= requested_year_from),
  check (status <> 'lost' or nullif(trim(lost_reason), '') is not null)
);
create index leads_org_status_created_idx on public.leads (organization_id, status, created_at desc) where archived_at is null;
create index leads_org_assignee_followup_idx on public.leads (organization_id, assigned_to_user_id, follow_up_at) where status not in ('won', 'lost') and archived_at is null;
create index leads_org_customer_idx on public.leads (organization_id, customer_id) where customer_id is not null;
create index leads_org_vehicle_idx on public.leads (organization_id, vehicle_id) where vehicle_id is not null;
create index leads_org_creator_idx on public.leads (organization_id, created_by_user_id);

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null,
  customer_id uuid,
  vehicle_id uuid,
  actor_user_id uuid,
  activity_type text not null check (activity_type in ('note', 'call', 'email', 'sms', 'whatsapp', 'website_enquiry', 'meeting', 'test_drive', 'status_change', 'assignment')),
  direction text check (direction is null or direction in ('inbound', 'outbound', 'internal')),
  subject text,
  body text not null default '',
  outcome text,
  happened_at timestamptz not null default now(),
  next_action_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (organization_id, lead_id) references public.leads (organization_id, id) on delete cascade,
  foreign key (organization_id, customer_id) references public.customers (organization_id, id),
  foreign key (organization_id, vehicle_id) references public.vehicles (organization_id, id),
  foreign key (organization_id, actor_user_id) references public.organization_memberships (organization_id, user_id)
);
create index lead_activities_timeline_idx on public.lead_activities (organization_id, lead_id, happened_at desc);
create index lead_activities_org_customer_idx on public.lead_activities (organization_id, customer_id) where customer_id is not null;
create index lead_activities_org_vehicle_idx on public.lead_activities (organization_id, vehicle_id) where vehicle_id is not null;
create index lead_activities_org_actor_idx on public.lead_activities (organization_id, actor_user_id) where actor_user_id is not null;

create table public.dealership_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_user_id uuid not null,
  assigned_to_user_id uuid,
  lead_id uuid,
  customer_id uuid,
  vehicle_id uuid,
  task_type text not null default 'follow_up' check (task_type in ('follow_up', 'call', 'email', 'appointment', 'vehicle_prep', 'document', 'import_review', 'service_delivery', 'other')),
  title text not null,
  description text not null default '',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  due_at timestamptz,
  reminder_at timestamptz,
  completed_at timestamptz,
  completion_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, created_by_user_id) references public.organization_memberships (organization_id, user_id),
  foreign key (organization_id, assigned_to_user_id) references public.organization_memberships (organization_id, user_id),
  foreign key (organization_id, lead_id) references public.leads (organization_id, id),
  foreign key (organization_id, customer_id) references public.customers (organization_id, id),
  foreign key (organization_id, vehicle_id) references public.vehicles (organization_id, id),
  check (status <> 'completed' or completed_at is not null)
);
create index dealership_tasks_org_due_idx on public.dealership_tasks (organization_id, status, due_at);
create index dealership_tasks_assignee_due_idx on public.dealership_tasks (organization_id, assigned_to_user_id, status, due_at);
create index dealership_tasks_org_lead_idx on public.dealership_tasks (organization_id, lead_id) where lead_id is not null;
create index dealership_tasks_org_customer_idx on public.dealership_tasks (organization_id, customer_id) where customer_id is not null;
create index dealership_tasks_org_vehicle_idx on public.dealership_tasks (organization_id, vehicle_id) where vehicle_id is not null;
create index dealership_tasks_org_creator_idx on public.dealership_tasks (organization_id, created_by_user_id);

create table public.dealership_appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid,
  customer_id uuid,
  lead_id uuid,
  vehicle_id uuid,
  assigned_to_user_id uuid,
  created_by_user_id uuid not null,
  appointment_type text not null check (appointment_type in ('sales_consultation', 'test_drive', 'vehicle_delivery', 'service', 'meeting', 'other')),
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'completed', 'cancelled', 'no_show', 'reschedule_requested')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_zone text not null default 'Africa/Johannesburg',
  contact_name text not null,
  contact_phone text,
  contact_email text,
  location_notes text,
  customer_notes text not null default '',
  internal_notes text not null default '',
  confirmation_sent_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, location_id) references public.dealership_locations (organization_id, id),
  foreign key (organization_id, customer_id) references public.customers (organization_id, id),
  foreign key (organization_id, lead_id) references public.leads (organization_id, id),
  foreign key (organization_id, vehicle_id) references public.vehicles (organization_id, id),
  foreign key (organization_id, assigned_to_user_id) references public.organization_memberships (organization_id, user_id),
  foreign key (organization_id, created_by_user_id) references public.organization_memberships (organization_id, user_id),
  check (ends_at > starts_at),
  check (contact_phone is not null or contact_email is not null)
);
create index dealership_appointments_org_start_idx on public.dealership_appointments (organization_id, starts_at, status);
create index dealership_appointments_assignee_start_idx on public.dealership_appointments (organization_id, assigned_to_user_id, starts_at) where status in ('requested', 'confirmed');
create index dealership_appointments_org_location_idx on public.dealership_appointments (organization_id, location_id, starts_at) where location_id is not null;
create index dealership_appointments_org_customer_idx on public.dealership_appointments (organization_id, customer_id) where customer_id is not null;
create index dealership_appointments_org_lead_idx on public.dealership_appointments (organization_id, lead_id) where lead_id is not null;
create index dealership_appointments_org_vehicle_idx on public.dealership_appointments (organization_id, vehicle_id) where vehicle_id is not null;
create index dealership_appointments_org_creator_idx on public.dealership_appointments (organization_id, created_by_user_id);

create table public.sales_deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid,
  vehicle_id uuid not null,
  customer_id uuid not null,
  lead_id uuid,
  salesperson_user_id uuid not null,
  created_by_user_id uuid not null,
  deal_number text not null,
  status text not null default 'draft' check (status in ('draft', 'negotiating', 'awaiting_deposit', 'awaiting_finance', 'awaiting_documents', 'ready_for_delivery', 'completed', 'cancelled')),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  agreed_price_minor integer not null check (agreed_price_minor >= 0),
  discount_minor integer not null default 0 check (discount_minor >= 0),
  deposit_required_minor integer not null default 0 check (deposit_required_minor >= 0),
  deposit_received_minor integer not null default 0 check (deposit_received_minor >= 0),
  trade_in_value_minor integer not null default 0 check (trade_in_value_minor >= 0),
  finance_required boolean not null default false,
  finance_provider text,
  finance_status text check (finance_status is null or finance_status in ('not_started', 'submitted', 'pending', 'approved', 'declined', 'cancelled')),
  finance_reference text,
  sale_agreed_at timestamptz,
  completed_at timestamptz,
  delivery_due_at timestamptz,
  cancellation_reason text,
  internal_notes text not null default '',
  custom_fields jsonb not null default '{}'::jsonb check (jsonb_typeof(custom_fields) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, deal_number),
  foreign key (organization_id, location_id) references public.dealership_locations (organization_id, id),
  foreign key (organization_id, vehicle_id) references public.vehicles (organization_id, id),
  foreign key (organization_id, customer_id) references public.customers (organization_id, id),
  foreign key (organization_id, lead_id) references public.leads (organization_id, id),
  foreign key (organization_id, salesperson_user_id) references public.organization_memberships (organization_id, user_id),
  foreign key (organization_id, created_by_user_id) references public.organization_memberships (organization_id, user_id),
  check (deposit_received_minor <= deposit_required_minor or deposit_required_minor = 0),
  check (status <> 'completed' or completed_at is not null)
);
create index sales_deals_org_status_created_idx on public.sales_deals (organization_id, status, created_at desc);
create index sales_deals_org_customer_idx on public.sales_deals (organization_id, customer_id, created_at desc);
create index sales_deals_org_vehicle_idx on public.sales_deals (organization_id, vehicle_id);
create index sales_deals_org_location_idx on public.sales_deals (organization_id, location_id) where location_id is not null;
create index sales_deals_org_lead_idx on public.sales_deals (organization_id, lead_id) where lead_id is not null;
create index sales_deals_org_salesperson_idx on public.sales_deals (organization_id, salesperson_user_id);
create index sales_deals_org_creator_idx on public.sales_deals (organization_id, created_by_user_id);

create table public.trade_in_vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null,
  make text not null,
  model text not null,
  variant text,
  model_year smallint check (model_year is null or model_year between 1886 and 2100),
  registration_number text,
  vin text,
  odometer_km integer check (odometer_km is null or odometer_km >= 0),
  condition_notes text not null default '',
  appraisal_value_minor integer not null check (appraisal_value_minor >= 0),
  outstanding_settlement_minor integer not null default 0 check (outstanding_settlement_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, deal_id),
  foreign key (organization_id, deal_id) references public.sales_deals (organization_id, id) on delete cascade
);

create table public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null,
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft', 'issued', 'part_paid', 'paid', 'overdue', 'void')),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  customer_name_snapshot text not null,
  customer_email_snapshot text,
  customer_address_snapshot text,
  subtotal_minor integer not null default 0 check (subtotal_minor >= 0),
  tax_minor integer check (tax_minor is null or tax_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  amount_paid_minor integer not null default 0 check (amount_paid_minor >= 0),
  tax_treatment text not null default 'configuration_required' check (tax_treatment in ('inclusive', 'exclusive', 'configuration_required')),
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, invoice_number),
  foreign key (organization_id, deal_id) references public.sales_deals (organization_id, id),
  foreign key (organization_id, created_by_user_id) references public.organization_memberships (organization_id, user_id),
  check (amount_paid_minor <= total_minor)
);
create index sales_invoices_org_status_due_idx on public.sales_invoices (organization_id, status, due_at);
create index sales_invoices_org_deal_idx on public.sales_invoices (organization_id, deal_id);
create index sales_invoices_org_creator_idx on public.sales_invoices (organization_id, created_by_user_id);

create table public.sales_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  invoice_id uuid not null,
  line_number smallint not null check (line_number > 0),
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_amount_minor integer not null check (unit_amount_minor >= 0),
  total_amount_minor integer not null check (total_amount_minor >= 0),
  tax_rate_basis_points integer check (tax_rate_basis_points is null or tax_rate_basis_points between 0 and 10000),
  created_at timestamptz not null default now(),
  foreign key (organization_id, invoice_id) references public.sales_invoices (organization_id, id) on delete cascade,
  unique (invoice_id, line_number)
);
create index sales_invoice_lines_org_invoice_idx on public.sales_invoice_lines (organization_id, invoice_id);

create table public.deal_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null,
  invoice_id uuid,
  recorded_by_user_id uuid not null,
  status text not null default 'received' check (status in ('expected', 'received', 'failed', 'refunded', 'void')),
  payment_method text not null check (payment_method in ('cash', 'eft', 'card_terminal', 'finance', 'other')),
  amount_minor integer not null check (amount_minor >= 0),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  payment_reference text,
  received_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  foreign key (organization_id, deal_id) references public.sales_deals (organization_id, id) on delete cascade,
  foreign key (organization_id, invoice_id) references public.sales_invoices (organization_id, id),
  foreign key (organization_id, recorded_by_user_id) references public.organization_memberships (organization_id, user_id)
);
create index deal_payments_deal_timeline_idx on public.deal_payments (organization_id, deal_id, created_at desc);
create index deal_payments_org_invoice_idx on public.deal_payments (organization_id, invoice_id) where invoice_id is not null;
create index deal_payments_org_recorder_idx on public.deal_payments (organization_id, recorded_by_user_id);

create table public.sales_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null,
  uploaded_by_user_id uuid not null,
  bucket_id text not null default 'sales-documents',
  object_path text not null,
  document_type text not null check (document_type in ('quotation', 'invoice', 'sale_agreement', 'proof_of_payment', 'finance_document', 'delivery_checklist', 'identity_document', 'other')),
  display_name text not null,
  content_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  uploaded_at timestamptz not null default now(),
  foreign key (organization_id, deal_id) references public.sales_deals (organization_id, id) on delete cascade,
  foreign key (organization_id, uploaded_by_user_id) references public.organization_memberships (organization_id, user_id),
  unique (bucket_id, object_path)
);
create index sales_documents_deal_idx on public.sales_documents (organization_id, deal_id, uploaded_at desc);
create index sales_documents_org_uploader_idx on public.sales_documents (organization_id, uploaded_by_user_id);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by_user_id uuid not null,
  bucket_id text not null default 'customer-imports',
  object_path text not null,
  file_name text not null,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  import_type text not null check (import_type in ('vehicles', 'customers', 'leads', 'mixed')),
  status text not null default 'uploaded' check (status in ('uploaded', 'scanning', 'preview_ready', 'awaiting_mapping', 'validated', 'committing', 'completed', 'failed', 'cancelled')),
  field_mapping jsonb not null default '{}'::jsonb check (jsonb_typeof(field_mapping) = 'object'),
  total_rows integer not null default 0 check (total_rows >= 0),
  valid_rows integer not null default 0 check (valid_rows >= 0),
  invalid_rows integer not null default 0 check (invalid_rows >= 0),
  duplicate_rows integer not null default 0 check (duplicate_rows >= 0),
  error_summary jsonb not null default '[]'::jsonb check (jsonb_typeof(error_summary) = 'array'),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (bucket_id, object_path),
  foreign key (organization_id, uploaded_by_user_id) references public.organization_memberships (organization_id, user_id)
);
create index import_jobs_org_created_idx on public.import_jobs (organization_id, created_at desc);
create index import_jobs_org_uploader_idx on public.import_jobs (organization_id, uploaded_by_user_id);

create table public.import_job_rows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  import_job_id uuid not null,
  row_number integer not null check (row_number > 0),
  raw_data jsonb not null check (jsonb_typeof(raw_data) = 'object'),
  normalized_data jsonb check (normalized_data is null or jsonb_typeof(normalized_data) = 'object'),
  validation_errors jsonb not null default '[]'::jsonb check (jsonb_typeof(validation_errors) = 'array'),
  duplicate_of_record_id uuid,
  duplicate_action text not null default 'review' check (duplicate_action in ('review', 'skip', 'merge', 'create')),
  status text not null default 'pending' check (status in ('pending', 'valid', 'invalid', 'duplicate', 'imported', 'skipped')),
  created_at timestamptz not null default now(),
  foreign key (organization_id, import_job_id) references public.import_jobs (organization_id, id) on delete cascade,
  unique (import_job_id, row_number)
);
create index import_job_rows_job_status_idx on public.import_job_rows (organization_id, import_job_id, status, row_number);

create table public.service_quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_request_id uuid not null,
  created_by_user_id uuid not null,
  quote_number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired', 'cancelled')),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  subtotal_minor integer not null default 0 check (subtotal_minor >= 0),
  travel_minor integer not null default 0 check (travel_minor >= 0),
  tax_minor integer check (tax_minor is null or tax_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  tax_treatment text not null default 'configuration_required' check (tax_treatment in ('inclusive', 'exclusive', 'configuration_required')),
  scope_snapshot jsonb not null check (jsonb_typeof(scope_snapshot) = 'object'),
  terms_version text,
  sent_at timestamptz,
  expires_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  customer_response_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, quote_number),
  foreign key (organization_id, service_request_id) references public.service_requests (organization_id, id) on delete cascade,
  foreign key (organization_id, created_by_user_id) references public.organization_memberships (organization_id, user_id)
);
create index service_quotes_org_status_idx on public.service_quotes (organization_id, status, created_at desc);
create index service_quotes_org_request_idx on public.service_quotes (organization_id, service_request_id);
create index service_quotes_org_creator_idx on public.service_quotes (organization_id, created_by_user_id);

create table public.service_quote_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  service_quote_id uuid not null,
  line_number smallint not null check (line_number > 0),
  service_code text not null,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_amount_minor integer not null check (unit_amount_minor >= 0),
  total_amount_minor integer not null check (total_amount_minor >= 0),
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (organization_id, service_quote_id) references public.service_quotes (organization_id, id) on delete cascade,
  unique (service_quote_id, line_number)
);
create index service_quote_lines_org_quote_idx on public.service_quote_lines (organization_id, service_quote_id);

create table public.service_delivery_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_request_id uuid not null,
  assigned_to_user_id uuid,
  created_by_user_id uuid,
  title text not null,
  description text not null default '',
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'blocked', 'awaiting_customer', 'completed', 'cancelled')),
  task_order smallint not null default 0,
  due_at timestamptz,
  completed_at timestamptz,
  customer_approval_required boolean not null default false,
  customer_approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, service_request_id) references public.service_requests (organization_id, id) on delete cascade,
  foreign key (organization_id, assigned_to_user_id) references public.organization_memberships (organization_id, user_id),
  foreign key (organization_id, created_by_user_id) references public.organization_memberships (organization_id, user_id)
);
create index service_delivery_tasks_service_order_idx on public.service_delivery_tasks (organization_id, service_request_id, task_order);
create index service_delivery_tasks_org_assignee_idx on public.service_delivery_tasks (organization_id, assigned_to_user_id) where assigned_to_user_id is not null;
create index service_delivery_tasks_org_creator_idx on public.service_delivery_tasks (organization_id, created_by_user_id) where created_by_user_id is not null;

create table public.service_deliverables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_request_id uuid not null,
  uploaded_by_user_id uuid not null,
  bucket_id text not null default 'service-deliverables',
  object_path text not null,
  deliverable_type text not null check (deliverable_type in ('website_draft', 'brand_asset', 'social_post', 'social_calendar', 'report', 'other')),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'awaiting_customer_approval', 'approved', 'changes_requested', 'published', 'archived')),
  version_number integer not null default 1 check (version_number > 0),
  customer_feedback text,
  approved_by_user_id uuid,
  approved_at timestamptz,
  published_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (bucket_id, object_path),
  foreign key (organization_id, service_request_id) references public.service_requests (organization_id, id) on delete cascade,
  foreign key (organization_id, uploaded_by_user_id) references public.organization_memberships (organization_id, user_id),
  foreign key (organization_id, approved_by_user_id) references public.organization_memberships (organization_id, user_id)
);
create index service_deliverables_queue_idx on public.service_deliverables (organization_id, status, scheduled_for);
create index service_deliverables_org_service_idx on public.service_deliverables (organization_id, service_request_id);
create index service_deliverables_org_uploader_idx on public.service_deliverables (organization_id, uploaded_by_user_id);
create index service_deliverables_org_approver_idx on public.service_deliverables (organization_id, approved_by_user_id) where approved_by_user_id is not null;

create table public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_onboarding_request_id uuid unique,
  provider text not null default 'unconfigured',
  provider_customer_reference text,
  provider_subscription_reference text,
  plan_code text not null check (plan_code in ('essentials', 'growth', 'managed')),
  billing_interval text not null check (billing_interval in ('monthly', 'annual')),
  status text not null default 'pending_payment' check (status in ('pending_payment', 'trialing', 'active', 'past_due', 'paused', 'cancelled', 'incomplete', 'expired')),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  amount_minor integer not null check (amount_minor > 0),
  tax_treatment text not null default 'configuration_required' check (tax_treatment in ('inclusive', 'exclusive', 'configuration_required')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  activated_at timestamptz,
  entitlement_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (provider, provider_subscription_reference),
  foreign key (organization_id, source_onboarding_request_id)
    references public.onboarding_requests (organization_id, id)
);
create index organization_subscriptions_org_status_idx on public.organization_subscriptions (organization_id, status, current_period_end desc);
create index organization_subscriptions_org_onboarding_idx on public.organization_subscriptions (organization_id, source_onboarding_request_id) where source_onboarding_request_id is not null;

create table public.billing_charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid,
  onboarding_request_id uuid,
  service_quote_id uuid,
  charge_type text not null check (charge_type in ('subscription', 'setup', 'setup_installment', 'travel', 'usage', 'domain', 'other')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  amount_minor integer not null check (amount_minor >= 0),
  tax_minor integer check (tax_minor is null or tax_minor >= 0),
  provider text not null default 'unconfigured',
  provider_charge_reference text,
  idempotency_key text not null,
  installment_number smallint check (installment_number is null or installment_number between 1 and 3),
  due_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  failure_message text,
  refunded_minor integer not null default 0 check (refunded_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, idempotency_key),
  unique (provider, provider_charge_reference),
  foreign key (organization_id, subscription_id) references public.organization_subscriptions (organization_id, id),
  foreign key (organization_id, service_quote_id) references public.service_quotes (organization_id, id),
  foreign key (organization_id, onboarding_request_id) references public.onboarding_requests (organization_id, id),
  check (refunded_minor <= amount_minor)
);
create index billing_charges_org_status_due_idx on public.billing_charges (organization_id, status, due_at);
create index billing_charges_org_subscription_idx on public.billing_charges (organization_id, subscription_id) where subscription_id is not null;
create index billing_charges_org_onboarding_idx on public.billing_charges (organization_id, onboarding_request_id) where onboarding_request_id is not null;
create index billing_charges_org_quote_idx on public.billing_charges (organization_id, service_quote_id) where service_quote_id is not null;

create table public.billing_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_reference text not null,
  event_type text not null,
  payload_digest text not null,
  processing_status text not null default 'received' check (processing_status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  attempt_count smallint not null default 0 check (attempt_count >= 0),
  last_error text,
  unique (provider, provider_event_reference)
);
create index billing_provider_events_status_received_idx on public.billing_provider_events (processing_status, received_at);

create table public.user_notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  task_reminders_enabled boolean not null default true,
  appointment_reminders_enabled boolean not null default true,
  service_updates_enabled boolean not null default true,
  marketing_enabled boolean not null default false,
  reminder_minutes_before integer[] not null default '{1440,60}' check (array_position(reminder_minutes_before, null) is null),
  quiet_hours_start time,
  quiet_hours_end time,
  time_zone text not null default 'Africa/Johannesburg',
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  foreign key (organization_id, user_id) references public.organization_memberships (organization_id, user_id) on delete cascade,
  check ((quiet_hours_start is null) = (quiet_hours_end is null))
);

create table public.organization_social_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  platform text not null check (platform in ('facebook', 'instagram', 'tiktok', 'other')),
  display_name text,
  handle text,
  profile_url text,
  external_account_reference text,
  authorization_status text not null default 'not_authorized' check (authorization_status in ('not_authorized', 'requested', 'authorized', 'revoked', 'error')),
  authorization_method text check (authorization_method is null or authorization_method in ('oauth', 'delegated_business_access', 'manual_link')),
  authorized_by_user_id uuid,
  authorized_at timestamptz,
  revoked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, platform, external_account_reference),
  foreign key (organization_id, authorized_by_user_id) references public.organization_memberships (organization_id, user_id),
  check (profile_url is null or profile_url ~* '^https?://')
);
create index organization_social_profiles_org_status_idx on public.organization_social_profiles (organization_id, authorization_status);
create index organization_social_profiles_org_authorizer_idx on public.organization_social_profiles (organization_id, authorized_by_user_id) where authorized_by_user_id is not null;

-- Only authenticated dealership members can access their organization's operational records.
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
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_organization_member(organization_id))', table_name || '_member_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_organization_member(organization_id))', table_name || '_member_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id))', table_name || '_member_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_organization_member(organization_id))', table_name || '_member_delete', table_name);
  end loop;
end $$;

-- Quote and delivery records are visible to the dealership but only trusted staff workflows write them.
do $$
declare table_name text;
begin
  foreach table_name in array array['service_quotes', 'service_quote_lines', 'service_delivery_tasks', 'service_deliverables'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_organization_member(organization_id))', table_name || '_member_select', table_name);
  end loop;
end $$;

-- Users may inspect billing state; only a verified server-side provider workflow can change it.
do $$
declare table_name text;
begin
  foreach table_name in array array['organization_subscriptions', 'billing_charges'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_organization_member(organization_id))', table_name || '_member_select', table_name);
  end loop;
end $$;

alter table public.billing_provider_events enable row level security;
revoke all on public.billing_provider_events from anon, authenticated;

alter table public.user_notification_preferences enable row level security;
revoke all on public.user_notification_preferences from anon, authenticated;
grant select, insert, update, delete on public.user_notification_preferences to authenticated;
create policy notification_preferences_self_select on public.user_notification_preferences
  for select to authenticated using (user_id = (select auth.uid()) and public.is_organization_member(organization_id));
create policy notification_preferences_self_insert on public.user_notification_preferences
  for insert to authenticated with check (user_id = (select auth.uid()) and public.is_organization_member(organization_id));
create policy notification_preferences_self_update on public.user_notification_preferences
  for update to authenticated using (user_id = (select auth.uid()) and public.is_organization_member(organization_id))
  with check (user_id = (select auth.uid()) and public.is_organization_member(organization_id));

create policy organizations_manager_update on public.organizations for update to authenticated
  using (public.is_organization_manager(id)) with check (public.is_organization_manager(id));
grant update (
  name, phone, city, province, address, website_status, website_url, website_review_requested,
  social_platforms, social_profiles, social_help, legal_name, contact_email,
  business_registration_number, vat_number, vat_registered, logo_path, currency,
  time_zone, business_hours, default_lead_assignment_user_id, default_follow_up_days, updated_at
) on public.organizations to authenticated;

create policy locations_manager_insert on public.dealership_locations for insert to authenticated
  with check (public.is_organization_manager(organization_id));
create policy locations_manager_update on public.dealership_locations for update to authenticated
  using (public.is_organization_manager(organization_id)) with check (public.is_organization_manager(organization_id));
grant insert, update on public.dealership_locations to authenticated;
grant update (name, city, province, address, is_default, contact_phone, contact_email, postal_code, latitude, longitude, business_hours)
  on public.dealership_locations to authenticated;

-- Keep upload objects private and scope every path by organization UUID.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('vehicle-media', 'vehicle-media', false, 20971520),
  ('sales-documents', 'sales-documents', false, 20971520),
  ('customer-imports', 'customer-imports', false, 10485760),
  ('service-deliverables', 'service-deliverables', false, 20971520)
on conflict (id) do update set public = false;

create policy dealership_storage_select on storage.objects for select to authenticated
  using (
    bucket_id in ('vehicle-media', 'sales-documents', 'customer-imports', 'service-deliverables')
    and case when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      then public.is_organization_member(split_part(name, '/', 1)::uuid) else false end
  );
create policy dealership_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id in ('vehicle-media', 'sales-documents', 'customer-imports', 'service-deliverables')
    and case when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      then public.is_organization_member(split_part(name, '/', 1)::uuid) else false end
  );
create policy dealership_storage_update on storage.objects for update to authenticated
  using (
    bucket_id in ('vehicle-media', 'sales-documents', 'customer-imports', 'service-deliverables')
    and case when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      then public.is_organization_member(split_part(name, '/', 1)::uuid) else false end
  ) with check (
    bucket_id in ('vehicle-media', 'sales-documents', 'customer-imports', 'service-deliverables')
    and case when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      then public.is_organization_member(split_part(name, '/', 1)::uuid) else false end
  );
create policy dealership_storage_delete on storage.objects for delete to authenticated
  using (
    bucket_id in ('vehicle-media', 'sales-documents', 'customer-imports', 'service-deliverables')
    and case when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      then public.is_organization_member(split_part(name, '/', 1)::uuid) else false end
  );

comment on table public.customers is 'Dealership-owned customer contacts and communication preferences. Do not store identity documents in unencrypted fields.';
comment on table public.vehicles is 'Dealership inventory with ZAR amounts stored as integer minor units.';
comment on table public.leads is 'Sales enquiries and follow-up state. Contact history is kept in lead_activities.';
comment on table public.sales_deals is 'Sales pipeline and negotiated vehicle sale terms; payment collection is tracked separately.';
comment on table public.import_job_rows is 'Temporary PII-bearing import preview rows; purge after the configured retention period.';
comment on table public.billing_provider_events is 'Private idempotency ledger for verified provider webhook events; raw card or payment credentials must never be stored.';
comment on table public.organization_subscriptions is 'Subscription contract snapshots; entitlements change only after trusted server-side payment verification.';
