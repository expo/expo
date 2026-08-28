# 0000: The Expo Monorepo

**Type:** Explainer
**Status:** Final
**Role:** Root
**Systems:** repo-wide
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-18 · finalized 2026-08-28

## What this is

The root LLP for this corpus, scoped to `packages/@expo/agent-cli` since 2026-08-21. Read it to get oriented, then use the index below to find the document that governs what you are about to change.

## The repository

[observed — repo root and `packages/` listing, 2026-08-18]

- `packages/` holds the Expo SDK modules (`expo-camera`, `expo-image`, ...), the `expo` package, and tooling under `packages/@expo/` (including `@expo/cli`).
- `apps/` holds development and test apps.
- `docs/` holds the expo.dev documentation site.
- `templates/`, `tools/`, `scripts/` support the above.
- Package manager: pnpm (`pnpm-workspace.yaml`); build orchestration via turbo (`turbo.json`).

`packages/@expo/cli` is the Expo CLI (`npx expo <command>`). Its command registry lives in `packages/@expo/cli/bin/cli.ts`, and each command lazy-imports its implementation from `src/<command>/`. The CLI has its own `CLAUDE.md` describing structure and conventions. [observed]

## LLP conventions here

- Documents live in `llp/`, named `NNNN-slug.type.md`.
- New documents start as `Draft` and reach `Final` when their content ships and settles. The four
  status values, and what each promises, are in [[0001-agentic-cli-on-expo-cli]] §Status convention.
- Claims are tagged `[observed]`, `[confirmed]`, or `[inferred]`.
- Code annotated with `@ref llp/NNNN-...` comments points back to its governing document.

## Index

Start here:

- [[0001-agentic-cli-on-expo-cli]] — the umbrella RFC: decisions, constraints, naming, and the index of feature LLPs.
- [[0016-v1-scope]] — what the first release contains, and what waits.

How the work is tested:

- [[0002-testing-and-evals]] — unit and e2e strategy, plus the 3-tier eval suite. Built first.
- [[0019-backend-parity-audit]] — the coverage matrix of command × backend × scenario.
- [[0022-live-tier]] — the fourth tier, `e2e-live/`: the published surface against a real simulator and the real EAS service.

What the CLI does:

- [[0003-knowledge-tools-and-skills]] — skills shipped from modules, docs lookup, API diff, upgrade.
- [[0004-smart-start-and-project-state]] — smart `dev`, the Expo Go check, post-install decisions.
- [[0005-runtime-loop-tools]] — runtime eval, the red-screen feed, deep links, the smoke gate.
- [[0007-deploy-and-headless]] — cross-platform deploy, headless creation, chat-driven development.
- [[0011-impact-and-freshness]] — what a change costs, and whether it can ship over the air.
- [[0012-build-explain]] — deterministic triage of a native build log.
- [[0018-interaction-commands]] — driving the app by testID, from the spike in [[0014-interaction-spike]].
- [[0023-fingerprint-caching]] — paying for one fingerprint instead of three.

How every command behaves:

- [[0006-agent-native-cli-surface]] — the process boundary, JSONL events, the output contract, the command registry.
- [[0008-guardrails]] — plan dry runs, untrusted-content marking, tool impact metadata.
- [[0009-smart-followups]] — state-aware next actions on every command output.
- [[0010-agent-conventions]] — the exit-code table, command resolution, and the upstream asks.
- [[0015-backend-selection-and-config]] — which build backend a plan uses, and the developer config that overrides it.
- [[0020-not-an-expo-app]] — what happens in a directory that holds no Expo app.
- [[0021-honest-reports]] — what a command may claim, and about what.

What was left out:

- [[0017-deferred-commands]] — the single home for the five deferred areas: what each was, why it left, and what would bring it back.
