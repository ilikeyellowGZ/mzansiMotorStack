# Implementation and integration status

## Delivered

- A responsive account-first onboarding journey for dealership owners, including optional website/social questions, setup method, subscription comparison, setup fee schedule, and final review.
- Exact plan prices: Essentials R849/month or R9,169.20/year; Growth R1,500/month or R16,200/year; Managed R3,500/month or R37,800/year. Annual savings are R1,018.80, R1,800, and R4,200 respectively.
- Setup fees: self-service Essentials and Growth R0; self-service Managed R4,500 for website/social launch; assisted Essentials R1,499, Growth R2,999, and Managed R5,999. Managed launch is a single package and does not stack another website fee.
- Growth assisted setup split into R999.67, R999.67, and R999.66. Annual subscription is charged upfront in the quote model; setup instalments are separate.
- Appointment requests in Africa/Johannesburg local time, always shown as requests until someone confirms availability. In-person travel pricing stays pending.
- Owner email confirmation and account recovery wiring; invite token acceptance validates expiry, verified email match, and joins an existing organization.
- Supabase project linked and authenticated through MCP and CLI. The onboarding and dealership operations migrations are applied to the linked project, with local migration history aligned to remote history.
- Tenant-scoped Supabase schema/RLS for organizations, locations, customer records, vehicles and media, leads and activity, tasks, appointments, deals, trade-ins, invoices, payments, documents, imports, service delivery, subscriptions, notifications, and social profiles. Four private Storage buckets and organization-path policies are configured.
- Transactional onboarding RPC. One default location is created behind the scenes. Unique onboarding and service request constraints prevent duplicate work from retries. Generated TypeScript database types reflect the live schema.
- A production workspace status page that does not show demo records and states clearly that billing, imports, and service work are not active.
- Netlify SPA routing configuration and pure pricing/URL unit tests.

## Deliberately not connected or launch-ready

- Supabase Auth, database persistence, invitation acceptance, and password recovery are implemented in code. Production redirect URLs and approved legal notice versions still need configuration. SMTP is not configured.
- Resend is not configured. Use it as the verified SMTP sender for Supabase Auth only after domain verification and sender configuration. Transactional emails for onboarding requests and appointment requests still need a trusted function and templates.
- Private Storage buckets and tenant-scoped policies are configured. Upload screens, signed upload workflows, scanning, CSV mapping/import, and data review are not implemented.
- Paystack checkout, transaction verification, signed webhook handling, recurring card subscriptions, scheduled setup instalments, and idempotent activation are implemented as Supabase Edge Functions. The migration and functions are local and still need deployment. Checkout stays blocked until tax treatment is configured, and no Paystack credentials are present.
- Netlify configuration is present, but no Netlify site is linked or deployed.
- Employee invitation acceptance exists, but owners cannot yet create/send invitations from the workspace.

## Configuration sequence

1. Supabase project linking and migrations are complete. Review the database advisors periodically as real workload develops.
2. Approve and publish the actual service terms and privacy notice. Set matching versions in the app environment and the private `pricing_configuration` row. Keep signup blocked until both versions match.
3. Configure Auth email confirmations, production Site URL, exact callback URLs, password reset URL, and Resend SMTP credentials. Verify email delivery before inviting customers.
4. Confirm tax treatment, AI/message allowances and service terms centrally. Keep signup/checkout unavailable while these are unresolved.
5. Configure tax treatment and approved pricing, set Paystack test credentials as Supabase Edge Function secrets, deploy the billing migration/functions, register the webhook URL in Paystack, and test payment, renewal, cancellation, failure, retry, and setup instalment flows before using live credentials.
6. Create private Storage buckets and upload policies; implement upload review and import validation.
7. Connect Netlify, set the Vite public Supabase variables, add the Netlify domain to Supabase Auth URLs, and validate deep links, email callbacks, and mobile layout on the production hostname.

## Local verification

- `npm test`: 11 pricing, setup-scope, URL, and disabled-payment-adapter tests pass.
- `npm run build`: TypeScript and Vite build pass. Code splitting keeps the largest generated chunk at about 258 kB minified.
- `npm run doctor -- --json`: no Performance-category findings after the final scan. Maintainability findings remain for the large wizard and app shell.
- Remote Supabase migration history, tables, generated types, security/performance/health advisors, and CLI linkage were checked. Docker is unavailable, so no local PostgreSQL stack was used.

## Paystack setup

- Required server secret: `PAYSTACK_SECRET_KEY` in Supabase Edge Function secrets. Never add it to a `VITE_*` variable or the browser bundle.
- Optional newer webhook signing secret: `PAYSTACK_WEBHOOK_SECRET`. The webhook also supports Paystack's `x-paystack-signature` HMAC using the secret key.
- Register `https://<project-ref>.supabase.co/functions/v1/paystack-webhook` in Paystack's webhook settings.
- The checkout creates Paystack plans on demand and supports card payments only, as Paystack recurring subscriptions require a reusable card authorization.
- Checkout intentionally returns an error while the saved quote has `configuration_required` tax treatment; it will not charge an unfinalized subtotal.
