# 0001: An Agentic CLI on Top of Expo CLI

**Type:** RFC
**Status:** Draft
**Systems:** `packages/exagent` (new); `packages/@expo/cli`; `expo-mcp` (external repo)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-18 (updated 2026-08-20)
**Related:** [[0000-expo-monorepo]]

## Summary

Make Expo the best framework to develop _through an agent_. Decision [confirmed — Kudo, 2026-08-18]: **Shape 1 — Expo ships the tool layer, not the model.** The product is deterministic, agent-facing tools (extending `expo-mcp`) plus official skills; the intelligence comes from whatever agent the user already runs (Claude Code, Cursor, the Claude mobile app). No model, no API key, and no billing anywhere in the product. Models appear only in CI, to run the eval suite. The `exagent` bin ships in v1 as a thin, model-free launcher; an embedded-loop agent remains a possible later wrapper, not v1. Shipping is gated on heavy tests and evals.

## Motivation

Generic coding agents drive Expo CLI through raw terminal output. They guess when to prebuild, when to rebuild, and when a restart is enough. Expo owns the ground truth for these decisions. An Expo-built tool layer lets any driving agent:

- read structured CLI state instead of scraping spinners and QR codes,
- encode Expo-specific decision rules (CNG, dev clients, Expo Go),
- see the running app through `expo-mcp` automation tools.

## Constraints

[confirmed — Kudo, 2026-08-18, Slack thread]

1. The code lives in the `expo/expo` repository.
2. The command can be an entirely new bin (`npx ai-expo`, `npx exagent`, or similar), not necessarily an `expo` subcommand.
3. Testing must be heavy. An eval suite must gate shipping. Testing infrastructure is built first [confirmed — Kudo, 2026-08-20].
4. The design should brainstorm agent-friendly features (see §Design documents).
5. **Process boundary** [confirmed — Kudo, 2026-08-20]: implementation invokes the `expo` CLI as a subprocess as much as possible; it does not import `@expo/cli` code. The same boundary generalizes across the whole Expo CLI family [confirmed — Kudo, 2026-08-20]: the new CLI builds on top of and across `expo`, `eas-cli`, `expo-doctor` (bin `expo-doctor` [observed — `packages/expo-doctor/package.json`]), `@expo/fingerprint` (bin `fingerprint` [observed — `packages/@expo/fingerprint/package.json`]), `create-expo`, and more — orchestrating them as subprocesses. Details and rationale: [[0006-agent-native-cli-surface]].
6. Feature areas are documented in separate LLPs [confirmed — Kudo, 2026-08-20]; this document stays the umbrella (decisions, constraints, index).

## Naming

[observed — npm registry, 2026-08-18]

- `ai-expo` and `exagent` are reserved on npm by `kudochien` (published 2026-08-18).
- `expo-agent` is reserved by `laraelmas`; `expo-ai` is owned by `bycedric`.
- Scoped names under `@expo/` remain available to the org.

Decision [confirmed — Kudo, 2026-08-20]: `exagent` is the bin and package name (`packages/exagent/`); `ai-expo` stays reserved as an alias.

## Design

### Package layout

New workspace package `packages/exagent/`:

```
packages/exagent/       # model-free CLI (Shape 1) — no agent loop
├── bin/cli.ts          # `npx exagent setup|skills|install|start|mcp|context|new`
├── src/
│   ├── setup/          # install Expo skills + register MCP server into Claude Code/Cursor/Codex
│   ├── skills/         # skills sync/list/show/clean (code from PoC PRs, [[0003-knowledge-tools-and-skills]])
│   ├── install/        # wraps `expo install` subprocess + skill sync + impact classification
│   ├── start/          # wraps `expo start` subprocess + skill sync; later smart start ([[0004-smart-start-and-project-state]])
│   ├── context/        # project-state probe: machine-readable project brief
│   └── new/            # headless project creation ([[0007-deploy-and-headless]])
├── e2e/
└── evals/              # eval scenarios, fixtures, graders (tiers 0–2)
```

`exagent install` / `exagent start` wrap the `expo` equivalents as subprocesses [confirmed — Kudo, 2026-08-20]; `@expo/cli` gets no hooks.

The intelligence-adjacent surface lives in `expo-mcp` (tools) and `expo/skills` (knowledge); this package wires a user's existing agents to them. [inferred — layout sketch under Shape 1]

`@expo/cli` stays lean [observed — `packages/@expo/cli/CLAUDE.md` states the public interface is intentional and lean]. If an `expo agent` alias is wanted later, it follows the existing lazy-resolution pattern: `src/start/server/MCP.ts` resolves `expo-mcp` from the project with `resolveFrom.silent` and errors with an install hint when missing [observed].

### Product shape: tool provider, no model

Decision [confirmed — Kudo, 2026-08-18]: Shape 1. Consequences:

- New capabilities land as `expo-mcp` tools and Expo skills, not as an agent loop.
- Agent-friendly affordances in `@expo/cli` itself (non-interactive parity, JSONL events, deterministic decision commands) serve every driving agent.
- The reserved bins (`exagent` / `ai-expo`) can still ship as a thin, model-free launcher: start/connect the MCP server, install skills into the user's agents, print project context. [inferred]
- Chat-driven development ([[0007-deploy-and-headless]]) needs no Expo-side model either: the Claude app brings the model; Expo provides tools over `@expo/mcp-tunnel`.
- A standalone embedded-loop agent (the former Shape 2) is deferred; if built later, it wraps the user's existing Claude Code auth rather than handling keys. [inferred]

