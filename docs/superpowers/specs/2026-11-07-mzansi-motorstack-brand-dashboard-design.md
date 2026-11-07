# MzansiMotorStack Brand and Dashboard Design

## Goal and scope

Apply the supplied dealership dashboard brief to the existing application while keeping its current behavior, data boundaries, and green-and-gold brand identity. Establish shared visual foundations, redesign the preview dashboard as the reference workflow, then apply the system to implemented screens. Add the supplied marks to the application brand and use subtle, accessible transitions throughout.

The current production workspace intentionally contains setup status and empty module states. The preview routes contain illustrative dashboard, stock, leads, and tasks data. Redesigns must preserve this separation and must not present preview data as production records. Modules listed in the brief but not currently implemented remain outside the UI redesign until they exist.

## Current application audit

- Stack: React 19, TypeScript, Vite, React Router 7, Lucide React, plain CSS.
- Existing design contract: `DESIGN.md`; global styling and most screens are in `src/styles.css` and `src/App.tsx`. Onboarding is in `src/onboarding/OnboardingWizard.tsx`.
- Existing implemented workspace screens: overview, stock, leads, tasks, production workspace/setup status, and production empty states for other navigable modules. Public landing, tutorial, legal pages, authentication, and onboarding are also present.
- Type: DM Sans with system sans-serif fallback.
- Existing palette (preserve): ink `#18211E`; secondary ink `#59635E`; canvas `#F5F5F0`; surface `#FFFFFF`; divider `#E5E8E0`; pine `#24352F`; lime `#D7F26B`; mint `#EAF2E9`; amber surface `#F3E5C8`; error `#A9453C`.
- Existing status colors are used locally and should be normalized to the established semantic roles during implementation; do not invent new status meanings.
- Existing motion contract: 140ms control feedback and 220ms surface transitions, primarily opacity and transform, with a reduced-motion media query.
- Supplied compact road mark and full wordmark are transparent PNG assets. The source artwork visibly uses deep green and gold. Pixel sampling of the shaded artwork gives approximate representative values of `#025535` green and `#C89525` gold; these are asset observations, not replacements for the CSS tokens. Use the source artwork without recoloring. The existing pine and lime remain UI tokens; gold remains a restrained brand accent. Any mapping between sampled logo green and existing pine remains unresolved and should be retained as separate `logo artwork` and `UI token` references.
- Existing component library: no component framework; shared controls and patterns are authored in React/CSS. Lucide React is the current icon family.

## Visual direction

Use the brief's calm, precise financial-dashboard language: editorial page hierarchy, clear aligned numbers, compact tables, thin dividers, generous section spacing, efficient working areas, subtle shadows, and restrained color. Retain the warm canvas and dark navigation. Avoid excessive rounding, oversized cards, ornamental gradients, glass effects, and unnecessary elevation.

Use the compact road mark in constrained navigation and small identity slots. Use the full wordmark in the public header, authentication/onboarding spaces, and other locations with enough width. Preserve transparent backgrounds and adequate clear space; do not recreate the logo with text or recolor it. Logo alt text should identify MzansiMotorStack when informative; purely decorative repetitions should have empty alt text.

## Foundations and tokens

Keep the palette-to-semantic-to-component model. Preserve existing values and introduce aliases rather than parallel palettes. Semantic roles cover canvas, surface, primary and muted text, borders, primary action, secondary action, focus, success, warning, error, and information. Component CSS should consume semantic roles, not new literal color values.

Use DM Sans; establish 12, 14, 16, 20, 24, and 32px roles while preserving suitable existing display styles. Use regular, medium, and semibold weights. Enable tabular numerals for currency and metrics. Use the existing 4px spacing rhythm, extended to the brief's 20px and 48px stops where needed. Controls target 40px desktop and 44px touch height; panels use restrained 8–12px corners. Retain Lucide React. Layout uses consistent page margins and the current responsive breakpoints, with explicit validation at 1440, 1024, 768, and 390px.

## Shared components

Build or consolidate reusable styles/components for the application shell, logo lockups, navigation, page headers, buttons and icon buttons, links, tabs, breadcrumbs, form fields, selection controls, feedback, metric groups, dashboard panels, charts, tables, filter bars, pagination, status badges, avatars, vehicle thumbnails, activity, overlays, alerts, skeletons, empty states, and errors. Prefer extracting primitives that are already repeated; do not alter backend contracts or authentication flows.

Define applicable default, hover, pressed, focus-visible, selected, disabled, loading, invalid, and empty states. Use native semantics, visible keyboard focus, labelled controls, text status labels, accessible dialog/menu behavior, and local horizontal scrolling or record summaries for wide tables.

## Dashboard and workflows

The preview overview is the visual reference screen. Use a compact page toolbar, useful primary action, and period control only where supported by current data. Desktop layout places performance information beside actionable records; narrower layouts stack sections in reading order. Use only available data and existing calculations. Do not invent profit, trends, conversion rates, or percent changes. Any illustrative fixture remains clearly scoped to preview routes.

Carry shared headers, filters, tables, detail summaries, and form treatments to existing stock, leads, tasks, onboarding/authentication, public pages, and production status/empty states as applicable. Keep the production setup status factual. Do not add unsupported customer, deal, finance, service, report, settings, or calendar workflows solely to populate a gallery.

## Motion and accessibility

Use the existing motion contract as the baseline: 140ms for control feedback and about 220ms for surfaces. Favor opacity, color, border, and transform. Page/screen transitions may use a short opacity and small vertical offset only when they do not interfere with routing or focus. Avoid looping or attention-seeking logo animation. Use the road mark as a static brand anchor; any one-time reveal should be brief and decorative. Respect `prefers-reduced-motion` by removing nonessential movement and preserving state feedback.

Keep focus visible, contrast readable, status names alongside colors, touch targets comfortable, and motion optional. Do not rely on animation to communicate route, validation, loading, or completion state.

## Gallery, documentation, and handoff

Update `DESIGN.md` with the final token mappings, logo rules, component anatomy and usage, states, responsive behavior, motion, and accepted limitations. Include a realistic component gallery in an existing preview surface or a focused design-system page using the app's existing routing conventions. The gallery must use honest preview fixtures, not production records.

The handoff should summarize preserved token values, logo placements, shared primitives, screen coverage, motion/reduced-motion behavior, responsive validation, and any implemented-flow gaps found during review.

## Implementation sequence and validation

1. Finish the audit and map current literals to existing semantic tokens; record any genuinely unresolved mappings.
2. Define and document shared foundations, logo placement, responsive rules, states, and motion before screen styling.
3. Implement the reusable primitives and preview component gallery.
4. Redesign the preview dashboard and its supported data presentation.
5. Apply the shared treatments to all implemented workflows and public/auth/onboarding surfaces without changing business logic.
6. Check representative interactions (navigation, search/filter controls, forms, dialogs, and table actions where implemented) and responsive sizes 1440/1024/768/390px. Confirm reduced-motion and keyboard focus behavior. Run the existing build and checks.

No database schema, Supabase access policy, authentication, permission, integration, pricing, or production-data behavior is part of this visual change.
