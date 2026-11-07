# MzansiMotorStack design system

## 1. Product direction

An operations workspace and public site for independent South African dealerships. Translate Caeli Énergie's live visual language into MzansiMotorStack: an inset, shallow outlined header with a separate action block; oversized, heavy uppercase display typography; generous editorial spacing; quiet borders; and simple directional actions. The product retains its supplied logo, dealership content, existing functionality, warm paper and white surfaces, pine and lime interface colors, and gold confined to its established supporting role. CRM views use the same typographic character at a practical scale. The contract uses the supplied brief and runtime inspection of the live homepage at 390, 768, 1366 and 1920px.

## 2. Color

The existing palette is the source of truth. Keep literal values here and use semantic CSS aliases in components.

| Palette token | Value | Semantic aliases | Use |
|---|---|---|---|
| `--ink` | `#18211E` | `--color-text-primary` | Main text |
| `--ink-soft` | `#59635E` | `--color-text-muted` | Secondary text |
| `--paper` | `#F5F5F0` | `--color-canvas` | Page background |
| `--surface` | `#FFFFFF` | `--color-surface` | Panels and forms |
| `--line` | `#E5E8E0` | `--color-border` | Dividers and borders |
| `--pine` | `#24352F` | `--color-action-secondary`, `--color-info-text` | Primary brand surface and dark action |
| `--lime` | `#D7F26B` | `--color-action-primary` | Primary action and highlight |
| `--mint` | `#EAF2E9` | `--color-success-surface`, `--color-info-surface` | Success and soft information |
| `--amber` | `#F3E5C8` | `--color-warning-surface` | Warning surface |
| `--red` | `#A9453C` | `--color-error` | Error and destructive state |

Additional semantic text and focus aliases reuse values already present in the interface: `--color-focus: #87A735`, `--color-success-text: #526A48`, and `--color-warning-text: #826B49`. Logo artwork is served unchanged from the supplied transparent assets. Image sampling gives approximate representative artwork colors `#025535` green and `#C89525` gold; these values describe the shaded PNG artwork and do not replace CSS tokens. Use gold as an accent through the source artwork; do not add a new gold UI palette.

## 3. Typography and spacing

Altform is declared by the reference but no Altform files are present in the project. Use **DM Sans** as the available geometric-grotesque substitute, loaded as a variable web font across weights 400–1000. Keep the substitution explicit until licensed Altform files are supplied. Interface text remains sentence case; reserve uppercase for public display headlines, eyebrows, and selected compact metadata. Use tabular numerals for prices, totals, dates, and metrics.

The responsive expressive scale: hero display 64–132px, section display 44–81px, 0.94–1.05 line-height and -0.02em tracking, 900 weight, uppercase. Working titles are 28–40px; section headings 18–24px; body and controls 14–16px with 1.45–1.6 line-height. Small metadata uses 12–14px. Reference desktop anchors at about 1363px are 132.5px / 124.6px for the hero, 80.5px / 80.5px for large sections, and 15.1px / 18.9px, 700 weight for navigation.

Spacing uses a 4px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, and 160px. The shared `--page-gutter` is `clamp(1rem, 2vw, 4rem)`; public section spacing is 80–160px desktop. CRM content uses 24–40px section spacing and 20–32px panel padding. The reference header uses 14px top offset, 28px horizontal inset, 57px panels and CTA, 9–10px gap, and 5px CTA radius, scaled down responsively. Keep controls at least 40px, touch controls at least 44px, and use a 4–6px radius for navigation and main actions. Existing layout breakpoints are 400, 420, 560, 640, 760, 900, 1000, 1150, 1200, and 1440px.

**Fluid width contract:** page wrappers, the public header, sections, footer, CRM header and CRM content use the available parent width with no page-wide maximum. Gutters are applied once at each shell boundary. Grids use fractional tracks and `minmax(0, 1fr)` where content must shrink. Dense tables scroll inside their panels. Local text measures and the onboarding form may remain capped for reading comfort; they do not cap a whole page or working region. At 1920, 2560, 3440 and 3840px, the public and workspace headers and content continue to widen.

**Live reference observations:** At 1366px, Caeli's loaded hero H1 computed to Altform 900, 132.806px, 124.837px line height and -2px tracking. At 390px it computed to 52px, 47.84px line height and -1px tracking. Its header measured 57px high with a 14px top offset at 1366px, and 52px with a 10px offset at 390px. The header slides out when scrolling down. MzansiMotorStack keeps those geometric anchors, shows the public header again on upward scroll, and uses its own palette, logo and dashboard preview.

## 4. Logo and motion

