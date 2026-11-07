# Production gap audit

## Working in this repository

- Responsive seven-step owner onboarding, optional website and social selections, exact rand pricing, setup-fee options, and assistance appointment requests.
- Explicit demo mode with session-only draft persistence and fictional data isolated to `/demo` routes.
- Supabase Auth client wiring, email-confirmation return handling, password recovery, invite acceptance, draft persistence, and a production signup gate for approved legal notices.
- Applied Supabase migrations for tenant membership and onboarding plus dealership CRM, stock, sales, service delivery, billing state, notifications, social account references, private Storage buckets, and tenant RLS. Local and remote migration histories match.
- A server-side idempotent onboarding request function. It snapshots subscription and setup prices and never charges or activates an entitlement.
- A Netlify SPA fallback and baseline response headers.

## Still required before real customer onboarding

| Area | Remaining work |
| --- | --- |
| Supabase project | Project is linked and the migrations are applied. Configure production Auth URLs, email SMTP, approved legal notice versions, tax treatment, and AI/messaging allowances. The live project uses PostgreSQL 17; no local Docker database was available. |
| Legal and pricing | Replace preview notices with approved terms and privacy text. Confirm fee scope, annual discount terms, tax treatment, and billing dates. Production signup stays blocked until the versioned notices are approved. |
| Email | Configure a verified sender and Resend-backed SMTP for Supabase Auth. Confirmation and recovery email templates and delivery monitoring still need provider setup. Appointment request-received and service emails are not implemented. |
| Payments | Server-side Paystack checkout, transaction verification, signed webhook processing, recurring card subscriptions, and setup instalment schedules are implemented locally. Apply the new migration and deploy the Edge Functions, configure Paystack secrets/webhook URL, set approved tax treatment, then test duplicate/failure/cancel/retry cases before live use. Checkout refuses a quote whose tax treatment is still `configuration_required`. |
| Storage and imports | Private buckets and tenant policies are configured. Signed upload flows, file scanning, CSV preview, column mapping, validation, duplicate review, and commit flow remain to be implemented. The UI says uploads are unavailable. |
| Staff invitations | Invitation acceptance is implemented for a valid email/token. An authenticated owner/manager invitation-creation screen and trusted email-sending function are not implemented yet. |
| Service delivery | Onboarding creates idempotent service request records, but staff task assignment, quotes, approval queue/calendar, website delivery workflow, and social publishing workflow still need operational tooling. |
| Core CRM | Stock, leads, tasks, and reporting routes show empty production states. Tenant-scoped create/read/update flows and role permissions for those records remain future work. |
| Hosting and operations | Connect a Netlify site, add the public Supabase URL and publishable key, set Auth redirect URLs, test DNS/TLS and production email, and establish backups, monitoring, retention, incident response, and restore checks. No deployment was made. |

## Release boundary

Do not interpret an onboarding request as a paid subscription, confirmed appointment, accepted quote, or started service. The project currently records requests only. The demo remains separate from customer records.
