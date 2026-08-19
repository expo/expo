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
3. Testing must be heavy. An eval suite must gate shipping.
4. The design should brainstorm agent-friendly features (see §Feature candidates).

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
- Agent-friendly affordances in `@expo/cli` itself (non-interactive parity F1, JSONL events, deterministic decision commands) serve every driving agent.
- The reserved bins (`exagent` / `ai-expo`) can still ship as a thin, model-free launcher: start/connect the MCP server, install skills into the user's agents, print project context. [inferred]
- F3 (Claude mobile app) needs no Expo-side model either: the Claude app brings the model; Expo provides tools over `@expo/mcp-tunnel`.
- A standalone embedded-loop agent (the former Shape 2) is deferred; if built later, it wraps the user's existing Claude Code auth rather than handling keys. [inferred]

### Tool surface

Three layers, all machine-readable:

1. **Expo CLI as structured subprocess.** The CLI already emits JSONL events via `installEventLogger` / `LOG_EVENTS` (`packages/@expo/cli/bin/cli.ts`) [observed]. The agent spawns `expo start` / `expo run:*` / `expo export` and consumes events, not text.
2. **`expo-mcp` tools, reused as-is.** `automation_tap`, `automation_take_screenshot`, `automation_find_view`, `collect_app_logs`, `expo_router_sitemap`, `open_devtools` [observed — expo-mcp repo]. Decision [confirmed — Kudo, 2026-08-18]: reuse the `expo-mcp` infrastructure (Kudo owns that codebase) instead of vendoring. The agent package in `expo/expo` depends on the published `expo-mcp` / `@expo/mcp-tunnel` packages: in-process MCP connection locally, `@expo/mcp-tunnel` WebSocket transport for the remote/F3 case. New agent-facing tools land in `expo-mcp` first, so every MCP client (Claude Code, Cursor) inherits them (E1).
3. **Expo-specific decision tools** built for the agent (see §Feature candidates): Expo Go compatibility check, post-install impact classifier, project-state probe.

## Testing and evals

Shipping is gated on all three layers.

1. **Unit tests (jest).** Same setup as `@expo/cli` (`pnpm test`) [observed — `packages/@expo/cli/package.json`]. Everything deterministic is unit-tested: project-state model, impact classifier, tool input/output schemas, skill discovery.
2. **E2E CLI tests.** Same pattern as `@expo/cli` (`test:e2e`, `e2e/jest.config.js`) [observed]. Run the bin against fixture projects with the model mocked: scripted tool-call sequences verify wiring, permissions, and JSON output without model cost or nondeterminism.
3. **Evals (model-driven).** Scenario = fixture project + task prompt + a driving agent + programmatic grader. Constraint [confirmed — Kudo, 2026-08-18]: prefer a free local model that runs on GitHub Actions.
   - Example scenarios: "make this broken project start", "add expo-camera and get it running", "is this project Expo Go compatible?", "upgrade this SDK 52 fixture".
   - Graders are programmatic and model-free: dev server responds, app boots (via `automation_take_screenshot`), `expo-doctor` passes, correct files changed.
   - **Tier 0 — scripted MCP client (every PR, free, deterministic).** No model at all: replay recorded tool-call sequences against the real tools. Catches schema breaks, wiring regressions, and output-format drift. This tier does most of the CI work.
   - **Tier 1 — small local model (every PR or nightly, free).** Run a quantized open model (e.g. a 4–8B Qwen/Llama class model via llama.cpp or Ollama) as the driving agent on a GitHub-hosted runner, CPU-only. Feasibility [inferred]: standard runners are ~4 vCPU/16 GB, so expect single-digit tokens/sec — keep scenarios short and the suite small. Deliberate side effect: **if a weak model can use the tools, strong models certainly can** — tool/schema ergonomics get evaluated at the hardest setting.
   - **Tier 2 — frontier model (scheduled + pre-release).** A real agent (e.g. Claude Code headless) drives the full scenario set with an API key from CI secrets. N trials per scenario; gate on pass rate; transcripts stored as artifacts.
   - Note: `expo/skills` has an empty `eval-harness/` directory [observed]; the harness built here could serve both repos. [inferred]

