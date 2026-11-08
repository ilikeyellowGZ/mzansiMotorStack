# Clerk authentication setup

This project keeps React, TypeScript, Vite and Netlify. Clerk owns signup, email verification, login, password recovery, sessions and account settings. Supabase continues to own Postgres, Storage, Realtime and Edge Functions. Supabase profiles keep internal UUIDs; `profiles.clerk_user_id` maps the verified Clerk subject to that internal key.

The connected Supabase project was inspected on 7 November 2026: `auth.users`, dealerships, memberships and onboarding requests each contained zero rows. This is an empty test baseline, not evidence that an account database was migrated. The identity migration stops if `auth.users` is no longer empty. If real accounts appear before cutover, pause and prepare a verified account-activation map. Never connect an old account using an email-only match.

## 1. Browser dashboard actions

### Create a Clerk application

1. Create separate Clerk **development** and **production** instances. Keep their keys and Supabase projects separate.
2. In the Clerk Dashboard, enable email address and password sign-in, require email verification, and keep Google disabled until its OAuth credentials have been set up.
3. Keep Clerk's prebuilt `<SignIn />` and `<SignUp />` flows enabled. They provide password recovery and verification steps. Set the post-sign-in and post-sign-up fallback route to `/onboarding`; invite URLs carry their own safe, same-site return route.
4. Add the local origins `http://localhost:5173` and `http://127.0.0.1:5173` to the development instance. Add the exact Netlify production hostname and any verified custom domain to the production instance. Configure the same origins as allowed parties for the instance.
5. Copy the instance publishable key, secret key and issuer. The issuer is the exact `https://…clerk.accounts.dev` or configured production issuer shown by Clerk. Never use a development key in production.

### Connect Clerk to Supabase

1. In Clerk, open **Configure → Supabase** (or the Supabase integration setup). Activate the native Supabase integration and copy the Clerk instance domain. This adds the `role: authenticated` session claim required by Supabase.
2. In Supabase, open **Authentication → Sign In / Providers → Third-party Auth → Add provider → Clerk** and enter that Clerk domain. Do this separately in development and production.
3. Do not create a Supabase JWT template and do not share the Supabase JWT signing secret with Clerk. The frontend passes the normal Clerk session token through Supabase's `accessToken` callback.
4. Keep Row Level Security on. The migration uses `auth.jwt()->>'sub'` to resolve `profiles.clerk_user_id`, then uses the existing internal profile UUID for dealership membership and record ownership.

### Set Resend invitation email delivery

1. Add and verify the sender domain in Resend, then publish its SPF/DKIM records.
2. Create a server API key with the least access needed for transactional email. Set `RESEND_FROM_EMAIL` to an address on the verified domain.
3. The invitation function creates a random 256-bit token, stores only its SHA-256 hash, and emails the raw token link. Failed delivery revokes the newly created invitation.

### Set Netlify and Supabase function secrets

In Netlify, add only the browser values from the table below to the correct site and deploy context. These three values are public by design. Keep all other values out of Netlify's `VITE_*` environment.

In Supabase **Edge Functions → Secrets**, set the server values below in the matching project. Supabase's built-in `SUPABASE_URL` and legacy `SUPABASE_SERVICE_ROLE_KEY` can be used where available; `MOTORSTACK_SUPABASE_SECRET_KEY` holds the project's current `sb_secret_...` API key for these functions. Supabase reserves the `SUPABASE_` prefix for its own variables. Never put a service-role or secret key in the browser bundle.

| Variable | Where it is used |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Netlify/Vite browser build |
| `VITE_SUPABASE_URL` | Netlify/Vite browser build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Netlify/Vite browser build |
| `CLERK_SECRET_KEY` | Supabase Edge Functions only; token verification and verified-email lookup |
| `CLERK_ISSUER` | Supabase Edge Functions only; exact issuer check for this Clerk instance |
| `CLERK_JWT_AUDIENCE` | Optional; set only if the Clerk token is configured with an `aud` claim |
| `APP_ALLOWED_ORIGINS` | Supabase Edge Functions; comma-separated exact local and production origins for `azp` validation and CORS |
| `APP_PUBLIC_URL` | Invitation links sent by Resend |
| `MOTORSTACK_SUPABASE_SECRET_KEY` | Supabase Edge Functions only; trusted profile and invitation writes |
| `RESEND_API_KEY` | Supabase Edge Functions only; invitation email delivery |
| `RESEND_FROM_EMAIL` | Supabase Edge Functions only; verified invitation sender |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Reserved for an optional future webhook; no webhook is needed for first-login provisioning |

## 2. Terminal commands

1. Copy `.env.example` to `.env.local` and fill in only the three `VITE_*` browser values plus the approved legal notice versions. Do not copy server secrets into `.env.local`.
2. Install the locked dependencies and verify the frontend:

   ```powershell
   npm ci
   npm run build
   npm test
   npm run dev
   ```

3. Review the linked project and migration list before applying any DDL:

   ```powershell
   npx supabase --version
   npx supabase migration list --linked
   npx supabase db push --linked
   ```

   The Clerk migration intentionally aborts if `auth.users` contains rows. Confirm the zero-user baseline and take a database backup before pushing it. Do not bypass that preflight if accounts have appeared.

4. Deploy the functions after setting secrets in the corresponding Supabase project:

   ```powershell
   npx supabase functions deploy provision-clerk-profile --project-ref <development-project-ref>
   npx supabase functions deploy check-pending-invitation --project-ref <development-project-ref>
   npx supabase functions deploy accept-clerk-invitation --project-ref <development-project-ref>
   npx supabase functions deploy create-clerk-invitation --project-ref <development-project-ref>
   npx supabase functions deploy revoke-clerk-invitation --project-ref <development-project-ref>
   npx supabase functions deploy paystack-checkout --project-ref <development-project-ref>
   npx supabase functions deploy paystack-verify --project-ref <development-project-ref>
   ```

   Repeat with the production project ref only after the development flow is verified. The existing Paystack webhook remains signature-verified and does not use Clerk identity.

