# 0001: An Agentic CLI on Top of Expo CLI

**Type:** RFC
**Status:** Draft
**Systems:** new package (name TBD, see §Naming); `packages/@expo/cli`; `expo-mcp` (external repo)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-18
**Related:** [[0000-expo-monorepo]]

## Summary

Ship a terminal agent for Expo development. The agent plans and runs Expo workflows: start, install, prebuild, build, debug, fix. It ships as a new package in `expo/expo` with its own bin (for example `npx exagent`). It reuses Expo CLI internals, `expo-mcp` tools, and official Expo skills. It ships only behind heavy tests and an eval suite.

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
packages/exagent/
├── bin/cli.ts          # entry: `npx exagent [prompt] [flags]`
├── src/
│   ├── agent/          # engine setup, system prompt, session loop
│   ├── tools/          # Expo-specific tools (see below)
│   ├── skills/         # skill discovery from node_modules + bundled skills
│   ├── project/        # project-state model (CNG? dev client? native dirs?)
│   └── ui/             # terminal UI (interactive) + JSON output (headless)
├── e2e/
└── evals/              # eval scenarios, fixtures, graders
```

`@expo/cli` stays lean [observed — `packages/@expo/cli/CLAUDE.md` states the public interface is intentional and lean]. If an `expo agent` alias is wanted later, it follows the existing lazy-resolution pattern: `src/start/server/MCP.ts` resolves `expo-mcp` from the project with `resolveFrom.silent` and errors with an install hint when missing [observed].

### Engine

Use the Claude Agent SDK for the agent loop, permissions, MCP client, and skills loading [inferred — recommendation, not yet validated in this repo]. A model-agnostic engine is out of scope for v1. Model auth (BYO key vs. expo.dev-backed gateway) is an open question.

### Tool surface

Three layers, all machine-readable:

1. **Expo CLI as structured subprocess.** The CLI already emits JSONL events via `installEventLogger` / `LOG_EVENTS` (`packages/@expo/cli/bin/cli.ts`) [observed]. The agent spawns `expo start` / `expo run:*` / `expo export` and consumes events, not text.
2. **`expo-mcp` tools, in-process.** `automation_tap`, `automation_take_screenshot`, `automation_find_view`, `collect_app_logs`, `expo_router_sitemap`, `open_devtools` [observed — expo-mcp repo]. No tunnel needed when the agent runs on the same machine.
3. **Expo-specific decision tools** built for the agent (see §Feature candidates): Expo Go compatibility check, post-install impact classifier, project-state probe.

## Testing and evals

Shipping is gated on all three layers.

1. **Unit tests (jest).** Same setup as `@expo/cli` (`pnpm test`) [observed — `packages/@expo/cli/package.json`]. Everything deterministic is unit-tested: project-state model, impact classifier, tool input/output schemas, skill discovery.
2. **E2E CLI tests.** Same pattern as `@expo/cli` (`test:e2e`, `e2e/jest.config.js`) [observed]. Run the bin against fixture projects with the model mocked: scripted tool-call sequences verify wiring, permissions, and JSON output without model cost or nondeterminism.
3. **Evals (live model).** Scenario = fixture project + task prompt + programmatic grader.
   - Example scenarios: "make this broken project start", "add expo-camera and get it running on iOS sim", "is this project Expo Go compatible?", "upgrade this SDK 52 fixture".
   - Graders check outcomes, not transcripts: dev server responds, app boots (via `automation_take_screenshot`), `expo-doctor` passes, correct files changed.
   - Nondeterminism: run each scenario N times; gate on pass rate per scenario and aggregate; store transcripts as artifacts for regression triage.
   - CI: deterministic layers on every PR; eval suite on a schedule and before releases. [inferred — proposed policy]
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

## Open questions

1. Final name: `exagent` vs `ai-expo` vs a scoped `@expo/*` bin.
2. Model auth and billing: BYO Anthropic key vs expo.dev account gateway.
3. Engine commitment: Claude Agent SDK only for v1, or abstraction from day one?
4. Skill-from-module contract: `package.json` field vs directory convention; and whether `expo/skills` content gets bundled or fetched.
5. Relationship to `expo-mcp` repo: vendor the tools in-process, or depend on `expo-mcp` as published?
6. Whether `expo agent` (subcommand alias in `@expo/cli`) ships at all, and when.
7. F3 hosting: where does the cloud agent run — EAS-provided machines, or bring-your-own (Tuft-style) — and how does it authenticate to the user's EAS account?