## Feature candidates

Seed list from Kudo [confirmed — Slack, 2026-08-18], expanded [inferred]:

1. **Skills shipped from Expo modules.** SDK packages carry their own skill (usage, pitfalls, config-plugin notes). Discovery mirrors how `expo-mcp` is resolved from the project: scan `node_modules` for a declared skill entry (for example `expo.skills` in `package.json`, or a `skills/` folder). Installed packages then teach the agent automatically. Also exportable to other agents (Claude Code, Cursor) as a skills provider.
2. **Expo Go compatibility check.** A tool that answers "can this project run in Expo Go?" with reasons: compare dependencies against `packages/expo/bundledNativeModules.json` [observed — file exists], detect config plugins and custom native code, check SDK version support.
3. **Post-install impact decisions.** After `npx expo install {pkg}`, the agent classifies the change: JS-only → keep the dev server, maybe reload; new config plugin or native module under CNG → prebuild + new dev build; bare native dirs → pod install / gradle sync. The agent states the classification, then acts. This logic is deterministic and unit-tested; the agent is a consumer.
4. **One command to run the app.** "Get this app on the simulator" without the user choosing between `start`, `prebuild`, `run:ios`, or a dev build. The project-state probe decides the plan; the agent executes and narrates it.
5. **Agent-native dev server output.** In agent mode: no QR code, no spinner, no interactive keymap. Emit JSONL events (already available [observed]) plus a small status endpoint: bundle state, connected clients, last error. Same interface serves web-based agents; a QR code is meaningless to an agent, but a URL + platform launch tool is not.
6. **Log triage loop.** On a red screen or crash: pull device/simulator logs (`collect_app_logs`), symbolicate, map to source, propose or apply the fix, verify by screenshot.
7. **Verified UI changes.** After an edit: reload, `automation_take_screenshot`, compare against the request, iterate. Closes the loop that text-only agents cannot close.
8. **Doctor auto-fix.** Run `expo-doctor`, then fix findings instead of printing them.
9. **SDK upgrade workflow.** Drive an SDK upgrade end to end: bump, `expo install --fix`, run codemods, prebuild, build, boot-check — with the eval suite reusing this as a scenario.
10. **Headless CI mode.** `exagent -p "<task>" --json` with pass/fail exit codes, for CI jobs like "verify the app still boots after this PR".

## Extended brainstorm

Wider candidate list, grouped by theme. All items [inferred] unless tagged; runtime hooks named below exist in the repo today [observed where noted]. Not all of these are v1.

### A. Close the loop with the running app

- **A1. Runtime eval tool.** The CLI already speaks CDP to the app (`src/start/server/metro/debugging/messageHandlers/`: `VscodeRuntimeEvaluate`, `VscodeRuntimeCallFunctionOn`, `VscodeRuntimeGetProperties` [observed]). Expose this as an agent tool: run JS inside the live app, read state, trigger navigation, assert on values. This turns "I think the fix works" into "I evaluated it in the app".
- **A2. Structured red-screen feed.** LogBox symbolication exists in the CLI (`log-box/LogBoxSymbolication.ts` [observed]). Push every runtime error to the agent as a structured event: message, symbolicated stack, source file/line. No screenshot-reading of red screens.
- **A3. Network inspection.** A CDP `NetworkResponse` handler exists [observed]. Give the agent the app's network log: failing API calls become debuggable without guessing.
- **A4. Deep-link navigation tool.** Combine `expo_router_sitemap` with `uri-scheme`-style launching: "open route /profile/42 on the simulator". Enables per-route verification and screenshot sweeps.
- **A5. Performance probe.** `expo-app-metrics` / `expo-insights` exist as packages [observed]. Tool: startup time, slow frames, re-render counts — so "why is this list janky" starts from data.
- **A6. Cross-platform verification sweep.** Boot iOS + Android + web in parallel, screenshot the same routes, report visual/behavioral divergence. Uniquely valuable for a universal framework.