## 3. Code and environment edits

- `.env.example` lists the public Vite variables and server-only placeholders. Server secrets in the file are documentation placeholders; add actual values in Supabase Function Secrets.
- `src/main.tsx` wraps the existing app in Clerk only when a Clerk publishable key is present. The isolated demo and public marketing routes continue to render without login.
- `src/lib/config.ts` supplies the Clerk session token to `supabase-js` with the supported `accessToken` callback and does not enable a second Supabase Auth session.
- `supabase/migrations/20261107210000_clerk_third_party_identity.sql` switches identity lookup and tenant roles, preserves UUID ownership, replaces Auth triggers, adapts Storage policies and adds secure member suspension. Apply it through the Supabase migration process; it has not been applied to the linked project in this implementation session.
- Netlify's existing SPA fallback already serves direct routes. Keep the current `netlify.toml` publish directory and build command.

## 4. First platform administrator

There is no client-side platform-admin signup or self-promotion flow. `platform_administrators` is a separate, RLS-enabled table with no browser grants. After the initial verified Clerk user has signed in and the `provision-clerk-profile` function has created their mapping:

1. Confirm the person's Clerk user ID in the Clerk Dashboard using a separate administrator session.
2. In Supabase SQL Editor, have a trusted database administrator run the following with that exact Clerk ID. This does not cast the Clerk ID to UUID and does not grant dealership ownership.

   ```sql
   insert into public.platform_administrators(profile_id)
   select id
   from public.profiles
   where clerk_user_id = 'user_replace_with_verified_clerk_id'
   on conflict (profile_id) do nothing;
   ```

3. Verify exactly one row was inserted. Keep the SQL editor and database credentials restricted. Platform-admin application features must check this table on the server; dealership membership roles must not imply platform-admin rights.

## 5. Existing users, rollback and release boundary

The observed project had no Supabase Auth users or dealership rows, so there was no password or customer record to transfer. Clerk cannot receive Supabase password hashes through this migration. If real users are added before cutover, stop: export a protected mapping worklist, verify each old identity through an account activation journey, link only after successful verification, and keep the old login path available until every account is accounted for. Do not use an email match alone and do not delete the old Auth users or records.

For this empty test baseline, rollback means stop Clerk signup, restore the previous Netlify build, and restore the Supabase pre-migration backup if the schema must be reverted. Do not write an improvised reverse migration that recreates Auth triggers or discards Clerk mappings. Before turning off any legacy Auth setup, confirm zero active Auth users, test all Clerk journeys, and confirm the backup restores. Supabase Auth itself cannot be disabled at the project level; only the app's old signup/login code is removed here.

## 6. Manual verification checklist

Use separate Clerk development accounts, two dealerships and direct API requests with each account's Clerk session token. Do not use a service key as the user token.

- Verify signup, required email verification, login, logout, password recovery, a persistent reload, and expiry/re-authentication.
- Create an owner dealership, interrupt and resume onboarding, retry/double-submit, and confirm one organization, one default location, one owner membership and one onboarding request.
- Invite a new email and an existing Clerk user. Accept only with the verified invited address. Try wrong email, expired link, owner-revoked link and a second acceptance; confirm each fails with a useful response.
- Attempt direct RPC and REST role escalation, cross-dealership reads/writes, foreign organization IDs on insert/update, salesperson access to an unassigned lead, and access after owner suspension of the membership.
- Test private Storage paths under both organizations for reads, inserts, updates and deletes. Test invalid, expired, wrong-issuer and wrong-authorized-party tokens against every authenticated function.
- Retry profile provisioning concurrently and replay invitation acceptance. Both must stay idempotent; a second invitation acceptance must not add another membership or dealership.
- Force a failed payment and confirm the signed-in owner can still reach workspace billing/support routes.
- Inspect every built JS asset for `CLERK_SECRET_KEY`, `MOTORSTACK_SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESEND_API_KEY`; only publishable keys may appear in frontend output.

The repository checks run in this implementation session cover TypeScript/Vite production compilation, existing onboarding/pricing tests and safe redirect handling. Live provider flows, two-tenant direct API isolation, function token validation and email delivery still require configured Clerk/Supabase/Resend development credentials and deployed functions; no live success is claimed here.

## Provider plan limits (checked 8 November 2026)

- Clerk Hobby currently lists up to 50,000 monthly retained users per app and most authentication features at no charge. It lists a fixed seven-day session lifetime on Hobby; custom session lifetime and MFA are listed on Pro. Limits and branding/features can change. See [Clerk pricing](https://clerk.com/pricing).
- Supabase Free currently lists 50,000 monthly active users, 500 MB database, 5 GB egress and 1 GB file storage; inactive Free projects may pause after one week. Pro currently starts at $25/month and has higher included limits. Third-party authenticated usage can have usage charges above plan quotas. See [Supabase pricing](https://supabase.com/pricing) and [third-party auth pricing](https://supabase.com/docs/guides/auth/third-party/overview).
- Resend Free currently lists 3,000 emails/month and 100/day. Invitation volume beyond provider limits needs a paid plan or another configured transactional email arrangement. See [Resend pricing](https://resend.com/pricing).

Treat these as a dated snapshot, not a promise of permanently free or unlimited authentication, storage, third-party usage, email or delivery.