### Tool surface

Three layers, all machine-readable:

1. **The Expo CLI family as structured subprocesses.** Not just `expo`: the tool layer orchestrates `expo`, `eas-cli`, `expo-doctor`, `@expo/fingerprint`, `create-expo`, and more [confirmed — Kudo, 2026-08-20]. `expo` already emits JSONL events via `installEventLogger` / `LOG_EVENTS` (`packages/@expo/cli/bin/cli.ts`) [observed]; the tool layer spawns commands and consumes events, not text. Sibling CLIs without structured output get wrapped (parse + normalize) until they emit events natively.
2. **`expo-mcp` stays untouched; exagent is self-serve.** Clarified decision [confirmed — Kudo, 2026-08-22, superseding the 2026-08-18 reading]: "reuse MCP infra" means exagent may act as an MCP *client* or add MCP features — it does NOT mean new tools land in the `expo-mcp` codebase. Runtime capabilities (CDP evaluate, error feed, deep-link navigation) are implemented **inside `packages/exagent`** as CLI commands, agent-callable via shell. The existing published `expo-mcp` tools (`automation_*`, `collect_app_logs`, `expo_router_sitemap`, `open_devtools` [observed]) remain available to agents that connect to them; `@expo/mcp-tunnel` remains the remote-transport option for the chat-driven case ([[0007-deploy-and-headless]]).
3. **Expo-specific decision tools** built for the agent (see §Design documents): Expo Go compatibility check, post-install impact classifier, project-state probe.

## Design documents

Feature areas live in child LLPs [confirmed — Kudo, 2026-08-20]; each carries its own design, provenance, and testing notes. Document numbers reflect implementation priority order [confirmed — Kudo, 2026-08-20: knowledge/skills comes first after testing]:

- [[0002-testing-and-evals]] — the layer built **first**: unit/e2e strategy and the 3-tier eval suite (deterministic subprocess tests → best-effort agent-in-the-loop with a free/local model → frontier model; scripted MCP replay optional/deferred).
- [[0003-knowledge-tools-and-skills]] — **second**: skills shipped from Expo modules, version-pinned docs lookup, API diff, example transplant, dependency explainer, doctor auto-fix, SDK upgrade workflow.
- [[0004-smart-start-and-project-state]] — one deterministic engine for "what must run?": smart `start`, Expo Go compatibility check, post-install impact decisions.
- [[0005-runtime-loop-tools]] — seeing and driving the running app: runtime eval (CDP), red-screen feed, network inspection, deep-link navigation, performance probe, cross-platform sweep; log-triage and verified-UI loops.
- [[0006-agent-native-cli-surface]] — the process boundary, JSONL events as the contract, agent-mode dev server output, non-interactive parity, headless CI mode, the `exagent` launcher.
- [[0007-deploy-and-headless]] — cross-platform `deploy` (EAS Hosting + launch.expo.dev), headless project creation, Cloudflare Workers compatibility, chat-driven development (the phone as the only device), EAS auth for headless agents.
- [[0008-guardrails]] — checkpoints/undo, plan-with-cost dry runs, tool impact metadata.

**Scoped out** [confirmed — Kudo, 2026-08-19]: ambient/long-running modes (copilot watch mode, EAS build babysitter, PR verification bot, maintenance agent) — driving-agent behaviors, not tool-layer work; a separate `exagent mcp` feature (subsumed by Shape 1); the build-failure signature DB.

## Open questions

1. ~~Final name~~ — resolved [confirmed — Kudo, 2026-08-20]: `exagent` (package `packages/exagent/`, bin `exagent`); `ai-expo` stays reserved as an alias.
2. ~~Model auth and billing~~ — resolved [confirmed — Kudo, 2026-08-18]: Shape 1, no model in the product; CI-only models for evals ([[0002-testing-and-evals]]).
3. ~~Engine commitment~~ — moot under Shape 1; revisit only if a standalone bin is built later.
4. ~~Skill-from-module contract~~ — resolved [confirmed — Kudo, 2026-08-20]: directory convention `skills/*/SKILL.md` discovered via autolinking (see [[0003-knowledge-tools-and-skills]]). Scope is **co-located module skills** (e.g. `expo-sqlite/skills/`); distributing the general `expo/skills` repo content is out of scope for `exagent`.
5. ~~Relationship to `expo-mcp` repo~~ — resolved [confirmed — Kudo, 2026-08-18]: depend on and extend `expo-mcp`; do not vendor. See §Tool surface.
6. Whether `expo agent` (subcommand alias in `@expo/cli`) ships at all, and when.
7. Chat-driven hosting: where does the cloud agent run — EAS-provided machines, or bring-your-own (Tuft-style)? (EAS auth itself: resolved direction in [[0007-deploy-and-headless]] §EAS auth — `EXPO_TOKEN` now, device-code grant as end state.)
8. Does the device-code grant + scoped agent sessions land in www/expo.dev auth, and who owns that work?