### B. Deterministic knowledge tools (agents ask, Expo answers)

- **B1. Version-pinned docs lookup.** A `docs_lookup` tool that answers from documentation matching the project's installed SDK version. Wrong-version API usage is a top agent failure mode.
- **B2. API diff tool.** "What changed in expo-camera between SDK 52 and 54" — generated from changelogs and type diffs; feeds the upgrade workflow.
- **B3. Example transplant.** Fetch the canonical, version-matched integration from `expo/examples` (Stripe, Clerk, Supabase, ...) and adapt it into the project.
- **B4. Dependency explainer.** Why is this package in the tree; which native module versions conflict; what does `expo install --fix` intend to change and why.

### C. Guardrails that make autonomy safe

- **C1. Checkpoints.** Auto git snapshot before each agent action batch; `exagent undo` restores. Cheap trust.
- **C2. Plan-with-cost dry run.** Before acting, show the plan with time estimates ("prebuild ~2 min, pod install ~4 min, dev build ~8 min") and let the user approve once for the batch.
- **C3. Permission profiles.** `--safe` (JS-only edits, no native rebuilds, no network), default (asks for native/destructive), `--yolo` (CI). Maps to Agent SDK permission modes.

### D. Ambient and long-running modes

- **D1. Copilot watch mode.** The agent sits beside the dev server and auto-triages every red screen and build error as it happens, proposing (or applying) fixes in place. The dev keeps their normal workflow; the agent handles interrupts.
- **D2. EAS build babysitter.** Submit an EAS build, stream logs, classify failures against a signature DB of known build errors, fix and resubmit. Long-running, high-value, currently fully manual.
- **D3. PR verification bot.** Headless mode in CI: boot the app, walk key routes (A4), screenshot, attach results to the PR. "Does the app still boot" as a merge gate.
- **D4. Maintenance agent.** Scheduled runs: dependency bumps within SDK constraints, doctor auto-fix, deprecation scan before SDK releases.

### E. Ecosystem leverage

- **E1. `exagent mcp` — be a tool provider, not only an agent.** Expose the whole tool surface (project probe, Expo Go check, impact classifier, runtime eval, automation) as an MCP server so Claude Code, Cursor, and Codex get the same superpowers. Every improvement serves both our agent and everyone else's; adoption does not require switching agents.
- **E2. Build-failure signature DB.** Curated, updatable mapping from xcodebuild/gradle/Metro error patterns to causes and fixes. Served from expo.dev, versioned, shared by D1/D2 and the docs. The eval suite doubles as its regression harness.
- **E3. Module authoring flow.** `create-expo-module` + generate the Swift/Kotlin/TS scaffold, build the example app, and iterate against it — native module development as a guided agentic loop.
- **E4. Skills as an output, too.** The same skill-from-module contract (Feature 1) exports to other agents' formats, making Expo packages self-documenting for the whole agent ecosystem.

### F. Headless-first: no terminal, no laptop

Seeds from Kudo [confirmed — Slack, 2026-08-18]: Cloudflare Worker compatibility, headless project creation, and the north star — doing all mobile development and deployment from the Claude mobile app.

- **F1. Headless project creation.** `exagent new "<one-line app description>"` scaffolds without a TTY: template choice, `create-expo`, git init, EAS init, first boot check — every step flag- or JSON-driven. Generalize into a design principle: **non-interactive parity** — every interactive prompt in Expo/EAS CLIs must have a programmatic answer path, and the eval suite runs everything with no TTY attached. Prompts that block a pipe are bugs for agents.
- **F2. Cloudflare Workers compatibility (EAS Hosting).** Expo API routes deploy to the Cloudflare Workers runtime (workerd). Agent tools:
  - *Compat preflight*: static lint of API routes and server code for Node APIs and packages that do not exist under workerd, before any deploy.
  - *Local workerd run*: execute routes under the real runtime locally and feed failures back to the agent as structured errors.
  - *Fix loop*: known-incompatibility → known-substitution mapping (same signature-DB shape as E2), so the agent rewrites Node-isms into Workers-safe code and re-verifies.
