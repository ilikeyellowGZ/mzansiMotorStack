# mzansiMotorStack

MzansiMotorStack is a dealership operations app for independent South African dealerships. The current slice includes the public product site, a seven-step owner onboarding flow, invited employee acceptance, a clearly isolated sample workspace, and a tenant-scoped Supabase schema for onboarding and service requests.

## Run locally

Use Node.js 22.12+ or 24+ and npm.

```powershell
npm install
npm run dev:demo
```

The demo runs without a Supabase project. Its onboarding progress is stored only in the current browser session, and its dealership dashboard uses fictional records. It cannot create real accounts or launch paid services.

Production mode is intentionally gated. Configure an approved Supabase project and legal notice versions before using `npm run dev` with `VITE_APP_MODE=production`. Follow [the setup and integration report](docs/IMPLEMENTATION-STATUS.md) before enabling a live signup.

## Build and checks

```powershell
npm test
npm run build
```

## Key files

- `src/onboarding/OnboardingWizard.tsx` — owner setup, invitation acceptance, pricing, and appointment-request screens.
- `src/lib/onboarding.ts` — plan totals, setup prices, and quote arithmetic.
- `supabase/migrations/202611070001_onboarding_and_billing_intents.sql` — tenant data, RLS, terms capture, invitation acceptance, and idempotent onboarding requests.
- `netlify.toml` — static build, SPA route fallback, and baseline response headers.
- `docs/IMPLEMENTATION-STATUS.md` — what works today and what still requires provider configuration or implementation.
- `docs/PRODUCTION-GAP-AUDIT.md` — readiness gaps and launch blockers.
