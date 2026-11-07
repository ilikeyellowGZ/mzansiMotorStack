# MzansiMotorStack Brand and Dashboard Implementation Plan

> **For agentic workers:** Execute this plan task-by-task in this session. Steps use checkbox syntax for tracking.

**Goal:** Apply the approved brand dashboard design to existing MzansiMotorStack screens with reusable visual foundations, logos, motion, responsive behavior, and a realistic preview gallery.

**Architecture:** Preserve the React/Vite/React Router application and its business logic. Add semantic aliases and shared CSS/React primitives in the existing UI files, use the provided transparent logos as assets, and redesign only implemented screens and honest preview data. Keep production status separate from preview fixtures.

**Tech Stack:** React 19, TypeScript, Vite, React Router 7, Lucide React, CSS.

**Spec:** `docs/superpowers/specs/2026-11-07-mzansi-motorstack-brand-dashboard-design.md`

## Global Constraints

- Preserve existing palette: ink `#18211E`; secondary ink `#59635E`; canvas `#F5F5F0`; surface `#FFFFFF`; divider `#E5E8E0`; pine `#24352F`; lime `#D7F26B`; mint `#EAF2E9`; amber surface `#F3E5C8`; error `#A9453C`.
- Keep DM Sans and Lucide React; do not add a component library or animation dependency.
- Do not alter authentication, permissions, database, Supabase, pricing, integrations, or business logic.
- Do not show preview fixtures in production or invent unavailable metrics.
- Motion uses 140ms controls and about 220ms surfaces, with reduced-motion support.
- Validate layouts at 1440, 1024, 768, and 390px; prevent whole-page horizontal overflow.

## File Map

- `src/styles.css`: semantic aliases, consistent component states, typography/spacing, responsive adjustments, brand image sizing, and motion rules.
- `src/App.tsx`: shared brand lockups, existing application shell and preview screens, dashboard layout, gallery, and app route where appropriate.
- `src/onboarding/OnboardingWizard.tsx`: replace inline approximation with provided full logo in onboarding brand location.
- `DESIGN.md`: final token audit, logo placement, components, states, responsiveness, motion, and known workflow boundaries.
- `docs/IMPLEMENTATION-HANDOFF.md`: concise completion and validation handoff.
- `public/brand/`: copies of provided transparent source PNG assets using stable web paths.
- `docs/superpowers/plans/2026-11-07-mzansi-motorstack-brand-dashboard.md`: this execution checklist.

## Task 1: Inspect current visual implementation and assets

**Files:** Read `src/App.tsx`, `src/styles.css`, `src/onboarding/OnboardingWizard.tsx`, `DESIGN.md`, and route map; do not edit unrelated files.

- [ ] Map current route names to screens, preview fixture boundaries, navigation controls, existing responsive rules, and duplicated brand marks.
- [ ] Confirm transparent logo asset dimensions and use the existing source artwork unchanged.
- [ ] Record current token and remaining literal color usages; group literals by existing semantic role before editing.

**Verification:** Inspection only. Confirm paths and scopes against the current source, including current uncommitted changes.

## Task 2: Establish design tokens and brand primitives

**Files:** Modify `src/styles.css`, `src/App.tsx`, `src/onboarding/OnboardingWizard.tsx`; create `public/brand/mzansi-road-mark.png` and `public/brand/mzansi-motorstack-wordmark.png`.

- [ ] Copy the logo assets into `public/brand/` without altering pixels.
- [ ] Add semantic CSS aliases that resolve to the existing palette; create roles for canvas, surface, text, muted text, borders, actions, focus, and statuses.
- [ ] Add typography roles at 12, 14, 16, 20, 24, and 32px; add tabular-number and 4px-based spacing utilities/tokens.
- [ ] Add shared brand lockup using the compact mark in the sidebar and the wordmark in public/auth/onboarding contexts; provide meaningful or empty alt text according to whether adjacent text duplicates the name.
- [ ] Consolidate button, field, focus, surface, selected, loading, disabled, and status styles where current markup permits. Keep desktop controls about 40px and touch controls at least 44px.
- [ ] Ensure motion tokens are 140ms for controls and 220ms for surfaces. Reduce nonessential animations under `prefers-reduced-motion`.

**Verification:** Build the app and inspect existing brand locations and focus styles before proceeding.

## Task 3: Redesign preview dashboard and add component gallery

**Files:** Modify `src/App.tsx` and `src/styles.css`.

- [ ] Restructure preview `Overview` into a compact page toolbar, concise metric group, performance panel, and actionable task/stock records using existing fixture values.
- [ ] Keep the existing currency formatter and only display calculations already present in source.
- [ ] Create a responsive `ComponentGallery` screen in preview mode with button, field, status, panel, table, alert, empty-state, and logo examples using clear preview-only data.
- [ ] Add a preview-only link/route to the gallery without exposing it as a production module.
- [ ] Add motion to route/screen content only as a short opacity and small transform transition; keep route semantics/focus unchanged.

**Verification:** Build. Manually inspect `/demo`, `/demo/stock`, `/demo/leads`, `/demo/tasks`, and the gallery at 1440px and 390px.

## Task 4: Apply shared system to implemented workflows

**Files:** Modify `src/App.tsx`, `src/styles.css`, `src/onboarding/OnboardingWizard.tsx`.

- [ ] Apply consistent page headers, compact working surfaces, filters and table/record layouts to stock, leads, and tasks without changing actions or data.
- [ ] Apply the foundations to production workspace status and empty states while preserving truthful copy and absence of demo records.
- [ ] Apply logo, field, button, focus, validation, and save-feedback styles to onboarding/auth/public pages where custom markup is owned by this app.
- [ ] Add responsive treatment for navigation and dense records; use local horizontal scrolling when record width cannot reasonably collapse.
- [ ] Consolidate local status colors to semantic tokens only when the semantic meaning is clear; retain any unresolved mapping as documented debt.

**Verification:** Build and check route navigation, search/filter controls, forms, dialogs/table actions where present, keyboard focus, touch targets, reduced motion, and widths 1024px and 768px.

## Task 5: Document, review, and hand off

**Files:** Modify `DESIGN.md`; create `docs/IMPLEMENTATION-HANDOFF.md`; update this plan's task boxes.

- [ ] Document final preserved palette values, semantic aliases, type/spacing roles, reusable components, component states, logo use, motion, breakpoints, and limitations.
- [ ] Write a concise handoff listing screen coverage, production/preview data boundary, responsive checks, interactions checked, and remaining unsupported workflows.
- [ ] Run `npm run build` and the existing `npm test` only after the UI is complete; address failures caused by this change.
- [ ] Review the diff and confirm the pre-existing unrelated onboarding/auth/Supabase changes remain untouched.

**Verification:** Build and existing unit tests pass; visual inspection confirms no whole-page horizontal overflow and reduced-motion behavior is present.
