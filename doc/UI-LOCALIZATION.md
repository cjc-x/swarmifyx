# UI Localization Spec

## Summary

This document defines what it means for the Abacus UI to be localized, and
what must be checked when an upstream merge introduces or changes UI.

Use this document to answer:

- which i18n system is authoritative
- which UI surfaces count as localized
- which merge-time checks are required
- which pitfalls are easy to miss

Do not use this document as the merge procedure. For the execution flow, use
[`doc/UPSTREAM-MERGE-RUNBOOK.md`](./UPSTREAM-MERGE-RUNBOOK.md).

## Single Source Boundaries

- This document defines UI-localized behavior and the merge intake checklist for
  UI text.
- [`doc/MERGE-RENAME-RULES.md`](./MERGE-RENAME-RULES.md) defines rename rules,
  legacy-name exceptions, and lockfile policy.
- [`AGENTS.md`](../AGENTS.md) and
  [`doc/SPEC-implementation.md`](./SPEC-implementation.md) define product
  invariants such as company-scoped boundaries. This document does not redefine
  those invariants.
- [`doc/UPSTREAM-MERGE-RUNBOOK.md`](./UPSTREAM-MERGE-RUNBOOK.md) defines the
  recommended merge sequence and verification flow.

## Terminology

- `UI-localized`: all user-visible front-end text is wired through the existing
  i18n system and renders correctly in `en-US` and `zh-CN`.
- `canonical label`: a stable label produced by upstream code or adapter data,
  such as `Current session` or `5h limit`, that the UI should normalize and
  translate rather than push back into server contracts.
- `valueLabel`: a user-visible value string associated with a label, such as
  `$12.34 remaining`.
- `detail`: supporting copy associated with a label/value pair, such as a reset
  message or provider note.

## Stable Localization Requirements

### Authoritative i18n System

- Use the existing browser-level i18n system only. Do not introduce a second
  localization mechanism.
- Supported locales are fixed to `en-US` and `zh-CN`.
- Locale resolution order is fixed to:
  - `localStorage`
  - `navigator.language`
  - `en-US`
- The storage key is fixed to `abacus.locale`.
- Language changes must update `document.documentElement.lang`.

### Required Language Entry Points

- Keep a language switcher in `ui/src/components/OnboardingWizard.tsx`.
- Keep a global language switcher in `ui/src/components/Layout.tsx` next to the
  theme toggle.
- Do not add a language switcher to settings pages.

### What Must Be Localized

Localization scope includes more than top-level headings. It includes:

- navigation labels, breadcrumbs, page titles, tabs, section headings
- buttons, menus, dialogs, popovers, tooltips, badges, helper text
- empty states, error states, fallback copy, aria/title text
- front-end generated prompt text, snippet text, and long explanatory text
- formatted or normalized UI strings derived from upstream/adapters, including
  `canonical label`, `valueLabel`, and `detail`

### Contract Boundary Rules

- Do not add new server/db/shared contracts just for localization.
- Keep localized rendering in the front-end consumption layer.
- If upstream returns stable labels or formatted fragments, normalize and
  translate them in UI code or UI helpers instead of mutating the server wire
  shape.

### Link and Prompt Rules

- `DEFAULT_TASK_DESCRIPTION` must exist in English and Chinese.
- The CEO persona link in `DEFAULT_TASK_DESCRIPTION` must point to
  `https://github.com/abacus-lab/companies/...`.
- User-visible current-product links that still point to
  `https://github.com/paperclipai/paperclip` must be updated to
  `https://github.com/abacus-lab/abacus`.

## Merge Intake Checklist

When upstream merge work changes UI, inspect all touched `ui/src/pages/*`,
`ui/src/components/*`, `ui/src/lib/*`, and relevant `tests/e2e/*` files.

Default audit scope for upstream merge work:

- prioritize product UI and management UI
- exclude `DesignGuide`, `RunTranscriptUxLab`, example plugin UI, and
  demo/sample pages unless the current merge actually touches them

For each touched UI area, check:

- page titles, tabs, and section headings
- buttons, menus, dialogs, and popover text
- empty states, errors, fallback text, aria/title text
- helper text, badges, counters, summary lines, and formatted labels
- front-end generated prompt/snippet/description copy
- any rendered `canonical label`, `valueLabel`, or `detail`

