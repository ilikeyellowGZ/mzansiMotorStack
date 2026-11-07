# MzansiMotorStack data model

The Supabase schema is tenant-scoped by `organization_id`. Composite foreign keys prevent records in one dealership from referencing another dealership's customers, vehicles, staff, leads, or service work. Row-level security restricts access to authenticated members of the organization.

## Table coverage

- **Identity and onboarding:** `profiles`, `organizations`, `organization_memberships`, `dealership_locations`, `onboarding_drafts`, `onboarding_requests`, `appointment_requests`, `service_requests`, `organization_invitations`, `audit_events`, `pricing_configuration`.
- **Customers and inventory:** `customers`, `vehicles`, `vehicle_media`, `vehicle_service_records`.
- **Sales pipeline:** `leads`, `lead_activities`, `dealership_tasks`, `dealership_appointments`, `sales_deals`, `trade_in_vehicles`, `sales_invoices`, `sales_invoice_lines`, `deal_payments`, `sales_documents`.
- **Imports:** `import_jobs`, `import_job_rows`.
- **Service delivery:** `service_quotes`, `service_quote_lines`, `service_delivery_tasks`, `service_deliverables`.
- **Account operations:** `organization_subscriptions`, `billing_charges`, `billing_provider_events`, `user_notification_preferences`, `organization_social_profiles`.

The full per-field contract is in the checked-in SQL migrations and generated [TypeScript database types](../src/lib/database.types.ts). Fields cover organization identity and operating hours; customer contacts, addresses, and channel-specific consent; vehicle identity, specifications, condition, pricing, acquisition, listing, and service history; lead source, qualification, budget, follow-up, and contact history; sales and trade-in values; quote, payment, invoice, and delivery status; import validation; notification preferences; and delegated social-account authorization state.

## Data and security conventions

- ZAR prices use integer minor units (cents); no card numbers, security codes, passwords, or provider tokens are stored.
- Customer email/SMS/WhatsApp marketing consent is recorded separately from permission to respond to a sales enquiry.
- Storage buckets are private. Object names begin with the dealership UUID, and Storage policies verify membership in that organization.
- Subscription and charge records are readable by organization members but are not writable by browser roles. Provider events and pricing configuration have no browser table access.
- Imports may contain personal data. The application must purge staged rows after its retention period.
- The live schema is a foundation; the corresponding inventory, sales, import, service, and billing screens and server workflows are still under implementation.
