# 0004: Smart Start and the Project-State Engine

**Type:** RFC
**Status:** Draft
**Systems:** project-state probe (new); smart `start` command (new); `@expo/fingerprint`; `expo-mcp` tools
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0002-testing-and-evals]]

## Summary

One deterministic engine answers "what must run to get this app on a device?" — consumed as a single smart `start` command [confirmed — Kudo, 2026-08-19], as the post-install "what must rerun?" answer, and as an Expo Go compatibility check. Neither agents nor users decide when to prebuild, rebuild, or just start Metro.

Per [[0001-agentic-cli-on-expo-cli]] §Constraints, the engine _invokes_ `expo prebuild` / `expo run:*` / `expo start` as subprocesses and consumes their JSONL events; it does not import `@expo/cli` internals.

## Inputs (project-state probe)

- Target: Expo Go, dev client, or web; is the target app installed on the device/simulator?
- Native state: bare `ios/`/`android/` dirs vs CNG; `@expo/fingerprint` hash of the native surface [observed — package exists; the CLI's build-cache providers already compute `calculateFingerprintHashAsync`, `packages/@expo/cli/src/utils/build-cache-providers/index.ts`].
- Compatibility: Expo Go check; post-install impact classification (below).

## Decision table (sketch)

| State                                                   | Plan                                            |
| ------------------------------------------------------- | ----------------------------------------------- |
| Expo Go compatible, Go installed                        | start Metro → open in Expo Go                   |
| Dev client installed, fingerprint matches last build    | start Metro → open dev client                   |
| Fingerprint changed (new native module / config plugin) | prebuild (CNG) → native build → install → start |
| Build cache hit for current fingerprint                 | download/install cached build → start Metro     |
| Bare project, native dirs dirty                         | pod install / gradle sync → build → start       |
| Web                                                     | start Metro for web                             |

## Contract

Emit the plan first as a structured event (steps + reasons + time-class estimates), then execute, streaming JSONL progress. `--plan` stops after emitting so a driving agent can present it for approval ([[0008-guardrails]]). Exposed identically as a CLI command for humans and an MCP tool for agents.

## Sub-features

- **Expo Go compatibility check** [confirmed — Kudo seed, 2026-08-18]: answer "can this run in Expo Go?" with reasons — compare dependencies against `packages/expo/bundledNativeModules.json` [observed — file exists], detect config plugins and custom native code, check SDK support.
- **Post-install impact decisions** [confirmed — Kudo seed, 2026-08-18]: after `npx expo install {pkg}`: JS-only → keep dev server, maybe reload; new config plugin or native module under CNG → prebuild + new dev build; bare native dirs → pod install / gradle sync. Same classifier as the decision table, consumed at a second moment.

## Implemented in v1 as

[observed — implementation, 2026-08-22] The engine shipped in `packages/exagent` (`src/project/`, `src/plan/`, `src/context/`, `exagent start --plan|--smart`) with these deliberate approximations of the table above:

1. **No device probe.** "Go/dev client installed on the device" is unobservable without simctl/adb; those rows are dropped — `expo start` prompts for Go itself and `expo run:*` installs what it builds.
2. **No build-cache lookup.** Freshness = probe fingerprint vs `.expo/exagent-last-build.json` (written after a successful `run:*` step). Unrecorded ⇒ stale: v1 over-plans a build at worst, never under-plans.
3. The recorded hash is the pre-build probe hash (what an unchanged project re-probes to).
4. The `web` rule fires only on an explicit `--web`; `ProjectState` cannot prove "web-only".
5. Bare-vs-CNG uses "any native dir present"; the argv uses the resolved platform.
6. `sdkVersion: null` never forces a rule; `expoGo.compatible` is the single Go verdict.
7. Config plugins are read from static config only (`app.json`); dynamic `app.config.js/ts` yields a debug event and best-effort skip — resolving it needs an `expo config` subprocess (follow-up).

## Testing

The decision table is pure logic over probed state: exhaustively unit-tested, no model, no device (tier 0 in [[0002-testing-and-evals]]). Probe and execution paths get e2e coverage against fixtures via subprocess + JSONL assertions.
