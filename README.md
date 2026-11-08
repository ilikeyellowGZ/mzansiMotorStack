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

## Enable MotorStack Assistant

The bottom-left widget is available on the public site and in the app. In the unconfigured demo it shows an honest offline state. With the server connection enabled, free-text answers use Groq Chat Completions through a Supabase Edge Function; plan prices and cards come from the same source as the pricing page. A reviewed person or demo request is saved to `assistant_enquiries`. No live agent or confirmed appointment is implied.

1. Apply `supabase/migrations/20261108113546_assistant_enquiries_and_history.sql` after the existing Clerk identity migration. Deploy the `motorstack-assistant` Edge Function with `verify_jwt = false`; it verifies signed-in Clerk tokens itself and restricts public requests by origin and database rate limits.
2. Create a key in the [Groq console](https://console.groq.com/keys) and set Edge Function secrets `GROQ_API_KEY`, `GROQ_MODEL`, `ASSISTANT_RATE_LIMIT_SALT` (24+ random characters), `MOTORSTACK_SUPABASE_SECRET_KEY` (the project's `sb_secret_...` key), `APP_ALLOWED_ORIGINS`, `CLERK_SECRET_KEY`, and `CLERK_ISSUER`. Include each exact production site origin in `APP_ALLOWED_ORIGINS`. Supabase reserves the `SUPABASE_` prefix for platform-provided variables, so use the exact `MOTORSTACK_SUPABASE_SECRET_KEY` name here. The function can also use the platform-provided legacy `SUPABASE_SERVICE_ROLE_KEY` when a new secret key has not been configured. Never put the Groq or server secret in a `VITE_*` variable.
   - The configured alternative is `GROQ_MODEL=qwen/qwen3.8-27b`. Groq currently lists Qwen 3.8 27B as a **preview** model, so check availability and suitability before production release. Its strict JSON Schema output is used for response structure. [Groq's model list](https://console.groq.com/docs/models) and [structured-output guide](https://console.groq.com/docs/structured-outputs) document this.
   - Set `GROQ_MODEL=llama-3.3-70b-versatile` only if your Groq Enterprise project has access. [Groq retired that model for free and developer tiers on 16 August 2026](https://console.groq.com/docs/deprecations). Llama uses JSON Object Mode without schema enforcement; the server still validates every model field. Prices, permissions and submissions stay under application control. The function returns a configuration error if Groq rejects the selection.
3. Set the site's existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Clerk settings are needed for private onboarding context and signed-in chat history. Enquiries can be reviewed by the project operator in the Supabase Dashboard; set up an operational notification or queue before promising a response time.
4. Complete and approve the draft privacy notice, operator contact and legal configuration before opening production signup. The assistant history expires after 30 days and enquiry records after 90 days. The function purges expired records on requests; schedule `select public.purge_assistant_expired()` daily with an operator job so deletion continues during periods with no traffic.

The existing onboarding wizard remains the final review and submission path. The chat's compact setup form saves website, social and self versus assisted setup choices only after review. It never marks an onboarding request complete on its own. There is no public vehicle catalogue, so the assistant does not recommend individual cars.

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
