# mzansiMotorStack

MzansiMotorStack is a dealership operations app for independent South African dealerships. It includes the public product site, a seven-step owner onboarding flow, invited employee acceptance, a clearly isolated sample workspace, and a tenant-scoped Supabase schema for dealership operations.

## Run locally

Use Node.js 22.12+ or 24+ and npm.

```powershell
npm install
npm run dev:demo
```

The demo runs without a Supabase project. Its onboarding progress is stored only in the current browser session, and its dealership dashboard uses fictional records. It cannot create real accounts or launch paid services.

The Supabase project is linked and the existing database migrations are applied. Clerk authentication is implemented in the repository, but the new identity migration and Edge Functions still need to be applied/deployed after Clerk, Supabase third-party auth, Resend and Netlify are configured. Production onboarding also remains gated until legal notices and pricing configuration are approved. Follow the [Clerk authentication setup guide](docs/CLERK-AUTH-SETUP.md) before enabling live signup.

## Build and checks

```powershell
npm test
npm run build
```

## Key files

- `src/onboarding/OnboardingWizard.tsx` — owner setup, invitation acceptance, pricing, and appointment-request screens.
- `src/lib/onboarding.ts` — plan totals, setup prices, and quote arithmetic.
- `supabase/migrations/` — linked-project migrations for onboarding, dealership operations, private Storage buckets, row security, and indexes.
- `src/auth/ClerkAuth.tsx` — Clerk screens, protected routes, profile provisioning, and owner team access.
- `supabase/functions/` — Clerk identity/invitation functions and existing payment functions.
- `docs/CLERK-AUTH-SETUP.md` — provider setup, migration, rollback, pricing limits, and manual verification guide.
- `src/lib/database.types.ts` — generated TypeScript types for the live Supabase schema.
- `netlify.toml` — static build, SPA route fallback, and baseline response headers.
- `docs/IMPLEMENTATION-STATUS.md` — what works today and what still requires provider configuration or implementation.
- `docs/PRODUCTION-GAP-AUDIT.md` — readiness gaps and launch blockers.
