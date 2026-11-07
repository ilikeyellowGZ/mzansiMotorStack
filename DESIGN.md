# mzansiMotorStack design system

## 1. Product direction

An operations workspace for independent South African dealerships and multi-branch groups. The visual direction borrows the supplied reference's soft, airy surfaces, restrained typography and compact status cards, then gives them a grounded dealership character: warm paper, deep pine ink and a sharp citron marker. Small vehicle illustrations and a considered dashboard grid make the first visit memorable without adding stock photography or implying live integrations.

## 2. Color

| Token        | Value     | Use                           |
| ------------ | --------- | ----------------------------- |
| `--ink`      | `#18211E` | Main text and dark navigation |
| `--ink-soft` | `#59635E` | Secondary text                |
| `--paper`    | `#F5F5F0` | Page background               |
| `--surface`  | `#FFFFFF` | Main cards and forms          |
| `--line`     | `#E5E8E0` | Dividers and borders          |
| `--pine`     | `#24352F` | Primary brand surface         |
| `--lime`     | `#D7F26B` | Main action and highlights    |
| `--mint`     | `#EAF2E9` | Soft status surface           |
| `--amber`    | `#F3E5C8` | Attention state               |
| `--red`      | `#A9453C` | Error and destructive state   |

## 3. Typography

Use `DM Sans` for interface and display text, loaded from Google Fonts with system sans-serif fallback. Use a compact type scale: display 56/1.03, page title 32/1.15, section title 20/1.3, body 15/1.55, caption 12/1.4. At narrow widths the display size reduces with `clamp()`.

## 4. Layout and spacing

Spacing follows a 4px base: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80. Marketing content is capped at 1200px with generous section spacing; authenticated screens use a 248px sidebar and flexible content column. Breakpoints: 640px, 900px and 1200px. Mobile views collapse navigation and dashboard columns without horizontal scrolling.

## 5. Components

### Button

- Structure: semantic button or link with icon slot and label.
- Variants: primary lime, dark, quiet, outline.
- States: default, hover, pressed, focus-visible, disabled, loading.
- Accessibility: native keyboard behavior; visible high-contrast focus ring; icon is decorative when label exists.
- Motion: color and transform transitions, 140ms ease-out; respects reduced motion.

### Form field

- Structure: label, input/select, hint or error.
- Variants: text, email, password, select.
- States: default, focus, filled, invalid, disabled.
- Accessibility: visible labels, appropriate autocomplete/input types, described validation errors.

### Surface card

- Structure: white surface, subtle border, 20px radius, 20–28px padding.
- Variants: metric, action, vehicle, onboarding step.
- States: default, hover when interactive, selected, empty.
- Accessibility: use a button/link for clickable cards; decorative art is hidden from assistive technology.

### Application navigation

- Structure: brand, workspace selector, grouped links, account controls.
- Variants: desktop rail and mobile drawer.
- States: current, hover, focus, collapsed.
- Accessibility: labeled navigation, `aria-current="page"`, keyboard-operable menu.

### Contact form

- Structure: visible labels, required identity/contact fields, a message textarea, and a clear preview notice.
- Variants: compact landing-page panel.
- States: default, focus, native validation error, preview confirmation.
- Accessibility: associated labels, email input semantics, keyboard operation, and status announcement after submit.

### Public guide

- Structure: editorial title, preview-scope banner, anchored contents list, numbered steps, and contextual links.
- Variants: setup tutorial and prototype data notice.
- States: default and keyboard focus.
- Accessibility: semantic headings, real anchor links, readable line length, and responsive single-column layout.

## 6. Motion

Use 140ms for control feedback and 220ms for surface transitions, with opacity and transform only. Keep movement subtle and preserve the reduced-motion preference.

## 7. Surface and depth

Use a mixed treatment: fine warm-gray borders for structure, one soft elevation shadow for floating panels, and tonal contrast for the dark sidebar. Avoid pervasive glass effects. Form and dashboard cards remain calm and legible.
