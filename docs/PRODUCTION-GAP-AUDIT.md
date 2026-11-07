# Production gap audit

## Implemented in the repository

- React/Vite public site, isolated sample demo, seven-step owner onboarding and exact current plan/service pricing.
- Clerk routes and supported components for email/password signup, verification, login, password recovery and profile management.
- Native Clerk–Supabase JWT integration using the Clerk session token. Supabase profiles preserve internal UUIDs and map a verified Clerk `sub` through server-only provisioning.
- Prepared Clerk identity migration with a fail-closed preflight for existing Supabase Auth users, migrated authorization helpers, owner/manager/salesperson policies, private Storage role policies and a separate platform-admin table.
- Server-verified Clerk provisioning, invitation checking/creation/revocation/acceptance, Resend delivery, and membership suspension functions.
- Netlify SPA fallback, Supabase schema, onboarding/payment records and tenant RLS from the existing migrations.

## Release blockers

| Area | Remaining work |
| --- | --- |
| Clerk and Supabase | Create dev/prod Clerk instances, set email/password verification, configure exact domains and the native Supabase third-party provider in both dashboards. Add public keys to Netlify and server secrets to Supabase Functions. |
| Database cutover | Review the zero-user preflight again, back up the database, apply `20261107210000_clerk_third_party_identity.sql`, and verify its policies/advisors. The migration has not been applied. If any Supabase Auth users exist, stop and prepare a verified account-activation/mapping plan; do not merge by email. |
| Edge Functions | Deploy the Clerk and invitation functions with gateway JWT verification enabled. Test invalid, expired, wrong-issuer and wrong-authorized-party tokens directly. Configure `APP_ALLOWED_ORIGINS`, `CLERK_ISSUER`, `CLERK_SECRET_KEY` and server-only Supabase secret. |
| Email | Verify a Resend sender and configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Test invite delivery, bounces and revoked links. Clerk handles its own verification/recovery email configuration. |
| Onboarding and legal | Approve/publish real service terms and privacy notices and set matching version values. Confirm tax treatment and pricing configuration before enabling checkout. |
| Payment | Deploy the Paystack migration and functions, configure test secrets/webhook, then test payment success, failure, retries and duplicate webhooks. Checkout must remain blocked until inclusive tax treatment is configured. |
| Storage and operations | Storage policies exist. Signed upload, scanning, CSV import and operational create/edit screens remain unimplemented. |
| Production hosting | Connect Netlify, set production-only browser values, and verify deep links and flows on the production hostname. No deployment has been made. |

## Data assessment and rollback

A read-only count of the linked Supabase project on 7 November 2026 found zero Auth users, organizations, memberships and onboarding requests. That is an empty test baseline. The migration keeps all UUID foreign-key relationships pointed at profiles, but refuses to cut over if Auth users exist, because moving an account without a verified Clerk activation could strand or incorrectly merge a real user's identity.

For the current empty baseline, stop Clerk signup, roll back the Netlify application build and restore the pre-migration Supabase backup if schema restoration is required. Do not improvise a reverse migration. Supabase Auth itself cannot be disabled at the project level; the obsolete app-level signup/login calls have been removed.

## Test boundary

`npm run build` passes and `npm test` passes 19 local tests. Auth-provider flows, deployed Edge Functions, Resend delivery, two-dealership API isolation, cross-tenant Storage, session expiry and payment failure access have not been live-tested because no provider credentials/functions were configured in this session. See [the setup guide](CLERK-AUTH-SETUP.md) for the development verification checklist.
