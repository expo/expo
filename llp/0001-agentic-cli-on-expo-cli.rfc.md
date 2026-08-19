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

## Open questions

1. Final name: `exagent` vs `ai-expo` vs a scoped `@expo/*` bin.
2. Model auth and billing: BYO Anthropic key vs expo.dev account gateway.
3. Engine commitment: Claude Agent SDK only for v1, or abstraction from day one?
4. Skill-from-module contract: `package.json` field vs directory convention; and whether `expo/skills` content gets bundled or fetched.
5. Relationship to `expo-mcp` repo: vendor the tools in-process, or depend on `expo-mcp` as published?
6. Whether `expo agent` (subcommand alias in `@expo/cli`) ships at all, and when.