For cost, budget, finance, and quota changes, additionally inspect:

- overview cards and card descriptions
- provider/biller/quota panels
- budget incident and policy cards
- company settings upload/remove/failure fallback text
- project detail, agent detail, approval card, and approval payload copy

When adding translation keys:

- keep English source strings as keys
- avoid duplicate keys
- search the existing dictionary before adding a new key; duplicate entries in
  `ui/src/lib/i18n.ts` break typecheck and make translation ownership unclear
- preserve English fallback behavior
- prefer interpolation for variable strings, such as:
  - `Resets {time}`
  - `{amount} remaining`
  - `{percent}% used`

When upstream introduces structured labels plus free-form detail:

- prefer a reusable UI helper for label/value/detail translation
- avoid duplicating per-component `switch` logic
- do not change the server contract solely to force translated strings
- build locale-sensitive option arrays and label maps inside a component or a
  locale-aware helper, not in module top-level constants
- if a nested component or helper starts calling `t(...)`, it must either call
  `useI18n()` in that scope or receive `t` explicitly via props

## Common Pitfalls

- The easiest misses are usually not page titles, but card descriptions,
  secondary headings, empty states, incident text, and fallback messages.
- Quota/subscription UI often needs all three layers localized:
  - `canonical label`
  - `valueLabel`
  - `detail`
  Translating only one of the three leaves partially English UI behind.
- Structured strings like `Current session`, `5h limit`, `$12.34 remaining`,
  and `Resets Mar 18 at 7:59am` are better handled with UI helpers than with
  server contract changes.
- If translated data structures are built at module top level, locale switches
  will not recompute them. Common high-risk examples include navigation items,
  filter options, workspace options, adapter config enums, summary builders,
  and status-label maps. Build them inside the component, hook, or a
  locale-aware helper.
- Nested page-local subcomponents are a common merge hazard. It is easy to add
  `t(...)` calls in a nested renderer and forget to wire `useI18n()` or pass
  `t`, which turns a localization change into a typecheck failure.
- After merging upstream UI, do a dedicated scan for user-visible brand names
  and GitHub links. Do not assume new upstream UI already matches Abacus
  naming rules.

## Test and Acceptance Requirements

### High-Value Tests

- locale normalization
- `localStorage` / `navigator.language` precedence
- translation hit and English fallback behavior
- interpolation
- date/time/currency/relative-time formatting
- prompt/snippet builder output
- GitHub URL replacement behavior
- structured UI helper mapping for labels/valueLabel/detail
- locale-sensitive arrays or label maps recompute after a locale change
- onboarding locale switching
- layout-level locale switching next to the theme toggle
- refresh persistence after a locale change

If a merge rewrites a module-top-level English array/object into a localized
builder, add at least one targeted test that proves the labels recompute after
switching locale.

### Low-Value Tests to Avoid

- one test per translation key
- broad snapshots
- mechanical "button text exists" tests without behavior value

### Required Quality Gates

- `pnpm -r typecheck`
- `pnpm test:run`
- `pnpm build`

### Acceptance Criteria

- UI supports `en-US` and `zh-CN`, with `en-US` fallback.
- Onboarding can switch locale.
- The global shell can switch locale next to the theme toggle.
- Settings pages do not host the language switcher.
- Desktop and mobile shell both expose locale switching.
- Locale changes apply immediately and persist across refresh.
- `DEFAULT_TASK_DESCRIPTION` and other front-end generated prompt/snippet text
  react to locale changes.
- Upstream-merged UI text is localized in the same merge, not left as follow-up
  debt.
- Breadcrumbs, document title, navigation, empty states, and formatted
  date/time/currency output react to locale changes.

## References

- Rename and lockfile policy:
  [`doc/MERGE-RENAME-RULES.md`](./MERGE-RENAME-RULES.md)
- Merge execution flow:
  [`doc/UPSTREAM-MERGE-RUNBOOK.md`](./UPSTREAM-MERGE-RUNBOOK.md)
- Product invariants:
  [`AGENTS.md`](../AGENTS.md),
  [`doc/SPEC-implementation.md`](./SPEC-implementation.md)