- **F3. Chat-driven development — the phone is the only device.** North star [confirmed — Kudo]: run the whole lifecycle from the Claude mobile app. The agent runs on a cloud machine; the user's phone is both the chat client and the test device. Required pieces, most of which exist in some form:
  - Remote dev server: tunnel Metro to the device (packager proxy URL) — no QR, the agent sends an install/open link.
  - Agent eyes without a laptop: cloud simulators (EAS Simulator is an experimental API today) for screenshots and automation when the user's phone is busy being a chat client.
  - Remote transport: `@expo/mcp-tunnel` already provides WebSocket MCP transport for exactly this shape [observed — expo-mcp repo].
  - Delivery without a Mac: EAS Build → TestFlight/internal distribution → EAS Update for OTA iteration.
  - Everything upstream of this (F1 headless creation, A-tools for verification, C guardrails, JSONL events) is a prerequisite; F3 is the composition of them, not a separate system.
- **F4. EAS auth for headless agents.** Decision [confirmed — Kudo, 2026-08-18]: use EAS as the delivery rails for F3. Auth is the gap. What exists today [observed — `packages/@expo/cli/src/api/user/`]:
  - password + OTP login (`actions.ts`, `otp.ts`);
  - browser OAuth: PKCE authorization-code flow with a **localhost redirect** — `expoSsoLauncher.ts` starts a local HTTP server, opens the browser, exchanges the code at `auth/token` (client_id `expo-cli`);
  - `EXPO_TOKEN` env for CI (`UserSettings.ts`).

  Fit for a cloud agent, where the approving browser is on the user's phone and the CLI is on a remote machine:
  - *Localhost-redirect PKCE does not work remotely* — the redirect lands on the phone, not on the agent machine. It stays the right flow for laptop-local interactive use only.
  - *`EXPO_TOKEN` works today* and is the pragmatic bootstrap: CI mode (D3) and early F3 use it. Downsides: long-lived, broad scope, manual provisioning — wrong end-state for a consumer chat flow.
  - *Recommended end state [inferred]: OAuth device authorization grant* (device-code flow). The agent posts a URL + code into the chat; the user taps it on the phone, approves on expo.dev; the agent polls `auth/token` for the session. Purpose-built for input-constrained/remote clients, and incremental to build since the `auth/token` grant exchange already exists — the www side adds a `device_code` grant and an approval page.
  - Harden either path with *scoped, expiring agent sessions*: tokens carry scopes (read, build, update, submit), show up in the dashboard as revocable "agent sessions", and default to short expiry with refresh while the chat session is active.

## Open questions

1. Final name: `exagent` vs `ai-expo` vs a scoped `@expo/*` bin.
2. ~~Model auth and billing~~ — resolved [confirmed — Kudo, 2026-08-18]: Shape 1, no model in the product; CI-only models for evals (§Testing).
3. ~~Engine commitment~~ — moot under Shape 1; revisit only if a standalone bin is built later.
4. Skill-from-module contract: `package.json` field vs directory convention; and whether `expo/skills` content gets bundled or fetched.
5. ~~Relationship to `expo-mcp` repo~~ — resolved [confirmed — Kudo, 2026-08-18]: depend on and extend `expo-mcp`; do not vendor. See §Tool surface.
6. Whether `expo agent` (subcommand alias in `@expo/cli`) ships at all, and when.
7. F3 hosting: where does the cloud agent run — EAS-provided machines, or bring-your-own (Tuft-style)? (EAS auth itself: resolved direction in F4 — `EXPO_TOKEN` now, device-code grant as end state.)
8. Does the device-code grant + scoped agent sessions land in www/expo.dev auth, and who owns that work?
