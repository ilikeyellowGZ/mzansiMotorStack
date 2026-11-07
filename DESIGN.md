# MzansiMotorStack design system

## 1. Product direction

An operations workspace for South African dealerships. Use a calm, precise dashboard language: editorial headings, thin dividers, aligned numbers, readable status labels, and concise record views. The brand uses the supplied green-and-gold road marks with the application's existing pine and lime interface colors. The visual system remains grounded in warm paper, deep pine navigation, and restrained elevation.

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

Use DM Sans for interface and display text with an Arial/system fallback. Semantic roles are 12, 14, 16, 20, 24, and 32px. Use regular, medium, and semibold weights; use tabular numerals for prices, totals, dates, and metric values. Existing marketing display styles may retain their responsive `clamp()` treatment.

Spacing uses a 4px base: 4, 8, 12, 16, 20, 24, 32, 40, and 48px. Use 40px desktop controls and at least 44px touch controls. Controls use about 8px corners; panels use 10px corners. The existing layout breakpoints are 400, 420, 560, 640, 760, 900, 1000, 1200, and 1440px. Validate workspace views at 1440, 1024, 768, and 390px.

## 4. Logo and motion

- `public/brand/mzansi-road-mark.png`: compact identity for application navigation and tight spaces. On dark surfaces, place the unmodified artwork on a small white tile for contrast.
- `public/brand/mzansi-motorstack-wordmark.png`: public headers and light authentication/onboarding areas with enough width. Keep its transparent background and original colors; do not apply filters or recolor it.
- Meaningful brand links have the accessible name `MzansiMotorStack home`. The contained image has empty alt text because the link already supplies that name.
- Control feedback uses 140ms. Surface transitions use about 220ms. Prefer opacity and transform for infrequent screen entry; color and border transitions communicate control feedback. Do not animate data, use looping logo motion, or add movement to frequent actions. Gate hover movement to hover-capable fine pointers.
- Under `prefers-reduced-motion`, keep interface state and feedback while reducing movement. Do not rely on animation to communicate loading, validation, route, or completion.

## 5. Components and usage

| Component/pattern | Use | States and accessibility |
|---|---|---|
| Application shell and navigation | Workspace identity, route navigation, account actions | Current, hover, focus, mobile drawer; labelled nav, `aria-current`, keyboard operation |
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

The React implementation has no component-library dependency. Existing shared JSX and CSS patterns are reused; the preview component gallery at `/demo/components` demonstrates current action, field, status, vehicle, feedback and empty-state patterns using preview-only examples.

## 6. Responsive behavior and data boundaries

Workspace navigation collapses to a mobile drawer. Dashboard performance and actionable records share a balanced desktop grid and stack on narrow screens. Dense inventory and enquiry records scroll locally instead of forcing whole-page horizontal overflow. Filters and common mobile actions provide comfortable touch targets.

`/demo/*` uses illustrative local fixtures and clearly identifies them as preview data. `/app` uses live setup status and truthful production empty states. Do not move demo fixtures to production or introduce records, calculations, branch selectors, or unsupported workflows that are not implemented. Customer, deal, finance, service, reporting, settings, and calendar features remain outside this implemented-screen design until those modules exist.

## 7. Known mapping and implementation notes

The CSS contains legacy component-specific shades beyond the core palette. Normalize them to semantic roles when their meaning is clear; retain an unresolved mapping as documented debt instead of silently changing its appearance or inventing a new status. Authentication providers may render their own fields and controls; style them through supported appearance APIs and surrounding application surfaces.

When changing this design system, update the component gallery and keep the product behavior, authentication, permissions, integrations, and data contracts intact.
