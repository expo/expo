# 0000: The Expo monorepo

**Type:** Explainer
**Status:** Active
**Role:** Root
**Systems:** repo-wide
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-18
**Revised:** 2026-08-30

## What this is

The root LLP for this corpus, scoped to `packages/@expo/agent-cli` since 2026-08-21. Read it to get oriented, then use the index to find the document that governs what you are about to change.

## The repository

- `packages/` holds the Expo SDK modules (`expo-camera`, `expo-image`, ...), the `expo` package, and tooling under `packages/@expo/` (including `@expo/cli`).
- `packages-detached/` holds npm packages that are not SDK modules. `expo-agent-cli` lives here: a bunx/npx alias for `@expo/agent-cli`, published at the same version when that package is published.
- `apps/` holds development and test apps.
- `docs/` holds the expo.dev documentation site.
- `templates/`, `tools/`, `scripts/` support the above.
- Package manager: pnpm (`pnpm-workspace.yaml`). Build orchestration via turbo (`turbo.json`).

`packages/@expo/cli` is the Expo CLI (`npx expo <command>`). Its command registry lives in `packages/@expo/cli/bin/cli.ts`. Each command lazy-imports its implementation from `src/<command>/`. The CLI has its own `CLAUDE.md` describing structure and conventions.

## LLP conventions here

- Documents live in `llp/`, named `NNNN-slug.type.md`. They keep that path for life. Status lives in the header, not in a folder.
- `llp/foundation/` is the kernel: the smallest set from which the design could be recreated. Links only.
- `llp/current/` is the work in play. Links only. Empty means the corpus is collapsed: every living document is the v1 design of record.
- New documents start as `Draft`. They reach `Active` when the design ships and settles. Status values, and what each promises, are in §Status convention below.
- Claims are tagged `[observed]`, `[confirmed]`, or `[inferred]`. An Active document should not carry `[inferred]`: confirm the claim or drop the brainstorm.
- Code annotated with `@ref llp/NNNN-...` comments points back to its governing document.

## Status convention

A document's `Status:` header takes one of these values.

- **Draft:** still being written. Nothing in it is safe to build against.
- **Active:** design of record, shipped and stable. An open question inside Active is follow-on work. A decision inside one is changed by amending the document, not by discovering the code disagrees.
- **Open:** settled in part. The header names the unbuilt part.
- **Deferred - reference:** left out of the release. Code lives on `src/deferred/`. Only [[0017-deferred-commands]].
- **Superseded:** replaced. The header names the replacement. The file stays put.
- **Tombstoned:** do not believe its claims.

Active is not a promise never to change. It is a promise that a change to it is a change to a shipped contract.

## Index

Start here:

- [[0001-agentic-cli-on-expo-cli]]: umbrella RFC for decisions, constraints, and naming.
- [[0016-v1-scope]]: what the first release contains, and what waits.

Testing:

- [[0002-testing-and-evals]]: unit, e2e, live, and eval strategy. Built first.
- [[0022-live-tier]]: live suites against a real simulator and the real EAS service.

What the CLI does:

- [[0003-knowledge-tools-and-skills]]: skills shipped from modules.
- [[0004-smart-start-and-project-state]]: smart `dev`, the Expo Go check, post-install decisions.
- [[0005-runtime-loop-tools]]: runtime eval, the red-screen feed, deep links, the smoke gate.
- [[0007-deploy-and-headless]]: `deploy` and `new`.
- [[0011-impact-and-freshness]]: what a change costs, and whether it can ship over the air.
- [[0012-build-explain]]: deterministic triage of a native build log.
- [[0018-interaction-commands]]: driving the app by testID.
- [[0023-fingerprint-caching]]: paying for one fingerprint instead of three.

How every command behaves:

- [[0006-agent-native-cli-surface]]: the process boundary, JSONL events, the output contract, the command registry.
- [[0008-guardrails]]: plan dry runs, consent as a re-run, untrusted-content fences.
- [[0009-smart-followups]]: state-aware next actions on every command output.
- [[0010-agent-conventions]]: the exit-code table, command resolution, and the upstream asks.
- [[0015-backend-selection-and-config]]: which build backend a plan uses, and the developer config that overrides it.
- [[0021-honest-reports]]: what a command may claim, and about what.
- [[0024-cli-ui]]: the help template, the workflow map, the on-ramp, the palette.

Left out:

- [[0017-deferred-commands]]: everything that is not in v1. Shelf commands, and unbuilt product.

Superseded (history only):

- [[0014-interaction-spike]] → [[0018-interaction-commands]]
- [[0019-backend-parity-audit]] → [[0002-testing-and-evals]] / [[0022-live-tier]]
- [[0020-not-an-expo-app]] → [[0004-smart-start-and-project-state]]