- `public/brand/mzansi-road-mark.png`: compact identity for application navigation and tight spaces. On dark surfaces, place the unmodified artwork on a small white tile for contrast.
- `public/brand/mzansi-motorstack-wordmark.png`: public headers and light authentication/onboarding areas with enough width. Keep its transparent background and original colors; do not apply filters or recolor it.
- Meaningful brand links have the accessible name `MzansiMotorStack home`. The contained image has empty alt text because the link already supplies that name.
- Control feedback uses 140ms. Surface transitions use about 220ms. Prefer opacity and transform for infrequent screen entry; color and border transitions communicate control feedback. Do not animate data, use looping logo motion, or add movement to frequent actions. Gate hover movement to hover-capable fine pointers.
- Under `prefers-reduced-motion`, keep interface state and feedback while reducing movement. Do not rely on animation to communicate loading, validation, route, or completion.

## 5. Components and usage

| Component/pattern | Use | States and accessibility |
|---|---|---|
| Public inset header | Brand lockup, public anchors, preview/login utilities and separated primary CTA | 57px desktop panels, 14/28px inset, narrow gap; responsive menu; focus-visible and keyboard access |
| Public page navigation | Shared links to product sections, pricing, tutorial, privacy notice and service terms | Desktop links, mobile menu with expanded state and close-on-navigation, current page state where practical |
| Pricing plan card and billing choice | Compare the three plans using the onboarding price source | Monthly/annual selected state, readable ZAR totals, setup and tax caveats, keyboard-accessible selection and CTA |
| Workspace header and navigation | Workspace identity, grouped available destinations, search and account actions | Current, hover, focus, mobile drawer; labelled nav, `aria-current`, keyboard operation |
| Brand lockup | Road mark in compact slots, full wordmark on light surfaces with room | Preserve source art; use meaningful link labels and sufficient contrast |
| Buttons and icon buttons | Primary, secondary, quiet, outline, and icon actions | Default, hover, pressed, focus-visible, disabled, loading; native button/link semantics and 40/44px targets |
| Page header and toolbar | Page title, context, primary action, search and local filters | Responsive wrap; labelled search and selected filter state |
| Form field | Text, search, select, choice, validation and save feedback | Default, focus, filled, invalid, disabled; visible label, described error, keyboard support |
| Metric group | Stock, enquiry, appointment and task summaries | Use tabular numerals; label values and avoid unsupported calculations |
| Dashboard panel and chart frame | Performance, activity and related record groups | Thin border, restrained radius, chart summary text and readable labels |
| Data list/table | Vehicle inventory, customer enquiries, tasks and related records | Aligned columns, local horizontal scrolling or responsive summaries, labelled status and actions |
| Status badge | Availability, preparation, reservation, lead and service states | Text always accompanies color; use semantic success, warning, error, or information roles |
| Vehicle thumbnail and avatar | Identify dealership records and assigned people | Decorative visuals use empty alt text; preserve a text label in the record |
| Activity timeline, alert, toast and empty state | Progress, feedback, errors, loading and absence of records | Announce status where appropriate; actionable recovery links stay keyboard-accessible |
| Menu, drawer and dialog | Account actions, mobile navigation, focused workflows | Button triggers, visible focus, correct expanded state, escape behavior, labelled dialog where implemented |

The React implementation has no component-library dependency. Existing shared JSX and CSS patterns are reused; the preview component gallery at `/demo/components` demonstrates action, field, status, vehicle, metric/chart, activity/checklist, feedback, disabled, empty, alert, loading, permission, menu, tooltip, native dialog, drawer, table, selection and pagination patterns using preview-only examples. The active repository implements public landing, pricing, tutorial and draft legal notice pages, authentication, onboarding, the workspace overview, stock, leads, tasks, and the demo gallery. Pricing draws from `src/lib/onboarding.ts`; legal pages must not imply approval or lift the production signup gate. Customer, deal, finance, service, reports, settings, and calendar routes do not currently exist; do not fabricate those modules or route destinations during visual styling.

## 6. Responsive behavior and data boundaries

Workspace destinations stay reachable in the compact CRM navigation and collapse to an accessible mobile drawer. Dashboard performance and actionable records share a balanced desktop grid and stack on narrow screens. Dense inventory and enquiry records scroll locally instead of forcing whole-page horizontal overflow. Filters and common mobile actions provide comfortable touch targets. Public headers retain section links, pricing, draft legal notices, demo, sign-in and the actual workspace action; the mobile menu and footer also expose the tutorial.

`/demo/*` uses illustrative local fixtures and clearly identifies them as preview data. `/app` uses live setup status and truthful production empty states. Do not move demo fixtures to production or introduce records, calculations, branch selectors, or unsupported workflows that are not implemented. Customer, deal, finance, service, reporting, settings, and calendar features remain outside this implemented-screen design until those modules exist.

## 7. Known mapping and implementation notes

The CSS contains legacy component-specific shades beyond the core palette. Normalize them to semantic roles when their meaning is clear; retain an unresolved mapping as documented debt instead of silently changing its appearance or inventing a new status. Authentication providers may render their own fields and controls; style them through supported appearance APIs and surrounding application surfaces.

When changing this design system, update the component gallery and keep the product behavior, authentication, permissions, integrations, and data contracts intact.
