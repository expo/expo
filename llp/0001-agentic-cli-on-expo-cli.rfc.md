# 0001: An Agentic CLI on Top of Expo CLI

**Type:** RFC
**Status:** Draft
**Systems:** new package (name TBD, see §Naming); `packages/@expo/cli`; `expo-mcp` (external repo)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-18
**Related:** [[0000-expo-monorepo]]

## Summary

Make Expo the best framework to develop *through an agent*. Decision [confirmed — Kudo, 2026-08-18]: **Shape 1 — Expo ships the tool layer, not the model.** The product is deterministic, agent-facing tools (extending `expo-mcp`) plus official skills; the intelligence comes from whatever agent the user already runs (Claude Code, Cursor, the Claude mobile app). No model, no API key, and no billing anywhere in the product. Models appear only in CI, to run the eval suite. A standalone agent bin (`npx exagent`) remains a possible later wrapper, not v1. Shipping is gated on heavy tests and evals.

## Motivation

Generic coding agents drive Expo CLI through raw terminal output. They guess when to prebuild, when to rebuild, and when a restart is enough. Expo owns the ground truth for these decisions. An Expo-built agent can:

- read structured CLI state instead of scraping spinners and QR codes,
- encode Expo-specific decision rules (CNG, dev clients, Expo Go),
- see the running app through `expo-mcp` automation tools.

## Constraints

[confirmed — Kudo, 2026-08-18, Slack thread]

1. The code lives in the `expo/expo` repository.
2. The command can be an entirely new bin (`npx ai-expo`, `npx exagent`, or similar), not necessarily an `expo` subcommand.
3. Testing must be heavy. An eval suite must gate shipping. Testing infrastructure is built first [confirmed — Kudo, 2026-08-20].
4. The design should brainstorm agent-friendly features (see §Design documents).
5. **Process boundary** [confirmed — Kudo, 2026-08-20]: implementation invokes the `expo` CLI as a subprocess as much as possible; it does not import `@expo/cli` code. Details and rationale: [[0005-agent-native-cli-surface]].
6. Feature areas are documented in separate LLPs [confirmed — Kudo, 2026-08-20]; this document stays the umbrella (decisions, constraints, index).

## Naming

[observed — npm registry, 2026-08-18]

- `ai-expo` and `exagent` are reserved on npm by `kudochien` (published 2026-08-18).
- `expo-agent` is reserved by `laraelmas`; `expo-ai` is owned by `bycedric`.
- Scoped names under `@expo/` remain available to the org.

Recommendation [inferred]: use `exagent` as the bin and package name. It is short, unique, and already reserved. Keep `ai-expo` as a reserved alias. Decision pending (§Open questions).

## Design

### Package layout

New workspace package `packages/exagent/` (final name per §Naming):

```
packages/exagent/       # thin, model-free launcher (Shape 1)
├── bin/cli.ts          # `npx exagent setup|mcp|context|new` — no agent loop
├── src/
│   ├── setup/          # install Expo skills + register MCP server into Claude Code/Cursor/Codex
│   ├── context/        # project-state probe: machine-readable project brief
│   └── new/            # F1 headless project creation
├── e2e/
└── evals/              # eval scenarios, fixtures, graders (tiers 0–2)
```

The intelligence-adjacent surface lives in `expo-mcp` (tools) and `expo/skills` (knowledge); this package wires a user's existing agents to them. [inferred — layout sketch under Shape 1]

`@expo/cli` stays lean [observed — `packages/@expo/cli/CLAUDE.md` states the public interface is intentional and lean]. If an `expo agent` alias is wanted later, it follows the existing lazy-resolution pattern: `src/start/server/MCP.ts` resolves `expo-mcp` from the project with `resolveFrom.silent` and errors with an install hint when missing [observed].

### Product shape: tool provider, no model

Decision [confirmed — Kudo, 2026-08-18]: Shape 1. Consequences:

- New capabilities land as `expo-mcp` tools and Expo skills, not as an agent loop.
- Agent-friendly affordances in `@expo/cli` itself (non-interactive parity, JSONL events, deterministic decision commands) serve every driving agent.
- The reserved bins (`exagent` / `ai-expo`) can still ship as a thin, model-free launcher: start/connect the MCP server, install skills into the user's agents, print project context. [inferred]
- F3 (Claude mobile app) needs no Expo-side model either: the Claude app brings the model; Expo provides tools over `@expo/mcp-tunnel`.
- A standalone embedded-loop agent (the former Shape 2) is deferred; if built later, it wraps the user's existing Claude Code auth rather than handling keys. [inferred]

