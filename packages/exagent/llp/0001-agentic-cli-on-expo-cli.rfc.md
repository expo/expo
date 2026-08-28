# 0001: An Agentic CLI on Top of Expo CLI

**Type:** RFC
**Status:** Draft
**Systems:** `packages/exagent` (new); `packages/@expo/cli`; `expo-mcp` (external repo)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-18 (updated 2026-08-20)
**Related:** [[0000-expo-monorepo]]

## Summary

Make Expo the best framework to develop _through an agent_.

Decision [confirmed — Kudo, 2026-08-18]: **Shape 1 — Expo ships the tool layer, not the model.** The product is deterministic, agent-facing tools (extending `expo-mcp`) plus official skills. The intelligence comes from whatever agent the user already runs: Claude Code, Cursor, the Claude mobile app. No model, no API key, and no billing anywhere in the product. Models appear only in CI, to run the eval suite.

The `exagent` bin ships in v1 as a thin, model-free launcher. An embedded-loop agent stays a possible later wrapper, not v1. Shipping is gated on heavy tests and evals.

## Motivation

Generic coding agents drive Expo CLI through raw terminal output. They guess when to prebuild, when to rebuild, and when a restart is enough. Expo owns the ground truth for these decisions.

An Expo-built tool layer lets any driving agent:

- read structured CLI state instead of scraping spinners and QR codes,
- encode Expo-specific decision rules (CNG, dev clients, Expo Go),
- see the running app through `expo-mcp` automation tools.

## Constraints

[confirmed — Kudo, 2026-08-18, Slack thread]

1. The code lives in the `expo/expo` repository.
2. The command can be an entirely new bin (`npx ai-expo`, `npx exagent`, or similar), not necessarily an `expo` subcommand.
3. Testing must be heavy. An eval suite must gate shipping. Testing infrastructure is built first [confirmed — Kudo, 2026-08-20].
4. The design should brainstorm agent-friendly features (see §Design documents).
5. **Process boundary** [confirmed — Kudo, 2026-08-20]: implementation invokes the `expo` CLI as a subprocess as much as possible; it does not import `@expo/cli` code. The same boundary generalizes across the whole Expo CLI family [confirmed — Kudo, 2026-08-20]. The new CLI builds on top of and across `expo`, `eas-cli`, `expo-doctor` (bin `expo-doctor` [observed — `packages/expo-doctor/package.json`]), `@expo/fingerprint` (bin `fingerprint` [observed — `packages/@expo/fingerprint/package.json`]), `create-expo`, and more, orchestrating them as subprocesses. Details and rationale: [[0006-agent-native-cli-surface]].
6. Feature areas are documented in separate LLPs [confirmed — Kudo, 2026-08-20]. This document stays the umbrella: decisions, constraints, index.

## Naming

[observed — npm registry, 2026-08-18]

- `ai-expo` and `exagent` are reserved on npm by `kudochien` (published 2026-08-18).
- `expo-agent` is reserved by `laraelmas`; `expo-ai` is owned by `bycedric`.
- Scoped names under `@expo/` remain available to the org.

Decision [confirmed — Kudo, 2026-08-20]: `exagent` is the bin and package name (`packages/exagent/`). `ai-expo` stays reserved as an alias.

## Design

### Package layout

New workspace package `packages/exagent/`:

```
packages/exagent/       # model-free CLI (Shape 1) — no agent loop
├── bin/cli.ts          # flat commands + colon groups (runtime:*, skills:*, inspect:*, agents:*)
├── src/
│   ├── agents/         # agents:setup — sync module skills + write the AGENTS.md managed block
│   ├── skills/         # skills sync/list/show/clean (code from PoC PRs, [[0003-knowledge-tools-and-skills]])
│   ├── install/        # wraps `expo install` subprocess + skill sync + impact classification
│   ├── start/          # wraps `expo start` subprocess + skill sync; later smart start ([[0004-smart-start-and-project-state]])
│   ├── project/        # project-state probe: the machine-readable project brief, reported by `status --json`
│   └── new/            # headless project creation ([[0007-deploy-and-headless]])
├── e2e/
└── evals/              # eval scenarios, fixtures, graders (tiers 0–2)
```

`exagent install` and `exagent start` wrap the `expo` equivalents as subprocesses [confirmed — Kudo, 2026-08-20]. `@expo/cli` gets no hooks.

Knowledge lives in co-located module skills ([[0003-knowledge-tools-and-skills]]). Runtime and decision tooling is self-serve in this package [confirmed — Kudo, 2026-08-22].

`@expo/cli` stays lean [observed — `packages/@expo/cli/CLAUDE.md` states the public interface is intentional and lean]. If an `expo agent` alias is wanted later, it follows the existing lazy-resolution pattern: `src/start/server/MCP.ts` resolves `expo-mcp` from the project with `resolveFrom.silent` and errors with an install hint when missing [observed].

### Product shape: tool provider, no model

Decision [confirmed — Kudo, 2026-08-18]: Shape 1. Consequences:

- New capabilities land as `exagent` commands and Expo skills, not as an agent loop [updated per the 2026-08-22 self-serve clarification].
- Agent-friendly affordances in `@expo/cli` itself (non-interactive parity, JSONL events, deterministic decision commands) serve every driving agent.
- The reserved bins (`exagent` / `ai-expo`) can still ship as a thin, model-free launcher: start and connect the MCP server, install skills into the user's agents, print project context. [inferred]
- Chat-driven development ([[0007-deploy-and-headless]]) needs no Expo-side model either. The Claude app brings the model; Expo provides tools over `@expo/mcp-tunnel`.
- A standalone embedded-loop agent (the former Shape 2) is deferred. If it is built later, it wraps the user's existing Claude Code auth rather than handling keys. [inferred]

### Tool surface

Three layers, all machine-readable:

1. **The Expo CLI family as structured subprocesses.** Not just `expo`. The tool layer orchestrates `expo`, `eas-cli`, `expo-doctor`, `@expo/fingerprint`, `create-expo`, and more [confirmed — Kudo, 2026-08-20]. `expo` already emits JSONL events via `installEventLogger` / `LOG_EVENTS` (`packages/@expo/cli/bin/cli.ts`) [observed], so the tool layer spawns commands and consumes events rather than text. Sibling CLIs without structured output get wrapped (parse and normalize) until they emit events natively.
2. **`expo-mcp` stays untouched; exagent is self-serve.** Clarified decision [confirmed — Kudo, 2026-08-22, superseding the 2026-08-18 reading]: "reuse MCP infra" means exagent may act as an MCP _client_ or add MCP features. It does NOT mean new tools land in the `expo-mcp` codebase. Runtime capabilities (CDP evaluate, error feed, deep-link navigation) are implemented **inside `packages/exagent`** as CLI commands, agent-callable via shell. The existing published `expo-mcp` tools (`automation_*`, `collect_app_logs`, `expo_router_sitemap`, `open_devtools` [observed]) stay available to agents that connect to them. `@expo/mcp-tunnel` stays the remote-transport option for the chat-driven case ([[0007-deploy-and-headless]]).
3. **Expo-specific decision tools** built for the agent (see §Design documents): the Expo Go compatibility check, the post-install impact classifier, the project-state probe.

## Design documents

Feature areas live in child LLPs [confirmed — Kudo, 2026-08-20]. Each carries its own design, provenance, and testing notes. Document numbers reflect implementation priority order [confirmed — Kudo, 2026-08-20: knowledge/skills comes first after testing].

**Foundations**

- [[0002-testing-and-evals]] — the layer built **first**: unit and e2e strategy, plus the 3-tier eval suite (deterministic subprocess tests, then best-effort agent-in-the-loop with a free local model, then a frontier model; scripted MCP replay is optional and deferred).
- [[0003-knowledge-tools-and-skills]] — **second**: skills shipped from Expo modules, version-pinned docs lookup, API diff, example transplant, dependency explainer, doctor auto-fix, the SDK upgrade workflow.

**What the CLI does**

- [[0004-smart-start-and-project-state]] — one deterministic engine for "what must run?": smart `start`, the Expo Go compatibility check, post-install impact decisions.
- [[0005-runtime-loop-tools]] — seeing and driving the running app: runtime eval (CDP), the red-screen feed, deep-link navigation, the smoke gate, the performance probe, the cross-platform sweep, and the log-triage and verified-UI loops. Network inspection is deferred (see [[0017-deferred-commands]]). Driving the app by testID is [[0014-interaction-spike]] and [[0018-interaction-commands]]. The family's shared preflight, which gives one refusal for "there is no dev server" and "there is no app" plus one ladder out, is §One preflight for the runtime family.
- [[0007-deploy-and-headless]] — cross-platform `deploy` (EAS Hosting and launch.expo.dev), headless project creation, Cloudflare Workers compatibility, chat-driven development (the phone as the only device), and EAS auth for headless agents.
- [[0011-impact-and-freshness]] — `exagent impact`: what a change costs (reload, Metro restart, native build) from the fingerprint diff, and, separately from the `runtimeVersion` policy, whether it can ship over the air.
- [[0012-build-explain]] — deterministic triage of a native build log, shipping as `inspect:build-log` ([[0016-v1-scope]]): the two-layer phase detector, the capped in-repo rule table, and the captured-log fixture corpus that pins it.
- [[0018-interaction-commands]] — driving the app by testID. `runtime:tree`, `runtime:tap` and `runtime:type` as shipped, plus the eight decisions [[0014-interaction-spike]] left open: the node cap, the nested-navigator focus rule, the exit bands, and what `--verify` does and does not claim.
- [[0023-fingerprint-caching]] — paying for one fingerprint instead of three, with an in-process memo and a cross-run record under `.expo/` revalidated against the size and modification time of the files that can move a hash. Three deliberate incompletenesses, and what each gives up: a stamp instead of a content hash, `ios/` and `android/` outside the key entirely, and a **ten-minute expiry** as the only bound on what those two miss. They force one reporting rule: a cached answer must say which check ran and how old it is. Measured 38% off `status --explain`. Also the finding that a default `status` is bound by its dev-server port scan, not by the fingerprint at all.
- [[0024-cli-ui]] — the CLI's own surface, read as a UI: one enforced help template per command (purpose, usage, options, examples with their outcomes, `Typically next`, the `--json` contract), a numbered *what to run, in order* map above the top-level listing, and `npx exagent help workflow` — a positional **topic**, the way `git help workflows` is — as the on-ramp that teaches the steps, the exit-code bands and the `--json` rule in one screen. The help is data rather than prose, so a unit test walks the registry and holds every command to the shape. Includes the rule the step titles are held to: if a title needs a legend, it is the wrong title. Plus the palette, off under `--json`, off outside a TTY, off under `NO_COLOR`.

