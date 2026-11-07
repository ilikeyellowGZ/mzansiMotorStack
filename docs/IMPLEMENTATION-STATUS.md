# Implementation and integration status

## Delivered

- A responsive account-first onboarding journey for dealership owners, including optional website/social questions, setup method, subscription comparison, setup fee schedule, and final review.
- Exact plan prices: Essentials R849/month or R9,169.20/year; Growth R1,500/month or R16,200/year; Managed R3,500/month or R37,800/year. Annual savings are R1,018.80, R1,800, and R4,200 respectively.
- Setup fees: self-service Essentials and Growth R0; self-service Managed R4,500 for website/social launch; assisted Essentials R1,499, Growth R2,999, and Managed R5,999. Managed launch is a single package and does not stack another website fee.
- Growth assisted setup split into R999.67, R999.67, and R999.66. Annual subscription is charged upfront in the quote model; setup instalments are separate.
- Appointment requests in Africa/Johannesburg local time, always shown as requests until someone confirms availability. In-person travel pricing stays pending.
- Owner email confirmation and account recovery wiring; invite token acceptance validates expiry, verified email match, and joins an existing organization.
- Supabase schema/RLS and transactional onboarding RPC. One default location is created behind the scenes. A unique onboarding request per owner and unique service request per requested service prevent duplicate work from retries.
- A production workspace status page that does not show demo records and states clearly that billing, imports, and service work are not active.
- Netlify SPA routing configuration and pure pricing/URL unit tests.

## Deliberately not connected or launch-ready

- There are no Supabase project credentials in this workspace, and the local Supabase CLI and Docker are unavailable. The migration has not been applied or run against PostgreSQL.
- Supabase Auth, database persistence, invitation acceptance, and password recovery are implemented in code but require project setup, configured redirect URLs, and approved legal notice versions. SMTP is not configured.
- Resend is not configured. Use it as the verified SMTP sender for Supabase Auth only after domain verification and sender configuration. Transactional emails for onboarding requests and appointment requests still need a trusted function and templates.
- Storage policies, private buckets, uploads, CSV mapping/import, and data review are not implemented.
- No payment provider, checkout, webhook, recurring billing, paid entitlement, tax setting, AI allowance, or messaging allowance is configured. The flow submits a non-payment request and cannot charge or activate a subscription.
- Netlify configuration is present, but no Netlify site is linked or deployed.
- Employee invitation acceptance exists, but owners cannot yet create/send invitations from the workspace.

## Configuration sequence

1. Create a Supabase project; apply the SQL migration and run database/RLS checks in that project.
2. Approve and publish the actual service terms and privacy notice. Set matching versions in the app environment and the private `pricing_configuration` row. Keep signup blocked until both versions match.
3. Configure Auth email confirmations, production Site URL, exact callback URLs, password reset URL, and Resend SMTP credentials. Verify email delivery before inviting customers.
4. Confirm tax treatment, AI/message allowances and service terms centrally. Keep signup/checkout unavailable while these are unresolved.
5. Choose and implement a payment provider adapter and signed webhook. Add idempotency and payment lifecycle tests before paid entitlements are enabled.
6. Create private Storage buckets and upload policies; implement upload review and import validation.
7. Connect Netlify, set the Vite public Supabase variables, add the Netlify domain to Supabase Auth URLs, and validate deep links, email callbacks, and mobile layout on the production hostname.

## Local verification

- `npm test`: 11 pricing, setup-scope, URL, and disabled-payment-adapter tests pass.
- `npm run build`: TypeScript and Vite build pass. Code splitting keeps the largest generated chunk at about 258 kB minified.
- `npm run doctor -- --json`: no Performance-category findings after the final scan. Maintainability findings remain for the large wizard and app shell.
- Browser-based visual and real Supabase/Postgres verification could not be completed in this environment. Browser access host was unavailable; Docker and the Supabase CLI are not installed.
