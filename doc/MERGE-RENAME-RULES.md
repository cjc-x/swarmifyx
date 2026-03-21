# Merge Rename Rules

## Summary

This document is the normative rule set for merging upstream `paperclipai/paperclip`
changes into this Abacus fork.

Use this document to answer:

- which remote/repo role is which
- which names must be rewritten
- which exceptions are allowed
- which post-merge conditions must be true

Do not use this document as a step-by-step execution guide. For the operational
flow, use [`doc/UPSTREAM-MERGE-RUNBOOK.md`](./UPSTREAM-MERGE-RUNBOOK.md).

## Single Source Boundaries

- This document defines rename and merge output rules.
- [`doc/UI-LOCALIZATION.md`](./UI-LOCALIZATION.md) defines what "UI-localized"
  means and how merged UI must be localized.
- [`AGENTS.md`](../AGENTS.md) and
  [`doc/SPEC-implementation.md`](./SPEC-implementation.md) define product and
  implementation invariants such as company-scoped boundaries.
- [`doc/UPSTREAM-MERGE-RUNBOOK.md`](./UPSTREAM-MERGE-RUNBOOK.md) defines the
  recommended execution sequence and command checklist.

## Terminology

- `upstream`: the semantic role for the canonical `paperclipai/paperclip`
  repo. In this
  checkout the default remote name is `origin`.
- `private fork`: the semantic role for the Abacus repo. In this checkout
  the default remote name is `private`.
- `base branch`: the private-fork branch used as the PR comparison target. By
  default this is `private/master`.
- `company-scoped`: an existing repository invariant that every business record
  belongs to exactly one company and company boundaries are enforced in
  routes/services. The source of truth is [`AGENTS.md`](../AGENTS.md) and
  [`doc/SPEC-implementation.md`](./SPEC-implementation.md).
- `UI-localized`: user-visible UI text is integrated with the existing front-end
  i18n system as defined in [`doc/UI-LOCALIZATION.md`](./UI-LOCALIZATION.md).

> [!IMPORTANT]
> If your local remote names differ, follow the semantic role rather than the
> literal remote name.

## Conflict Resolution Priorities

When the same area contains both upstream logic changes and local rename/UI
customizations, resolve in this order:

1. Keep upstream behavior changes, bug fixes, and contract alignment.
2. Keep Abacus naming, branding, package scopes, and user-visible links.
3. Keep existing repository invariants, especially company-scoped boundaries,
   audit/approval semantics, budget hard-stop behavior, and UI-localized
   behavior.
4. Keep or update tests so the merged behavior is covered.

## Rename Mapping

Apply the following replacements when upstream code introduces legacy names:

| Upstream token | Abacus token | Typical locations                             |
|----------------|--------------|-----------------------------------------------|
| `paperclipai`  | `abacus-lab` | npm scope, import path, GitHub org/URL, URL slug |
| `paperclipai`  | `abacus`     | class names, components, title-cased branding |
| `PAPERCLIPAI`  | `ABACUS`     | env vars, constants                           |
| `papercli`     | `abacus`     | legacy short names                            |
| `Papercli`     | `Abacus`     | legacy short names                            |
| `PAPERCLI`     | `ABACUS`     | legacy short names                            |
| `paperclip`    | `abacus`     | user-visible brand text                       |
| `paperclip`    | `abacus`     | lowercase product references, config values, CLI names |

> [!IMPORTANT]
> Match case exactly and prefer longer matches before shorter matches. For
> example, replace `paperclipai` before considering `paperclip`.

## File Type Rules

### Code Files

- Replace legacy naming in source files, including package scopes, import
  paths, env var names, CLI-facing strings, RPC/app identity fields, and
  user-visible brand text.
- If upstream adds new logic in a conflicting block, keep the upstream logic and
  re-apply Abacus naming on top.
- Rename obligations include user-visible error messages, helper text, brand
  labels, and product links. Do not stop at import-path fixes.

### `package.json`

- Keep `"name"` aligned to `@abacus-lab/abacus` for the published CLI package
  and `@abacus-lab/*` for scoped workspace packages. The private repo root
  manifest may remain `abacus`.
- Keep `"repository"` aligned to
  `https://github.com/abacus-lab/abacus`.
- Replace dependency scopes from `@paperclipai/*` to `@abacus-lab/*` for packages
  owned by this fork.
- Keep the installed CLI command name as `abacus` even though the npm package is
  `@abacus-lab/abacus`.
- When versions conflict, prefer the newer upstream version unless the private
  fork has an explicit release constraint.

### Markdown / Docs

- Replace user-visible `Paperclip` branding with `Abacus`.
- Replace `github.com/paperclipai/paperclip` with
  `github.com/abacus-lab/abacus` in user-visible current-product links.
- Replace `github.com/paperclipai/` with `github.com/abacus-lab/` when it is
  referring to the current product rather than historical upstream context.
- If the merged docs add UI-visible copy or prompt text, they must also satisfy
  [`doc/UI-LOCALIZATION.md`](./UI-LOCALIZATION.md).

### Config / Templates

- Replace `PAPERCLIP` / `PAPERCLIPAI` env var names with `ABACUS`.
- Replace legacy config values using the mapping table above.

### Lockfiles and CI-Managed Files

- `pnpm-lock.yaml` is CI-managed for normal pull requests and must not remain in
  a feature PR diff.
- If a merge changes `pnpm-lock.yaml`, restore it to the base branch version
  before pushing the PR, unless the branch exists specifically to refresh the
  lockfile.
- Preserve the correct manifest/source changes first, then remove the lockfile
  diff to satisfy CI policy.
- If a lockfile or third-party package metadata still contains
  `@paperclipai/*`, first verify whether it is the real published dependency
  name of an external package. Do not rename third-party dependency names just
  to satisfy branding.

## Allowed Exceptions

The following may keep the upstream name unchanged:

- explicit fork-source statements such as `Forked from paperclip`
- historical commit hashes or commit message references
- upstream changelog or release-note history references
- third-party dependency names outside the Abacus namespace
- lockfile entries or package-manager metadata that reflect real third-party
  published package names, including transitive `@paperclipai/*` dependencies
- comments explicitly marked as `upstream reference`
- inert, non-user-visible test fixtures or temp directory names, as long as the
  legacy token does not leak into product UI, public contracts, or assertion
  meaning

> [!IMPORTANT]
> Exceptions must be justified as historical reference or inert test data, not
> as a convenience escape hatch.

## Required Post-Merge Conditions

After an upstream merge is considered done, all of the following must be true:

- merged behavior keeps the upstream logic changes
- merged code and docs keep Abacus naming
- merged UI is UI-localized according to
  [`doc/UI-LOCALIZATION.md`](./UI-LOCALIZATION.md)
- the PR diff against the base branch does not include `pnpm-lock.yaml`, unless
  this is a dedicated lockfile-refresh branch
- rename audit is clean except for allowed exceptions
- quality gates pass:
  - `pnpm -r typecheck`
  - `pnpm test:run`
  - `pnpm build`

## References

- Execution flow: [`doc/UPSTREAM-MERGE-RUNBOOK.md`](./UPSTREAM-MERGE-RUNBOOK.md)
- UI localization rules: [`doc/UI-LOCALIZATION.md`](./UI-LOCALIZATION.md)
- Company-scoped/product invariants: [`AGENTS.md`](../AGENTS.md),
  [`doc/SPEC-implementation.md`](./SPEC-implementation.md)