**How every command behaves**

- [[0006-agent-native-cli-surface]] — the process boundary, JSONL events as the contract, agent-mode dev server output, non-interactive parity, headless CI mode, and the `exagent` launcher.
- [[0008-guardrails]] — plan-with-cost dry runs, untrusted-content marking, tool impact metadata. The checkpoint half is deferred (see [[0017-deferred-commands]]).
- [[0009-smart-followups]] — every command output carries state-aware next actions for the driving agent.
- [[0010-agent-conventions]] — the conventions every command shares: the exit-code table, the two command-resolution rules, and the list of upstream asks the tool layer is working around.
- [[0015-backend-selection-and-config]] — which of the two build backends a plan uses, decided at planning time from the host and the toolchain, plus the developer config (`package.json` › `expo.exagent`) that overrides it.
- [[0020-not-an-expo-app]] — the second wrong-directory failure. A `package.json` with no `expo` dependency is not an app. Which command stops there, which one reports, and why the `Try:` line names the recovery that mutates nothing.
- [[0021-honest-reports]] — what a command may claim, and about what. The six rules that came out of friction run 7 and the first live-staging run: a flag that names a target *is* the target; a claim is about the moment it is printed; one subject gets one answer; the tool's own sentence is read before anything is guessed; a note only in `--json` is a note nobody read; and a gate red for a generated file says what generates it.

**Scope and coverage**

- [[0016-v1-scope]] — what the first release contains: the keep/defer/rename table, the `src/deferred/` reference shelf, and the per-command `[experimental]` mark.
- [[0017-deferred-commands]] — the single home for the five areas that release left out: `dev:wait`, the checkpoint system, `build:wait`, `runtime:network` and `doctor:fix`. What each was, why it left, what would bring it back, and which `src/deferred/` directory holds its code. Reference, not a plan.
- [[0019-backend-parity-audit]] — the coverage matrix of command × backend × scenario, the five bugs closing it found, and the rule it states: a backend is a second process boundary, so a row is only filled by a test that ran the command against a stub of that backend's binary.
- [[0022-live-tier]] — the fourth test tier, `e2e-live/`. The published surface run against a real simulator, a real Hermes and the real EAS service on staging, so that [[0002-testing-and-evals]] §A flag is not shipped stops being a manual step. Covers what a live assertion may be (invariants, never timings), how a suite refuses when it cannot run, the one write per run, and the F93 it found on the way in.

**Scoped out** [confirmed — Kudo, 2026-08-19]: ambient and long-running modes (copilot watch mode, EAS build babysitter, PR verification bot, maintenance agent), which are driving-agent behaviors rather than tool-layer work; a separate `exagent mcp` feature, subsumed by Shape 1; and **the build-failure signature DB**, a hosted, growing, community-fed corpus with its own service and submission path. The capped, in-repo, ~40-entry rule table that `inspect:build-log` matches against is deliberately not that. [[0010-agent-conventions]] §`inspect:build-log` records the decision and [[0012-build-explain]] §The rule table implements the cap.

## Open questions

1. ~~Final name~~ — resolved [confirmed — Kudo, 2026-08-20]: `exagent` (package `packages/exagent/`, bin `exagent`); `ai-expo` stays reserved as an alias.
2. ~~Model auth and billing~~ — resolved [confirmed — Kudo, 2026-08-18]: Shape 1, no model in the product; CI-only models for evals ([[0002-testing-and-evals]]).
3. ~~Engine commitment~~ — moot under Shape 1; revisit only if a standalone bin is built later.
4. ~~Skill-from-module contract~~ — resolved [confirmed — Kudo, 2026-08-20]: the directory convention `skills/*/SKILL.md`, discovered via autolinking (see [[0003-knowledge-tools-and-skills]]). Scope is **co-located module skills** (for example `expo-sqlite/skills/`); distributing the general `expo/skills` repo content is out of scope for `exagent`.
5. ~~Relationship to `expo-mcp` repo~~ — resolved [confirmed — Kudo, 2026-08-18]: depend on and extend `expo-mcp`; do not vendor. See §Tool surface.
6. Whether `expo agent` (a subcommand alias in `@expo/cli`) ships at all, and when.
7. Chat-driven hosting: where does the cloud agent run, on EAS-provided machines or bring-your-own (Tuft-style)? EAS auth itself has a resolved direction in [[0007-deploy-and-headless]] §EAS auth: `EXPO_TOKEN` now, device-code grant as the end state.
8. Does the device-code grant plus scoped agent sessions land in www/expo.dev auth, and who owns that work?