### Tool surface

Three layers, all machine-readable:

1. **Expo CLI as structured subprocess.** The CLI already emits JSONL events via `installEventLogger` / `LOG_EVENTS` (`packages/@expo/cli/bin/cli.ts`) [observed]. The agent spawns `expo start` / `expo run:*` / `expo export` and consumes events, not text.
2. **`expo-mcp` tools, reused as-is.** `automation_tap`, `automation_take_screenshot`, `automation_find_view`, `collect_app_logs`, `expo_router_sitemap`, `open_devtools` [observed — expo-mcp repo]. Decision [confirmed — Kudo, 2026-08-18]: reuse the `expo-mcp` infrastructure (Kudo owns that codebase) instead of vendoring. The agent package in `expo/expo` depends on the published `expo-mcp` / `@expo/mcp-tunnel` packages: in-process MCP connection locally, `@expo/mcp-tunnel` WebSocket transport for the remote/F3 case. New agent-facing tools land in `expo-mcp` first, so every MCP client (Claude Code, Cursor) inherits them.
3. **Expo-specific decision tools** built for the agent (see §Design documents): Expo Go compatibility check, post-install impact classifier, project-state probe.

## Design documents

Feature areas live in child LLPs [confirmed — Kudo, 2026-08-20]; each carries its own design, provenance, and testing notes:

- [[0002-testing-and-evals]] — the layer built **first**: unit/e2e strategy and the 3-tier eval suite (scripted MCP client → small local model on GitHub Actions → frontier model).
- [[0003-smart-start-and-project-state]] — one deterministic engine for "what must run?": smart `start`, Expo Go compatibility check, post-install impact decisions.
- [[0004-runtime-loop-tools]] — seeing and driving the running app: runtime eval (CDP), red-screen feed, network inspection, deep-link navigation, performance probe, cross-platform sweep; log-triage and verified-UI loops.
- [[0005-agent-native-cli-surface]] — the process boundary, JSONL events as the contract, agent-mode dev server output, non-interactive parity, headless CI mode, the `exagent` launcher.
- [[0006-knowledge-tools-and-skills]] — skills shipped from Expo modules, version-pinned docs lookup, API diff, example transplant, dependency explainer, doctor auto-fix, SDK upgrade workflow.
- [[0007-deploy-and-headless]] — cross-platform `deploy` (EAS Hosting + launch.expo.dev), headless project creation, Cloudflare Workers compatibility, chat-driven development (the phone as the only device), EAS auth for headless agents.
- [[0008-guardrails]] — checkpoints/undo, plan-with-cost dry runs, tool impact metadata.

**Scoped out** [confirmed — Kudo, 2026-08-19]: ambient/long-running modes (copilot watch mode, EAS build babysitter, PR verification bot, maintenance agent) — driving-agent behaviors, not tool-layer work; a separate `exagent mcp` feature (subsumed by Shape 1); the build-failure signature DB.

## Open questions

1. ~~Final name~~ — resolved [confirmed — Kudo, 2026-08-20]: `exagent` (package `packages/exagent/`, bin `exagent`); `ai-expo` stays reserved as an alias.
2. ~~Model auth and billing~~ — resolved [confirmed — Kudo, 2026-08-18]: Shape 1, no model in the product; CI-only models for evals ([[0002-testing-and-evals]]).
3. ~~Engine commitment~~ — moot under Shape 1; revisit only if a standalone bin is built later.
4. Skill-from-module contract: `package.json` field vs directory convention; and whether `expo/skills` content gets bundled or fetched.
5. ~~Relationship to `expo-mcp` repo~~ — resolved [confirmed — Kudo, 2026-08-18]: depend on and extend `expo-mcp`; do not vendor. See §Tool surface.
6. Whether `expo agent` (subcommand alias in `@expo/cli`) ships at all, and when.
7. F3 hosting: where does the cloud agent run — EAS-provided machines, or bring-your-own (Tuft-style)? (EAS auth itself: resolved direction in F4 — `EXPO_TOKEN` now, device-code grant as end state.)
8. Does the device-code grant + scoped agent sessions land in www/expo.dev auth, and who owns that work?
