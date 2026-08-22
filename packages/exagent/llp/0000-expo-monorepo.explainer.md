# 0000: The Expo Monorepo

**Type:** Explainer
**Status:** Draft
**Role:** Root
**Systems:** repo-wide
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-18

## What this is

Root LLP for this corpus (scoped to `packages/exagent` since 2026-08-21). It orients readers and agents and indexes the documents below: one umbrella RFC plus eight feature documents, most with implemented-in-v1 sections.

## The repository

[observed — repo root and `packages/` listing, 2026-08-18]

- `packages/` holds the Expo SDK modules (`expo-camera`, `expo-image`, ...), the `expo` package, and tooling under `packages/@expo/` (including `@expo/cli`).
- `apps/` holds development and test apps.
- `docs/` holds the expo.dev documentation site.
- `templates/`, `tools/`, `scripts/` support the above.
- Package manager: pnpm (`pnpm-workspace.yaml`); build orchestration via turbo (`turbo.json`).

`packages/@expo/cli` is the Expo CLI (`npx expo <command>`). Its command registry lives in `packages/@expo/cli/bin/cli.ts`; each command lazy-imports its implementation from `src/<command>/`. The CLI has its own `CLAUDE.md` describing structure and conventions. [observed]

## LLP conventions here

- Documents live in `llp/`, named `NNNN-slug.type.md`.
- New documents start as `Draft`. Claims are tagged `[observed]`, `[confirmed]`, or `[inferred]`.
- Code annotated with `@ref llp/NNNN-...` comments points back to its governing document.

## Index

Agentic tool layer (umbrella + feature areas):

- [[0001-agentic-cli-on-expo-cli]] — umbrella RFC: decisions, constraints, naming, index of the feature LLPs.
- [[0002-testing-and-evals]] — plan: unit/e2e strategy and the 3-tier eval suite; built first.
- [[0003-knowledge-tools-and-skills]] — RFC: skills from modules, docs lookup, API diff, upgrade; second.
- [[0004-smart-start-and-project-state]] — RFC: smart `start`, Expo Go check, post-install decisions.
- [[0005-runtime-loop-tools]] — RFC: runtime eval, red-screen feed, network/deep-link/perf tools.
- [[0006-agent-native-cli-surface]] — RFC: process boundary, JSONL events, output contract, colon-group command registry.
- [[0007-deploy-and-headless]] — RFC: cross-platform deploy, headless creation, workerd compat, chat-driven dev, EAS auth.
- [[0008-guardrails]] — RFC: checkpoints, plan dry runs, tool impact metadata.
- [[0009-smart-followups]] — RFC: state-aware next actions attached to every command output.
