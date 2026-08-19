# 0000: The Expo Monorepo

**Type:** Explainer
**Status:** Draft
**Role:** Root
**Systems:** repo-wide
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-18

## What this is

Root LLP for the `expo/expo` monorepo. It orients readers and agents, and indexes the LLP corpus. This corpus is new; it starts with one design document.

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

- [[0001-agentic-cli-on-expo-cli]] — RFC: an agentic CLI built on top of Expo CLI.
