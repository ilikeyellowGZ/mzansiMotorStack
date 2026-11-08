# Implementation and integration status

## Delivered

- A responsive seven-step owner onboarding journey and sample workspace, with the existing pricing and service choices preserved.
- Tenant-scoped Supabase schema/RLS for dealership operations and private Storage, plus idempotent onboarding and payment workflows.
- Clerk React screens at `/signup`, `/login`, `/account`, `/accept-invite`, `/onboarding`, and `/access-denied`. Clerk owns password, verification, recovery and session flows.
- Clerk's current native Supabase third-party integration, session-token callback, server-verified profile provisioning, owner invitations through Resend, single-use acceptance, revocation and member suspension.
- A forward-only identity migration that preserves internal UUID keys, replaces Auth-user foreign keys with profile references, updates roles and authorization policies, and aborts when Supabase Auth users exist.
- Netlify SPA routing remains in place; the public site and isolated demo do not require login.
- A bottom-left MotorStack Assistant with page-aware prompts, free-text AI endpoint, server-verified plan and assisted-online-setup prices, reviewed enquiry capture, and a Clerk-scoped reviewed setup-choice save. Anonymous threads stay in the browser session; signed-in threads use RLS-backed Supabase history.

## Not yet connected or launch-ready

- The Clerk migration is local and has not been applied. The linked Supabase project currently has zero Auth users, organizations, memberships and onboarding requests. The migration has a preflight guard; if this changes, pause and prepare a verified account activation mapping first.
- Clerk dev/prod instances, Supabase third-party provider settings, production domains, Edge Function secrets/functions, Resend and Netlify are not configured here. No live sign-up, login, recovery, invitation email or token verification is claimed.
- Production onboarding stays gated until approved legal notice versions and billing/tax configuration are set.
- Private Storage policies exist, but upload workflows, scanning, imports and operational record screens remain future work.
- Paystack checkout and webhook code are local. The Paystack migration/functions still need deployment and test credentials before payment flows can be verified.
- No Netlify site is linked or deployed.
- The assistant migration and Edge Function are local only. OpenAI model credentials, a rate-limit salt, Clerk secrets, function deployment, and an operational owner for the enquiry queue are required before live chat or handoff is verified. The public vehicle catalogue does not exist, so the assistant does not offer individual vehicle recommendations.

## Configuration sequence

1. Follow [the Clerk authentication setup guide](CLERK-AUTH-SETUP.md) to create separate development and production Clerk instances, set exact domains, and activate native Clerk–Supabase integration in both dashboards.
2. Review the live table counts and the migration preflight. Take a backup, apply the identity migration, and deploy the Clerk and invitation Edge Functions to development first.
3. Set the public Clerk/Supabase values in Netlify and server-only Clerk, Supabase and Resend secrets in Supabase Function Secrets.
4. Verify email/password, recovery, owner onboarding, invitations, direct two-dealership RLS isolation, Storage paths and invalid/expired function tokens before production.
5. Approve/publish legal notices and configure pricing/tax treatment before enabling real onboarding or checkout.
6. Deploy and verify Paystack and operational storage features separately before using production credentials.
7. Apply the assistant migration, deploy `motorstack-assistant`, add server-only OpenAI and rate-limit secrets, and test chat, reviewed setup saves, and enquiry queue handling on the development hostname. Schedule the assistant expiry purge for periods with no traffic. See [the assistant setup guide](../README.md#enable-motorstack-assistant).

## Verification in this workspace

- `npm run build` passes after the assistant integration.
- `npm test` passes 22 tests, including plan recommendation, pricing/onboarding, and safe internal redirect checks.
- `deno check` passes for the assistant Edge Function. Production-build browser checks cover launcher, greeting, open/expanded/mobile states, page navigation, source links, offline errors, reviewed handoff and retry idempotency key. These browser service responses were mocked; the live OpenAI, database, and Clerk paths still need deployed-provider verification.
- Live provider verification and two-tenant direct API checks still require configured development credentials and deployed functions.
- The linked project was inspected read-only for migration history, table state and identity counts. The new migration was not applied remotely.

## Paystack setup

- Set `PAYSTACK_SECRET_KEY` and optional `PAYSTACK_WEBHOOK_SECRET` as server-side Supabase Function Secrets. Do not use `VITE_*` for secrets.
- Register `https://<project-ref>.supabase.co/functions/v1/paystack-webhook` in Paystack.
- The checkout uses card subscriptions and remains blocked until tax treatment is configured as inclusive.
